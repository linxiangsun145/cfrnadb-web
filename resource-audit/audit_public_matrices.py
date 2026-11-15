"""Independently count every public matrix value; never rewrite source matrices.

Requires pyarrow. Inputs are the frozen public catalog, download manifest and ZIPs.
"""
import argparse,csv,datetime,hashlib,io,json,time,urllib.request,zipfile
from pathlib import Path
import pyarrow as pa
import pyarrow.csv as pacsv
import pyarrow.compute as pc

KINDS={'mRNA_lncRNA','cfrnapro','ap','ap_usage'}

def digest(path):
    with path.open('rb') as f:return hashlib.file_digest(f,'sha256').hexdigest()

def audit(bundle,catalog,root):
    path=root/(bundle['id']+'.zip');assert digest(path)==bundle['sha256'],'ZIP checksum mismatch'
    d=next(d for d in catalog['datasets'] if d['id']==bundle['dataset_id'])
    assert d['study']=='GSE133684' and d['kind'] in KINDS and d['sources']==401
    c=next(c for c in d['channels'] if c['id']==bundle['channel_id'])
    with zipfile.ZipFile(path) as z:
        provenance=json.loads(z.read('provenance.json'));checks=json.loads(z.read('checksums.json'))
        assert provenance['study_accession']=='GSE133684' and provenance['source_labels']==401
        assert provenance['channel']['id']==c['id']
        assert provenance['source_manifest_sha256']==d['source_sha256']
        assert provenance['measurement_manifest_sha256']==d['measurement_sha256']
        assert checks['matrix.tsv']['sha256']==provenance['source_matrix_sha256']
        metadata=list(csv.DictReader(io.StringIO(z.read('sample-metadata.tsv').decode('utf-8-sig')),delimiter='\t'))
        groups={r['source_label']:r['clinical_group_reported'] for r in metadata}
        assert len(groups)==401 and set(groups.values())=={'PDAC','healthy'}
        with z.open('matrix.tsv') as f:header=f.readline().decode('utf-8-sig').rstrip('\r\n').split('\t')
        assert len(header)==402 and len(set(header))==402 and set(header[1:])==set(groups)
        labels=header[1:];types={label:pa.float64() for label in labels};types[header[0]]=pa.string()
        stats={label:dict(observed=0,missing=0,zero=0,negative=0) for label in labels}
        total=dict(observed=0,missing=0,zero=0,negative=0);rows=0;all_missing_features=0;minimum=None;maximum=None
        with z.open('matrix.tsv') as f:
            reader=pacsv.open_csv(f,read_options=pacsv.ReadOptions(block_size=4*1024*1024),
                parse_options=pacsv.ParseOptions(delimiter='\t'),
                convert_options=pacsv.ConvertOptions(column_types=types,null_values=['NA'],strings_can_be_null=False))
            for batch in reader:
                rows+=batch.num_rows;any_observed=None
                for index,label in enumerate(labels,1):
                    a=batch.column(index);valid=pc.is_valid(a)
                    any_observed=valid if any_observed is None else pc.or_(any_observed,valid)
                    assert not (pc.sum(pc.fill_null(pc.invert(pc.is_finite(a)),False)).as_py() or 0),'Non-finite observed value'
                    item=dict(observed=len(a)-a.null_count,missing=a.null_count,
                        zero=pc.sum(pc.fill_null(pc.equal(a,0),False)).as_py() or 0,
                        negative=pc.sum(pc.fill_null(pc.less(a,0),False)).as_py() or 0)
                    for key,n in item.items():stats[label][key]+=n;total[key]+=n
                    limits=pc.min_max(a).as_py()
                    if limits['min'] is not None:minimum=limits['min'] if minimum is None else min(minimum,limits['min'])
                    if limits['max'] is not None:maximum=limits['max'] if maximum is None else max(maximum,limits['max'])
                all_missing_features+=batch.num_rows-(pc.sum(any_observed).as_py() or 0)
        assert rows==d['features'] and total['observed']+total['missing']==rows*401
        summary=dict(dataset_id=d['id'],kind=d['kind'],channel_id=c['id'],column=c['column'],unit=c['unit'],primary=c['id']==d['primary_channel'],
            features=rows,source_labels=401,cells=rows*401,**total,positive=total['observed']-total['zero']-total['negative'],
            all_missing_features=all_missing_features,observed_min=minimum,observed_max=maximum,
            zip_sha256=bundle['sha256'],matrix_sha256=provenance['source_matrix_sha256'],
            source_manifest_sha256=d['source_sha256'],measurement_manifest_sha256=d['measurement_sha256'])
        source_rows=[dict(dataset_id=d['id'],kind=d['kind'],channel_id=c['id'],column=c['column'],source_label=label,group_reported=groups[label],**stats[label]) for label in labels]
        return summary,source_rows

def main(args):
    catalog=json.loads(args.catalog.read_text(encoding='utf-8'));manifest=json.loads(args.manifest.read_text(encoding='utf-8'))
    assert len(catalog['datasets'])==4 and catalog['source_labels']==401
    assert len(manifest['bundles'])==12 and {d['study'] for d in catalog['datasets']}=={'GSE133684'}
    assert {d['kind'] for d in catalog['datasets']}==KINDS
    args.output.mkdir(parents=True,exist_ok=True);summary=[];observations=[];start=time.monotonic()
    for bundle in manifest['bundles']:
        path=args.bundle_root/(bundle['id']+'.zip')
        if not path.exists() and args.download:
            args.bundle_root.mkdir(parents=True,exist_ok=True)
            url='https://cfrnadb-web-hcha.vercel.app/downloads/'+bundle['id']+'.zip'
            with urllib.request.urlopen(url,timeout=60) as incoming,path.open('wb') as target:
                for block in iter(lambda:incoming.read(1048576),b''):target.write(block)
        if not path.is_file():raise FileNotFoundError('Download the named public ZIP or use --download: '+path.name)
        row,labels=audit(bundle,catalog,args.bundle_root);summary.append(row);observations.extend(labels)
        print(row['kind']+'/'+row['column']+': '+str(row['cells'])+' cells counted',flush=True)
    for name,rows in [('channel-summary.tsv',summary),('source-coverage.tsv',observations)]:
        with (args.output/name).open('w',encoding='utf-8',newline='') as f:
            writer=csv.DictWriter(f,fieldnames=list(rows[0]),delimiter='\t',lineterminator='\n');writer.writeheader();writer.writerows(rows)
    result=dict(format='cfrnadb.public-matrix-audit.v1',status='PASS_COMPLETE_PUBLIC_MATRIX_AUDIT',release='public-2026.11.14',
        checked_at=datetime.datetime.now(datetime.timezone.utc).isoformat(),pyarrow_version=pa.__version__,
        catalog_sha256=digest(args.catalog),download_manifest_sha256=digest(args.manifest),
        channels=summary,total_cells=sum(r['cells'] for r in summary),source_labels=401,source_rows=len(observations),
        scope='Technical value availability in GSE133684; not biological QC, donor independence or historical advanced-run reconstruction.',
        count_rules='NA is missing; finite numeric zero is observed; negative values are counted separately without clipping or imputation.',
        elapsed_seconds=round(time.monotonic()-start,2))
    assert result['total_cells']==catalog['total_logical_measurements']
    (args.output/'matrix-audit.json').write_text(json.dumps(result,indent=2,allow_nan=False)+'\n',encoding='utf-8')
    print(json.dumps(dict(status=result['status'],channels=len(summary),cells=result['total_cells'],seconds=result['elapsed_seconds'])))

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--catalog',type=Path,required=True);p.add_argument('--manifest',type=Path,required=True)
    p.add_argument('--bundle-root',type=Path,required=True);p.add_argument('--output',type=Path,required=True);p.add_argument('--download',action='store_true');main(p.parse_args())

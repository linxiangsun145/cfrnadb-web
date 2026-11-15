"""Rebuild source-ID link coverage from the published primary ZIP annotations."""
import argparse,csv,gzip,hashlib,io,itertools,json,sys
from pathlib import Path
from gene_link_rules import source_gene_links

def sha(p):
    with p.open('rb') as f:return hashlib.file_digest(f,'sha256').hexdigest()

def main(args):
    catalog=json.loads(args.catalog.read_text(encoding='utf-8'));downloads=json.loads(args.manifest.read_text(encoding='utf-8'))
    assert len(catalog['datasets'])==4 and {d['study'] for d in catalog['datasets']}=={'GSE133684'}
    args.output.mkdir(parents=True,exist_ok=True);coverage=[];sets={};versions={};links=[];annotation_hashes={}
    for d in catalog['datasets']:
        b=next(b for b in downloads['bundles'] if b['dataset_id']==d['id'] and b['channel_id']==d['primary_channel'])
        p=args.bundle_root/(b['id']+'.zip');assert sha(p)==b['sha256']
        import zipfile
        observed=0;linked=set();genes=set();source_ids={}
        with zipfile.ZipFile(p) as z:
            checks=json.loads(z.read('checksums.json'));annotation_hashes[d['id']]=checks['feature-annotation.tsv']['sha256']
            with z.open('feature-annotation.tsv') as raw:
                for row in csv.DictReader(io.TextIOWrapper(raw,encoding='utf-8'),delimiter='\t'):
                    observed+=1;feature=json.loads(row['annotation_json'])
                    for link in source_gene_links(d['kind'],feature):
                        linked.add(row['feature_revision_id']);genes.add(link['gene_id']);source_ids.setdefault(link['gene_id'],set()).add(link['source_gene_id'])
                        links.append(dict(dataset_id=d['id'],kind=d['kind'],feature_revision_id=row['feature_revision_id'],native_feature_id=row['native_feature_id'],
                            **link,reference_id=row['reference_id'],reference_sha256=row['reference_sha256'],source_manifest_sha256=d['source_sha256']))
        assert observed==d['features']
        coverage.append(dict(dataset_id=d['id'],kind=d['kind'],features=observed,mapped_features=len(linked),unmapped_features=observed-len(linked),distinct_source_gene_ids=len(genes)))
        sets[d['kind']]=genes;versions[d['kind']]=source_ids
    pairs=[]
    for a,b in itertools.combinations(sets,2):
        common=sets[a]&sets[b]
        pairs.append(dict(view_a=a,view_b=b,shared_source_gene_ids=len(common),union_source_gene_ids=len(sets[a]|sets[b]),
            fraction_of_a=len(common)/len(sets[a]),fraction_of_b=len(common)/len(sets[b]),
            shared_with_disjoint_source_gene_versions=sum(not (versions[a][g]&versions[b][g]) for g in common)))
    with gzip.GzipFile(filename=str(args.output/'source-gene-links.tsv.gz'),mode='wb',mtime=0) as raw:
        with io.TextIOWrapper(raw,encoding='utf-8',newline='') as f:
            writer=csv.DictWriter(f,fieldnames=list(links[0]),delimiter='\t',lineterminator='\n');writer.writeheader();writer.writerows(links)
    for name,rows in [('gene-coverage.tsv',coverage),('gene-overlap.tsv',pairs)]:
        with (args.output/name).open('w',encoding='utf-8',newline='') as f:
            writer=csv.DictWriter(f,fieldnames=list(rows[0]),delimiter='\t',lineterminator='\n');writer.writeheader();writer.writerows(rows)
    result=dict(format='cfrnadb.public-source-gene-audit.v1',status='PASS_REBUILT_SOURCE_GENE_COVERAGE',mapping_rules_sha256=sha(Path(__file__).with_name('gene_link_rules.py')),
        catalog_sha256=sha(args.catalog),annotation_sha256=annotation_hashes,links=len(links),coverage=coverage,pairwise=pairs,
        interpretation='Canonical source Ensembl ID overlap, retaining original versions and reference hashes; not independent molecular validation or physical-sample matching.')
    assert len(links)==235171,'Published source mappings differ from the attested public DB projection'
    (args.output/'gene-audit.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8');print(json.dumps(result))

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--catalog',type=Path,required=True);p.add_argument('--manifest',type=Path,required=True)
    p.add_argument('--bundle-root',type=Path,required=True);p.add_argument('--output',type=Path,required=True);main(p.parse_args())

"""Reproduce a cfRNAdb descriptive resource figure from its bound data.json."""
import argparse
import json
import math
from pathlib import Path
import textwrap

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt


def ranks(values):
    order=sorted(range(len(values)),key=lambda i:values[i]);out=[0.0]*len(values);i=0
    while i<len(order):
        j=i+1
        while j<len(order) and values[order[j]]==values[order[i]]:j+=1
        for k in range(i,j):out[order[k]]=(i+j+1)/2
        i=j
    return out


def rho(pairs):
    if len(pairs)<2:return None
    a=ranks([p[0] for p in pairs]);b=ranks([p[1] for p in pairs]);mean=(len(pairs)+1)/2
    aa=sum((x-mean)**2 for x in a);bb=sum((y-mean)**2 for y in b)
    return sum((x-mean)*(y-mean) for x,y in zip(a,b))/math.sqrt(aa*bb) if aa and bb else None


def quantile(values,p):
    if not values:return None
    values=sorted(values);x=(len(values)-1)*p;i=int(x)
    return values[i]+(values[min(i+1,len(values)-1)]-values[i])*(x-i)


def unit_label(series):
    return {'TPM_all_featureCounts_genes_exon_union_length':'TPM (exon-union length)',
        'salmon_transcript_TPM_sum':'TPM (transcript sum)',
        'natural_log_KL_from_uniform':'KL from uniform (natural log)',
        'within_gene_promoter_usage_fraction':'Within-gene promoter usage fraction'}.get(series['channel']['unit'],series['channel']['unit'])


def main(data_path,output):
    data=json.loads(Path(data_path).read_text(encoding='utf-8'));output=Path(output);output.mkdir(parents=True,exist_ok=True)
    assert data['study']=='GSE133684' and len(data['observations'])==401
    observations={r['source_id']:r for r in data['observations']};groups=['healthy','PDAC'];colors=['#40916c','#2878b5']
    plt.rcParams.update({'font.family':'DejaVu Sans','font.size':9,'axes.spines.top':False,'axes.spines.right':False,
        'svg.fonttype':'none','svg.hashsalt':'cfrnadb-20261114','axes.labelcolor':'#243449','text.color':'#243449'})
    summaries=[]
    for s in data['series']:
        assert len(s['values'])==401 and {r['source_id'] for r in s['values']}==set(observations)
        for group in groups:
            rows=[r for r in s['values'] if observations[r['source_id']]['group']==group]
            values=[r['value'] for r in rows if r['value'] is not None]
            summaries.append(dict(feature=s['native_feature_id'],kind=s['kind'],unit=s['channel']['unit'],group=group,
                source_labels=len(rows),measured=len(values),missing=len(rows)-len(values),zero=sum(v==0 for v in values),
                q1=quantile(values,.25),median=quantile(values,.5),q3=quantile(values,.75)))
    if data['mode']=='paired':
        a,b=data['series'];left={r['source_id']:r['value'] for r in a['values']};right={r['source_id']:r['value'] for r in b['values']}
        pairs=[(left[k],right[k],k) for k in left if left[k] is not None and right[k] is not None]
        fig,ax=plt.subplots(figsize=(6.8,4.2))
        for group,color in zip(groups,colors):
            values=[p for p in pairs if observations[p[2]]['group']==group]
            ax.scatter([math.log1p(p[0]) for p in values],[p[1] for p in values],s=15,alpha=.65,color=color,label=group,rasterized=False)
        correlation=rho(pairs)
        ax.set_xlabel('log1p('+unit_label(a)+')');ax.set_ylabel(unit_label(b))
        ax.legend(frameon=False,title='Source group');ax.set_title(data['gene']+' | paired n='+str(len(pairs))+' of 401 ('+str(401-len(pairs))+' unpaired)\nDescriptive Spearman rho='+('NA' if correlation is None else f'{correlation:.3f}')+'; small n limits interpretation')
        summary=dict(groups=summaries,paired_n=len(pairs),spearman_rho=correlation,
            by_pipeline_strandedness={strand:dict(n=sum(observations[p[2]]['pipeline_strandedness']==strand for p in pairs),
                rho=rho([p for p in pairs if observations[p[2]]['pipeline_strandedness']==strand])) for strand in ['forward','reverse']})
    else:
        fig,axes=plt.subplots(1,len(data['series']),figsize=(max(6.8,3.2*len(data['series'])),4.1),squeeze=False)
        for ax,s in zip(axes[0],data['series']):
            transform=s['channel']['column'] in ('tpm','counts')
            values=[[r['value'] for r in s['values'] if observations[r['source_id']]['group']==g and r['value'] is not None] for g in groups]
            plotted=[[math.log1p(v) if transform else v for v in row] for row in values]
            boxes=ax.boxplot(plotted,tick_labels=[g+'\nn='+str(len(v)) for g,v in zip(groups,values)],patch_artist=True,whis=(0,100),showfliers=False)
            for patch,color in zip(boxes['boxes'],colors):patch.set_facecolor(color);patch.set_alpha(.5)
            ylabel=('log1p('+unit_label(s)+')') if transform else unit_label(s)
            ax.set_ylabel('\n'.join(textwrap.wrap(ylabel,31)));ax.set_title('\n'.join(textwrap.wrap(s['kind']+' | '+s['native_feature_id'],31)),fontsize=8)
        fig.suptitle(data['gene']+' | GSE133684 | descriptive source-group distributions',fontsize=11)
        summary=dict(groups=summaries)
    fig.text(.02,.015,'Source labels are not confirmed independent subjects. NA excluded; observed zeros retained.\nShared reads/protocol may influence patterns. Exact units and missing states are retained in data.json / values.tsv.',fontsize=7)
    fig.tight_layout(rect=(0,.10,1,.96))
    fig.savefig(output/'figure.svg',metadata={'Date':None,'Creator':'cfRNAdb public release 2026.11.14'})
    fig.savefig(output/'figure.pdf',metadata={'CreationDate':None,'ModDate':None,'Creator':'cfRNAdb public release 2026.11.14'})
    fig.savefig(output/'figure.png',dpi=300)
    plt.close(fig)
    summary.update(matplotlib_version=matplotlib.__version__,interpretation=data['interpretation'])
    (output/'summary.json').write_text(json.dumps(summary,indent=2,allow_nan=False)+'\n',encoding='utf-8')
    print(json.dumps(dict(status='PASS_CASE_FIGURE_REPRODUCED',id=data['id'],series=len(data['series']))))


if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--data',type=Path,default=Path(__file__).with_name('data.json'));p.add_argument('--output',type=Path,default=Path(__file__).parent)
    args=p.parse_args();main(args.data,args.output)

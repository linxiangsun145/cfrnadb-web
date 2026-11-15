"""Render reproducible descriptive audit figures; no group-effect or diagnostic tests."""
import argparse,json,textwrap
from pathlib import Path
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np

LABELS={'cfrnapro':'RNA coverage','mRNA_lncRNA':'mRNA / lncRNA','ap_usage':'Promoter gene usage','ap':'Promoter activity'}

def main(root):
    matrix=json.loads((root/'matrix-audit.json').read_text());gene=json.loads((root/'gene-audit.json').read_text())
    plt.rcParams.update({'font.family':'DejaVu Sans','font.size':9,'svg.fonttype':'none','svg.hashsalt':'cfrnadb-audit-20261115','axes.spines.top':False,'axes.spines.right':False})
    def save(fig,name):
        fig.savefig(root/(name+'.svg'),metadata={'Date':None,'Creator':'cfRNAdb resource audit'})
        fig.savefig(root/(name+'.pdf'),metadata={'CreationDate':None,'ModDate':None,'Creator':'cfRNAdb resource audit'})
        fig.savefig(root/(name+'.png'),dpi=300);plt.close(fig)
    rows=matrix['channels'];fig,ax=plt.subplots(figsize=(9,6));y=np.arange(len(rows));left=np.zeros(len(rows))
    for key,label,color in [('positive','Observed positive','#3f82b5'),('zero','Observed zero','#9fc8b1'),('missing','Missing (NA)','#d5dce5')]:
        values=np.array([r[key]/r['cells']*100 for r in rows]);ax.barh(y,values,left=left,color=color,label=label,height=.7);left+=values
    ax.set_yticks(y,[LABELS[r['kind']]+' | '+r['column'] for r in rows]);ax.invert_yaxis();ax.set_xlim(0,100);ax.set_xlabel('Percentage of feature × source-label cells, within one channel')
    ax.set_title('Complete value-availability audit | GSE133684 | 401 source labels',pad=34);ax.legend(loc='lower center',bbox_to_anchor=(.5,1.005),ncol=3,frameon=False)
    fig.text(.015,.015,'NA is distinct from measured zero. Each row retains its own unit; values are not pooled across channels.\nTechnical availability does not establish biological validity or donor independence.',fontsize=8)
    fig.tight_layout(rect=(0,.08,1,.92));save(fig,'channel-availability')
    coverage=gene['coverage'];kinds=[r['kind'] for r in coverage];totals={r['kind']:r['distinct_source_gene_ids'] for r in coverage}
    overlap={(r['view_a'],r['view_b']):r['shared_source_gene_ids'] for r in gene['pairwise']}
    values=np.array([[totals[a] if a==b else overlap.get((a,b),overlap.get((b,a))) for b in kinds] for a in kinds])
    fig,ax=plt.subplots(figsize=(6.8,5.1));image=ax.imshow(values,cmap='Blues',vmin=0,vmax=values.max())
    ax.set_xticks(range(4),[LABELS[k].replace(' ','\n',1) for k in kinds]);ax.set_yticks(range(4),[LABELS[k] for k in kinds]);ax.tick_params(length=0)
    for i in range(4):
        for j in range(4):ax.text(j,i,f'{values[i,j]:,}',ha='center',va='center',color='white' if values[i,j]>values.max()*.55 else '#18334d')
    ax.set_title('Shared source-declared Ensembl gene IDs');fig.colorbar(image,ax=ax,fraction=.045,pad=.04,label='Distinct source gene IDs')
    fig.text(.015,.015,'Gene-ID overlap retains source versions and reference hashes. It is not independent molecular evidence.\nThe four views share 18,868 mapped gene IDs. Feature rows and gene counts are different quantities.',fontsize=8)
    fig.tight_layout(rect=(0,.09,1,.96));save(fig,'gene-overlap')
    print(json.dumps(dict(status='PASS_RESOURCE_AUDIT_FIGURES',figures=2,matplotlib=matplotlib.__version__)))

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--input',type=Path,required=True);args=p.parse_args();main(args.input)

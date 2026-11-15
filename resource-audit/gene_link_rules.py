"""Gene links from explicit source identifiers; no coordinate or substring inference."""
import re

GENE=re.compile(r'^(ENSG\d+)(?:\.\d+)?$')
SUPPORTED={'mRNA_lncRNA','cfrnapro','ap','ap_usage','rag','as','fusion'}


def source_gene_links(kind,feature):
    source=feature.get('source_annotation',{})
    native=feature.get('native_feature_id') or feature.get('source_feature_id') or feature.get('name','')
    candidates=[]
    if kind in ('mRNA_lncRNA','cfrnapro','ap_usage','rag') and GENE.fullmatch(native):
        candidates=[(native,'gene_feature','native_feature_id')]
    elif kind=='ap' and GENE.fullmatch(source.get('gene_id','')):
        candidates=[(source['gene_id'],'promoter_gene','source_annotation.gene_id')]
    elif kind=='as':
        match=re.match(r'^(?:SE|A3SS|A5SS|MXE|RI)\|(ENSG\d+(?:\.\d+)?)\|',native)
        if match:candidates=[(match[1],'splice_event_gene','source_native_event_id')]
    elif kind=='fusion':
        # The delivered annotation declares SYMBOL^ENSEMBL|SYMBOL^ENSEMBL.
        parts=source.get('annotation','').split('|')
        if len(parts)==2:
            for index,part in enumerate(parts):
                tokens=part.rsplit('^',1)
                if len(tokens)==2 and GENE.fullmatch(tokens[1]):
                    candidates.append((tokens[1],'fusion_partner_'+('left' if index==0 else 'right'),'source_annotation.annotation'))
    return [dict(gene_id=GENE.fullmatch(gene)[1],source_gene_id=gene,relation=relation,selector=selector)
            for gene,relation,selector in candidates]

// Presentation of curated metadata. Source values remain unchanged in exports.
import {escape as e} from './portal-data.mjs';
import {copy as c,t} from './portal-i18n.mjs';
import {publicMode} from './portal-public.mjs';

export const metadataUrl=(cohort,tier='core')=>publicMode&&cohort==='gut401'&&['core','extended'].includes(tier)?'/release/metadata-'+tier+'.tsv':'/v1/portal/metadata-export?'+new URLSearchParams({cohort,tier});
const absent=()=>c('Not reported / unconfirmed','未提供／未确认');
const value=v=>v===null||v===undefined||v===''?absent():String(v);
const pair=(label,v)=>'<div class="metadata-item"><dt>'+e(label)+'</dt><dd>'+e(value(v))+'</dd></div>';
export function linkStatus(status){return ({VERIFIED_PUBLIC_GEO_ENA_SRA:c('Public accessions crosschecked','公开编号已交叉核对'),INDEXED_PUBLIC_EXACT_LABEL_MATCH:c('Indexed sample record matched','公开索引记录匹配'),PRIVATE_LABEL_ONLY:c('Repository mapping unconfirmed','公开编号对应待确认')})[status]||absent();}
export function repositoryLinks(core){
  const entries=[['geo_accession',/^GSM\d+$/,v=>'https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc='+v],
    ['biosample_accession',/^(SAMN|SAMC)\d+$/,v=>v.startsWith('SAMC')?'https://ngdc.cncb.ac.cn/biosample/browse/'+v:'https://www.ncbi.nlm.nih.gov/biosample/'+v],
    ['read_run_accession',/^SRR\d+$/,v=>'https://www.ncbi.nlm.nih.gov/sra/?term='+v]];
  const links=entries.filter(([f,pattern])=>pattern.test(core?.[f]||'')).map(([f,,url])=>'<a target="_blank" rel="noopener noreferrer" href="'+e(url(core[f]))+'">'+e(core[f])+'</a>');
  return links.length?links.join('<span aria-hidden="true"> · </span>'):'<span class="muted">'+absent()+'</span>';
}
export function metadataDownloads(cohort){return '<div class="metadata-downloads"><a class="btn small" data-metadata-core href="'+metadataUrl(cohort)+'">'+c('Study core metadata · TSV','本研究核心元数据 · TSV')+'</a><a class="btn small" data-metadata-extended href="'+metadataUrl(cohort,'extended')+'">'+c('Study extended metadata · TSV','本研究扩展元数据 · TSV')+'</a></div>';}
export function metadataStudy(study){
  const m=study.metadata;if(!m)return '';
  const specimens=Object.entries(m.specimen_counts).map(([s,n])=>s+' ('+n+')').join(' · ');
  return '<section class="card metadata-study section-gap"><div class="section-head"><h2>'+c('Study information','研究信息')+'</h2><a href="'+e(m.repository_url)+'" target="_blank" rel="noopener noreferrer">'+c('Original study','原始研究')+' ↗</a></div><dl class="definition">'+
    pair(c('Reported groups','来源分组'),Object.entries(m.groups).map(([g,n])=>g+' '+n).join(' · '))+
    pair(c('Reported specimens','有来源记录的标本'),specimens||null)+
    (m.specimen_not_reported?pair(c('Specimen not documented per label','缺少逐标签标本记录'),m.specimen_not_reported):'')+
    pair(c('Instrument reported per label','逐标签记录的测序仪'),Object.entries(m.instrument_counts).map(([v,n])=>v+' ('+n+')').join(' · ')||null)+
    pair(c('Public accession links','公开编号对应'),m.verified_repository_links+' '+c('crosschecked','已交叉核对')+' · '+m.indexed_repository_links+' '+c('indexed record','索引记录匹配'))+
    pair(c('Metadata updated','元数据整理日期'),m.metadata_date)+'</dl>'+
    (m.publications.length?'<p>'+c('Publication','相关文献')+': '+m.publications.map(p=>'<a target="_blank" rel="noopener noreferrer" href="'+e(p.url)+'">PMID '+e(p.pubmed_id)+'</a>').join(' · ')+'</p>':'')+
    metadataDownloads(study.id)+'</section>';
}
export function metadataSource(metadata,cohort){
  if(!metadata)return '';
  const x=metadata.extended,b=metadata.core;
  const age=x.age_reported===null?null:String(x.age_reported)+' '+(x.age_unit||c('(unit unconfirmed)','（单位未确认）'));
  const center=x.center_status==='CONFLICT_REQUIRES_REVIEW'?c('Needs review: clinical table ','待核实：临床来源表 ')+x.clinical_center_raw+c('; pipeline ','；流程表 ')+x.pipeline_center_raw:x.collection_center;
  return '<section class="card metadata-core"><h2>'+c('Source information','来源信息')+'</h2><dl class="definition">'+pair(c('Reported group','来源分组'),b.clinical_group_reported)+pair(c('Reported specimen','来源标本'),b.specimen_reported)+'<div class="metadata-item"><dt>'+c('Public identifiers','公开编号')+'</dt><dd>'+repositoryLinks(b)+'</dd></div>'+pair(c('Accession evidence','编号对应证据'),linkStatus(b.biosample_link_status))+'</dl>'+metadataDownloads(cohort)+'</section>'+
    '<details class="card metadata-extended"><summary>'+c('Optional clinical & laboratory information','可选临床与实验信息')+'</summary><div class="metadata-extension-grid"><div><h3>'+c('Clinical source values','临床来源值')+'</h3><dl class="definition">'+
    pair(c('Age as reported','年龄来源值'),age)+pair(c('Gender as reported','Gender 来源值'),x.sex_reported)+pair(c('Original stage code','原始分期代码'),x.stage_reported)+pair(c('Staging system / edition','分期体系／版本'),x.stage_system)+pair(c('Collection center','采集中心'),center)+pair(c('Original split label','来源划分标签'),x.source_split_reported)+'</dl></div><div><h3>'+c('Library & sequencing','建库与测序')+'</h3><dl class="definition">'+
    pair(c('Instrument','测序仪'),x.instrument_model)+pair(c('Read layout','单双端类型'),x.library_layout)+pair(c('Reported preparation kit','有来源支持的建库试剂盒'),x.library_kit_reported)+pair(c('Confirmed kit version','已确认试剂盒版本'),x.library_kit_version_confirmed)+pair(c('Confirmed UMI design','已确认 UMI 设计'),x.umi_status_confirmed)+pair(c('Pipeline strand parameter','流程方向参数'),x.pipeline_strandedness)+'</dl></div></div><p class="small muted">'+c('Age units and staging systems remain explicit. Pipeline direction and split labels do not establish kit identity or patient independence.','年龄单位和分期体系按确认状态使用。流程方向参数及来源划分标签不能确认试剂盒型号或受试者独立性。')+'</p><dl class="definition small">'+pair(c('Observation identifier','来源观察标识'),b.source_observation_id)+pair(c('Subject / physical library','受试者／物理文库'),c('Unconfirmed','未确认'))+'</dl></details>';
}

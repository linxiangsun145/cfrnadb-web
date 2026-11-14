import {escape as e,number as n,numeric,route} from './portal-data.mjs';
import {copy as c,t,featureName,channelName} from './portal-i18n.mjs';
import {distribution,pairValues,spearman} from './portal-compare.mjs';

const q=(path,args)=>path+'?'+new URLSearchParams(args);
const heading=(title,subtitle)=>'<div class="page-top"><div><p class="eyebrow">cfRNAdb</p><h1>'+e(title)+'</h1><p>'+e(subtitle)+'</p></div></div>';
const note=text=>'<div class="note">'+e(text)+'</div>';
const featureLink=f=>route('feature/'+f.dataset_id+'/'+f.id);

export function boxplot(measurements,groups){
  const labels=[...new Set([...groups.values()])].sort();const values=measurements.map(r=>r.value).filter(Number.isFinite);
  if(!values.length)return '<p class="muted">'+c('No measured values','没有有效测量值')+'</p>';
  const low=Math.min(...values),high=Math.max(...values),span=high-low||1;
  const y=v=>175-(v-low)/span*145;
  return '<svg viewBox="0 0 580 230" class="chart" role="img" aria-label="'+c('Descriptive source-group distributions','来源分组的描述性分布')+'">'+[0,.5,1].map(p=>'<line class="grid" x1="70" x2="560" y1="'+(175-p*145)+'" y2="'+(175-p*145)+'"/><text x="62" y="'+(179-p*145)+'" text-anchor="end">'+e(numeric(low+p*span))+'</text>').join('')+
    labels.map((group,index)=>{const rows=measurements.filter(r=>groups.get(r.source_id)===group),s=distribution(rows),x=115+index*370/Math.max(1,labels.length-1),half=Math.min(44,190/Math.max(1,labels.length));if(!s.n)return '';return '<line x1="'+x+'" x2="'+x+'" y1="'+y(s.min)+'" y2="'+y(s.max)+'" stroke="#6e8baa"/><rect x="'+(x-half)+'" width="'+(2*half)+'" y="'+y(s.q3)+'" height="'+Math.max(1,y(s.q1)-y(s.q3))+'" fill="'+(index?'#cce4fa':'#d7eadf')+'" stroke="#52799f"/><line x1="'+(x-half)+'" x2="'+(x+half)+'" y1="'+y(s.median)+'" y2="'+y(s.median)+'" stroke="#24486c" stroke-width="2"/><text x="'+x+'" y="203" text-anchor="middle">'+e(group)+'</text><text x="'+x+'" y="221" text-anchor="middle">n='+s.n+'; NA='+s.missing+'</text>';}).join('')+'</svg>';
}

function scatter(a,b,groups){
  const pairs=pairValues(a.measurements,b.measurements),r=spearman(pairs);
  if(!pairs.length)return note(c('No paired measured observations','没有可配对的有效来源观察'));
  const xs=pairs.map(p=>Math.log1p(p.x)),ys=pairs.map(p=>p.y),xmin=Math.min(...xs),xmax=Math.max(...xs),ymin=Math.min(...ys),ymax=Math.max(...ys);
  const x=v=>55+(v-xmin)/(xmax-xmin||1)*480,y=v=>215-(v-ymin)/(ymax-ymin||1)*180;
  return '<svg class="chart" viewBox="0 0 580 260" role="img" aria-label="'+c('Paired expression and coverage values','配对的表达与覆盖谱数值')+'"><line class="grid" x1="55" x2="550" y1="215" y2="215"/><line class="grid" x1="55" x2="55" y1="25" y2="215"/>'+pairs.map((p,i)=>'<circle cx="'+x(xs[i])+'" cy="'+y(p.y)+'" r="2.7" fill="'+(groups.get(p.source_id)==='PDAC'?'#2475b5':'#3c8c68')+'" opacity=".65"><title>'+e(p.label)+': '+p.x+', '+p.y+'</title></circle>').join('')+'<text x="55" y="240">log1p('+e(a.channel.unit)+')</text><text x="55" y="17">'+e(b.channel.unit)+'</text></svg><p class="small">'+c('Paired labels','配对来源标签')+': '+n(pairs.length)+' · Spearman ρ='+e(numeric(r))+'</p>';
}

export async function renderGene(main,catalog,params,api){
  const cohort=params.cohort||catalog.default_cohort||'cancer373',gene=params.gene||'TP53';
  const form='<section class="filter-panel"><form class="gene-form" data-form="gene"><div class="field"><label for="gene-query">'+c('Exact source gene symbol or Ensembl gene ID','来源基因符号或 Ensembl 基因 ID')+'</label><input id="gene-query" name="gene" value="'+e(gene)+'" maxlength="80" required></div><div class="field"><label for="gene-cohort">'+t('study')+'</label><select id="gene-cohort" name="cohort">'+catalog.studies.map(s=>'<option value="'+s.id+'" '+(s.id===cohort?'selected':'')+'>'+e(s.accession)+'</option>').join('')+'</select></div><button class="btn primary">'+c('Explore gene','查看基因联动')+'</button></form></section>';
  const title=heading(c('Gene-linked feature explorer','基因跨特征联动'),c('Follow explicit source gene identifiers across feature layers within one study.','在同一研究内，按来源明确的基因标识关联不同特征层。'));
  let result;
  try{result=await api(q('gene',{cohort,gene,include_values:'1'}));}catch(error){if(error.status===404){main.innerHTML=title+form+note(c('No exact source gene mapping was found. Try an Ensembl gene ID or another study.','没有找到明确的来源基因映射，可尝试 Ensembl 基因 ID 或另一研究。'));return;}throw error;}
  const unique=[...new Set(result.genes.map(g=>g.gene_id))];
  if(unique.length>1){main.innerHTML=title+form+note(c('This source symbol maps to multiple gene IDs. Choose an explicit gene before comparing values.','该来源符号对应多个基因ID，请先选择明确的基因再比较数值。'))+unique.map(id=>'<a class="btn" href="'+route('genes',{cohort,gene:id})+'">'+e(id)+'</a>').join(' ');return;}
  const groups=result.groups?new Map(result.groups.map(r=>[r.source_id,r.group])):new Map((await api(q('metadata',{cohort}))).items.map(r=>[r.source_observation_id,r.clinical_group_reported]));
  const ds=id=>catalog.datasets.find(d=>d.id===id);
  const selected=['mRNA_lncRNA','cfrnapro','ap_usage'].map(kind=>result.links.find(l=>l.feature.kind===kind)).filter(Boolean);
  const values=result.primary_features||await Promise.all(selected.map(l=>api(q('feature',{dataset:l.feature.dataset_id,feature:l.feature.id}))));
  const plots=values.map(f=>'<section class="card"><h2>'+e(featureName(f.dataset))+'</h2><p>'+e(channelName(f.channel))+' · '+e(f.channel.unit)+'</p>'+boxplot(f.measurements,groups)+'<p class="small">'+c('Median and quartiles; whiskers show measured range. Zero is retained.','箱体为四分位数，中线为中位数，须线为实测范围；保留零值。')+'</p><a href="'+featureLink(f)+'">'+c('Exact values & full feature details','精确值与完整特征详情')+' →</a></section>').join('');
  const expression=values.find(f=>f.dataset.kind==='mRNA_lncRNA'),coverage=values.find(f=>f.dataset.kind==='cfrnapro');
  main.innerHTML=title+form+'<section class="card"><h2>'+e(result.genes[0].gene_symbol||gene)+' · '+e(unique[0])+'</h2><p class="small">'+c('Source Ensembl gene versions and reference hashes remain attached to each link. Unmapped features are not assigned by coordinate proximity or name similarity.','每项关联保留来源 Ensembl 版本及参考哈希；不按坐标邻近或名称相似性补造关联。')+'</p><div class="gene-coverage">'+result.coverage.map(row=>{const d=ds(row.dataset_id);return '<span><b>'+e(featureName(d))+'</b> '+n(row.features_for_gene)+(row.mapping_status==='NO_ATTESTED_GENE_MAPPING'?' · '+c('mapping unavailable','无可核查基因映射'):'');}).join('</span>')+'</span></div></section><div class="gene-plots section-gap">'+plots+'</div>'+
    (expression&&coverage?'<section class="card section-gap"><h2>'+c('Paired expression & coverage','表达与覆盖谱配对')+'</h2>'+scatter(expression,coverage,groups)+'</section>':'')+
    note(c('These are descriptive source-observation summaries. Patient independence is unconfirmed. Shared reads, library protocol and study batch can affect patterns; correlation does not establish independent biological support or a diagnostic effect.','这些统计仅描述来源观察。受试者独立性尚未确认，共享 reads、建库流程及研究批次均可能影响分布；相关性不等于独立生物学支持或诊断效果。'))+
    '<section class="card section-gap"><div class="section-head"><h2>'+c('Source-supported feature links','有来源支持的特征关联')+'</h2><button class="btn small" data-gene-export>'+c('Export links TSV','导出关联 TSV')+'</button></div><div class="table-wrap"><table><thead><tr><th>'+t('featureView')+'</th><th>'+t('featureId')+'</th><th>'+c('Source gene & relation','来源基因与关联类型')+'</th></tr></thead><tbody>'+result.links.map(l=>'<tr><td>'+e(featureName(ds(l.feature.dataset_id)))+'</td><td><a class="mono" href="'+featureLink(l.feature)+'">'+e(l.feature.native_id)+'</a></td><td class="small">'+e(l.source_gene_id)+'<span class="secondary">'+e(l.relation)+'</span></td></tr>').join('')+'</tbody></table></div>'+(result.truncated?note(c('First 100 links are shown; use the feature browser for further source IDs.','当前显示前100项关联，可在特征浏览中继续检索来源标识。')):'')+'</section>';
  main.querySelector('[data-gene-export]').addEventListener('click',()=>{
    const rows=[['gene_id','source_gene_id','relation','release_id','feature_revision_id','native_feature_id','reference_sha256'],...result.links.map(l=>[l.gene_id,l.source_gene_id,l.relation,l.feature.dataset_id,l.feature.id,l.feature.native_id,l.evidence.reference_sha256])];
    const raw=rows.map(r=>r.map(v=>String(v??'').replace(/[\t\r\n]/g,' ')).join('\t')).join('\n')+'\n',url=URL.createObjectURL(new Blob([raw],{type:'text/tab-separated-values'})),a=document.createElement('a');a.href=url;a.download='cfrnadb-'+gene+'-links.tsv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  });
}

export async function renderExamples(main,api,id){
  const catalog=await api('examples'),items=id?catalog.items.filter(x=>x.id===id):catalog.items;
  main.innerHTML=heading(c('Reproducible resource examples','可复用的资源使用案例'),c('Source-bound queries, descriptive figures and downloadable reproduction files.','提供来源绑定的查询、描述性图表和可下载复现文件。'))+note(c('Illustrative genes were specified before inspecting group effects. These examples demonstrate resource use and are not clinical validation.','示例基因在查看组间效应前指定；案例展示资源使用，不作为临床验证。'))+'<div class="example-grid">'+items.map(item=>'<section class="card"><p class="eyebrow">'+e(item.gene)+' · GSE133684</p><h2><a href="'+route('examples/'+item.id)+'">'+e(c(item.title_en,item.title_zh))+'</a></h2><p>'+e(c(item.summary_en,item.summary_zh))+'</p><img class="example-figure" loading="lazy" src="/v1/portal/examples/'+item.id+'/figure.svg" alt="'+e(c(item.title_en,item.title_zh))+'"><div class="metadata-downloads"><a class="btn small" href="'+route('genes',{cohort:'gut401',gene:item.gene})+'">'+c('Explore this gene','查看基因联动')+'</a>'+['values.tsv','reproduce.py','figure.svg','figure.pdf','reproduction.zip'].filter(name=>item.files[name]).map(name=>'<a class="btn small" href="/v1/portal/examples/'+item.id+'/'+name+'">'+e(name)+'</a>').join('')+'</div><p class="small muted">'+e(c(item.caption_en,item.caption_zh))+'</p></section>').join('')+'</div>';
}

export async function renderQuality(main,catalog,api){
  const report=await api('quality');const ds=id=>catalog.datasets.find(d=>d.id===id);
  main.innerHTML=heading(c('Quality & reproducibility evidence','质量与可复现性证据'),c('Separate frozen-value checks, source QC and original-run reconstruction.','分别呈现冻结值核查、来源质控和原始运行重建证据。'))+
    '<section class="card"><h2>'+c('Available view-level evidence','已提供的视图级证据')+'</h2><div class="table-wrap"><table><thead><tr><th>'+t('study')+'</th><th>'+t('featureView')+'</th><th>'+c('Observed cells','实测单元')+'</th><th>NA</th><th>'+c('Verification','核查范围')+'</th></tr></thead><tbody>'+report.datasets.map(r=>'<tr><td>'+e(r.study)+'</td><td>'+e(featureName(ds(r.dataset_id)))+'</td><td>'+n(r.observed_cells)+'</td><td>'+n(r.missing_cells)+'</td><td>'+c('Source values, frozen partitions and hashes','来源数值、冻结分区与哈希')+'</td></tr>').join('')+'</tbody></table></div><p class="small muted">'+c('Counts span all channels and can overlap across layers. Technical checks do not establish biological validation.','计数覆盖所有通道，跨层可能重叠；技术核查不等同于生物学验证。')+'</p></section><h2 class="section-gap">'+c('Original advanced-run evidence · HRA000210','高级特征原始运行证据 · HRA000210')+'</h2><div class="two-columns">'+report.advanced_run_evidence.map(r=>'<section class="card"><h3>'+e(r.kind)+'</h3><span class="pill">'+c('Run artifacts pending','原运行文件待交付')+'</span><p>'+c('Rules, current configuration and delivery QC are available. The original model, report and selection files are not readable by the project account.','已有规则、当前配置和交付质控；项目账号仍无法读取原始模型、报告及筛选文件。')+'</p><p class="mono small">'+e(r.missing_files.join(' · '))+'</p></section>').join('')+'</div>'+
    note(c('Missing evidence remains explicit. Current configuration and newly calculated statistics cannot substitute for the original historical QC run.','缺少的证据保持明确标记；当前配置和新计算统计不能替代历史运行证明。'));
}

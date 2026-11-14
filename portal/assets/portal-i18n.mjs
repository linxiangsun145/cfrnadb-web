// Interface copy only. Source IDs, numeric values, units and exported data remain canonical.
export function language(search=globalThis.location?.search||'') {
  return new URLSearchParams(search).get('lang')==='zh'?'zh':'en';
}
export const lang=language();
export const copy=(en,zh)=>lang==='zh'?zh:en;
export function languageUrl(target,url=globalThis.location?.href||'http://localhost/portal/') {
  const next=new URL(url);next.searchParams.set('lang',target==='zh'?'zh':'en');return next.href;
}
const messages={
  genes:['Gene explorer','基因联动'],examples:['Examples','使用案例'],public:['PUBLIC OPEN-DATA RELEASE','公开数据版'],
  home:['Home','首页'],browse:['Browse','特征浏览'],search:['Search','搜索'],studies:['Studies & QC','数据来源与质控'],statistics:['Statistics','数据统计'],downloads:['Downloads','数据下载'],help:['Methods & help','方法与帮助'],
  private:['PRIVATE RESEARCH EDITION','私有研究版'],subtitle:['Cell-free RNA feature database','游离 RNA 多维特征数据库'],skip:['Skip to content','跳到主要内容'],connecting:['Connecting to the catalogue…','正在连接数据目录…'],loading:['Loading research data…','正在读取研究数据…'],live:['Live catalogue','实时数据目录'],versions:['Versions','数据版本'],
  footerNote:['Source analysis labels are retained independently of physical sample identities.','来源分析标签与物理样本身份分开保留。'],footerDefinitions:['Data definitions','数据定义'],footerProvenance:['Versions & provenance','版本与来源'],
  sources:['Source labels','来源标签'],features:['Feature rows','特征行'],views:['Feature views','特征视图'],studiesCount:['Source studies','来源研究'],final:['Unified final view','统一最终视图'],cohort:['Cohort view','独立队列视图'],history:['Historical / source view','历史／来源版本'],preview:['Early preview','早期预览'],audit:['Full audit view','完整审计视图'],
  featureView:['Feature view','特征视图'],study:['Source study','来源研究'],version:['Version','版本'],allViews:['All available views','全部可用视图'],allVersions:['All selected versions','所选范围内的全部版本'],keyword:['Gene or source feature ID','基因或来源特征 ID'],placeholder:['HGNC symbol, Ensembl ID or native feature ID','输入基因符号、Ensembl ID 或原生特征 ID'],
  historyToggle:['Include historical / source versions','包含历史／来源版本'],auditToggle:['Include full audit views','包含完整审计视图'],clear:['Clear filters','清空筛选'],apply:['Apply filters','应用筛选'],previous:['Previous','上一页'],next:['Next','下一页'],pageSize:['Rows per page','每页行数'],exportPage:['Export this page','导出当前页'],
  featureId:['Feature / native ID','特征／原生 ID'],gene:['Gene annotation','基因注释'],channel:['Measurement channel','测量通道'],unit:['Unit','单位'],value:['Value','数值'],state:['Measurement state','测量状态'],status:['Status','状态'],
  measured:['Measured labels','有测量值的标签'],missing:['Missing labels','缺失标签'],zero:['Observed zero','实测零值'],median:['Median of measured values','有效值中位数'],distribution:['Distribution across source labels','来源标签间的数值分布'],exact:['Exact source values','精确来源数值'],filterSources:['Filter source labels…','筛选来源标签…'],
  annotation:['Feature annotation','特征注释'],coordinates:['Reference coordinates','参考坐标'],provenance:['Provenance','来源追溯'],reference:['Reference definition','参考定义'],releaseId:['Release identifier','数据版本标识'],revision:['Feature revision','特征修订标识'],identity:['Source identity','来源身份'],selection:['Selection scope','筛选范围'],
  featureDownload:['Download these values','下载该特征数值'],matrixDownload:['Full matrix & metadata','完整矩阵与元数据'],related:['Find related source IDs','查找关联来源 ID'],sourceHash:['Source manifest SHA-256','来源清单 SHA-256'],referenceHash:['Reference SHA-256','参考定义 SHA-256'],
  sourceLabel:['Source analysis label','来源分析标签'],observation:['Observation identifier','来源观察标识'],qc:['Source QC metric','来源质控指标'],qcCount:['QC fields supplied','已提供的质控字段'],qcContext:['Feature view for QC','质控所属特征视图'],coverage:['Measurement-state coverage','测量状态覆盖'],available:['Available feature layers','可用特征层'],channels:['Channels','通道数'],
  browseView:['Browse this view','浏览该视图'],sourceMetadata:['Download source metadata','下载来源元数据'],sampleMetrics:['Source sample-level measurements','来源标签级测量'],notSupplied:['Not supplied','未提供'],reported:['Source reported','来源报告'],pass:['PASS','通过'],
  chooseDownload:['Choose a version and channel','选择版本与测量通道'],columns:['Source label columns','来源标签列'],cells:['Values, including NA','数值单元（含 NA）'],oneUnit:['Unit per matrix','每个矩阵对应一种单位'],prepare:['Prepare full download bundle','生成完整下载包'],inside:['Inside every bundle','每个下载包的内容'],downloadNotes:['Download notes','下载说明'],ready:['Your bundle is ready','下载包已就绪'],zip:['Download ZIP','下载 ZIP'],queued:['Queued for preparation','已加入生成队列'],building:['Preparing your full matrix','正在生成完整矩阵'],checkAgain:['Check again','重新检查'],failedBundle:['Bundle preparation did not finish','下载包生成未完成'],
  retry:['Try again','重试'],backHome:['Back to home','返回首页'],unavailable:['Service unavailable','服务暂时不可用'],loadError:['We could not load this view','暂时无法加载此页面'],empty:['No matching source feature','未找到匹配的来源特征'],
  observed:['Observed','实测值'],signed:['Observed · signed','实测值（可为负值）'],lowCoverage:['Missing · low coverage','缺失：覆盖不足'],lowDepth:['Missing · low allelic depth','缺失：等位基因深度不足'],zeroGene:['Missing · zero gene TPM','缺失：基因 TPM 为零'],qcMissing:['Missing · source QC','缺失：来源质控'],
  guideStart:['Getting started','快速入门'],guideProcessing:['Feature processing','特征处理'],guideUnits:['Units & missing states','单位与缺失状态'],guideIdentity:['Source identities','来源身份'],guideVersions:['Versions & QC','版本与质控'],guideDownloads:['Downloads','下载格式'],guideReferences:['References','参考文献'],
};
export function t(key){const m=messages[key];if(!m)throw new Error('Missing interface message: '+key);return m[lang==='zh'?1:0];}
const features={
  ap:['Alternative promoters','可变启动子','Promoter activity, transcript TPM and within-gene usage.','启动子活性、转录本 TPM 与基因内使用率。'],
  ap_usage:['Promoter gene usage','基因层启动子使用率','Major, minor and inactive promoter fractions at gene level.','基因层主要、次要及非活跃启动子的使用比例。'],
  ase:['Allelic expression','等位基因表达','Allelic imbalance with source-specific depth and missingness rules.','等位基因表达不平衡，保留来源特定的深度与缺失值规则。'],
  as:['Alternative splicing','可变剪接','Source-defined splice events and inclusion PSI.','来源定义的剪接事件及包含水平 PSI。'],
  cfpeak:['RNA peaks','RNA 富集峰','RNA peaks on the source reference sequences.','来源 RNA 参考序列上的富集峰。'],
  cfrnapro:['RNA coverage profiles','RNA 覆盖谱','Gene-span coverage and KL divergence from uniform coverage.','基因范围内的覆盖度及相对均匀覆盖的 KL 散度。'],
  editing:['RNA editing','RNA 编辑','Source RNA editing fractions and explicit QC missing states.','来源 RNA 编辑等位基因比例及明确的质控缺失状态。'],
  endmotif:['Read-end motifs','读段末端基序','Read-start 4-mers in sequenced orientation and normalized spectra.','测序方向的读段起始端 4-mer 及背景归一化谱。'],
  fusion:['Candidate fusions','候选融合','Source fusion predictions and QC detection states.','来源融合预测、支持证据及质控后检出状态。'],
  mbrna:['Microbial RNA','微生物 RNA','Source microbial genus counts and library-sum CPM.','来源微生物属级计数及按文库总量归一化的 CPM。'],
  mRNA_lncRNA:['mRNA & lncRNA','mRNA 与 lncRNA','Gene expression with the recorded source quantification definitions.','依据来源定量定义组织的基因表达数据。'],
  mutation:['RNA variants','RNA 变异','RNA variant fractions; paired-DNA somatic confirmation is not supplied.','RNA 变异等位基因比例；尚无配对 DNA 的体细胞变异确认。'],
  rag:['Rare-abundance genes','低丰度基因 RAG','Source RAG abundance, library-sum normalization and enrichment.','来源 RAG 丰度、文库总量归一化与富集评分。'],
  sncrna:['Small non-coding RNA','小非编码 RNA','Source small-RNA counts and nine-category RPM normalization.','来源小 RNA 计数及基于九类 RNA 总量的 RPM 归一化。'],
  TE:['Transposable-element RNA','转座元件 RNA','Selected repeat-subfamily estimates with source reference and QC.','保留来源参考与质控定义的重复元件亚家族估计量。'],
  TE_full_audit:['Gene & repeat audit','基因与重复元件审计','Full gene-plus-repeat estimation universe for audit.','用于审计的完整基因与重复元件估计集合。'],
};
export const featureName=d=>features[d.kind]?.[lang==='zh'?1:0]||d.name;
export const featureDescription=d=>features[d.kind]?.[lang==='zh'?3:2]||d.description;
export const roleName=role=>t(role==='cohort'?'cohort':role);
const columns={value:['Final feature value','最终特征值'],counts:['Counts','计数'],cpm:['CPM','CPM'],tpm:['TPM','TPM'],rpm:['RPM','RPM'],kl:['KL divergence','KL 散度'],mean_coverage:['Mean coverage','平均覆盖度'],usage:['Promoter usage','启动子使用率'],major:['Major promoter usage','主要启动子使用率'],minor:['Minor promoter usage','次要启动子使用率'],inactive:['Inactive promoter fraction','非活跃启动子比例'],ae:['Allele imbalance','等位基因表达不平衡'],ref_fraction:['Reference allele fraction','参考等位基因比例'],ref_counts:['Reference support','参考等位基因支持数'],alt_counts:['Alternative support','替代等位基因支持数'],observed:['Observed state','观测状态'],psi:['PSI','PSI'],ffpm:['FFPM','FFPM'],log2nx:['log₂(CPM + 1)','log₂(CPM + 1)'],zscore:['Source control Z score','来源对照 Z 分数'],frequency:['Observed frequency','观测频率']};
export const channelName=c=>columns[c.column]?.[lang==='zh'?1:0]||(c.column||c.unit).replaceAll('_',' ');
export function stateName(state){return t(state==='observed_zero'?'zero':state==='observed_positive'?'observed':state.includes('negative')?'signed':state.includes('low_coverage')?'lowCoverage':state.includes('15')?'lowDepth':state.includes('zero_gene')?'zeroGene':'qcMissing');}
const fields={'gene name':'基因名称','gene type':'基因类型','gene id':'基因 ID','feature type':'特征类型','annotation':'注释','repeat class':'重复类别','repeat family':'重复家族','annotation loci':'注释位点','chrom':'染色体','position':'位置','ref':'参考碱基','alt':'替代碱基','source':'来源','view membership':'所属视图','exon union length':'外显子并集长度','motif':'基序','native namespace':'原生命名空间','selected TE subset':'已选 TE 子集','sequence':'序列','start':'起点','end':'终点','strand':'链方向','system':'坐标系统','namespace':'坐标命名空间','reference seq id':'参考序列 ID','coordinate system':'坐标系统','source assembly label':'来源组装版本','identity status':'身份状态','source TSS 1based':'来源 TSS（1-based）','nominal length nt':'标称长度（nt）','length type':'长度类型','source RNA category':'来源 RNA 类别','source sequence id':'来源序列 ID','annotation note':'注释说明','gene label':'基因标签','rag enrichment score':'RAG 富集评分','features':'特征数','features passing coverage':'通过覆盖阈值的特征数','nonzero coverage features':'覆盖非零的特征数','coverage mode':'覆盖模式','elapsed seconds':'运行时间（秒）','bedtools version':'bedtools 版本','min avg cov exclusive':'平均覆盖度严格下限'};
export function fieldName(key){const name=key.replaceAll('_',' ');return lang==='zh'?(fields[name]||name):name;}
export const studyTitle=s=>s.accession+' · '+(s.id==='cancer373'?copy('Unified cfRNA features','统一 cfRNA 特征'):copy('Independent cohort','独立研究队列'));

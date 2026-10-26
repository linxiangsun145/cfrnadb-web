import { STATES, filterFeatures, filterSamples, paginate, channelMeasurements, summarizeMeasurements, toTsv, SAMPLE_FIELDS, FEATURE_FIELDS, MEASUREMENT_FIELDS } from './data.mjs';

const main = document.querySelector('#main');
document.querySelector('.skip-link').addEventListener('click',event=>{event.preventDefault();main.focus();main.scrollIntoView();});
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const format = value => value === null || value === undefined ? '—' : new Intl.NumberFormat('en', { maximumFractionDigits:3 }).format(value);
const route = (path = '', params = {}) => '#/' + path + (Object.values(params).some(v => v !== '' && v !== undefined) ? '?' + new URLSearchParams(Object.entries(params).filter(([,v]) => v !== '' && v !== undefined)) : '');
const tag = text => `<span class="tag">${escape(text)}</span>`;
const stateBadge = state => `<span class="state ${escape(state)}">${escape(STATES[state] || state)}</span>`;
const meta = entries => `<dl class="metadata">${entries.map(([label,value]) => `<dt>${escape(label)}</dt><dd>${escape(value ?? 'Not provided')}</dd>`).join('')}</dl>`;
const title = (eyebrow,heading,description,action='') => `<div class="page-head"><div><p class="eyebrow">${escape(eyebrow)}</p><h1>${escape(heading)}</h1><p class="subtitle">${escape(description)}</p></div>${action}</div>`;
const empty = (heading='No matching results',text='Try another search or reset the filters.') => `<div class="empty"><strong>${escape(heading)}</strong>${escape(text)}</div>`;
const option = (value,label,selected) => `<option value="${escape(value)}"${value===selected?' selected':''}>${escape(label)}</option>`;
const field = (label,id,content) => `<div class="field"><label for="${id}">${escape(label)}</label>${content}</div>`;
let data, manifest, lastExplore=route('explore'), lastSamples=route('samples'), preserveScroll=false, toastTimer;
const moduleById = id => data.modules.find(m => m.id===id);
const featureById = id => data.features.find(f => f.id===id);
const sampleById = id => data.samples.find(s => s.id===id);
const channelsOf = feature => moduleById(feature.module_id).channels.filter(c => feature.channel_ids.includes(c.id));

function currentRoute() {
  const hash=location.hash.slice(1) || '/', [path,query='']=hash.split('?');
  return { parts:path.replace(/^\/+|\/+$/g,'').split('/').filter(Boolean), params:Object.fromEntries(new URLSearchParams(query)) };
}
function navigate(path, params={}, keepScroll=false) {
  preserveScroll=keepScroll;
  const next=route(path,params);
  if (location.hash===next) render(); else location.hash=next;
}
function pager(page, path, params) {
  return `<div class="pager"><span>Showing ${page.from}–${page.to} of ${page.total}</span><div class="pager-buttons"><button class="btn compact" data-page="${page.page-1}" data-path="${path}" ${page.page<=1?'disabled':''}>← Previous</button><span>Page ${page.page} of ${page.pages}</span><button class="btn compact" data-page="${page.page+1}" data-path="${path}" ${page.page>=page.pages?'disabled':''}>Next →</button></div></div>`;
}
function featureTable(rows) {
  if (!rows.length) return empty();
  return `<div class="table-wrap"><table><thead><tr><th scope="col">FEATURE / LABEL</th><th scope="col">ANALYSIS VIEW</th><th scope="col">TYPE</th><th scope="col" class="align-right">OBSERVED SAMPLES¹</th></tr></thead><tbody>${rows.map(f => `<tr><td><a class="mono" href="${route('feature/'+f.id)}">${escape(f.id)}</a><span class="feature-name">${escape(f.name)}</span></td><td>${escape(moduleById(f.module_id).name)}</td><td>${tag(f.type)}</td><td class="align-right">${f.available_samples} / ${data.samples.length}</td></tr>`).join('')}</tbody></table></div>`;
}
function renderHome() {
  const examples=['DEMO-SNC-001','DEMO-PRO-001','DEMO-COV-001'].map(featureById);
  return `<section class="hero"><div><p class="eyebrow">Explore the development preview</p><h1>A shared view of<br>cell-free RNA features.</h1><p class="subtitle">Browse features, inspect individual measurements, and trace each value to its sample, channel, and release.</p><form class="search-form" id="home-search" role="search"><input type="search" name="q" aria-label="Search demo features" placeholder="Search a feature, RNA label, or gene…" maxlength="200"><button class="btn primary" type="submit">Search →</button></form><p class="small muted">Try <a href="${route('explore',{q:'VIM'})}">VIM</a>, <a href="${route('explore',{q:'miR-21'})}">miR-21</a>, or <a href="${route('explore',{module:'cfpeak'})}">RNA peaks</a></p></div><aside class="hero-panel"><p class="eyebrow">One reproducible browsing path</p><div class="path"><span class="step-number">01</span>Find a feature across analysis views</div><div class="path"><span class="step-number">02</span>Inspect samples, units, and quality states</div><div class="path"><span class="step-number">03</span>Download the same values and metadata</div><p class="small muted" style="margin:20px 0 0">This release uses synthetic fixtures to test the complete browsing experience.</p></aside></section>
  <section class="stats" aria-label="Synthetic demo release counts">${[[data.features.length,'Demo features'],[data.samples.length,'Simulated samples'],[data.studies.length,'Fictional studies'],[data.modules.length,'Analysis views']].map(([n,s])=>`<div class="stat"><strong>${n}</strong><span>${s}</span></div>`).join('')}</section>
  <section><div class="section-head"><h2>Explore by analysis view</h2><a href="${route('explore')}">Browse all features →</a></div><div class="cards">${data.modules.map(m=>`<a class="card module-card" href="${route('explore',{module:m.id})}"><span class="module-symbol">${escape(m.short)}</span><h3>${escape(m.name)}</h3><p>${escape(m.description)}</p><div class="card-bottom"><span>${data.features.filter(f=>f.module_id===m.id).length} demo features</span><span aria-hidden="true">↗</span></div></a>`).join('')}</div></section>
  <div class="home-bottom"><section class="card"><div class="section-head"><h2>Start with an example</h2>${tag('SYNTHETIC')}</div>${examples.map(f=>`<div class="example-row"><div><a href="${route('feature/'+f.id)}">${escape(f.name)} →</a><br><small>${escape(moduleById(f.module_id).name)}</small></div><span class="mono muted">${escape(f.id)}</span></div>`).join('')}</section><section class="card"><p class="eyebrow">Release ${escape(data.version)}</p><h2>Definitions travel with the data.</h2><p class="small muted">Separate measurement channels, explicit unavailable states, and versioned feature identifiers are included in every measurement export.</p><a class="small" href="${route('docs',{section:'states'})}">Read the data guide →</a></section></div>`;
}
function renderExplore(params) {
  lastExplore=location.hash || route('explore');
  const types=[...new Set(data.features.filter(f=>!params.module||f.module_id===params.module).map(f=>f.type))].sort();
  const results=filterFeatures(data,params), page=paginate(results,params.page);
  return title('Feature catalog','Explore features','Search illustrative annotations and compare availability within each analysis view.',`<button class="btn" data-download="filtered-features">↓ Export ${results.length} feature${results.length===1?'':'s'}</button>`)+`
  <div class="browser-layout"><aside class="filter-panel"><h2>Refine results</h2><form id="feature-filters">
  ${field('Search','feature-query',`<input id="feature-query" type="search" name="q" value="${escape(params.q||'')}" placeholder="Name or feature ID" maxlength="200">`)}
  ${field('Analysis view','module-filter',`<select id="module-filter" name="module">${option('','All analysis views',params.module||'')}${data.modules.map(m=>option(m.id,m.name,params.module)).join('')}</select>`)}
  ${field('Feature type','type-filter',`<select id="type-filter" name="type">${option('','All feature types',params.type||'')}${types.map(t=>option(t,t,params.type)).join('')}</select>`)}
  <button class="btn primary" type="submit">Apply filters</button></form><p class="small" style="margin-bottom:0"><a href="${route('explore')}">Reset filters</a></p><div class="filter-note"><strong>About this catalog</strong><p>Every record in this release is synthetic. View counts refer to this demo, not the research cohort.</p></div></aside>
  <section class="results-panel" aria-label="Feature search results"><div class="toolbar"><span class="result-meta" role="status">${results.length} matching feature${results.length===1?'':'s'} · ${escape(data.version)}</span><div><label class="small muted" for="feature-sort">Sort </label><select id="feature-sort">${option('name','Name A–Z',params.sort||'name')}${option('availability','Availability: high to low',params.sort)}</select></div></div>
  ${featureTable(page.items)}${pager(page,'explore',params)}<p class="small muted" style="margin-top:18px">¹ Available observations in the feature’s primary channel, including observed zeros. Other states are excluded.</p></section></div>`;
}
function renderSamples(params) {
  lastSamples=location.hash || route('samples');
  const results=filterSamples(data,params), page=paginate(results,params.page);
  return title('Sample directory','Browse samples','Explore fictional studies and sample identities defined for this demo.',`<button class="btn" data-download="filtered-samples">↓ Export ${results.length} samples</button>`)+`
  <div class="browser-layout"><aside class="filter-panel"><h2>Refine samples</h2><form id="sample-filters">
  ${field('Search','sample-query',`<input id="sample-query" type="search" name="q" value="${escape(params.q||'')}" placeholder="Sample ID or demo group" maxlength="200">`)}
  ${field('Fictional study','study-filter',`<select id="study-filter" name="study">${option('','All demo studies',params.study||'')}${data.studies.map(s=>option(s.id,s.name,params.study)).join('')}</select>`)}
  ${field('Simulated biofluid','biofluid-filter',`<select id="biofluid-filter" name="biofluid">${option('','All biofluids',params.biofluid||'')}${['Plasma','Serum'].map(s=>option(s,s,params.biofluid)).join('')}</select>`)}
  <button class="btn primary" type="submit">Apply filters</button></form><p class="small" style="margin-bottom:0"><a href="${route('samples')}">Reset filters</a></p><div class="filter-note"><strong>Fictional groups</strong><p>Demo groups A, B, and C are interface labels. They do not represent diagnoses or clinical cohorts.</p></div></aside>
  <section class="results-panel" aria-label="Sample search results"><div class="toolbar"><span class="result-meta" role="status">${results.length} matching samples · Synthetic identities</span></div>${!results.length?empty():`<div class="table-wrap"><table><thead><tr><th scope="col">SAMPLE</th><th scope="col">FICTIONAL STUDY</th><th scope="col">DEMO GROUP</th><th scope="col">SIMULATED BIOFLUID</th></tr></thead><tbody>${page.items.map(s=>`<tr><td><a class="mono" href="${route('sample/'+s.id)}">${escape(s.id)}</a></td><td><a href="${route('samples',{study:s.study_id})}">${escape(s.study_id)}</a></td><td>${escape(s.group)}</td><td>${tag(s.biofluid)}</td></tr>`).join('')}</tbody></table></div>`}${pager(page,'samples',params)}</section></div>`;
}
function chart(rows,channel) {
  const stats=summarizeMeasurements(rows), max=stats.max>0?stats.max:1;
  const width=800, height=300, left=63, right=16, top=26, bottom=232, step=(width-left-right)/rows.length;
  const colors={'Demo group A':'#2e735a','Demo group B':'#71919e','Demo group C':'#b49b5d'};
  let body='';
  for(let t=0;t<=4;t++) {
    const y=bottom-(bottom-top)*t/4, v=max*t/4;
    body+=`<line class="chart-grid" x1="${left}" x2="${width-right}" y1="${y}" y2="${y}"/><text x="${left-10}" y="${y+4}" text-anchor="end">${new Intl.NumberFormat('en',{notation:'compact',maximumFractionDigits:1}).format(v)}</text>`;
  }
  rows.forEach((m,i)=>{
    const s=sampleById(m.sample_id), x=left+i*step+step*.2, bw=step*.6;
    const tooltip=`${m.sample_id} · ${s.group}: ${m.state==='observed'?format(m.value)+' '+channel.unit:STATES[m.state]}`;
    if(m.state==='observed') {
      const bh=(bottom-top)*m.value/max;
      body+=`<rect x="${x}" y="${bottom-Math.max(bh,2)}" width="${bw}" height="${Math.max(bh,2)}" rx="1" fill="${colors[s.group]}"><title>${escape(tooltip)}</title></rect>`;
    } else body+=`<g stroke="#9b9f92" stroke-width="1.5"><title>${escape(tooltip)}</title><path d="M${x+3} ${bottom-8}l${bw-6} 7m0 -7l-${bw-6} 7"/></g>`;
    body+=`<text x="${x+bw/2}" y="${bottom+17}" text-anchor="end" transform="rotate(-50 ${x+bw/2} ${bottom+17})">${escape(m.sample_id.slice(-3))}</text>`;
  });
  return `<div class="chart-scroll"><svg class="measurement-chart" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="chart-title chart-desc"><title id="chart-title">${escape(channel.name)} across synthetic samples</title><desc id="chart-desc">${stats.observed} observed values including ${stats.zeros} zeros; ${stats.missing} unavailable measurements marked by crosses. Exact values are in the accompanying table.</desc>${body}<text x="${(width+left)/2}" y="294" text-anchor="middle">Sample suffix (DEMO-001 to DEMO-024)</text></svg></div><div class="legend">${Object.entries(colors).map(([g,c])=>`<span><i style="background:${c}"></i>${g}</span>`).join('')}<span><i class="missing"></i>× Unavailable; colored baseline = observed zero</span></div>`;
}
function renderFeature(id,params) {
  const feature=featureById(id);
  if(!feature) return notFound('Feature not found','This feature ID is not part of the current synthetic release.');
  const channels=channelsOf(feature), channel=channels.find(c=>c.id===params.channel)||channels[0], rows=channelMeasurements(data,id,channel.id), stats=summarizeMeasurements(rows);
  return `<div class="breadcrumb"><a href="${escape(lastExplore)}">Explore features</a><span>/</span>${escape(id)}</div>`+
    title(moduleById(feature.module_id).name,feature.name,feature.id+' · '+feature.revision_id,`<button class="btn" data-download="feature" data-feature="${id}" data-channel="${channel.id}">↓ Download this channel</button>`)+`
  <div class="detail-grid"><div><section class="card chart-card"><div class="chart-head"><div><h2>Measurements across samples</h2><p class="small muted">Unit: ${escape(channel.unit)}</p></div><div><label for="channel-select">Measurement channel</label><select id="channel-select" data-feature="${id}">${channels.map(c=>option(c.id,c.name,channel.id)).join('')}</select></div></div>${chart(rows,channel)}<div class="summary-strip">${[[stats.observed,'Observed samples'],[stats.missing,'Unavailable'],[stats.zeros,'Observed zeros'],[format(stats.median),'Median · observed only']].map(([v,l])=>`<div><strong>${v}</strong><span>${l}</span></div>`).join('')}</div></section>
  <details class="detail-table" open><summary>Exact measurements · ${rows.length} samples</summary><div class="table-wrap"><table><thead><tr><th scope="col">SAMPLE</th><th scope="col">DEMO GROUP</th><th scope="col" class="align-right">${escape(channel.name.toUpperCase())}</th><th scope="col">STATE</th></tr></thead><tbody>${rows.map(m=>`<tr><td><a class="mono" href="${route('sample/'+m.sample_id)}">${escape(m.sample_id)}</a></td><td>${escape(sampleById(m.sample_id).group)}</td><td class="align-right">${format(m.value)}</td><td>${stateBadge(m.state)}</td></tr>`).join('')}</tbody></table></div></details></div>
  <aside class="card detail-side"><h2 style="font-size:16px">Feature record</h2>${meta([['Feature ID',id],['Revision',feature.revision_id],['Type',feature.type],['Illustrative gene label',feature.gene_label],['Reference marker',feature.reference_id],['Coordinates','Not provided in demo'],['Data kind','Synthetic fixture'],['Release',data.version]])}<div class="notice" style="margin-top:23px">${escape(feature.annotation_note)}</div><p class="small" style="margin:18px 0 0"><a href="${route('docs',{section:'channels'})}">Understand measurement channels →</a></p></aside></div>`;
}
function renderSample(id) {
  const sample=sampleById(id);
  if(!sample) return notFound('Sample not found','This sample ID is not part of the current synthetic release.');
  const primary=new Set(data.features.map(f=>f.primary_channel_id)), rows=data.measurements.filter(m=>m.sample_id===id&&primary.has(m.channel_id));
  return `<div class="breadcrumb"><a href="${escape(lastSamples)}">Samples</a><span>/</span>${escape(id)}</div>`+
  title('Synthetic sample',id,sample.group+' · '+sample.biofluid+' · '+sample.study_id,`<button class="btn" data-download="sample" data-sample="${id}">↓ Download all channels</button>`)+`
  <div class="detail-grid"><section><div class="notice" style="margin-bottom:20px">This table displays the primary channel of each feature. Units differ by view; values are not combined into one scale.</div><div class="table-wrap"><table><thead><tr><th scope="col">FEATURE</th><th scope="col">CHANNEL / UNIT</th><th scope="col" class="align-right">VALUE</th><th scope="col">STATE</th></tr></thead><tbody>${rows.map(m=>{const f=featureById(m.feature_id);return `<tr><td><a href="${route('feature/'+f.id)}">${escape(f.name)}</a><span class="feature-name mono">${escape(f.id)}</span></td><td><span class="mono">${escape(m.channel_id)}</span><span class="feature-name">${escape(m.unit)}</span></td><td class="align-right">${format(m.value)}</td><td>${stateBadge(m.state)}</td></tr>`;}).join('')}</tbody></table></div></section><aside class="card detail-side"><h2 style="font-size:16px">Sample identity</h2>${meta([['Fictional study',sample.study_id],['Subject',sample.subject_id],['Biosample',sample.biosample_id],['Library',sample.library_id],['Sequencing run',sample.sequencing_run_id],['Library type',sample.library_type],['Identity evidence',sample.identity_status],['Data kind','Synthetic fixture']])}</aside></div>`;
}
function renderDownloads() {
  const cards=[
    ['TSV','Sample metadata',`${data.samples.length} synthetic samples with explicit study, subject, biosample, library, and run identities.`,'samples','Download samples'],
    ['TSV','Feature catalog',`${data.features.length} illustrative features with revision IDs, view assignments, and reference markers.`,'features','Download catalog'],
    ['TSV','Measurements',`${format(data.measurements.length)} rows in long format. Each row retains its feature revision, channel, unit, value, and measurement state.`,'measurements','Download measurements'],
    ['JSON','Complete demo release','The same synthetic data used by the website, including definitions, metadata, and all measurement channels.','release','Download release'],
    ['JSON','Release manifest','Release counts, measurement definitions, and the SHA-256 checksum of the complete demo data file.','manifest','Download manifest']
  ];
  return title('Versioned exports','Download the demo release','Reproduce what you see in the browser. Every export is explicitly marked synthetic.')+`
  <div class="notice amber"><strong>${escape(data.version)} · ${escape(data.release_date)} · SYNTHETIC DATA</strong><p>These files are interface fixtures. They are not a scientific data release and should not be used to draw biological or clinical conclusions.</p></div><div class="download-grid">${cards.map(([kind,name,desc,action,button])=>`<section class="card download-card"><div>${tag(kind)}</div><h2>${name}</h2><p>${escape(desc)}</p><button class="btn" data-download="${action}">↓ ${button}</button></section>`).join('')}</div>
  <section class="card"><h2>Export conventions</h2><p class="small muted">TSV exports include <span class="mono">release_id</span> and <span class="mono">data_kind</span>. Unavailable numeric values are empty cells accompanied by their explicit state. An observed zero is exported as <span class="mono">0</span>. Channels are kept separate, and coordinates are not invented for illustrative features.</p><p class="small muted">The complete JSON file is served unchanged so its checksum matches the manifest. Spreadsheet-sensitive text is escaped in TSV exports.</p><a class="small" href="${route('docs',{section:'states'})}">Read the state and channel definitions →</a></section>`;
}
function renderDocs() {
  const sections=[['start','Getting started'],['states','Measurement states'],['channels','Channels & units'],['identity','Sample identity'],['scope','Project scope']];
  return title('Documentation','A guide to this preview','Understand how to browse and interpret the synthetic demonstration data.')+`<div class="docs-layout"><aside class="card docs-nav" aria-label="Guide sections">${sections.map(([id,name])=>`<a href="${route('docs',{section:id})}">${name}</a>`).join('')}</aside><article class="docs-body">
  <section id="doc-start"><h2>Getting started</h2><ol><li>Open <a href="${route('explore')}">Explore</a> and search for an illustrative RNA or gene label such as <code>VIM</code>.</li><li>Filter by analysis view or feature type. Open a feature ID to inspect its values.</li><li>Select a measurement channel to update the chart, summary, exact-value table, and channel download together.</li><li>Open a sample ID to review its synthetic identity and feature measurements.</li><li>Use <a href="${route('downloads')}">Downloads</a> for the complete release and checksum manifest.</li></ol><p>Searches and filter settings appear in the URL, so the page can be bookmarked or shared. All current data, identities, groups, biofluids, and annotations are synthetic.</p></section>
  <section id="doc-states"><h2>Measurement states</h2>${Object.entries(data.state_definitions).map(([s,desc])=>`<div class="definition-list"><div>${stateBadge(s)}</div><p>${escape(desc)}</p></div>`).join('')}<p style="margin-top:16px">Observed zeros remain numeric zeros. Unavailable values appear as a dash in the browser and an empty numeric cell in TSV files, with the state retained. Summary statistics use observed values only.</p></section>
  <section id="doc-channels"><h2>Channels and units</h2><p>A feature can have several measurement channels. A count, RPM, TPM, covered-base value, mean coverage, and KL score have different definitions. The feature chart displays one channel at a time.</p><div class="table-wrap"><table><thead><tr><th scope="col">VIEW</th><th scope="col">CHANNEL</th><th scope="col">DEMO UNIT</th></tr></thead><tbody>${data.modules.flatMap(m=>m.channels.map(c=>`<tr><td>${escape(m.name)}</td><td class="mono">${escape(c.id)}</td><td>${escape(c.unit)}</td></tr>`)).join('')}</tbody></table></div><p style="margin-top:16px">Values are generated deterministically for interface testing. They do not implement biological quantification or normalization. Real releases will require validated reference, annotation, and measurement definitions.</p></section>
  <section id="doc-identity"><h2>Sample identity and feature revisions</h2><p>The demo defines separate identifiers for fictional studies, subjects, biosamples, libraries, and sequencing runs. These identities are generated fixtures. In a research release, matching source labels alone cannot establish that two files came from the same person or physical library.</p><p>Each measurement points to a feature revision and a channel. <code>DEMO_REFERENCE_v1</code> is a fixture marker, not a biological reference assembly. Genomic coordinates are deliberately unspecified.</p></section>
  <section id="doc-scope"><h2>Project scope and current availability</h2><p>The research project organizes five overlapping workflow categories: human cfRNA; microbial RNA; dsRNA / cfPeak / small RNA; mRNA / lncRNA including RAG collection annotations; and microbial / TE-associated RNA extensions. These categories are not five independent molecular modalities.</p><p>This website preview demonstrates four analysis views: small RNA, alternative promoter, RNA coverage, and RNA peaks. It does not claim that all five research workflows have finished or passed validation. Microbial and dsRNA research results are not included in this synthetic release.</p><p>No laboratory server connection is required to use this preview. Real data integration, scientific validation, and database-backed APIs remain subsequent development work.</p></section></article></div>`;
}
function notFound(heading='Page not found',description='This address is not part of the current preview.') {
  return empty(heading,description)+`<p style="text-align:center"><a class="btn" href="${route('explore')}">Browse demo features</a></p>`;
}
function render() {
  const {parts,params}=currentRoute(), view=parts[0]||'home', oldScroll=window.scrollY;
  document.querySelectorAll('[data-nav]').forEach(a=>{
    const active=a.dataset.nav===(view==='feature'?'explore':view==='sample'?'samples':view);
    if(active) a.setAttribute('aria-current','page'); else a.removeAttribute('aria-current');
  });
  const titles={home:'Overview',explore:'Explore features',samples:'Browse samples',feature:'Feature details',sample:'Sample details',downloads:'Downloads',docs:'Guide'};
  document.title=`${titles[view]||'Page not found'} · cfRNAdb demo`;
  main.innerHTML=view==='home'?renderHome():view==='explore'?renderExplore(params):view==='samples'?renderSamples(params):view==='feature'?renderFeature(parts[1],params):view==='sample'?renderSample(parts[1]):view==='downloads'?renderDownloads():view==='docs'?renderDocs():notFound();
  if(view==='docs' && params.section && ['start','states','channels','identity','scope'].includes(params.section)) document.querySelector('#doc-'+params.section)?.scrollIntoView();
  else if(preserveScroll) window.scrollTo(0,oldScroll); else window.scrollTo(0,0);
  main.focus({preventScroll:true});
  preserveScroll=false;
}
function toast(message) {
  document.querySelector('.toast')?.remove();
  clearTimeout(toastTimer);
  const el=document.createElement('div'); el.className='toast'; el.role='status'; el.textContent=message; document.body.append(el);
  toastTimer=setTimeout(()=>el.remove(),4500);
}
function downloadText(content,name,type) {
  const url=URL.createObjectURL(new Blob([content],{type})), a=document.createElement('a');
  a.href=url; a.download=name; document.body.append(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1500);
  toast('Download prepared · '+name);
}
function exportTsv(rows,fields,suffix) {
  downloadText(toTsv(rows.map(r=>({release_id:data.release_id,...r})),['release_id',...fields]),`cfrnadb-${data.version}-${suffix}.tsv`,'text/tab-separated-values;charset=utf-8');
}
function handleDownload(button) {
  const action=button.dataset.download, params=currentRoute().params;
  if(action==='filtered-features') exportTsv(filterFeatures(data,params),[...FEATURE_FIELDS,'available_samples'],'filtered-features');
  else if(action==='filtered-samples') exportTsv(filterSamples(data,params),SAMPLE_FIELDS,'filtered-samples');
  else if(action==='features') exportTsv(data.features,FEATURE_FIELDS,'features');
  else if(action==='samples') exportTsv(data.samples,SAMPLE_FIELDS,'samples');
  else if(action==='measurements') exportTsv(data.measurements,MEASUREMENT_FIELDS,'measurements');
  else if(action==='feature') exportTsv(channelMeasurements(data,button.dataset.feature,button.dataset.channel),MEASUREMENT_FIELDS,button.dataset.feature+'-'+button.dataset.channel);
  else if(action==='sample') exportTsv(data.measurements.filter(m=>m.sample_id===button.dataset.sample),MEASUREMENT_FIELDS,button.dataset.sample+'-all-channels');
  else if(action==='manifest') downloadText(JSON.stringify(manifest,null,2)+'\n',`cfrnadb-${data.version}-manifest.json`,'application/json');
  else if(action==='release') {
    const a=document.createElement('a');a.href='/data/demo-release.json';a.download=`cfrnadb-${data.version}-release.json`;document.body.append(a);a.click();a.remove();toast('Download requested · Complete synthetic release');
  }
}
main.addEventListener('submit',event=>{
  event.preventDefault();
  const form=event.target, params=Object.fromEntries(new FormData(form));
  if(form.id==='home-search') navigate('explore',params);
  else if(form.id==='feature-filters') navigate('explore',{...params,sort:document.querySelector('#feature-sort')?.value||'name'},true);
  else if(form.id==='sample-filters') navigate('samples',params,true);
});
main.addEventListener('change',event=>{
  if(event.target.id==='module-filter') {
    const params=Object.fromEntries(new FormData(document.querySelector('#feature-filters')));params.type='';params.sort=currentRoute().params.sort||'name';navigate('explore',params,true);
  } else if(event.target.id==='feature-sort') navigate('explore',{...currentRoute().params,sort:event.target.value,page:1},true);
  else if(event.target.id==='channel-select') navigate('feature/'+event.target.dataset.feature,{channel:event.target.value},true);
});
main.addEventListener('click',event=>{
  const button=event.target.closest('button'); if(!button||button.disabled) return;
  if(button.dataset.page) navigate(button.dataset.path,{...currentRoute().params,page:button.dataset.page},true);
  else if(button.dataset.download) handleDownload(button);
  else if(button.dataset.reload) location.reload();
});
window.addEventListener('hashchange',()=>{if(data) render();});

try {
  const responses=await Promise.all([fetch('/data/demo-release.json'),fetch('/data/manifest.json')]);
  if(responses.some(r=>!r.ok)) throw new Error('The demo release could not be downloaded.');
  [data,manifest]=await Promise.all(responses.map(r=>r.json()));
  if(data.data_kind!=='synthetic'||manifest.data_kind!=='synthetic'||manifest.release_id!==data.release_id) throw new Error('The demo release and manifest do not match.');
  if(data.samples.length!==manifest.counts.samples||data.features.length!==manifest.counts.features) throw new Error('The release counts do not match the manifest.');
  render();
} catch(error) {
  data=null;
  main.innerHTML=`<div class="empty"><strong>Unable to load the demo release</strong><p>${escape(error.message)}</p><button class="btn" data-reload="true">Try again</button><p class="small">You can also review the <a href="https://github.com/linxiangsun145/cfrnadb-web">source repository</a>.</p></div>`;
}

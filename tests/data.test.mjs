import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { STATES, filterFeatures, filterSamples, paginate, channelMeasurements, summarizeMeasurements, toTsv, MEASUREMENT_FIELDS } from '../assets/data.mjs';

const bytes=readFileSync(new URL('../data/demo-release.json',import.meta.url));
const data=JSON.parse(bytes);
const manifest=JSON.parse(readFileSync(new URL('../data/manifest.json',import.meta.url)));

test('published fixture and manifest agree, and all identities are explicitly synthetic',()=>{
  assert.equal(createHash('sha256').update(bytes).digest('hex'),manifest.files[0].sha256);
  assert.equal(bytes.length,manifest.files[0].bytes);
  assert.equal(data.data_kind,'synthetic');
  for(const kind of ['samples','features','studies','measurements']) {
    assert.equal(data[kind].length,manifest.counts[kind]);
    for(const item of data[kind]) assert.equal(item.data_kind,'synthetic');
  }
  assert.equal(new Set(data.samples.map(s=>s.id)).size,24);
  for(const s of data.samples) {
    for(const field of ['id','study_id','subject_id','biosample_id','library_id','sequencing_run_id']) assert.match(s[field],/^DEMO-/);
    assert(data.studies.some(st=>st.id===s.study_id));
  }
});

test('measurements have unique revision/sample/channel keys and compatible units',()=>{
  const keys=new Set();
  for(const m of data.measurements) {
    const f=data.features.find(f=>f.id===m.feature_id), mod=data.modules.find(mod=>mod.id===f.module_id);
    assert.equal(m.feature_revision_id,f.revision_id);
    assert(data.samples.some(s=>s.id===m.sample_id));
    assert(f.channel_ids.includes(m.channel_id));
    assert.equal(m.unit,mod.channels.find(c=>c.id===m.channel_id).unit);
    assert(Object.hasOwn(STATES,m.state));
    assert(m.state==='observed' ? Number.isFinite(m.value) && m.value>=0 : m.value===null);
    const key=[m.feature_revision_id,m.sample_id,m.channel_id].join('|');
    assert(!keys.has(key),'duplicate measurement key');keys.add(key);
  }
  for(const f of data.features) for(const channel of f.channel_ids) assert.equal(channelMeasurements(data,f.id,channel).length,24);
});

test('compound filters and availability counts return the intended records',()=>{
  assert.equal(filterFeatures(data,{q:' VIM '}).length,3);
  assert.deepEqual(filterFeatures(data,{q:'VIM',module:'promoter',type:'Promoter'}).map(f=>f.id),['DEMO-PRO-001']);
  assert.equal(filterFeatures(data,{q:'unknown-no-feature'}).length,0);
  assert.equal(filterSamples(data,{study:'DEMO-STUDY-01',biofluid:'Plasma'}).length,4);
  assert.equal(filterSamples(data,{q:'DEMO-024'}).length,1);
  const row=filterFeatures(data,{q:'DEMO-SNC-001'})[0];
  assert.equal(row.available_samples,channelMeasurements(data,row.id,row.primary_channel_id).filter(m=>m.state==='observed').length);
});

test('observed zero is counted; unavailable values are excluded from statistics and never imputed',()=>{
  const rows=[{state:'observed',value:0},{state:'observed',value:10},{state:'not_measured',value:null},{state:'failed',value:null},{state:'low_depth',value:null}];
  assert.deepEqual(summarizeMeasurements(rows),{observed:2,missing:3,zeros:1,median:5,min:0,max:10});
  assert.equal(summarizeMeasurements(rows.slice(2)).median,null);
  assert(data.measurements.some(m=>m.state==='observed'&&m.value===0));
  for(const state of Object.keys(STATES)) assert(data.measurements.some(m=>m.state===state));
});

test('channel-specific exports retain empty missing values, true zeros, units, and release identity',()=>{
  const rows=channelMeasurements(data,'DEMO-SNC-001','snc_count');
  const fields=['release_id',...MEASUREMENT_FIELDS];
  const text=toTsv(rows.map(r=>({release_id:data.release_id,...r})),fields);
  const lines=text.trimEnd().split('\r\n');
  assert.equal(lines.length,25);
  const header=lines[0].split('\t');
  for(let i=0;i<rows.length;i++) {
    const cells=lines[i+1].split('\t'), row=rows[i];
    assert.equal(cells[header.indexOf('release_id')],data.release_id);
    assert.equal(cells[header.indexOf('channel_id')],'snc_count');
    assert.equal(cells[header.indexOf('unit')],row.unit);
    assert.equal(cells[header.indexOf('state')],row.state);
    assert.equal(cells[header.indexOf('value')],row.value===null?'':String(row.value));
  }
});

test('TSV handles metadata quoting and spreadsheet-sensitive text without changing numeric values',()=>{
  assert.equal(toTsv([{label:'=SUM(A1)',value:0}],['label','value']),"label\tvalue\r\n'=SUM(A1)\t0\r\n");
  assert.equal(toTsv([{label:'a\tb"c',value:null}],['label','value']),'label\tvalue\r\n"a\tb""c"\t\r\n');
});

test('pagination handles empty, invalid, and out-of-range requests',()=>{
  assert.equal(paginate(data.features,99).page,4);
  assert.equal(paginate(data.features,2).items[0].id,data.features[12].id);
  assert.equal(paginate(data.features,-1).page,1);
  assert.equal(paginate(data.features,'invalid').page,1);
  assert.deepEqual(paginate([],4),{items:[],page:1,pages:1,total:0,from:0,to:0});
});

// Resolve only exact, approved frozen queries. Other requests use the live API.
export function snapshotPath(path,index){
  const url=new URL(path,'https://release.invalid/'),p=url.searchParams;
  if([...p.keys()].length!==new Set(p.keys()).size)return null;
  const only=keys=>[...p.keys()].every(k=>keys.includes(k));
  const gut=()=>!p.has('cohort')||p.get('cohort')==='gut401';
  if(url.pathname==='/catalog'&&only([]))return '/release/catalog.json';
  if(url.pathname==='/quality'&&only([]))return '/release/quality.json';
  if(url.pathname==='/examples'&&only([]))return '/open/examples/catalog.json';
  if(url.pathname==='/observations'&&only(['dataset'])&&index.observations?.includes(p.get('dataset')))return '/release/observations/'+p.get('dataset')+'.json';
  if(url.pathname==='/metadata'&&only(['cohort','tier'])&&gut()){
    const tier=p.get('tier')||'core';
    return ['core','extended'].includes(tier)?'/release/metadata-'+tier+'.json':null;
  }
  if(url.pathname==='/gene'&&only(['cohort','gene','include_values'])&&gut()&&p.get('include_values')==='1'){
    const key=p.get('gene'),gene=Object.hasOwn(index.genes,key)?index.genes[key]:null;return gene?'/release/genes/'+gene+'.json':null;
  }
  if(url.pathname==='/feature'&&only(['dataset','feature','channel'])){
    const f=index.features[p.get('feature')];
    if(f&&f.dataset_id===p.get('dataset')&&(!p.get('channel')||p.get('channel')===f.channel_id))return '/release/features/'+p.get('feature')+'.json';
  }
  return null;
}

export function readyBundle(manifest,dataset,channel){
  return manifest.bundles.find(b=>b.dataset_id===dataset&&b.channel_id===channel)||null;
}

export async function releaseJson(path,signal){
  const response=await fetch(path,{signal});
  if(!response.ok)throw new Error('Released file unavailable (HTTP '+response.status+')');
  return response.json();
}

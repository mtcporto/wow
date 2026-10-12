const fs=require('node:fs/promises'),path=require('node:path');
const {createHandler}=require('../server/blizzard.cjs');
const handler=createHandler(),requests=new Map();
function request(resource,locale='en_US'){
 const key=resource+':'+locale;if(requests.has(key))return requests.get(key);
 const pending=(async()=>{for(let attempt=0;attempt<4;attempt++){
 const response={code:200,setHeader(){},status(code){this.code=code;return this},json(body){this.body=body}};
 await handler({method:'GET',query:{path:'/data/wow/'+resource,locale}},response);
 if(response.code===200)return response.body;if(response.code===404)return null;
 await new Promise(resolve=>setTimeout(resolve,1000*(attempt+1)));
 }throw Error('Could not fetch '+resource);})();requests.set(key,pending);return pending;
}
(async()=>{
 const [en,pt]=await Promise.all([request('toy/index'),request('toy/index','pt_BR')]);
 const names=new Map(pt.toys.map(toy=>[toy.id,toy.name])),toys=[],sources=new Map();let next=0,completed=0;
 await Promise.all(Array.from({length:8},async()=>{while(next<en.toys.length){
 const entry=en.toys[next++],toy=await request('toy/'+entry.id);
 if(toy?.item?.id){
 const [item,media]=await Promise.all([request('item/'+toy.item.id),request('media/item/'+toy.item.id)]);
 const icon=media?.assets?.find(asset=>asset.key==='icon')?.value||'';
 const sourceType=toy.source?.type||'';if(sourceType&&!sources.has(sourceType))sources.set(sourceType,{toyId:toy.id,en_US:toy.source.name});
 toys.push({id:toy.id,itemId:toy.item.id,name:{en_US:entry.name||toy.item.name,pt_BR:names.get(toy.id)||entry.name||toy.item.name},quality:item?.quality?.type||'',icon,source:sourceType});
 }
 completed++;if(completed%100===0)console.log(completed+'/'+en.toys.length);
 }}));
 const sourceLabels={};await Promise.all([...sources].map(async([type,value])=>{const toy=await request('toy/'+value.toyId,'pt_BR');sourceLabels[type]={en_US:value.en_US,pt_BR:toy?.source?.name||value.en_US};}));
 toys.sort((a,b)=>a.id-b.id);const destination=path.join(__dirname,'../public/data/toys.json');
 await fs.writeFile(destination+'.tmp',JSON.stringify({updatedAt:new Date().toISOString(),sourceLabels,toys}));await fs.rename(destination+'.tmp',destination);
 console.log('Saved '+toys.length+' toys, '+sources.size+' Blizzard acquisition sources.');
})().catch(error=>{console.error(error.message);process.exitCode=1});

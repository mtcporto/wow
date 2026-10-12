const test = require('node:test');
const assert = require('node:assert/strict');
const {createHandler} = require('../server/blizzard.cjs');
const env = {BLIZZARD_CLIENT_ID: 'synthetic-client', BLIZZARD_CLIENT_SECRET: 'synthetic-secret'};
function response() {return {headers:{},code:200,setHeader(k,v){this.headers[k]=v;},status(v){this.code=v;return this;},json(v){this.body=v;return this;}};}
test('proxies only catalogue data and keeps credentials out of the browser response', async () => {
 const requests=[];const handler=createHandler({env,fetchImpl:async (url,init)=>{
  requests.push({url:String(url),init});
  return requests.length===1 ? Response.json({access_token:'synthetic-provider-token',expires_in:3600}) : Response.json({name:'Pet',access_token:'synthetic-provider-token',link:'https://example.test/?access_token=synthetic-provider-token'});
 }});
 const res=response();await handler({method:'GET',query:{path:'/data/wow/pet/42',locale:'pt_BR'}},res);
 assert.equal(res.code,200);assert.equal(requests[0].url,'https://oauth.battle.net/token');
 assert.equal(requests[1].url,'https://us.api.blizzard.com/data/wow/pet/42?namespace=static-us&locale=pt_BR');
 assert.equal(requests[1].init.headers.Authorization,'Bearer synthetic-provider-token');
 assert.equal(res.body.name,'Pet');assert.equal(res.body.access_token,undefined);
 assert(!JSON.stringify(res.body).includes('synthetic-provider-token'));assert(!JSON.stringify(res.body).includes(env.BLIZZARD_CLIENT_SECRET));
 assert.match(res.headers['Cache-Control'],/s-maxage=300/);
});
test('rejects arbitrary URLs, account endpoints and parameter injection before fetching',async()=>{
 let calls=0;const handler=createHandler({env,fetchImpl:async()=>{calls++;throw Error('unexpected');}});
 for(const query of [{path:'https://attacker.test/'},{path:'/profile/user/wow'},{path:'/data/wow/pet/1/../../oauth/token'},{path:'/data/wow/pet/1',locale:['en_US']},{path:'/data/wow/pet/1',locale:'en_US&access_token=injected'}]){
  const res=response();await handler({method:'GET',query},res);assert.equal(res.code,400);
 }
 const res=response();await handler({method:'POST',query:{path:'/data/wow/pet/1'}},res);assert.equal(res.code,405);assert.equal(calls,0);
});
test('fails closed when server credentials are missing and does not relay provider errors',async()=>{
 const res=response();await createHandler({env:{},fetchImpl:()=>{throw Error('unexpected');}})({method:'GET',query:{path:'/data/wow/pet/index'}},res);assert.equal(res.code,503);
 const failure=response();await createHandler({env,fetchImpl:async()=>new Response('secret provider error',{status:401})})({method:'GET',query:{path:'/data/wow/pet/index'}},failure);
 assert.equal(failure.code,502);assert(!JSON.stringify(failure.body).includes('secret provider error'));
});
test('reuses a warm-instance token without exposing it and handles concurrent requests',async()=>{
 let auth=0;const handler=createHandler({env,fetchImpl:async url=>{
  if(String(url).includes('oauth.battle.net')){auth++;return Response.json({access_token:'synthetic-provider-token',expires_in:3600});}
  return Response.json({id:1});
 }});
 await Promise.all([1,2].map(async id=>handler({method:'GET',query:{path:'/data/wow/pet/'+id}},response())));assert.equal(auth,1);
});
test('HTML scripts remain valid and no longer authenticate with Blizzard in the browser',()=>{
 const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
 for(const file of ['index.html','pets.html']){
  const html=fs.readFileSync(path.join(__dirname,'..',file),'utf8');assert(!html.includes('oauth.battle.net/token'));assert(!html.includes('clientSecret'));assert(html.includes('/api/blizzard?path='));
  for(const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi))if(!/\bsrc=/.test(match[1]))new vm.Script(match[2],{filename:file});
 }
});
test('hunter search fixes tameability and accepts only numeric family and page filters',async()=>{
 const requests=[];const handler=createHandler({env,fetchImpl:async(url)=>{
  requests.push(String(url));return requests.length===1?Response.json({access_token:'synthetic-provider-token',expires_in:3600}):Response.json({results:[]});
 }});
 for(const query of [{path:'/data/wow/search/creature',family:'1&is_tameable=false'},{path:'/data/wow/search/creature',family:'1',page:['2']},{path:'/data/wow/search/creature',family:'1',page:'-1'}]){
  const res=response();await handler({method:'GET',query},res);assert.equal(res.code,400);
 }
 assert.equal(requests.length,0);
 const res=response();await handler({method:'GET',query:{path:'/data/wow/search/creature',family:'1',page:'2',locale:'pt_BR'}},res);assert.equal(res.code,200);
 const url=new URL(requests[1]);assert.equal(url.hostname,'us.api.blizzard.com');assert.equal(url.searchParams.get('is_tameable'),'true');assert.equal(url.searchParams.get('family.id'),'1');assert.equal(url.searchParams.get('_page'),'2');assert.equal(url.searchParams.get('_pageSize'),'24');assert.equal(url.searchParams.get('locale'),'pt_BR');
});
test('allows explorer resources while rejecting malformed talent paths and arbitrary search APIs',async()=>{
 let calls=0;const handler=createHandler({env,fetchImpl:async url=>{calls++;return String(url).includes('oauth.battle.net')?Response.json({access_token:'synthetic-provider-token',expires_in:3600}):Response.json({id:3});}});
 for(const resource of ['playable-class/3','playable-specialization/253','playable-race/1','creature-family/index','mount/221','talent-tree/774/playable-specialization/253','media/creature-display/161','journal-expansion/index','journal-expansion/68','journal-instance/63','journal-encounter/477','media/journal-instance/63','media/item/13245','profession/index','profession/164','profession/164/skill-tier/2477','recipe/1631','media/profession/164','media/recipe/1631','item-appearance/set/index','item-appearance/set/13','item-appearance/321','decor/index','decor/80','fixture/141','fixture-hook/2503','room/1','achievement/index','achievement/6','achievement-category/index','achievement-category/81','media/achievement/6']){
  const res=response();await handler({method:'GET',query:{path:'/data/wow/'+resource}},res);assert.equal(res.code,200);
 }
 const before=calls;
 for(const resource of ['talent-tree/774/playable-specialization/../../oauth','search/mount','profession/164/skill-tier/1/../../oauth','recipe/0','item-appearance/set/13/../../oauth','item-appearance/set/0','decor/0','achievement-category/81/../../oauth','achievement/0','fixture-hook/2503/../../oauth','room/index?url=https://evil.test','playable-class/0','media/creature-display/1?url=https://evil.test']){
  const res=response();await handler({method:'GET',query:{path:'/data/wow/'+resource}},res);assert.equal(res.code,400);
 }
 assert.equal(calls,before);
});
test('realm resources use the selected regional host and dynamic namespace',async()=>{
 const requests=[];const handler=createHandler({env,fetchImpl:async url=>{requests.push(String(url));return requests.length===1?Response.json({access_token:'synthetic-provider-token',expires_in:3600}):Response.json({name:'Realm'});}});
 const res=response();await handler({method:'GET',query:{path:'/data/wow/realm/argent-dawn',region:'eu',locale:'pt_BR',namespace:'profile-evil'}},res);assert.equal(res.code,200);
 const url=new URL(requests[1]);assert.equal(url.hostname,'eu.api.blizzard.com');assert.equal(url.searchParams.get('namespace'),'dynamic-eu');assert.equal(url.pathname,'/data/wow/realm/argent-dawn');assert.equal(url.searchParams.get('locale'),'pt_BR');assert.match(res.headers['Cache-Control'],/s-maxage=60/);
 const before=requests.length;
 for(const query of [{path:'/data/wow/realm/azralon',region:'evil.test'},{path:'/data/wow/region/1',region:['us']},{path:'/data/wow/realm/../oauth',region:'us'},{path:'/data/wow/connected-realm/0',region:'us'}]){const responseObject=response();await handler({method:'GET',query},responseObject);assert.equal(responseObject.code,400);}
 assert.equal(requests.length,before);
});

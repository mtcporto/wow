const test=require('node:test'),assert=require('node:assert/strict');
const {readSnapshot,pageSnapshot}=require('../server/auctions.cjs');
const {createHandler}=require('../server/blizzard.cjs');
const env={BLIZZARD_CLIENT_ID:'test',BLIZZARD_CLIENT_SECRET:'test'};
const response=()=>({code:200,headers:{},setHeader(k,v){this.headers[k]=v},status(c){this.code=c;return this},json(body){this.body=body}});
test('auction stream filters items, orders unit prices and preserves paginated totals',async()=>{
const auctions=Array.from({length:121},(_,i)=>({id:i+1,item:{id:2770},quantity:2,buyout:1000-i*2}));auctions.push({id:500,item:{id:42},quantity:99,unit_price:1});
const snapshot=await readSnapshot(Response.json({auctions},{headers:{'last-modified':'Mon, 12 Oct 2026 12:00:00 GMT'}}),2770);
const page=pageSnapshot(snapshot,2);assert.equal(page.auctions.length,50);assert.equal(page.total,121);assert.equal(page.quantity,242);assert.equal(page.lowestUnitPrice,380);assert.equal(page.pages,3);assert.equal(page.auctions[0].id,71);assert(page.snapshotAt);
});
test('public profiles use profile namespace, rankings dynamic and catalogues static',async()=>{
const urls=[];const handler=createHandler({env,fetchImpl:async url=>{urls.push(String(url));return String(url).includes('oauth')?Response.json({access_token:'test-token',expires_in:3600}):Response.json({entries:Array.from({length:105},(_,id)=>({id}))});}});
for(const [path,namespace] of [['/profile/wow/character/azralon/tést/equipment','profile-eu'],['/data/wow/reputation-tiers/0','static-eu'],['/data/wow/pvp-season/42/pvp-leaderboard/2v2','dynamic-eu']]){const res=response();await handler({method:'GET',query:{path,region:'eu',page:'2'}},res);assert.equal(res.code,200);assert.equal(new URL(urls.at(-1)).searchParams.get('namespace'),namespace);if(path.includes('leaderboard')){assert.equal(res.body.entries.length,50);assert.equal(res.body.entries[0].id,50);assert.equal(res.body.total,105);}}
});
test('auction pages reuse the item snapshot and reject unbounded or injected queries',async()=>{
let calls=0;const handler=createHandler({env,fetchImpl:async url=>{calls++;return String(url).includes('oauth')?Response.json({access_token:'test-token',expires_in:3600}):Response.json({auctions:[{id:1,item:{id:2770},unit_price:20,quantity:3}]});}});
for(const query of [{path:'/data/wow/auctions/commodities'},{path:'/data/wow/auctions/commodities',item:['2770']},{path:'/profile/user/wow'},{path:'/profile/wow/character/azralon/test/collections/toys'},{path:'/data/wow/toy/index',region:'evil.test'}]){const res=response();await handler({method:'GET',query},res);assert.equal(res.code,400);}
assert.equal(calls,0);for(const page of ['1','2']){const res=response();await handler({method:'GET',query:{path:'/data/wow/auctions/commodities',item:'2770',page}},res);assert.equal(res.code,200);assert.equal(res.body.auctions.length,1);}assert.equal(calls,2);
});
test('item name search localizes the field and fixes pagination without allowing parameter injection',async()=>{
 const urls=[];const handler=createHandler({env,fetchImpl:async url=>{urls.push(String(url));return String(url).includes('oauth')?Response.json({access_token:'test-token',expires_in:3600}):Response.json({results:[]});}});
 for(const q of ['', 'x', 'ore&namespace=profile-us','a'.repeat(81)]){const res=response();await handler({method:'GET',query:{path:'/data/wow/search/item',q}},res);assert.equal(res.code,400);}assert.equal(urls.length,0);
 const res=response();await handler({method:'GET',query:{path:'/data/wow/search/item',q:'Minério de Cobre',locale:'pt_BR',region:'eu',page:'2'}},res);
 assert.equal(res.code,200);const url=new URL(urls.at(-1));assert.equal(url.hostname,'eu.api.blizzard.com');assert.deepEqual(url.searchParams.getAll('name.pt_BR'),['Minério','Cobre']);assert.equal(url.searchParams.get('namespace'),'static-eu');assert.equal(url.searchParams.get('_pageSize'),'12');assert.equal(url.searchParams.get('_page'),'2');assert.equal(url.searchParams.get('access_token'),null);
});
test('bounded native parsing and streaming fallback preserve identical auction data across chunk boundaries',async()=>{
 const body=JSON.stringify({auctions:Array.from({length:130},(_,i)=>({id:i+1,item:{id:i%3===0?2770:42},quantity:2,unit_price:300-i,time_left:'LONG',note:'braces { } and escaped " quotes'}))});
 const chunks=()=>new ReadableStream({start(controller){const bytes=new TextEncoder().encode(body);for(let i=0;i<bytes.length;i+=17)controller.enqueue(bytes.slice(i,i+17));controller.close();}});
 const fast=await readSnapshot(new Response(chunks()),2770),slow=await readSnapshot(new Response(chunks()),2770,{fastLimit:64});
 assert.deepEqual(fast.entries,slow.entries);assert.equal(fast.total,44);assert.equal(slow.total,44);assert.equal(fast.quantity,slow.quantity);assert.equal(fast.lowestUnitPrice,slow.lowestUnitPrice);
});

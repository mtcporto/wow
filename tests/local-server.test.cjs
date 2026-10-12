const test=require('node:test');const assert=require('node:assert/strict');
const {createLocalServer}=require('../server/local.cjs');
test('local server protects environment files and fails closed without provider credentials',async()=>{
 const server=createLocalServer({env:{}});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base='http://127.0.0.1:'+server.address().port;
 try {
  for(const path of ['/.env','/.git/config','/server/blizzard.cjs'])assert.equal((await fetch(base+path)).status,404);
  const api=await fetch(base+'/api/blizzard?path=/data/wow/pet/index');assert.equal(api.status,503);assert.equal(api.headers.get('access-control-allow-origin'),'*');
  assert.equal((await fetch(base+'/pets.html')).status,200);
  for (const [asset,type] of [['catalogue.css','text/css'],['catalogue.js','text/javascript'],['explorer.js','text/javascript'],['data/class-mounts.json','application/json'],['assets/wow-midnight.webp','image/webp'],['explorer-data.js','text/javascript'],['talent-tree.js','text/javascript'],['data/mounts.json','application/json'],['data/media.json','application/json']]) {
    const response=await fetch(base+'/'+asset);
    assert.equal(response.status,200);
    assert(response.headers.get('content-type').startsWith(type));
  }
 }finally{await new Promise(resolve=>server.close(resolve));}
});

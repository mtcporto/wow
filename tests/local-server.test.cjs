const test=require('node:test');const assert=require('node:assert/strict');
const {createLocalServer}=require('../server/local.cjs');
test('local server protects environment files and fails closed without provider credentials',async()=>{
 const server=createLocalServer({env:{}});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base='http://127.0.0.1:'+server.address().port;
 try {
  for(const path of ['/.env','/.git/config','/server/blizzard.cjs'])assert.equal((await fetch(base+path)).status,404);
  const api=await fetch(base+'/api/blizzard?path=/data/wow/pet/index');assert.equal(api.status,503);assert.equal(api.headers.get('access-control-allow-origin'),'*');
  assert.equal((await fetch(base+'/pets.html')).status,200);
 }finally{await new Promise(resolve=>server.close(resolve));}
});

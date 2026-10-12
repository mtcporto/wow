const fs = require('node:fs/promises');
const path = require('node:path');
const {createHandler} = require('../server/blizzard.cjs');
const handler = createHandler();
async function request(resource) {
  for (let attempt=0;attempt<4;attempt++) {
    const response={code:200,setHeader(){},status(code){this.code=code;return this;},json(body){this.body=body;return this;}};
    await handler({method:'GET',query:{path:resource,locale:'en_US'}},response);
    if(response.code===200)return response.body;
    if(response.code===404)return null;
    await new Promise(resolve=>setTimeout(resolve,1000*(attempt+1)));
  }
  throw Error('Could not fetch '+resource);
}
(async()=>{
 const index=await request('/data/wow/pet/index');
 const pets=[];let next=0,completed=0;
 await Promise.all(Array.from({length:12},async()=>{
  while(next<index.pets.length){
   const entry=index.pets[next++];const pet=await request('/data/wow/pet/'+entry.id);
   if(pet)pets.push({id:pet.id,name:pet.name,family:pet.battle_pet_type?.name||'Unknown',icon:pet.icon||''});
   completed++;if(completed%200===0)console.log(completed+'/'+index.pets.length);
  }
 }));
 pets.sort((a,b)=>a.id-b.id);
 const destination=path.join(__dirname,'../public/data/pets.json');
 await fs.writeFile(destination+'.tmp',JSON.stringify({updatedAt:new Date().toISOString(),pets}));
 await fs.rename(destination+'.tmp',destination);
 console.log('Catalogue saved: '+pets.length+' pets.');
})().catch(error=>{console.error(error.message);process.exitCode=1});

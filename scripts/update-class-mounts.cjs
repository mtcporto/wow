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
 const index=await request('/data/wow/mount/index');
 const mounts=[];let next=0,completed=0;
 await Promise.all(Array.from({length:12},async()=>{
  while(next<index.mounts.length){
   const entry=index.mounts[next++];const mount=await request('/data/wow/mount/'+entry.id);
   if(mount)mounts.push({id:mount.id,name:mount.name,description:mount.description,classes:(mount.requirements?.classes||[]).map(c=>c.id),faction:mount.requirements?.faction?.type||mount.faction?.type||null,source:mount.source?.type||null,displays:(mount.creature_displays||[]).map(d=>d.id)});
   completed++;if(completed%200===0)console.log(completed+'/'+index.mounts.length);
  }
 }));
 mounts.sort((a,b)=>a.id-b.id);
 const destination=path.join(__dirname,'../public/data/mounts.json');
 await fs.writeFile(destination+'.tmp',JSON.stringify({updatedAt:new Date().toISOString(),mounts}));
 await fs.rename(destination+'.tmp',destination);
 const classDestination=path.join(__dirname,'../public/data/class-mounts.json');
 await fs.writeFile(classDestination+'.tmp',JSON.stringify({updatedAt:new Date().toISOString(),mounts:mounts.filter(m=>m.classes.length)}));
 await fs.rename(classDestination+'.tmp',classDestination);
 console.log('Catalogue saved: '+mounts.length+' mounts.');
})().catch(error=>{console.error(error.message);process.exitCode=1});

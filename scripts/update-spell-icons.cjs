const fs=require('node:fs/promises');const path=require('node:path');
const {createHandler}=require('../server/blizzard.cjs');const handler=createHandler();
async function get(resource){
 for(let attempt=0;attempt<3;attempt++){
  const r={setHeader(){},status(code){this.code=code;return this;},json(data){this.data=data;}};
  await handler({method:'GET',query:{path:'/data/wow/'+resource,locale:'en_US'}},r);
  if(r.code===200)return r.data;if(r.code===404)return null;
  await new Promise(resolve=>setTimeout(resolve,500*(attempt+1)));
 }
 throw Error('Unable to refresh '+resource);
}
async function pool(entries,limit,work){let next=0;await Promise.all(Array.from({length:Math.min(limit,entries.length)},async()=>{while(next<entries.length)await work(entries[next++]);}));}
(async()=>{
 const classes=await get('playable-class/index');const specializations=new Set();
 await pool(classes.classes,6,async cl=>{const data=await get('playable-class/'+cl.id);for(const spec of data?.specializations||[])specializations.add(spec.id);});
 const spells=new Set();
 await pool([...specializations],6,async id=>{
  const spec=await get('playable-specialization/'+id);if(!spec?.spec_talent_tree?.key?.href)return;
  const resource=new URL(spec.spec_talent_tree.key.href).pathname.replace('/data/wow/','');const tree=await get(resource);if(!tree)return;
  const nodes=[...(tree.class_talent_nodes||[]),...(tree.spec_talent_nodes||[]),...(tree.hero_talent_trees||[]).flatMap(h=>h.hero_talent_nodes||[])];
  for(const node of nodes)for(const rank of node.ranks||[])for(const option of rank.choice_of_tooltips||[rank.tooltip]){const id=option?.spell_tooltip?.spell?.id;if(Number.isInteger(id)&&id>0)spells.add(id);}
  for(const talent of spec.pvp_talents||[]){const id=talent.spell_tooltip?.spell?.id;if(Number.isInteger(id)&&id>0)spells.add(id);}
 });
 console.log('Talent spells discovered: '+spells.size);
 const icons={};let completed=0;
 await pool([...spells],12,async id=>{const data=await get('media/spell/'+id);const icon=data?.assets?.find(a=>a.key==='icon')?.value;if(icon?.startsWith('https://'))icons[id]=icon;completed++;if(completed%200===0)console.log(completed+'/'+spells.size);});
 if(!Object.keys(icons).length)throw Error('No icons returned; previous catalogue preserved');
 const destination=path.join(__dirname,'../public/data/spell-icons.json');await fs.writeFile(destination+'.tmp',JSON.stringify({updatedAt:new Date().toISOString(),icons}));await fs.rename(destination+'.tmp',destination);console.log('Spell icons saved: '+Object.keys(icons).length);
})().catch(error=>{console.error(error.message);process.exitCode=1});

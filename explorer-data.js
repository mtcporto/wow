(function(root,factory){const data=factory();if(typeof module==='object'&&module.exports)module.exports=data;else root.ExplorerData=data;})(globalThis,()=>{
 const normalize=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 function filterMounts(mounts,{query='',faction='',classId='',source=''}={}) {
  const term=normalize(query).trim();
  return mounts.filter(m=>{
   if(term&&!normalize(m.name).includes(term))return false;
   if(faction&&(m.faction||'UNSPECIFIED')!==faction)return false;
   if(source&&(m.source||'UNSPECIFIED')!==source)return false;
   if(classId==='UNSPECIFIED'&&(m.classes||[]).length)return false;
   if(classId&&classId!=='UNSPECIFIED'&&!(m.classes||[]).includes(Number(classId)))return false;
   return true;
  });
 }
 function talentGraph(nodes) {
  const unique = [...new Map(nodes.map(node=>[node.id,node])).values()];
  if(!unique.length)return {nodes:[],edges:[],width:400,height:180};
  const positions=unique.map((node,index)=>({node,row:Number.isFinite(node.display_row)?node.display_row:Math.floor(index/5)+1,col:Number.isFinite(node.display_col)?node.display_col:index%5+1}));
  const minRow=Math.min(...positions.map(p=>p.row));const minCol=Math.min(...positions.map(p=>p.col));
  const placed=positions.map(({node,row,col})=>({...node,x:70+(col-minCol)*128,y:48+(row-minRow)*100}));
  const ids=new Set(placed.map(n=>n.id));const edges=new Map();
  function edge(from,to){if(from!==to&&ids.has(from)&&ids.has(to))edges.set(from+':'+to,{from,to});}
  for(const node of placed){for(const id of node.unlocks||[])edge(node.id,id);for(const id of node.locked_by||[])edge(id,node.id);}
  return {nodes:placed,edges:[...edges.values()],width:Math.max(400,Math.max(...placed.map(n=>n.x))+70),height:Math.max(180,Math.max(...placed.map(n=>n.y))+60)};
 }
 function flattenRecipes(categories,parents=[]) {
  const recipes=[];
  for(const category of categories||[]) {
   const trail=[...parents,category.name].filter(Boolean);
   for(const recipe of category.recipes||[])if(Number.isInteger(recipe.id)&&recipe.id>0)recipes.push({...recipe,category:trail.join(' › ')});
   recipes.push(...flattenRecipes(category.categories||category.subcategories||[],trail));
  }
  return [...new Map(recipes.map(recipe=>[recipe.id,recipe])).values()];
 }
 function filterRecipes(recipes,{query='',category=''}={}) {
  const term=normalize(query).trim();
  return recipes.filter(recipe=>(!category||recipe.category===category)&&(!term||normalize(recipe.name).includes(term)));
 }
 function recipeOutputs(recipe) {
  const outputs=[];
  for(const [key,faction] of [['crafted_item',null],['alliance_crafted_item','ALLIANCE'],['horde_crafted_item','HORDE']])if(recipe[key]?.id)outputs.push({item:recipe[key],faction});
  for(const entry of recipe.crafted_items||[]){const item=entry.item||entry;if(item.id&&!outputs.some(o=>o.item.id===item.id))outputs.push({item,faction:null});}
  return outputs;
 }
 function filterAppearanceSets(sets,query='') {
  const term=normalize(query).trim();
  return sets.filter(set=>!term||normalize(set.name||set.set_name).includes(term));
 }
 function filterMedia(items,{query='',type=''}={}) {
  const term=normalize(query).trim();
  return items.filter(item=>(!type||item.type===type)&&(!term||normalize(Object.values(item.titles||{}).join(' ')).includes(term)));
 }
 return {filterMounts,talentGraph,flattenRecipes,filterRecipes,recipeOutputs,filterAppearanceSets,filterMedia};
});

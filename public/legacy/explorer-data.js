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
 function talentGraph(nodes,config={}) {
  const unique = [...new Map(nodes.map(node=>[node.id,node])).values()];
  if(!unique.length)return {nodes:[],edges:[],width:400,height:180};
  const positions=unique.map((node,index)=>({node,row:Number.isFinite(node.display_row)?node.display_row:Math.floor(index/5)+1,col:Number.isFinite(node.display_col)?node.display_col:index%5+1}));
  const minRow=Math.min(...positions.map(p=>p.row));const minCol=Math.min(...positions.map(p=>p.col));
  const {stepX=128,stepY=100,marginX=70,marginY=48,minWidth=400,minHeight=180}=config;
  const placed=positions.map(({node,row,col})=>({...node,x:marginX+(col-minCol)*stepX,y:marginY+(row-minRow)*stepY}));
  const ids=new Set(placed.map(n=>n.id));const edges=new Map();
  function edge(from,to){if(from!==to&&ids.has(from)&&ids.has(to))edges.set(from+':'+to,{from,to});}
  for(const node of placed){for(const id of node.unlocks||[])edge(node.id,id);for(const id of node.locked_by||[])edge(id,node.id);}
  return {nodes:placed,edges:[...edges.values()],width:Math.max(minWidth,Math.max(...placed.map(n=>n.x))+marginX),height:Math.max(minHeight,Math.max(...placed.map(n=>n.y))+marginY+12)};
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
function talentGroups(tree,eligibleIds) {
  const specNodes=new Map((tree.spec_talent_nodes||[]).map(node=>[node.id,node]));
  const heroIds=new Set((tree.hero_talent_trees||[]).flatMap(hero=>hero.hero_talent_nodes||[]).map(node=>node.id));
  const eligible=new Set(eligibleIds);
  return [{name:'Class',kind:'class',nodes:tree.class_talent_nodes||[]},{name:'Specialization',kind:'spec',nodes:(tree.spec_talent_nodes||[]).filter(node=>!heroIds.has(node.id))},...(tree.hero_talent_trees||[]).filter(hero=>eligible.has(hero.id)).map(hero=>({name:hero.name,kind:'hero',nodes:(hero.hero_talent_nodes||[]).map(node=>({...node,ranks:specNodes.get(node.id)?.ranks||node.ranks}))}))].filter(group=>group.nodes.length);
 }
 function talentTooltip(node,locale='en_US') {
  const pt=locale==='pt_BR';
  const choices=(node.ranks||[]).flatMap(rank=>(rank.choice_of_tooltips||[rank.tooltip]).filter(Boolean).map(option=>({option,rank:rank.rank})));
  const sections=choices.map(({option,rank})=>({name:option.talent?.name||option.spell_tooltip?.spell?.name||'',rank,meta:['power_cost','range','cast_time','cooldown'].map(key=>option.spell_tooltip?.[key]).filter(Boolean),description:option.spell_tooltip?.description||''}));
  return {title:sections[0]?.name||(pt?'Escolha de talento':'Talent choice'),kind:'talent',sections,lines:choices.length?[]:[{text:pt?'Informações não fornecidas pela API.':'Information not provided by the API.',tone:'muted'}]};
 }
 function spellTooltip(data) {
  return {title:data.name||'',kind:'spell',lines:[{text:data.description||'',tone:'gold'}],sections:[]};
 }
 const itemQualityColors={POOR:'#9d9d9d',COMMON:'#ffffff',UNCOMMON:'#1eff00',RARE:'#0070dd',EPIC:'#a335ee',LEGENDARY:'#ff8000',ARTIFACT:'#e6cc80',HEIRLOOM:'#00ccff'};
 function itemQualityColor(quality){return itemQualityColors[quality]||'#ffffff';}
 function itemTooltip(data,locale='en_US') {
  const pt=locale==='pt_BR',preview=data.preview_item||{},lines=[];
  const add=(text,tone='normal',right='')=>{if(text||right)lines.push({text:String(text||''),tone,...(right?{right:String(right)}:{})});};
  add(preview.level?.display_string||(data.level?(pt?'Nível do item ':'Item Level ')+data.level:''),'gold');
  add(preview.binding?.name);
  add(preview.inventory_type?.name||data.inventory_type?.name,'normal',preview.item_subclass?.name||data.item_subclass?.name);
  add(preview.armor?.display?.display_string);add(preview.shield_block?.display?.display_string);
  add(preview.weapon?.damage?.display_string,'normal',preview.weapon?.attack_speed?.display_string);add(preview.weapon?.dps?.display_string);
  for(const stat of preview.stats||[])add(stat.display?.display_string||(stat.type?.name||'')+(stat.value!=null?' '+stat.value:''),stat.is_negated?'muted':stat.is_equip_bonus?'green':'normal');
  for(const socket of preview.sockets||[])add(socket.display_string||socket.socket_type?.name,'muted');
  for(const spell of preview.spells||[])add(spell.description,'green');
  add(preview.durability?.display_string);
  add(preview.requirements?.level?.display_string||(data.required_level?(pt?'Requer nível ':'Requires level ')+data.required_level:''));
  for(const requirement of ['playable_classes','playable_races','skill','reputation'])add(preview.requirements?.[requirement]?.display_string);
  add(data.description,'gold');
  const price=preview.sell_price?.value??data.sell_price;
  if(Number.isInteger(price)&&price>0){
    const coins=[{type:'gold',amount:Math.floor(price/10000),name:pt?'ouro':'gold'},{type:'silver',amount:Math.floor(price/100)%100,name:pt?'prata':'silver'},{type:'copper',amount:price%100,name:pt?'cobre':'copper'}].filter(coin=>coin.amount);
    lines.push({text:preview.sell_price?.display_strings?.header||(pt?'Preço de venda:':'Sell Price:'),tone:'normal',coins});
  }
  return {title:preview.name||data.name||'',quality:preview.quality?.type||data.quality?.type,kind:'item',lines,sections:[]};
 }
  return {itemQualityColor,talentGroups,talentTooltip,spellTooltip,itemTooltip,filterMounts,talentGraph,flattenRecipes,filterRecipes,recipeOutputs,filterAppearanceSets,filterMedia};
});

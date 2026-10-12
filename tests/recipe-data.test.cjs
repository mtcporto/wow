const test=require('node:test');const assert=require('node:assert/strict');
const {flattenRecipes,filterRecipes,recipeOutputs}=require('../public/legacy/explorer-data.js');
test('recipe categories preserve nested paths and deduplicate recipe references',()=>{
 const recipes=flattenRecipes([{name:'Armor',recipes:[{id:1,name:'Peitoral'}],categories:[{name:'Plate',recipes:[{id:2,name:'Calças'}]}]},{name:'Tools',recipes:[{id:1,name:'Peitoral'}]}]);
 assert.equal(recipes.length,2);assert.equal(recipes.find(r=>r.id===2).category,'Armor › Plate');
 assert.deepEqual(filterRecipes(recipes,{query:'calcas',category:'Armor › Plate'}).map(r=>r.id),[2]);
 assert.equal(filterRecipes(recipes,{query:'calcas',category:'Tools'}).length,0);
});
test('recipe outputs keep Alliance and Horde variants separate and handle absent output items',()=>{
 const outputs=recipeOutputs({alliance_crafted_item:{id:10,name:'Alliance'},horde_crafted_item:{id:20,name:'Horde'}});
 assert.deepEqual(outputs.map(o=>[o.item.id,o.faction]),[[10,'ALLIANCE'],[20,'HORDE']]);
 assert.deepEqual(recipeOutputs({}),[]);
 assert.deepEqual(recipeOutputs({crafted_item:{id:30},crafted_items:[{item:{id:30}},{item:{id:40}}]}).map(o=>o.item.id),[30,40]);
});

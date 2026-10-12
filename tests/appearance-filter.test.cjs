const test=require('node:test');const assert=require('node:assert/strict');
const {filterAppearanceSets}=require('../explorer-data.js');
test('appearance set search supports accents and both index and detail name fields',()=>{
 const sets=[{id:1,name:'Armadura do Campeão'},{id:2,set_name:'Vestes da Aliança'}];
 assert.deepEqual(filterAppearanceSets(sets,'campeao').map(s=>s.id),[1]);
 assert.deepEqual(filterAppearanceSets(sets,'alianca').map(s=>s.id),[2]);
 assert.equal(filterAppearanceSets(sets,'').length,2);assert.equal(filterAppearanceSets(sets,'unknown').length,0);
});

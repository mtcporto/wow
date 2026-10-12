const test=require('node:test'),assert=require('node:assert/strict');
const {toys,sourceLabels}=require('../public/data/toys.json');
test('toy snapshot connects collection IDs to actual item IDs, official icons and acquisition sources',()=>{
 assert(toys.length>1000);assert.equal(new Set(toys.map(toy=>toy.id)).size,toys.length);
 for(const toy of toys){assert(Number.isInteger(toy.itemId)&&toy.itemId>0);assert(toy.name.en_US&&toy.name.pt_BR);if(toy.icon)assert.equal(new URL(toy.icon).hostname,'render.worldofwarcraft.com');if(toy.source)assert(sourceLabels[toy.source]?.en_US&&sourceLabels[toy.source]?.pt_BR);}
 const murloc=toys.find(toy=>toy.id===30);assert.equal(murloc.itemId,33079);assert.equal(murloc.source,'PROMOTION');assert.equal(murloc.name.pt_BR,'Fantasia de Murloc');assert(murloc.icon);assert.equal(sourceLabels.PROFESSION.pt_BR,'Profissão');
});

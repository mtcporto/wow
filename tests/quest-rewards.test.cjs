const test=require('node:test'),assert=require('node:assert/strict');
const {questRewardGroups}=require('../features/game-data/data.ts');
test('Blizzard quest choice_of rewards retain item references and specialization requirements',()=>{
 const result=questRewardGroups({items:{choice_of:[{item:{id:59406,name:'Gloves of Purchased Time'},requirements:{playable_specializations:[{id:64,name:'Frost'}]}},{item:{id:59407,name:"Aitokk's Belt"}}]}});
 assert.deepEqual(result.choice.map(row=>row.item.id),[59406,59407]);assert.equal(result.choice[0].requirements.playable_specializations[0].id,64);assert.deepEqual(result.received,[]);
});
test('guaranteed rewards remain separate from choices and malformed items produce no invalid links',()=>{
 const result=questRewardGroups({items:{received:[{item:{id:123},quantity:2},{item:{name:'Missing ID'}}],choice_of:[{item:{id:456}}]}});
 assert.equal(result.received.length,1);assert.equal(result.received[0].quantity,2);assert.equal(result.choice[0].item.id,456);assert.deepEqual(questRewardGroups({}),{choice:[],received:[]});
});

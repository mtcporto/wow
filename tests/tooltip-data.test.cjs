const test=require('node:test');const assert=require('node:assert/strict');
const {talentTooltip,itemTooltip,talentGraph}=require('../public/legacy/explorer-data.js');
test('talent tooltips preserve each choice and rank with cost, range and cooldown',()=>{
 const option=(name,description)=>({talent:{name},spell_tooltip:{description,power_cost:'20 Runic Power',range:'Melee Range',cooldown:'30 sec cooldown'}});
 const model=talentTooltip({ranks:[{rank:1,choice_of_tooltips:[option('A','First choice'),option('B','Second choice')]},{rank:2,tooltip:option('A','Second rank')}]});
 assert.equal(model.title,'A');assert.deepEqual(model.sections.map(s=>[s.name,s.rank]),[['A',1],['B',1],['A',2]]);assert.deepEqual(model.sections[0].meta,['20 Runic Power','Melee Range','30 sec cooldown']);assert.equal(model.sections[2].description,'Second rank');
 assert.match(talentTooltip({},'pt_BR').lines[0].text,/não fornecidas/);
});
test('item tooltips retain quality, localized stats, equip effects and requirements',()=>{
 const model=itemTooltip({name:'Item',quality:{type:'EPIC'},preview_item:{name:'Preview name',level:{display_string:'Item Level 80'},binding:{name:'Binds when picked up'},stats:[{display:{display_string:'+20 Strength'}},{display:{display_string:'+10 Haste'},is_equip_bonus:true},{display:{display_string:'+5 Intellect'},is_negated:true}],spells:[{description:'Equip: healing increased'}],requirements:{level:{display_string:'Requires Level 20'}}}});
 assert.equal(model.title,'Preview name');assert.equal(model.quality,'EPIC');assert(model.lines.some(l=>l.text==='Equip: healing increased'&&l.tone==='green'));assert(model.lines.some(l=>l.text==='+5 Intellect'&&l.tone==='muted'));assert.equal(model.lines.at(-1).text,'Requires Level 20');
 assert.equal(itemTooltip({name:'Minimal'}).lines.length,0);
});
test('compact graph preserves positions and connections at icon scale',()=>{
 const graph=talentGraph([{id:1,display_row:4,display_col:2,unlocks:[2]},{id:2,display_row:5,display_col:4,locked_by:[1]}],{stepX:42,stepY:48,marginX:25,marginY:30,minWidth:170,minHeight:180});
 assert.deepEqual(graph.nodes.map(n=>[n.x,n.y]),[[25,30],[109,78]]);assert.deepEqual(graph.edges,[{from:1,to:2}]);
});

test('hero trees use specialization descriptions without duplicating or leaking ineligible nodes',()=>{
 const {talentGroups}=require('../public/legacy/explorer-data.js');
 const groups=talentGroups({class_talent_nodes:[{id:1}],spec_talent_nodes:[{id:2},{id:3,ranks:[{tooltip:{spell_tooltip:{description:'Blood version'}}}]},{id:4}],hero_talent_trees:[{id:10,name:'Eligible',hero_talent_nodes:[{id:3,display_row:8,ranks:[{tooltip:{spell_tooltip:{description:'Shared version'}}}]}]},{id:11,name:'Ineligible',hero_talent_nodes:[{id:4}]}]},[10]);
 assert.deepEqual(groups.map(group=>group.nodes.map(node=>node.id)),[[1],[2],[3]]);
 assert.equal(talentTooltip(groups[2].nodes[0]).sections[0].description,'Blood version');assert.equal(groups[2].nodes[0].display_row,8);
});

test('item quality palette distinguishes rare, epic, legendary and heirloom titles',()=>{
 const {itemQualityColor}=require('../public/legacy/explorer-data.js');
 assert.equal(itemQualityColor('COMMON'),'#ffffff');assert.equal(itemQualityColor('UNCOMMON'),'#1eff00');
 assert.equal(itemQualityColor('RARE'),'#0070dd');assert.equal(itemQualityColor('EPIC'),'#a335ee');assert.equal(itemQualityColor('LEGENDARY'),'#ff8000');assert.equal(itemQualityColor('HEIRLOOM'),'#00ccff');assert.equal(itemQualityColor('UNKNOWN'),'#ffffff');
});
test('item preview preserves scaled level, damage/speed pairing and exact currency',()=>{
 const model=itemTooltip({level:83,sell_price:99999,inventory_type:{name:'Ranged'},item_subclass:{name:'Wand'},preview_item:{level:{display_string:'Item Level 10'},weapon:{damage:{display_string:'1 - 2 Arcane Damage'},attack_speed:{display_string:'Speed 2.00'}},sell_price:{value:10203}}});
 assert.equal(model.lines[0].text,'Item Level 10');assert(model.lines.some(line=>line.text==='Ranged'&&line.right==='Wand'));assert(model.lines.some(line=>line.text==='1 - 2 Arcane Damage'&&line.right==='Speed 2.00'));
 assert.deepEqual(model.lines.at(-1).coins.map(coin=>[coin.type,coin.amount]),[['gold',1],['silver',2],['copper',3]]);
});

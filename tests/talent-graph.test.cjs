const test=require('node:test');const assert=require('node:assert/strict');
const {talentGraph}=require('../explorer-data.js');
test('talent graph deduplicates reciprocal links and ignores external or self references',()=>{
 const graph=talentGraph([{id:10,display_row:1,display_col:3,unlocks:[20,20,10,999]},{id:20,display_row:2,display_col:3,locked_by:[10,999]}]);
 assert.deepEqual(graph.edges,[{from:10,to:20}]);
 assert.equal(graph.nodes[0].x,graph.nodes[1].x);assert(graph.nodes[1].y>graph.nodes[0].y);
});
test('graph positions remain relative to the selected tree rather than global talent columns',()=>{
 const graph=talentGraph([{id:1,display_row:4,display_col:15},{id:2,display_row:5,display_col:17}]);
 assert.equal(graph.nodes[0].x,70);assert.equal(graph.nodes[0].y,48);
 assert(graph.width>graph.nodes[1].x+50);assert(graph.height>graph.nodes[1].y+25);
});
test('graph handles empty trees, repeated nodes and missing coordinates',()=>{
 assert.deepEqual(talentGraph([]).nodes,[]);
 const graph=talentGraph([{id:1},{id:1},{id:2}]);assert.equal(graph.nodes.length,2);
 assert(graph.nodes.every(node=>Number.isFinite(node.x)&&Number.isFinite(node.y)));
});

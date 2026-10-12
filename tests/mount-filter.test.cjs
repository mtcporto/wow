const test=require('node:test');const assert=require('node:assert/strict');
const {filterMounts}=require('../explorer-data.js');
const mounts=[{id:1,name:'Corcel da Morte de Áquerus',classes:[6],faction:null,source:'VENDOR'},{id:2,name:'Cavalo da Aliança',classes:[],faction:'ALLIANCE',source:'VENDOR'},{id:3,name:'Montaria misteriosa',classes:[],faction:null,source:null}];
test('mount filters combine localized accent-insensitive search with explicit class restrictions',()=>{
 assert.deepEqual(filterMounts(mounts,{query:'aquerus',classId:'6',source:'VENDOR'}).map(m=>m.id),[1]);
 assert.equal(filterMounts(mounts,{query:'aquerus',faction:'ALLIANCE'}).length,0);
 assert.equal(filterMounts(mounts,{classId:'3'}).length,0);
});
test('missing restrictions and sources remain distinct from a known faction or class',()=>{
 assert.deepEqual(filterMounts(mounts,{classId:'UNSPECIFIED'}).map(m=>m.id),[2,3]);
 assert.deepEqual(filterMounts(mounts,{faction:'UNSPECIFIED',source:'UNSPECIFIED'}).map(m=>m.id),[3]);
 assert.deepEqual(filterMounts(mounts,{faction:'ALLIANCE'}).map(m=>m.id),[2]);
});
test('bundled full mount catalogue includes the class-restricted subset and unique IDs',()=>{
 const full=require('../data/mounts.json').mounts;const restricted=require('../data/class-mounts.json').mounts;
 const ids=new Set(full.map(m=>m.id));assert.equal(ids.size,full.length);
 assert(full.length>restricted.length);assert(restricted.every(m=>ids.has(m.id)&&m.classes.length));
 assert(full.find(m=>m.id===221).classes.includes(6));
});

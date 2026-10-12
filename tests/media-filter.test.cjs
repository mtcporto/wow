const test=require('node:test');const assert=require('node:assert/strict');
const {filterMedia}=require('../explorer-data.js');
test('official media search works across localized titles and combines type filters',()=>{
 const items=[{type:'video',titles:{en_US:'Legacy of Rage',pt_BR:'Legado da Fúria'}},{type:'comic',titles:{en_US:'Legacy',pt_BR:'Legado'}}];
 assert.equal(filterMedia(items,{query:'furia',type:'video'}).length,1);
 assert.equal(filterMedia(items,{query:'rage',type:'comic'}).length,0);
 assert.equal(filterMedia(items,{query:'legacy'}).length,2);
});
test('media catalogue keeps links and images on official sources and has no duplicate paths',()=>{
 const items=require('../data/media.json').items;assert(items.length>0);
 assert.equal(new Set(items.map(i=>i.path)).size,items.length);
 for(const item of items){assert.match(item.path,/^\/media\/(video|comic|short-story|book|audio)\/[a-z0-9-]+$/);assert(item.titles.en_US);assert(item.locales.includes('en-us'));if(item.image)assert(['blz-contentstack-images.akamaized.net','bnetcmsus-a.akamaihd.net'].includes(new URL(item.image).hostname));}
});

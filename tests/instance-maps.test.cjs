const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {instances}=require('../public/data/instance-maps.json');
test('bundled maps have local assets and valid normalized Journal encounter coordinates',()=>{
 for(const instance of Object.values(instances)){
  const encounterIds=new Set(),mapIds=new Set();
  assert(instance.source.url.startsWith('https://wago.tools/'));
  for(const floor of instance.floors){
   assert(!mapIds.has(floor.uiMapId));mapIds.add(floor.uiMapId);
   assert(Number.isInteger(floor.width)&&floor.width>0);assert(Number.isInteger(floor.height)&&floor.height>0);
   assert.match(floor.image,/^\/assets\/maps\/uimap-\d+\.webp$/);
   const image=fs.readFileSync(path.join(__dirname,'../public',floor.image));assert.equal(image.toString('ascii',0,4),'RIFF');assert.equal(image.toString('ascii',8,12),'WEBP');
   for(const pin of floor.pins){assert(!encounterIds.has(pin.encounterId));encounterIds.add(pin.encounterId);assert(Number.isFinite(pin.x)&&pin.x>=0&&pin.x<=1);assert(Number.isFinite(pin.y)&&pin.y>=0&&pin.y<=1);assert(pin.name.en_US);}
  }
 }
});
test('Gruul uses UI map 330 with both Journal bosses, distinct from engine map 565',()=>{
 const floor=instances['746'].floors.find(floor=>floor.uiMapId===330);assert(floor);assert.equal(floor.width,1002);assert.equal(floor.height,668);assert.equal(floor.fileDataIds.length,12);
 assert.deepEqual(floor.pins.map(pin=>pin.encounterId),[1564,1565]);
});

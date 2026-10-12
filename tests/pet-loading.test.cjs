const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const html = fs.readFileSync(require('node:path').join(__dirname, '../pets.html'), 'utf8');
const loader = html.slice(html.indexOf('    let catalogueLoadVersion'), html.indexOf('    function showPets()'));
test('opens the pet catalogue with one static file and one index call, without per-pet detail requests', async () => {
  const requests = [];
  const context = vm.createContext({
    currentLanguage:'pt_BR', allPets:[], petFamilies:{}, petCategories:{},
    getTranslation:key=>key, updateBackgroundLoading(){}, setupFamilyNav(){},
    showPets(){}, updatePageText(){}, categorizeFamily(){},
    fetch:async url=>{requests.push(url);return {ok:true,json:async()=>({pets:[{id:1,name:'English name',family:'Beast',icon:'icon.jpg'},{id:2,name:'Removed pet',family:'Beast'}]})};},
    fetchPetIndex:async()=>{requests.push('index');return {pets:[{id:1,name:'Nome em português'}]};},
    fetchPetDetails:()=>assert.fail('Opening the catalogue must not fetch individual details'),
    document:{getElementById:()=>({})}
  });
  vm.runInContext(loader, context);
  await context.loadPetsData();
  assert.deepEqual(requests,['data/pets.json','index']);
  assert.equal(context.allPets.length,1);
  assert.equal(context.allPets[0].name,'Nome em português');
  assert.equal(context.petFamilies.Beast.length,1);
});
test('a slower previous language request cannot overwrite the newly selected language',async()=>{
 let resolveOld;
 const context=vm.createContext({currentLanguage:'en_US',allPets:[],petFamilies:{},petCategories:{},getTranslation:key=>key,updateBackgroundLoading(){},setupFamilyNav(){},showPets(){},updatePageText(){},categorizeFamily(){},
 fetch:async()=>({ok:true,json:async()=>({pets:[{id:1,name:'Pet',family:'Beast'}]})}),
 fetchPetIndex:()=>context.currentLanguage==='en_US'?new Promise(resolve=>{resolveOld=resolve;}):Promise.resolve({pets:[{id:1,name:'Português'}]}),document:{getElementById:()=>({})}});
 vm.runInContext(loader,context);
 const old=context.loadPetsData();context.currentLanguage='pt_BR';await context.loadPetsData();
 resolveOld({pets:[{id:1,name:'English'}]});await old;
 assert.equal(context.allPets[0].name,'Português');
});

test('falls back to the catalogue name when Blizzard returns a null localized name',async()=>{
 const context=vm.createContext({currentLanguage:'pt_BR',allPets:[],petFamilies:{},petCategories:{},getTranslation:key=>key,updateBackgroundLoading(){},setupFamilyNav(){},showPets(){},updatePageText(){},categorizeFamily(){},
 fetch:async()=>({ok:true,json:async()=>({pets:[{id:1,name:'Fallback name',family:'Beast'}]})}),
 fetchPetIndex:async()=>({pets:[{id:1,name:null}]}),document:{getElementById:()=>({})}});
 vm.runInContext(loader,context);await context.loadPetsData();
 assert.equal(context.allPets[0].name,'Fallback name');
});

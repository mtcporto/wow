(() => {
  const params = new URLSearchParams(location.search);
  const output = document.getElementById('output');
  const title = document.getElementById('page-title');
  const intro = document.getElementById('explorer-intro');
  const back = document.getElementById('explorer-back');
  const icon = document.getElementById('explorer-icon');
  let locale = sessionStorage.getItem('wow-language') || 'en_US';
  let generation = 0;
  const cache = new Map();
  const text = (pt,en) => locale === 'pt_BR' ? pt : en;
  const escape = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const numeric = key => /^[1-9]\d{0,8}$/.test(params.get(key)||'') ? Number(params.get(key)) : null;
  function api(resource, extra={}) {
    const base = window.WowConfig.basePath;
    const query = new URLSearchParams({path:'/data/wow/'+resource,locale,...(/^(realm|region|connected-realm)\//.test(resource)?{region:worldRegion()}:{}),...extra});
    const key = query.toString();
    if (!cache.has(key)) cache.set(key, fetch(base+'/api/blizzard?'+query).then(async response=>{
      if(!response.ok)throw Error(text('Não foi possível carregar os dados. Tente novamente.','Unable to load data. Please try again.'));
      return response.json();
    }).catch(error=>{cache.delete(key);throw error;}));
    return cache.get(key);
  }
  const section = (heading,body,id='') => `<section class="explorer-section"${id?` id="${id}"`:""}><h2>${escape(heading)}</h2>${body}</section>`;
  const grid = cards => `<div class="relation-grid">${cards.join('')}</div>`;
  const card = (heading,body,href='') => `<${href?'a':'article'} class="relation-card"${href?` href="${escape(href)}"`:''}><h3>${escape(heading)}</h3>${body}</${href?'a':'article'}>`;
  const tag = label => `<span class="tag">${escape(label)}</span>`;
  const description = value => `<p>${escape(value)}</p>`;
  const skillButton = (name,index) => `<button class="spell-preview-button" data-skill="${index}">${escape(name)}</button>`;
  function bindSkills(skills) {
    output.querySelectorAll('[data-skill]').forEach(button=>{
      const skill=skills[Number(button.dataset.skill)];
      const tooltip=skill.spell_tooltip;
      WowTooltip.bind(button,()=>tooltip?ExplorerData.talentTooltip({ranks:[{tooltip:{talent:{name:skill.talent?.name||skill.spell?.name||skill.name},spell_tooltip:tooltip}}]},locale):api('spell/'+(skill.spell?.id||skill.id)).then(ExplorerData.spellTooltip));
    });
  }
  async function media(resource,version) {
    try { const data=await api(resource);const asset=data.assets?.find(a=>a.key==='icon')||data.assets?.[0];
      if(version!==generation||!asset||!/^https:\/\//.test(asset.value))return;
      icon.src=asset.value;icon.hidden=false;
    } catch { /* Media is optional; the catalogue remains usable. */ }
  }
  function familyName(value) {
    const names={Wolf:'Lobo',Cat:'Felino',Bear:'Urso',Boar:'Javali',Crab:'Caranguejo',Spider:'Aranha',Raptor:'Raptor',Scorpid:'Escorpídeo',Bat:'Morcego',Turtle:'Tartaruga'};
    return locale==='pt_BR'?(names[value]||value):value;
  }
  async function classView(id,version) {
    const [data,mounts] = await Promise.all([api('playable-class/'+id),fetch(window.WowConfig.basePath+'/data/class-mounts.json').then(r=>{if(!r.ok)throw Error('Mount catalogue unavailable');return r.json();})]);
    if(version!==generation)return;
    title.textContent=data.name;
    intro.textContent=text('Explore as raças, especializações e coleções ligadas a esta classe.','Explore the races, specializations and collections connected to this class.');
    let html=section(text('Especializações','Specializations'),grid((data.specializations||[]).map(s=>card(s.name,description(text('Função, talentos e habilidades PvP','Role, talents and PvP abilities')),'explore.html?spec='+s.id))), 'specializations');
    html+=section(text('Raças disponíveis','Available races'),grid((data.playable_races||[]).map(r=>card(r.name,description(text('Facção e habilidades raciais','Faction and racial abilities')),'explore.html?race='+r.id))), 'races');
    const exclusive=mounts.mounts.filter(m=>m.classes.includes(id));
    html+=section(text('Montarias restritas à classe','Class-restricted mounts'),exclusive.length?grid(exclusive.map(m=>card(m.name,`<details data-mount="${m.id}"><summary>${text('Ver montaria e requisitos','View mount and requirements')}</summary><div></div></details>`))):description(text('Nenhuma restrição desta classe foi encontrada no catálogo atual.','No restriction for this class was found in the current catalogue.')), 'mounts');
    if(id===3)html+=section(text('Companheiros de Hunter','Hunter companions'),card(text('Criaturas domáveis','Tameable creatures'),description(text('Explore famílias e busque companheiros. Battle pets têm seu próprio catálogo.','Explore families and find companions. Battle pets have a separate catalogue.')),'explore.html?hunters=1'));
    output.innerHTML=html;media('media/playable-class/'+id,version);
    output.querySelectorAll('[data-mount]').forEach(details=>details.addEventListener('toggle',async()=>{
      if(!details.open||details.dataset.loaded)return;details.dataset.loaded='1';const box=details.querySelector('div');box.textContent=text('Carregando…','Loading…');
      try {const mount=await api('mount/'+details.dataset.mount);if(version!==generation)return;details.closest('article').querySelector('h3').textContent=mount.name;
        box.innerHTML=description(mount.description)+`<div class="tags">${(mount.requirements?.classes||[]).map(c=>tag(c.name)).join('')}${mount.requirements?.faction?tag(mount.requirements.faction.name):''}${mount.source?tag(mount.source.name):''}</div>`;
        const display=mount.creature_displays?.[0]?.id;if(display){const asset=await api('media/creature-display/'+display);const image=asset.assets?.[0]?.value;if(version===generation&&image?.startsWith('https://'))box.insertAdjacentHTML('beforeend',`<img src="${escape(image)}" alt="${escape(mount.name)}" loading="lazy">`);}
      }catch(error){box.textContent=error.message;delete details.dataset.loaded;}
    }));
  }
  async function specView(id,version) {
    const data=await api('playable-specialization/'+id);if(version!==generation)return;
    back.href='explore.html?class='+data.playable_class.id;back.textContent='← '+data.playable_class.name;
    title.textContent=data.name;intro.textContent=data.gender_description?.male||'';
    let html=`<div class="tags">${[data.role?.name,data.power_type?.name,data.primary_stat_type?.name].filter(Boolean).map(tag).join('')}</div>`;
    output.innerHTML=html;media('media/playable-specialization/'+id,version);
    const path=data.spec_talent_tree?.key?.href;
    let groups=[],allNodes=[];
    if(path){const resource=new URL(path).pathname.replace('/data/wow/','');const tree=await api(resource);if(version!==generation)return;
      allNodes=[...(tree.class_talent_nodes||[]),...(tree.spec_talent_nodes||[]),...(tree.hero_talent_trees||[]).flatMap(h=>h.hero_talent_nodes||[])];
      groups=ExplorerData.talentGroups(tree,(data.hero_talent_trees||[]).map(hero=>hero.id));
      for(const group of groups)if(group.kind!=='hero')group.name=group.kind==='class'?text('Classe','Class'):text('Especialização','Specialization');
      html+=section(text('Árvores de talentos','Talent trees'),`<p class="explorer-note">${text('Explore os talentos e suas conexões. A distribuição de pontos e a exportação de builds serão adicionadas em outra etapa.','Explore talents and their connections. Point allocation and build export will be added in a later stage.')}</p><div id="talent-tree-root"></div>`);
    }
    html+=section(text('Talentos PvP','PvP talents'),grid((data.pvp_talents||[]).map((t,index)=>card(t.talent.name,skillButton(t.talent.name,index)+description(t.spell_tooltip?.description)))));
    output.innerHTML=html;
    bindSkills(data.pvp_talents||[]);
    if(groups.length)TalentTree.mount(document.getElementById('talent-tree-root'),groups,{locale,allNodes,classId:data.playable_class.id,className:data.playable_class.name,specName:data.name});
  }
  async function raceView(id,version) {
    const data=await api('playable-race/'+id);if(version!==generation)return;
    title.textContent=data.name;intro.textContent=data.faction?.name||'';
    output.innerHTML=section(text('Classes disponíveis','Available classes'),grid((data.playable_classes||[]).map(c=>card(c.name,'','explore.html?class='+c.id))))+section(text('Habilidades raciais','Racial abilities'),grid((data.racial_spells||[]).map((s,index)=>card(s.spell?.name||s.name,skillButton(s.spell?.name||s.name,index)+description(s.spell_tooltip?.description)))));
    bindSkills(data.racial_spells||[]);
  }
  async function huntersView(version) {
    title.textContent=text('Companheiros de Hunter','Hunter companions');intro.textContent=text('Famílias de criaturas domáveis, separadas dos mascotes de batalha.','Tameable creature families, separate from battle pets.');
    back.href='explore.html?class=3';back.textContent='← Hunter';
    const families=await api('creature-family/index');if(version!==generation)return;
    output.innerHTML=grid((families.creature_families||[]).map(f=>card(f.name,description(text('Explorar família','Explore family')),'explore.html?family='+f.id)));
  }
  async function familyView(id,version,page=1) {
    back.href='explore.html?hunters=1';back.textContent='← '+text('Famílias','Families');
    const [family,results]=await Promise.all([api('creature-family/'+id),api('search/creature',{family:String(id),page:String(page)})]);if(version!==generation)return;
    title.textContent=family.name;intro.textContent=family.specialization?.name||'';media('media/creature-family/'+id,version);
    output.innerHTML=description(text('A API indica domabilidade. Requisitos especiais e locais de captura ainda precisam de confirmação.','The API indicates tameability. Special requirements and taming locations still need confirmation.'))+grid((results.results||[]).map(result=>{
      const creature=result.data;const name=creature.name?.[locale]||creature.name?.en_US||creature.id;
      return card(name,`<div class="tags">${tag(text('Domável','Tameable'))}${tag(familyName(creature.family?.name?.en_US||''))}</div><details data-creature-display="${creature.creature_displays?.[0]?.id||''}"><summary>${text('Ver aparência','View appearance')}</summary><div></div></details>`);
    }))+`<div class="explorer-pager"><button class="back-btn" data-page="${page-1}" ${page<=1?'disabled':''}>←</button><span>${page} / ${results.pageCount||1}</span><button class="back-btn" data-page="${page+1}" ${page>=results.pageCount?'disabled':''}>→</button></div>`;
    output.querySelectorAll('[data-page]').forEach(button=>button.addEventListener('click',()=>{params.set('page',button.dataset.page);render();}));
    output.querySelectorAll('[data-creature-display]').forEach(details=>details.addEventListener('toggle',async()=>{
      if(!details.open||details.dataset.loaded||!details.dataset.creatureDisplay)return;details.dataset.loaded='1';
      const box=details.querySelector('div');box.textContent=text('Carregando…','Loading…');
      try {const data=await api('media/creature-display/'+details.dataset.creatureDisplay);if(version!==generation)return;const asset=data.assets?.[0]?.value;box.innerHTML=asset?.startsWith('https://')?`<img src="${escape(asset)}" alt="" loading="lazy">`:description(text('Imagem indisponível','Image unavailable'));}catch(error){box.textContent=error.message;delete details.dataset.loaded;}
    }));
  }
  const sourceName = source => ({VENDOR:text('Comerciante','Vendor'),DROP:text('Saque','Drop'),QUEST:text('Missão','Quest'),ACHIEVEMENT:text('Conquista','Achievement'),PROFESSION:text('Profissão','Profession'),PROMOTION:text('Promoção','Promotion'),WORLD_EVENT:text('Evento','World event'),STORE:text('Loja','Store'),TRADING_POST:text('Posto comercial','Trading post'),DISCOVERY:text('Descoberta','Discovery'),UNSPECIFIED:text('Não informado','Not specified')}[source]||source);
  const factionName = faction => faction==='ALLIANCE'?text('Aliança','Alliance'):faction==='HORDE'?text('Horda','Horde'):text('Facção não informada','Faction not specified');
  const pagination = (page,total) => `<div class="explorer-pager"><button class="back-btn" data-page="${page-1}" ${page<=1?'disabled':''} aria-label="${text('Página anterior','Previous page')}">←</button><span>${page} / ${Math.max(1,total)}</span><button class="back-btn" data-page="${page+1}" ${page>=total?'disabled':''} aria-label="${text('Próxima página','Next page')}">→</button></div>`;
  async function mountCatalogueView(version) {
    title.textContent=text('Montarias','Mounts');
    intro.textContent=text('Explore a coleção por nome, origem, facção e restrição de classe.','Explore the collection by name, source, faction and class restriction.');
    const [snapshot,index,classes]=await Promise.all([fetch(window.WowConfig.basePath+'/data/mounts.json').then(r=>{if(!r.ok)throw Error('Mount catalogue unavailable');return r.json();}),api('mount/index'),api('playable-class/index')]);
    if(version!==generation)return;
    const entries=new Map(index.mounts.map(m=>[m.id,m]));
    const mounts=snapshot.mounts.filter(m=>entries.has(m.id)).map(m=>({...m,name:entries.get(m.id).name||m.name})).sort((a,b)=>a.name.localeCompare(b.name,locale.replace('_','-')));
    const sources=[...new Set(mounts.map(m=>m.source||'UNSPECIFIED'))].sort();
    const options=(values)=>values.map(([value,label])=>`<option value="${escape(value)}">${escape(label)}</option>`).join('');
    output.innerHTML=`<form class="catalogue-filters" id="mount-filters" role="search"><label>${text('Buscar por nome','Search by name')}<input type="search" name="query" autocomplete="off" placeholder="${text('Nome da montaria…','Mount name…')}" maxlength="120"></label><label>${text('Facção','Faction')}<select name="faction">${options([['',text('Todas','All')],['ALLIANCE',text('Aliança','Alliance')],['HORDE',text('Horda','Horde')],['UNSPECIFIED',text('Não informada','Not specified')]])}</select></label><label>${text('Restrição de classe','Class restriction')}<select name="classId">${options([['',text('Todas','All')],['UNSPECIFIED',text('Sem classe informada','No class specified')],...classes.classes.map(c=>[c.id,c.name])])}</select></label><label>${text('Origem','Source')}<select name="source">${options([['',text('Todas','All')],...sources.map(s=>[s,sourceName(s)])])}</select></label><button class="back-btn" type="reset">${text('Limpar','Reset')}</button></form><p class="explorer-note">${text('Os filtros mostram o que foi informado pela API; a ausência de uma restrição não garante acesso irrestrito.','Filters reflect what the API reports; an absent restriction does not guarantee unrestricted access.')}</p><div id="mount-results" aria-live="polite"></div>`;
    const form=document.getElementById('mount-filters');const results=document.getElementById('mount-results');let page=1;
    for(const name of ['query','faction','classId','source'])if(params.has(name))form.elements.namedItem(name).value=params.get(name);
    function display(){
      if(version!==generation)return;
      const filters=Object.fromEntries(new FormData(form));
      const matches=ExplorerData.filterMounts(mounts,filters);
      const pages=Math.ceil(matches.length/24);page=Math.max(1,Math.min(page,pages||1));
      const cards=matches.slice((page-1)*24,page*24).map(m=>card(m.name,`<div class="tags">${m.source?tag(sourceName(m.source)):''}${m.faction?tag(factionName(m.faction)):''}${m.classes.length?tag(text('Restrita a classe','Class restriction')):''}</div>`,'explore.html?mount='+m.id));
      results.innerHTML=description(`${matches.length.toLocaleString(locale.replace('_','-'))} ${matches.length===1?text('montaria encontrada','mount found'):text('montarias encontradas','mounts found')}`)+(cards.length?grid(cards):`<div class="empty-state">${text('Nenhuma montaria corresponde aos filtros.','No mounts match these filters.')}</div>`)+pagination(page,pages);
      results.querySelectorAll('[data-page]').forEach(button=>button.addEventListener('click',()=>{page=Number(button.dataset.page);display();results.scrollIntoView({block:'start'});}));
    }
    form.addEventListener('submit',event=>event.preventDefault());
    form.addEventListener('input',()=>{page=1;display();});
    form.addEventListener('reset',()=>{page=1;setTimeout(display,0);});display();
  }
  async function optionalImage(resource,target,version,alt='') {
    try{const data=await api(resource);const asset=data.assets?.find(a=>a.key==='zoom')||data.assets?.find(a=>a.key==='main')||data.assets?.[0];
      if(version!==generation||!asset?.value?.startsWith('https://'))return;
      target.innerHTML=`<img src="${escape(asset.value)}" alt="${escape(alt)}" decoding="async">`;
    }catch{ /* Missing media does not block navigation. */ }
  }
  async function mountView(id,version){
    const data=await api('mount/'+id);if(version!==generation)return;
    title.textContent=data.name;intro.textContent=data.description||'';back.href='explore.html?mounts=1';back.textContent='← '+text('Montarias','Mounts');
    const requirements=data.requirements||{};
    const classes=requirements.classes||[];const faction=requirements.faction||data.faction;
    output.innerHTML=`<div class="tags">${data.source?tag(data.source.name):''}${faction?tag(faction.name):''}</div><div class="detail-art" id="mount-art"></div>`+section(text('Requisitos informados','Reported requirements'),classes.length?grid(classes.map(c=>card(c.name,description(text('Explorar classe','Explore class')),'explore.html?class='+c.id))):description(text('A API não informou uma restrição de classe para esta montaria.','The API did not report a class restriction for this mount.')))+description(faction?text('Facção: ','Faction: ')+faction.name:text('A API não informou restrição de facção.','The API did not report a faction restriction.'))+`<a class="back-btn" href="explore.html?mounts=1">${text('Explorar outras montarias','Explore other mounts')}</a>`;
    if(data.creature_displays?.[0])optionalImage('media/creature-display/'+data.creature_displays[0].id,document.getElementById('mount-art'),version,data.name);
  }
  function journalKind(){return ['dungeons','raids'].includes(params.get('kind'))?params.get('kind'):'';}
  function journalLink(key,id){return 'explore.html?'+key+'='+id+(journalKind()?'&kind='+journalKind():'');}
  async function journalView(version){
    const data=await api('journal-expansion/index');if(version!==generation)return;
    const kind=journalKind();title.textContent=kind==='dungeons'?text('Masmorras','Dungeons'):kind==='raids'?text('Raides','Raids'):text('Journal de Azeroth','Azeroth Journal');
    intro.textContent=text('Escolha uma expansão para explorar instâncias, chefes e recompensas.','Choose an expansion to explore instances, bosses and rewards.');
    output.innerHTML=grid(data.tiers.map(t=>card(t.name,description(text('Explorar conteúdo','Explore content')),journalLink('expansion',t.id))));
  }
  async function expansionView(id,version){
    const data=await api('journal-expansion/'+id);if(version!==generation)return;
    title.textContent=data.name;intro.textContent=text('Explore as masmorras e raides desta expansão.','Explore the dungeons and raids of this expansion.');back.href=journalLink('journal',1);back.textContent='← Journal';
    let html='';const kind=journalKind();
    for(const [key,pt,en] of [['dungeons','Masmorras','Dungeons'],['raids','Raides','Raids']]){
      if(kind&&kind!==key)continue;
      html+=section(text(pt,en),data[key]?.length?grid(data[key].map(i=>card(i.name,'',journalLink('instance',i.id)))):description(text('Nenhuma instância informada.','No instances reported.')));
    }
    if(!kind&&data.world_bosses?.length)html+=section(text('Chefes de mundo','World bosses'),grid(data.world_bosses.map(e=>card(e.name,'',journalLink('encounter',e.id)))));
    output.innerHTML=html;
  }
  async function instanceView(id,version){
    const data=await api('journal-instance/'+id);if(version!==generation)return;
    title.textContent=data.name;intro.textContent=data.description||'';
    back.href=data.expansion?journalLink('expansion',data.expansion.id):journalLink('journal',1);back.textContent='← '+(data.expansion?.name||'Journal');
    output.innerHTML=`<div class="tags">${data.category?tag(data.category.type==='RAID'?text('Raide','Raid'):text('Masmorra','Dungeon')):''}${(data.modes||[]).map(m=>tag(m.name)).join('')}${data.minimum_level?tag(text('Nível mínimo: ','Minimum level: ')+data.minimum_level):''}</div><div id="instance-art" class="detail-art"></div>`+section(text('Encontros','Encounters'),grid((data.encounters||[]).map(e=>card(e.name,description(text('Chefe, habilidades e itens','Boss, abilities and items')),journalLink('encounter',e.id)))));
    if(data.media)optionalImage('media/journal-instance/'+(data.media.id||id),document.getElementById('instance-art'),version,data.name);
  }
  function encounterSections(sections,depth=0){
    const heading='h'+Math.min(3+depth,6);
    return (sections||[]).map(s=>`<section class="encounter-ability${depth?' encounter-ability-nested':''}"><${heading}>${escape(s.title)}</${heading}>${s.body_text?description(s.body_text):''}${encounterSections(s.sections,depth+1)}</section>`).join('');
  }
  function encounterItemTable(items,encounter,version){
    const modes=(encounter.modes||[]).map(mode=>mode.name).join(', ');
    const columns=[['name',text('Nome','Name')],['level',text('Nível do item','Item level')],['required',text('Nível requerido','Required level')],['slot',text('Equipamento','Slot')],['type',text('Tipo','Type')]];
    const root=document.getElementById('encounter-items');
    root.innerHTML=`<label class="loot-search">${text('Buscar item','Search items')}<input type="search" maxlength="120" autocomplete="off" placeholder="${text('Nome, tipo ou classe…','Name, type or class…')}"></label><p class="loot-count" aria-live="polite"></p><div class="loot-table-scroll"><table class="loot-table"><caption>${escape(encounter.name)}${modes?' · '+escape(modes):''}</caption><thead><tr>${columns.map(([key,label])=>`<th scope="col" data-sort="${key}" aria-sort="none"><button type="button">${escape(label)} <span aria-hidden="true">↕</span></button></th>`).join('')}<th scope="col">${text('Modo','Mode')}</th><th scope="col">${text('Origem','Source')}</th></tr></thead><tbody>${items.map(item=>`<tr data-loot="${item.id}"><td><a class="loot-item-name" href="explore.html?item=${item.id}&fromEncounter=${encounter.id}"><span class="item-link-name">${escape(item.name)}</span></a><small class="loot-classes"></small></td>${['level','required','slot','type'].map(key=>`<td data-field="${key}" aria-label="${text('Carregando','Loading')}">…</td>`).join('')}<td>${escape(modes)||'—'}</td><td>${escape(encounter.instance?.name||encounter.name)}</td></tr>`).join('')}</tbody></table></div>`;
    const entries=items.map(item=>({id:item.id,name:item.name,row:root.querySelector(`[data-loot="${item.id}"]`),classes:'',level:null,required:null,slot:'',type:''}));
    const input=root.querySelector('input'),tbody=root.querySelector('tbody'),count=root.querySelector('.loot-count');
    let sort='',direction=1,next=0;
    const normalize=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
    function display(){
      if(version!==generation)return;
      const term=normalize(input.value),visible=entries.filter(entry=>normalize(entry.name+' '+entry.classes+' '+entry.type+' '+entry.slot).includes(term));
      for(const entry of entries)entry.row.hidden=!visible.includes(entry);
      if(sort)visible.sort((a,b)=>{const x=a[sort],y=b[sort];if(x===null)return y===null?0:1;if(y===null)return -1;return direction*(typeof x==='number'&&typeof y==='number'?x-y:String(x).localeCompare(String(y),locale.replace('_','-'),{numeric:true}));});
      for(const entry of visible)tbody.appendChild(entry.row);
      count.textContent=visible.length+' / '+entries.length+' '+text('itens','items');
    }
    root.querySelectorAll('[data-sort]').forEach(header=>header.querySelector('button').addEventListener('click',()=>{direction=sort===header.dataset.sort?-direction:1;sort=header.dataset.sort;root.querySelectorAll('[data-sort]').forEach(th=>th.setAttribute('aria-sort',th===header?(direction===1?'ascending':'descending'):'none'));display();}));
    input.addEventListener('input',display);display();
    async function worker(){
      while(next<entries.length&&version===generation){
        const entry=entries[next++];
        try{
          const item=await api('item/'+entry.id);if(version!==generation)return;
          const preview=item.preview_item||{};
          entry.name=preview.name||item.name||entry.name;entry.level=preview.level?.value??item.level??null;entry.required=preview.requirements?.level?.value??item.required_level??null;
          entry.slot=(preview.inventory_type||item.inventory_type)?.type==='NON_EQUIP'?'—':(preview.inventory_type?.name||item.inventory_type?.name||'—');
          entry.type=preview.item_subclass?.name||item.item_subclass?.name||item.item_class?.name||'—';
          entry.classes=preview.requirements?.playable_classes?.display_string||'';
          const color=ExplorerData.itemQualityColor(preview.quality?.type||item.quality?.type),name=entry.row.querySelector('.item-link-name');name.textContent=entry.name;name.style.color=color;
          entry.row.querySelector('.wow-item-icon')?.style.setProperty('border-color',color);entry.row.querySelector('.loot-classes').textContent=entry.classes;
        }catch{entry.slot=entry.type='—';}
        for(const key of ['level','required','slot','type']){const cell=entry.row.querySelector(`[data-field="${key}"]`);cell.textContent=entry[key]??'—';cell.removeAttribute('aria-label');}
        display();
      }
    }
    Promise.all([worker(),worker(),worker()]);
  }
  async function encounterView(id,version){
    const data=await api('journal-encounter/'+id);if(version!==generation)return;
    const instance=data.instance?await api('journal-instance/'+data.instance.id).catch(()=>null):null;
    if(version!==generation)return;
    title.textContent=data.name;intro.textContent=data.description||'';
    back.href=data.instance?journalLink('instance',data.instance.id):journalLink('journal',1);back.textContent='← '+(data.instance?.name||'Journal');
    const primary=(data.creatures||[]).find(creature=>creature.creature_display?.id);
    const art=document.getElementById('explorer-art'),meta=document.getElementById('explorer-meta');
    meta.innerHTML=(data.modes||[]).map(mode=>tag(mode.name)).join('')+(instance?`<a class="tag" href="${escape(journalLink('instance',instance.id))}">${escape(instance.name)}</a>${instance.location?tag(instance.location.name):''}${instance.expansion?tag(instance.expansion.name):''}`:'');meta.hidden=!meta.innerHTML;
    if(primary){
      document.getElementById('main-content').classList.add('encounter-page');art.hidden=false;
      art.innerHTML=`<span class="portrait-status">${text('Carregando imagem…','Loading image…')}</span>`;
      optionalImage('media/creature-display/'+primary.creature_display.id,art,version,primary.name).then(()=>{
        if(version===generation&&!art.querySelector('img'))art.innerHTML=`<span class="portrait-status">${text('Imagem indisponível.','Image unavailable.')}</span>`;
      });
    }
    const others=(data.creatures||[]).filter(creature=>creature!==primary);
    let html='';
    if(others.length)html+=section(text('Outras criaturas do encontro','Other encounter creatures'),grid(others.map(creature=>card(creature.name,creature.creature_display?.id?`<div class="detail-art" data-display="${creature.creature_display.id}"></div>`:''))));
    if(data.sections?.length)html+=section(text('Habilidades','Abilities'),encounterSections(data.sections));
    const items=[...new Map((data.items||[]).filter(i=>i.item?.id).map(i=>[i.item.id,i.item])).values()];
    html+=section(text('Itens do encontro','Encounter items'),items.length?'<div id="encounter-items"></div>':description(text('Nenhum item informado para este encontro.','No items reported for this encounter.')));
    output.innerHTML=html;
    if(items.length)encounterItemTable(items,data,version);
    output.querySelectorAll('[data-display]').forEach(target=>optionalImage('media/creature-display/'+target.dataset.display,target,version,others.find(creature=>String(creature.creature_display?.id)===target.dataset.display)?.name||''));
  }
  async function itemView(id,version){
    const data=await api('item/'+id);if(version!==generation)return;
    title.textContent=data.name;intro.textContent=data.inventory_type?.name||'';
    back.href=numeric('fromAchievement')?'explore.html?achievement='+numeric('fromAchievement'):numeric('fromDecor')?'explore.html?decor='+numeric('fromDecor'):numeric('fromAppearance')?'explore.html?appearance='+numeric('fromAppearance')+transmogContext():numeric('fromRecipe')?'explore.html?recipe='+numeric('fromRecipe')+recipeContext():(numeric('fromEncounter')?journalLink('encounter',numeric('fromEncounter')):journalLink('journal',1));
    back.textContent='← '+(numeric('fromAchievement')?text('Conquista','Achievement'):numeric('fromDecor')?text('Decoração','Decor'):numeric('fromAppearance')?text('Aparência','Appearance'):numeric('fromRecipe')?text('Receita','Recipe'):text('Encontro','Encounter'));
    intro.textContent='';
    const model=ExplorerData.itemTooltip(data,locale),color=ExplorerData.itemQualityColor(model.quality);
    output.innerHTML=`<div class="item-sheet-layout"><span class="wow-item-icon item-sheet-icon" id="item-sheet-icon" style="border-color:${color}" aria-hidden="true"></span><article class="wow-item-sheet" aria-label="${escape(text('Informações do item','Item information'))}">${WowTooltip.render(model)}</article></div>`;
    api('media/item/'+(data.media?.id||id)).then(asset=>{
      if(version!==generation)return;const url=asset.assets?.find(value=>value.key==='icon')?.value;
      if(url?.startsWith('https://'))document.getElementById('item-sheet-icon').innerHTML=`<img src="${escape(url)}" alt="" width="56" height="56">`;
    }).catch(()=>{});
    if(data.appearances?.length) {
      const appearances=data.appearances.map((appearance,index)=>{
        let href='explore.html?appearance='+appearance.id+'&fromItem='+id;
        if(numeric('fromEncounter'))href+='&fromEncounter='+numeric('fromEncounter');
        if(numeric('fromRecipe'))href+='&fromRecipe='+numeric('fromRecipe')+recipeContext();
        if(numeric('fromSet'))href+='&fromSet='+numeric('fromSet');
        return card(text('Variante visual ','Visual variant ')+(index+1),description(text('Ver itens com esta aparência','View items sharing this appearance')),href);
      });
      output.insertAdjacentHTML('beforeend',section(text('Aparências','Appearances'),grid(appearances)));
    }
  }

  const recipeContext = () => (numeric('fromProfession')?'&fromProfession='+numeric('fromProfession'):'')+(numeric('fromTier')?'&fromTier='+numeric('fromTier'):'');
  async function professionsView(version){
    const data=await api('profession/index');if(version!==generation)return;
    title.textContent=text('Profissões','Professions');intro.textContent=text('Explore profissões, linhas de habilidade, receitas e os materiais necessários.','Explore professions, skill tiers, recipes and their required materials.');
    const main=new Set([164,165,171,182,186,197,202,333,393,755,773,185,356,794]);
    const professions=data.professions||[];const cards=entries=>grid(entries.map(p=>card(p.name,description(text('Habilidades e receitas','Skills and recipes')),'explore.html?profession='+p.id)));
    output.innerHTML=section(text('Profissões do personagem','Character professions'),cards(professions.filter(p=>main.has(p.id))))+section(text('Outros sistemas de criação','Other crafting systems'),description(text('Sistemas e atividades de criação também listados pela Blizzard; nem todos são profissões aprendidas pelo personagem.','Crafting systems and activities also listed by Blizzard; not all are professions learned by characters.'))+cards(professions.filter(p=>!main.has(p.id))));
  }
  async function professionView(id,version){
    const data=await api('profession/'+id);if(version!==generation)return;
    title.textContent=data.name;intro.textContent=data.description||'';back.href='explore.html?professions=1';back.textContent='← '+text('Profissões','Professions');
    output.innerHTML=`<div class="tags">${data.type?.name?tag(data.type.name):''}</div>`+section(text('Linhas de habilidade','Skill tiers'),data.skill_tiers?.length?grid(data.skill_tiers.map(tier=>card(tier.name,description(text('Explorar receitas','Explore recipes')),'explore.html?profession='+id+'&tier='+tier.id))):description(text('A API não informou linhas de habilidade para esta profissão.','The API did not report skill tiers for this profession.')));
    media('media/profession/'+id,version);
  }
  async function skillTierView(professionId,tierId,version){
    const [profession,tier]=await Promise.all([api('profession/'+professionId),api('profession/'+professionId+'/skill-tier/'+tierId)]);if(version!==generation)return;
    title.textContent=tier.name;intro.textContent=profession.name;back.href='explore.html?profession='+professionId;back.textContent='← '+profession.name;
    const recipes=ExplorerData.flattenRecipes(tier.categories).sort((a,b)=>(a.name||'').localeCompare(b.name||'',locale.replace('_','-')));
    const categories=[...new Set(recipes.map(recipe=>recipe.category))].filter(Boolean).sort();
    output.innerHTML=`<div class="tags">${tier.minimum_skill_level!=null?tag(text('Habilidade mínima: ','Minimum skill: ')+tier.minimum_skill_level):''}${tier.maximum_skill_level!=null?tag(text('Habilidade máxima: ','Maximum skill: ')+tier.maximum_skill_level):''}</div><form class="catalogue-filters" id="recipe-filters" role="search"><label>${text('Buscar receita','Search recipes')}<input type="search" name="query" autocomplete="off" maxlength="120" placeholder="${text('Nome da receita…','Recipe name…')}"></label><label>${text('Categoria','Category')}<select name="category"><option value="">${text('Todas','All')}</option>${categories.map(category=>`<option value="${escape(category)}">${escape(category)}</option>`).join('')}</select></label><button type="reset" class="back-btn">${text('Limpar','Reset')}</button></form><div id="recipe-results" aria-live="polite"></div>`;
    const form=document.getElementById('recipe-filters'),results=document.getElementById('recipe-results');let page=1;
    function display(){
      if(version!==generation)return;
      const matches=ExplorerData.filterRecipes(recipes,Object.fromEntries(new FormData(form)));const pages=Math.ceil(matches.length/24);page=Math.max(1,Math.min(page,pages||1));
      results.innerHTML=description(matches.length.toLocaleString(locale.replace('_','-'))+' '+(matches.length===1?text('receita encontrada','recipe found'):text('receitas encontradas','recipes found')))+(matches.length?grid(matches.slice((page-1)*24,page*24).map(recipe=>card(recipe.name,`<div class="tags">${tag(recipe.category)}</div>`,'explore.html?recipe='+recipe.id+'&fromProfession='+professionId+'&fromTier='+tierId))):`<div class="empty-state">${text('Nenhuma receita corresponde aos filtros.','No recipes match these filters.')}</div>`)+pagination(page,pages);
      results.querySelectorAll('[data-page]').forEach(button=>button.addEventListener('click',()=>{page=Number(button.dataset.page);display();results.scrollIntoView({block:'start'});}));
    }
    form.addEventListener('submit',event=>event.preventDefault());form.addEventListener('input',()=>{page=1;display();});form.addEventListener('reset',()=>{page=1;setTimeout(display,0);});display();media('media/profession/'+professionId,version);
  }
  async function recipeView(id,version){
    const data=await api('recipe/'+id);if(version!==generation)return;
    title.textContent=data.name;intro.textContent=data.description||'';
    back.href=numeric('fromProfession')&&numeric('fromTier')?'explore.html?profession='+numeric('fromProfession')+'&tier='+numeric('fromTier'):'explore.html?professions=1';back.textContent='← '+text('Receitas','Recipes');
    const itemLink=item=>'explore.html?item='+item.id+'&fromRecipe='+id+recipeContext();
    const quantity=data.crafted_quantity;
    const produced=quantity?.value!=null?String(quantity.value):quantity?.minimum!=null&&quantity?.maximum!=null?quantity.minimum+'–'+quantity.maximum:null;
    let html=produced?`<div class="tags">${tag(text('Quantidade produzida: ','Crafted quantity: ')+produced)}</div>`:'';
    const outputs=ExplorerData.recipeOutputs(data);
    html+=section(text('Itens produzidos','Crafted items'),outputs.length?grid(outputs.map(({item,faction})=>card(item.name,`${faction?`<div class="tags">${tag(factionName(faction))}</div>`:''}${description(text('Ver atributos do item','View item stats'))}`,itemLink(item)))):description(text('A API não informou um item produzido para esta receita.','The API did not report a crafted item for this recipe.')));
    html+=section(text('Materiais necessários','Required materials'),data.reagents?.length?grid(data.reagents.filter(r=>r.reagent?.id).map(r=>card(r.reagent.name,description(text('Quantidade: ','Quantity: ')+r.quantity),itemLink(r.reagent)))):description(text('Nenhum material informado.','No materials reported.')));
    if(data.modified_crafting_slots?.length)html+=description(text('Esta receita possui espaços para reagentes opcionais. Os detalhes desses espaços ainda não estão disponíveis no explorador.','This recipe has optional reagent slots. Details of these slots are not yet available in the explorer.'));
    output.innerHTML=html;media('media/recipe/'+id,version);
  }

  const transmogContext = () => ['fromSet','fromItem','fromEncounter','fromRecipe','fromProfession','fromTier'].filter(key=>numeric(key)).map(key=>'&'+key+'='+numeric(key)).join('');
  async function transmogView(version){
    const data=await api('item-appearance/set/index');if(version!==generation)return;
    title.textContent=text('Aparências e transmog','Appearances and transmog');intro.textContent=text('Explore conjuntos, suas peças e os itens que compartilham cada aparência.','Explore sets, their pieces and the items sharing each appearance.');
    const sets=(data.appearance_sets||[]).map(s=>({...s,name:s.name||s.set_name||text('Conjunto','Set')})).sort((a,b)=>a.name.localeCompare(b.name,locale.replace('_','-')));
    output.innerHTML=`<form class="catalogue-filters" id="appearance-set-filters" role="search"><label>${text('Buscar conjunto','Search sets')}<input type="search" name="query" maxlength="120" autocomplete="off" placeholder="${text('Nome do conjunto…','Set name…')}"></label><button type="reset" class="back-btn">${text('Limpar','Reset')}</button></form><div id="appearance-set-results" aria-live="polite"></div>`;
    const form=document.getElementById('appearance-set-filters'),results=document.getElementById('appearance-set-results');let page=1;
    function display(){
      if(version!==generation)return;
      const matches=ExplorerData.filterAppearanceSets(sets,form.elements.query.value);const pages=Math.ceil(matches.length/24);page=Math.max(1,Math.min(page,pages||1));
      results.innerHTML=description(matches.length.toLocaleString(locale.replace('_','-'))+' '+(matches.length===1?text('conjunto encontrado','set found'):text('conjuntos encontrados','sets found')))+(matches.length?grid(matches.slice((page-1)*24,page*24).map(set=>card(set.name,description(text('Ver peças do conjunto','View set pieces')),'explore.html?appearanceSet='+set.id))):`<div class="empty-state">${text('Nenhum conjunto corresponde à busca.','No sets match your search.')}</div>`)+pagination(page,pages);
      results.querySelectorAll('[data-page]').forEach(button=>button.addEventListener('click',()=>{page=Number(button.dataset.page);display();results.scrollIntoView({block:'start'});}));
    }
    form.addEventListener('submit',event=>event.preventDefault());form.addEventListener('input',()=>{page=1;display();});form.addEventListener('reset',()=>{page=1;setTimeout(display,0);});display();
  }
  function appearanceName(data){return data.items?.[0]?.name||data.slot?.name||text('Aparência','Appearance');}
  async function appearanceSetView(id,version){
    const data=await api('item-appearance/set/'+id);if(version!==generation)return;
    title.textContent=data.set_name||data.name||text('Conjunto','Set');intro.textContent=text('Peças e variantes visuais deste conjunto. Abra uma peça para ver os itens correspondentes.','Pieces and visual variants of this set. Open a piece to see its matching items.');back.href='explore.html?transmog=1';back.textContent='← '+text('Conjuntos','Sets');
    const appearances=[...new Map((data.appearances||[]).map(a=>[a.id,a])).values()];let page=1;
    output.innerHTML=`<div id="appearance-pieces" aria-live="polite"></div>`;
    const container=document.getElementById('appearance-pieces');let pageVersion=0;let mediaObserver=null;
    async function display(){
      const request=++pageVersion;if(mediaObserver)mediaObserver.disconnect();
      const slice=appearances.slice((page-1)*24,page*24);const results=new Array(slice.length);let next=0;
      container.innerHTML=description(text('Carregando peças…','Loading pieces…'));container.setAttribute('aria-busy','true');
      await Promise.all(Array.from({length:Math.min(4,slice.length)},async()=>{while(next<slice.length){if(version!==generation||request!==pageVersion)return;const index=next++;try{results[index]=await api('item-appearance/'+slice[index].id);}catch{results[index]={id:slice[index].id,unavailable:true};}}}));
      if(version!==generation||request!==pageVersion)return;
      container.innerHTML=description(appearances.length+' '+(appearances.length===1?text('peça','piece'):text('peças','pieces')))+(results.length?grid(results.map(appearance=>card(appearance.unavailable?text('Peça indisponível','Piece unavailable'):appearanceName(appearance),`${appearance.slot?`<div class="tags">${tag(appearance.slot.name)}${appearance.item_subclass?tag(appearance.item_subclass.name):''}</div>`:''}${appearance.media?.id?`<div class="appearance-icon" data-appearance-media="${appearance.media.id}"></div>`:''}`,'explore.html?appearance='+appearance.id+'&fromSet='+id))):description(text('Nenhuma peça informada.','No pieces reported.')))+pagination(page,Math.ceil(appearances.length/24));
      container.setAttribute('aria-busy','false');
      if('IntersectionObserver' in window){mediaObserver=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){mediaObserver.unobserve(entry.target);optionalImage('media/item/'+entry.target.dataset.appearanceMedia,entry.target,version);}}, {rootMargin:'100px'});container.querySelectorAll('[data-appearance-media]').forEach(element=>mediaObserver.observe(element));}
      container.querySelectorAll('[data-page]').forEach(button=>button.addEventListener('click',()=>{page=Number(button.dataset.page);display();container.scrollIntoView({block:'start'});}));
    }
    await display();
  }
  async function appearanceView(id,version){
    const data=await api('item-appearance/'+id);if(version!==generation)return;
    title.textContent=appearanceName(data);intro.textContent=text('Itens que compartilham esta aparência. As regras de transmog e de desbloqueio dependem do jogo.','Items sharing this appearance. Transmog and unlock rules depend on the game.');
    back.href=numeric('fromSet')?'explore.html?appearanceSet='+numeric('fromSet'):numeric('fromItem')?'explore.html?item='+numeric('fromItem')+(numeric('fromEncounter')?'&fromEncounter='+numeric('fromEncounter'):'')+(numeric('fromRecipe')?'&fromRecipe='+numeric('fromRecipe')+recipeContext():''):'explore.html?transmog=1';back.textContent='← '+(numeric('fromSet')?text('Conjunto','Set'):numeric('fromItem')?text('Item','Item'):text('Conjuntos','Sets'));
    output.innerHTML=`<div class="tags">${[data.slot?.name,data.item_class?.name,data.item_subclass?.name].filter(Boolean).map(tag).join('')}</div>`+section(text('Itens com esta aparência','Items with this appearance'),grid((data.items||[]).map(item=>card(item.name,description(text('Ver atributos do item','View item stats')),'explore.html?item='+item.id+'&fromAppearance='+id+transmogContext()))));
    if(data.media?.id)media('media/item/'+data.media.id,version);
  }

  const housingTypes = () => ({
    decor:{endpoint:'decor',field:'decor_items',route:'decor',name:text('Decoração','Decor')},
    fixtures:{endpoint:'fixture',field:'fixtures',route:'fixture',name:text('Estruturas','Fixtures')},
    hooks:{endpoint:'fixture-hook',field:'fixture_hooks',route:'fixtureHook',name:text('Pontos de encaixe','Fixture hooks')},
    rooms:{endpoint:'room',field:'rooms',route:'room',name:text('Ambientes','Rooms')}
  });
  const housingLinks = active => `<nav class="housing-navigation" aria-label="${text('Catálogos de casas','Housing catalogues')}">${Object.entries(housingTypes()).map(([key,type])=>`<a class="back-btn" href="explore.html?housing=${key}" ${active===key?'aria-current="page"':''}>${escape(type.name)}</a>`).join('')}</nav>`;
  async function housingView(version){
    const kind=Object.hasOwn(housingTypes(),params.get('housing'))?params.get('housing'):'decor';
    const type=housingTypes()[kind];const data=await api(type.endpoint+'/index');if(version!==generation)return;
    title.textContent=text('Casas e decoração','Housing and decor');intro.textContent=text('Explore objetos, estruturas e ambientes para casas de Azeroth.','Explore objects, fixtures and rooms for homes in Azeroth.');
    const entries=(data[type.field]||[]).map(entry=>({...entry,name:entry.name||text('Entrada sem nome','Unnamed entry')})).sort((a,b)=>a.name.localeCompare(b.name,locale.replace('_','-')));
    output.innerHTML=housingLinks(kind)+`<form class="catalogue-filters" id="housing-filters" role="search"><label>${text('Buscar em ','Search in ')+escape(type.name)}<input type="search" name="query" maxlength="120" autocomplete="off" placeholder="${text('Nome…','Name…')}"></label><button type="reset" class="back-btn">${text('Limpar','Reset')}</button></form><div id="housing-results" aria-live="polite"></div>`;
    const form=document.getElementById('housing-filters'),results=document.getElementById('housing-results');let page=1;
    function display(){
      if(version!==generation)return;
      const matches=ExplorerData.filterAppearanceSets(entries,form.elements.query.value);const pages=Math.ceil(matches.length/24);page=Math.max(1,Math.min(page,pages||1));
      results.innerHTML=description(matches.length.toLocaleString(locale.replace('_','-'))+' '+(matches.length===1?text('resultado','result'):text('resultados','results')))+(matches.length?grid(matches.slice((page-1)*24,page*24).map(entry=>card(entry.name,description(type.name),'explore.html?'+type.route+'='+entry.id))):`<div class="empty-state">${text('Nenhum resultado para esta busca.','No results for this search.')}</div>`)+pagination(page,pages);
      results.querySelectorAll('[data-page]').forEach(button=>button.addEventListener('click',()=>{page=Number(button.dataset.page);display();results.scrollIntoView({block:'start'});}));
    }
    form.addEventListener('submit',event=>event.preventDefault());form.addEventListener('input',()=>{page=1;display();});form.addEventListener('reset',()=>{page=1;setTimeout(display,0);});display();
  }
  async function decorView(id,version){
    const data=await api('decor/'+id);if(version!==generation)return;
    title.textContent=data.name;intro.textContent=text('Objeto de decoração e itens associados.','Decor object and its associated items.');back.href='explore.html?housing=decor';back.textContent='← '+text('Decoração','Decor');
    const items=(Array.isArray(data.items)?data.items:[data.items]).filter(item=>item?.id);
    let html=housingLinks('decor')+section(text('Itens associados','Associated items'),items.length?grid(items.map(item=>card(item.name,description(text('Ver item','View item')),'explore.html?item='+item.id+'&fromDecor='+id))):description(text('Nenhum item associado informado.','No associated items reported.')));
    if(data.dye_slots?.length)html+=section(text('Espaços de cor','Dye slots'),grid(data.dye_slots.map((slot,index)=>card(text('Espaço ','Slot ')+(index+1),description(locale==='pt_BR'?({Metal:'Metal',General:'Geral'}[slot.dye_color_category]||slot.dye_color_category):slot.dye_color_category)))));
    output.innerHTML=html;
    if(items[0])media('media/item/'+items[0].id,version);
  }
  async function fixtureView(id,version){
    const data=await api('fixture/'+id);if(version!==generation)return;
    title.textContent=data.name;intro.textContent=text('Estrutura e seus pontos de encaixe.','Fixture and its attachment points.');back.href='explore.html?housing=fixtures';back.textContent='← '+text('Estruturas','Fixtures');
    output.innerHTML=housingLinks('fixtures')+section(text('Pontos de encaixe','Fixture hooks'),data.hooks?.length?grid(data.hooks.map(hook=>card(hook.name,description(text('Ver ligação com a estrutura','View fixture connection')),'explore.html?fixtureHook='+hook.id))):description(text('Nenhum ponto de encaixe informado.','No fixture hooks reported.')));
  }
  async function fixtureHookView(id,version){
    const data=await api('fixture-hook/'+id);if(version!==generation)return;
    title.textContent=data.type_name||data.name||text('Ponto de encaixe','Fixture hook');intro.textContent=text('Ligação entre um ponto de encaixe e sua estrutura.','Connection between an attachment point and its parent fixture.');back.href=data.parent_fixture?'explore.html?fixture='+data.parent_fixture.id:'explore.html?housing=hooks';back.textContent='← '+(data.parent_fixture?.name||text('Pontos de encaixe','Fixture hooks'));
    output.innerHTML=housingLinks('hooks')+section(text('Estrutura associada','Parent fixture'),data.parent_fixture?card(data.parent_fixture.name,description(text('Explorar estrutura','Explore fixture')),'explore.html?fixture='+data.parent_fixture.id):description(text('Nenhuma estrutura associada informada.','No parent fixture reported.')));
  }
  async function roomView(id,version){
    const data=await api('room/'+id);if(version!==generation)return;
    title.textContent=data.name;intro.textContent=text('Ambiente do catálogo de casas.','Room from the housing catalogue.');back.href='explore.html?housing=rooms';back.textContent='← '+text('Ambientes','Rooms');
    output.innerHTML=housingLinks('rooms')+description(text('Explore outros ambientes e objetos para a sua casa.','Explore other rooms and objects for your home.'))+grid([card(text('Outros ambientes','More rooms'),'','explore.html?housing=rooms'),card(text('Decoração','Decor'),'','explore.html?housing=decor')]);
  }

  function achievementList(target,entries,version,href,label){
    const values=[...new Map(entries.filter(e=>e?.id).map(e=>[e.id,{...e,name:e.name||text('Sem nome','Unnamed')}])).values()].sort((a,b)=>a.name.localeCompare(b.name,locale.replace('_','-')));
    target.innerHTML=`<form class="catalogue-filters" role="search"><label>${escape(label)}<input type="search" name="query" autocomplete="off" maxlength="120" placeholder="${text('Buscar por nome…','Search by name…')}"></label><button type="reset" class="back-btn">${text('Limpar','Reset')}</button></form><div class="achievement-results" aria-live="polite"></div>`;
    const form=target.querySelector('form'),results=target.querySelector('.achievement-results');let page=1;
    function display(){
      if(version!==generation)return;
      const matches=ExplorerData.filterAppearanceSets(values,form.elements.query.value);const pages=Math.ceil(matches.length/24);page=Math.max(1,Math.min(page,pages||1));
      results.innerHTML=description(matches.length.toLocaleString(locale.replace('_','-'))+' '+(matches.length===1?text('resultado','result'):text('resultados','results')))+(matches.length?grid(matches.slice((page-1)*24,page*24).map(entry=>card(entry.name,'',href(entry)))):`<div class="empty-state">${text('Nenhum resultado para esta busca.','No results match this search.')}</div>`)+pagination(page,pages);
      results.querySelectorAll('[data-page]').forEach(button=>button.addEventListener('click',()=>{page=Number(button.dataset.page);display();results.scrollIntoView({block:'start'});}));
    }
    form.addEventListener('submit',event=>event.preventDefault());form.addEventListener('input',()=>{page=1;display();});form.addEventListener('reset',()=>{page=1;setTimeout(display,0);});display();
  }
  async function achievementsView(version){
    const all=params.get('achievements')==='all';const mode=params.get('categoryMode')||'roots';
    const data=await api(all?'achievement/index':'achievement-category/index');if(version!==generation)return;
    title.textContent=text('Conquistas','Achievements');intro.textContent=text('Explore categorias, requisitos, séries de conquistas e recompensas.','Explore categories, criteria, achievement series and rewards.');
    const entries=all?data.achievements:mode==='guild'?data.guild_categories:mode==='all'?data.categories:data.root_categories;
    output.innerHTML=`<nav class="housing-navigation" aria-label="${text('Catálogos de conquistas','Achievement catalogues')}"><a class="back-btn" href="explore.html?achievements=1" ${!all&&mode==='roots'?'aria-current="page"':''}>${text('Categorias principais','Main categories')}</a><a class="back-btn" href="explore.html?achievements=1&amp;categoryMode=all" ${!all&&mode==='all'?'aria-current="page"':''}>${text('Todas as categorias','All categories')}</a><a class="back-btn" href="explore.html?achievements=1&amp;categoryMode=guild" ${!all&&mode==='guild'?'aria-current="page"':''}>${text('Guildas','Guilds')}</a><a class="back-btn" href="explore.html?achievements=all" ${all?'aria-current="page"':''}>${text('Todas as conquistas','All achievements')}</a></nav><div id="achievement-catalogue"></div>`;
    achievementList(document.getElementById('achievement-catalogue'),entries||[],version,entry=>'explore.html?'+(all?'achievement':'achievementCategory')+'='+entry.id,text('Buscar','Search'));
  }
  async function achievementCategoryView(id,version){
    const data=await api('achievement-category/'+id);if(version!==generation)return;
    title.textContent=data.name;intro.textContent=data.is_guild_category?text('Conquistas de guilda.','Guild achievements.'):text('Conquistas e subcategorias desta área.','Achievements and subcategories in this area.');back.href=numeric('parentCategory')?'explore.html?achievementCategory='+numeric('parentCategory'):'explore.html?achievements=1';back.textContent='← '+text('Categorias','Categories');
    let html=data.subcategories?.length?section(text('Subcategorias','Subcategories'),grid(data.subcategories.map(category=>card(category.name,'','explore.html?achievementCategory='+category.id+'&parentCategory='+id)))):'';
    html+=section(text('Conquistas','Achievements'),'<div id="category-achievements"></div>');output.innerHTML=html;
    achievementList(document.getElementById('category-achievements'),data.achievements||[],version,achievement=>'explore.html?achievement='+achievement.id+'&fromCategory='+id,text('Buscar conquista','Search achievements'));
  }
  function achievementCriteria(criterion,parentId){
    if(!criterion)return '';
    const heading=criterion.description||criterion.achievement?.name||text('Critério','Criterion');
    const relation=criterion.achievement?.id?`<a class="talent-reference" href="explore.html?achievement=${criterion.achievement.id}&fromAchievement=${parentId}">${escape(criterion.achievement.name||heading)}</a>`:'';
    const children=criterion.child_criteria||[];
    let operator=criterion.operator?.name||'';
    if(criterion.operator?.type==='AND')operator=text('Complete todos','Complete all');
    if(criterion.operator?.type==='OR')operator=text('Complete um','Complete one');
    if(criterion.operator?.type==='COMPLETE_AT_LEAST')operator=text('Complete pelo menos','Complete at least')+(criterion.amount>0?' '+criterion.amount:'');
    const tags=`<div class="tags">${operator?tag(operator):''}${criterion.amount>0&&criterion.operator?.type!=='COMPLETE_AT_LEAST'?tag(text('Quantidade: ','Quantity: ')+criterion.amount):''}${criterion.faction?tag(criterion.faction.name):''}</div>`;
    return `<li class="achievement-criterion"><p>${escape(heading)}</p>${relation}${tags}${children.length?`<ul>${children.map(child=>achievementCriteria(child,parentId)).join('')}</ul>`:''}</li>`;
  }
  async function achievementView(id,version){
    const data=await api('achievement/'+id);if(version!==generation)return;
    title.textContent=data.name;intro.textContent=data.description||'';
    back.href=numeric('fromAchievement')?'explore.html?achievement='+numeric('fromAchievement'):'explore.html?achievementCategory='+(numeric('fromCategory')||data.category?.id||'');
    if(!numeric('fromAchievement')&&!numeric('fromCategory')&&!data.category?.id)back.href='explore.html?achievements=1';
    back.textContent='← '+(numeric('fromAchievement')?text('Conquista de origem','Previous achievement'):data.category?.name||text('Conquistas','Achievements'));
    let html=`<div class="tags">${data.points!=null?tag(data.points+' '+text('pontos','points')):''}${typeof data.is_account_wide==='boolean'?tag(data.is_account_wide?text('Compartilhada na conta','Account-wide'):text('Não compartilhada na conta','Not account-wide')):''}${data.requirements?.faction?tag(data.requirements.faction.name):''}</div>`;
    html+=section(text('Critérios','Criteria'),data.criteria?`<ul class="achievement-criteria">${achievementCriteria(data.criteria,id)}</ul>`:description(text('Nenhum critério informado.','No criteria reported.')));
    const series=[['prerequisite_achievement',text('Conquista anterior','Previous achievement')],['next_achievement',text('Próxima conquista','Next achievement')]].filter(([key])=>data[key]?.id);
    if(series.length)html+=section(text('Série de conquistas','Achievement series'),grid(series.map(([key,label])=>card(data[key].name,description(label),'explore.html?achievement='+data[key].id+'&fromAchievement='+id))));
    if(data.reward_description||data.reward_item)html+=section(text('Recompensa','Reward'),description(data.reward_description||'')+(data.reward_item?card(data.reward_item.name,description(text('Ver item da recompensa','View reward item')),'explore.html?item='+data.reward_item.id+'&fromAchievement='+id):''));
    if(data.category)html+=`<a class="back-btn" href="explore.html?achievementCategory=${data.category.id}">${text('Explorar categoria: ','Explore category: ')+escape(data.category.name)}</a>`;
    output.innerHTML=html;media('media/achievement/'+id,version);
  }

  const worldRegions = () => ({us:text('Américas','Americas'),eu:text('Europa','Europe'),kr:text('Coreia','Korea'),tw:text('Taiwan','Taiwan')});
  const worldRegion = () => Object.hasOwn(worldRegions(),params.get('region'))?params.get('region'):'us';
  const worldLink = (key,value,region=worldRegion()) => 'explore.html?'+key+'='+encodeURIComponent(value)+'&region='+region;
  const realmParameter = () => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(params.get('realm')||'')?params.get('realm'):null;
  const connectedId = data => {
    const match=String(data.connected_realm?.href||'').match(/\/connected-realm\/(\d+)(?:\?|$)/);
    return match?Number(match[1]):null;
  };
  const worldNav = () => `<nav class="housing-navigation" aria-label="${text('Regiões de jogo','Game regions')}">${Object.entries(worldRegions()).map(([code,label])=>`<a class="back-btn" href="${worldLink('realms',1,code)}" ${worldRegion()===code?'aria-current="page"':''}>${escape(label)}</a>`).join('')}<a class="back-btn" href="explore.html?regions=1">${text('Sobre as regiões','About regions')}</a></nav>`;
  function worldRefresh(){
    const toolbar=document.createElement('div');toolbar.className='world-refresh';
    toolbar.innerHTML=`<p class="explorer-note">${text('Dados informados pela Blizzard; atualizações podem levar alguns minutos.','Data reported by Blizzard; updates may take a few minutes.')}</p><button class="back-btn" type="button">${text('Atualizar dados','Refresh data')}</button>`;
    toolbar.querySelector('button').addEventListener('click',()=>{cache.clear();render();});output.appendChild(toolbar);
  }
  async function regionsView(version){
    const regions=await Promise.all(Object.keys(worldRegions()).map(async code=>{
      try {const index=await api('region/index',{region:code});const link=index.regions?.[0]?.href||index.regions?.[0]?.key?.href;const id=String(link||'').match(/\/region\/(\d+)/)?.[1];if(!id)throw Error('Missing region');return {code,...await api('region/'+id,{region:code})};}
      catch{return {code,name:worldRegions()[code],unavailable:true};}
    }));if(version!==generation)return;
    title.textContent=text('Regiões de jogo','Game regions');intro.textContent=text('Explore as regiões e seus catálogos de reinos.','Explore game regions and their realm catalogues.');
    output.innerHTML=grid(regions.map(region=>region.unavailable?card(region.name,description(text('Informações temporariamente indisponíveis.','Information temporarily unavailable.'))):card(region.name,`<div class="tags">${region.tag?tag(region.tag):''}${region.patch_string?tag(text('Versão: ','Version: ')+region.patch_string):''}</div>`+description(text('Explorar reinos desta região','Explore realms in this region')),worldLink('regionInfo',region.id,region.code))));worldRefresh();
  }
  async function regionInfoView(id,version){
    const data=await api('region/'+id);if(version!==generation)return;
    title.textContent=data.name;intro.textContent=text('Informações e reinos da região.','Region information and realms.');back.href='explore.html?regions=1';back.textContent='← '+text('Regiões','Regions');
    output.innerHTML=worldNav()+`<div class="tags">${data.tag?tag(data.tag):''}${data.patch_string?tag(text('Versão: ','Version: ')+data.patch_string):''}</div>`+card(text('Reinos','Realms'),description(text('Buscar um reino nesta região','Search for a realm in this region')),worldLink('realms',1));worldRefresh();
  }
  async function realmsView(version){
    const data=await api('realm/index');if(version!==generation)return;
    title.textContent=text('Reinos','Realms');intro.textContent=worldRegions()[worldRegion()];
    output.innerHTML=worldNav()+'<div id="realm-catalogue"></div>';
    achievementList(document.getElementById('realm-catalogue'),data.realms||[],version,realm=>worldLink('realm',realm.slug||realm.id),text('Buscar reino','Search realms'));worldRefresh();
  }
  function realmTags(realm){
    const language={ptBR:text('Português (BR)','Portuguese (BR)'),enUS:text('Inglês (US)','English (US)'),esMX:text('Espanhol (MX)','Spanish (MX)'),enGB:text('Inglês (GB)','English (GB)'),frFR:text('Francês','French'),deDE:text('Alemão','German'),ruRU:text('Russo','Russian'),koKR:text('Coreano','Korean'),zhTW:text('Chinês tradicional','Traditional Chinese')};
    return `<div class="tags">${[realm.category,realm.type?.name,realm.locale?(language[realm.locale]||realm.locale):null,realm.timezone].filter(Boolean).map(tag).join('')}</div>`;
  }
  function connectedStatus(data){
    const status={UP:text('Disponível','Up'),DOWN:text('Indisponível','Down')};
    const populations={LOW:text('Baixa','Low'),MEDIUM:text('Média','Medium'),HIGH:text('Alta','High'),FULL:text('Cheia','Full')};
    return `<div class="tags">${data.status?tag(text('Estado: ','Status: ')+(status[data.status.type]||data.status.name)):''}${data.population?tag(text('População: ','Population: ')+(populations[data.population.type]||data.population.name)):''}${typeof data.has_queue==='boolean'?tag(data.has_queue?text('Com fila','Queue reported'):text('Sem fila informada','No queue reported')):''}</div>`;
  }
  async function realmView(slug,version){
    const data=await api('realm/'+slug);if(version!==generation)return;
    title.textContent=data.name;intro.textContent=data.region?.name||worldRegions()[worldRegion()];back.href=worldLink('realms',1);back.textContent='← '+text('Reinos','Realms');
    const connected=connectedId(data);
    output.innerHTML=worldNav()+realmTags(data)+(connected?section(text('Reinos conectados','Connected realms'),card(text('Explorar grupo conectado','Explore connected group'),description(text('Estado, população e outros reinos do grupo.','Status, population and other realms in this group.')),worldLink('connectedRealm',connected))):description(text('A API não informou um grupo conectado.','The API did not report a connected group.')));
    if(connected){const box=document.createElement('div');output.appendChild(box);try{const group=await api('connected-realm/'+connected);if(version!==generation)return;box.innerHTML=connectedStatus(group);}catch{box.textContent=text('Estado temporariamente indisponível.','Status temporarily unavailable.');}}
    if(version!==generation)return;
    worldRefresh();
  }
  async function connectedRealmView(id,version){
    const data=await api('connected-realm/'+id);if(version!==generation)return;
    title.textContent=text('Reinos conectados','Connected realms');intro.textContent=(data.realms||[]).map(realm=>realm.name).join(' · ');back.href=worldLink('realms',1);back.textContent='← '+text('Reinos','Realms');
    output.innerHTML=worldNav()+connectedStatus(data)+section(text('Reinos deste grupo','Realms in this group'),grid((data.realms||[]).map(realm=>card(realm.name,realmTags(realm),worldLink('realm',realm.slug||realm.id)))));worldRefresh();
  }

  async function officialMediaView(version){
    const response=await fetch(window.WowConfig.basePath+'/data/media.json');if(!response.ok)throw Error(text('Galeria indisponível.','Gallery unavailable.'));const catalogue=await response.json();if(version!==generation)return;
    title.textContent=text('Mídia oficial','Official media');intro.textContent=text('Vídeos, quadrinhos, contos, livros e áudio publicados pela Blizzard. Cada conteúdo abre em sua página oficial.','Videos, comics, short stories, books and audio published by Blizzard. Each entry opens on its official page.');
    const types={'':text('Todos','All'),video:text('Vídeos e cinemáticas','Videos and cinematics'),comic:text('Quadrinhos','Comics'),'short-story':text('Contos','Short stories'),book:text('Livros','Books'),audio:text('Áudio','Audio')};
    output.innerHTML=`<form class="catalogue-filters" id="media-filters" role="search"><label>${text('Buscar conteúdo','Search media')}<input type="search" name="query" maxlength="120" autocomplete="off" placeholder="${text('Título…','Title…')}"></label><label>${text('Tipo','Type')}<select name="type">${Object.entries(types).map(([key,label])=>`<option value="${key}">${escape(label)}</option>`).join('')}</select></label><button class="back-btn" type="reset">${text('Limpar','Reset')}</button></form><div id="official-media-results" aria-live="polite"></div><p class="explorer-note"><a href="https://worldofwarcraft.blizzard.com/${locale==='pt_BR'?'pt-br':'en-us'}/media" target="_blank" rel="noopener noreferrer">${text('Abrir a galeria oficial da Blizzard','Open the official Blizzard gallery')} ↗</a></p>`;
    const form=document.getElementById('media-filters'),results=document.getElementById('official-media-results');let page=1;
    if(Object.hasOwn(types,params.get('media')))form.elements.type.value=params.get('media');
    function display(){
      if(version!==generation)return;
      const items=ExplorerData.filterMedia(catalogue.items,Object.fromEntries(new FormData(form)));const pages=Math.ceil(items.length/24);page=Math.max(1,Math.min(page,pages||1));
      const cards=items.slice((page-1)*24,page*24).map(item=>{
        const title=item.titles[locale]||item.titles.en_US;
        const language=locale==='pt_BR'&&item.locales.includes('pt-br')?'pt-br':'en-us';
        const url='https://worldofwarcraft.blizzard.com/'+language+item.path;
        return `<a class="official-media-card" href="${escape(url)}" target="_blank" rel="noopener noreferrer">${item.image?`<img src="${escape(item.image)}" alt="" loading="lazy" decoding="async" width="800" height="450" referrerpolicy="no-referrer">`:''}<div><span class="tag">${escape(types[item.type]||item.type)}</span><h3>${escape(title)}</h3><p>${text('Ver no site oficial','View on the official site')} ↗${locale==='pt_BR'&&language==='en-us'?text(' · Página em inglês',' · English page'):''}</p></div></a>`;
      });
      results.innerHTML=description(items.length.toLocaleString(locale.replace('_','-'))+' '+(items.length===1?text('conteúdo encontrado','entry found'):text('conteúdos encontrados','entries found')))+(cards.length?`<div class="official-media-grid">${cards.join('')}</div>`:`<div class="empty-state">${text('Nenhum conteúdo corresponde aos filtros.','No media matches these filters.')}</div>`)+pagination(page,pages);
      results.querySelectorAll('[data-page]').forEach(button=>button.addEventListener('click',()=>{page=Number(button.dataset.page);display();results.scrollIntoView({block:'start'});}));
    }
    form.addEventListener('submit',event=>event.preventDefault());form.addEventListener('input',()=>{page=1;display();});form.addEventListener('reset',()=>{page=1;setTimeout(display,0);});display();
  }

  async function browseView(topic, version) {
    const headings = {
      specializations: text('Especializações', 'Specializations'),
      talents: text('Talentos', 'Talents'),
      'pvp-talents': text('Talentos PvP', 'PvP talents'),
      races: text('Raças por classe', 'Races by class'),
      mounts: text('Montarias de classe', 'Class mounts')
    };
    if (!headings[topic]) throw Error(text('Recurso indisponível', 'Resource unavailable'));
    title.textContent = headings[topic];
    intro.textContent = text('Escolha uma classe para explorar suas relações.', 'Choose a class to explore its connections.');
    const data = await api('playable-class/index');
    if (version !== generation) return;
    const target = topic === 'races' ? 'races' : topic === 'mounts' ? 'mounts' : 'specializations';
    output.innerHTML = grid(data.classes.map(c => card(c.name, description(headings[topic]), 'explore.html?class=' + c.id + '#' + target)));
  }
  async function render() {
    const version=++generation;
    document.getElementById('main-content').classList.remove('encounter-page');
    const art=document.getElementById('explorer-art');art.hidden=true;art.innerHTML='';
    const meta=document.getElementById('explorer-meta');meta.hidden=true;meta.innerHTML='';
    WowTooltip.configure({locale,load:api});
    document.documentElement.lang=locale==='pt_BR'?'pt-BR':'en';
    document.querySelector('[data-nav="pets"]').textContent=text('Mascotes','Battle pets');
    document.querySelector('[data-nav="mounts"]').textContent=text('Montarias','Mounts');
    document.querySelector('[data-nav="professions"]').textContent=text('Profissões','Professions');
    document.querySelector('[data-nav="transmog"]').textContent='Transmog';
    document.querySelector('[data-nav="housing"]').textContent=text('Casas','Housing');
    document.querySelector('[data-nav="achievements"]').textContent=text('Conquistas','Achievements');
    document.querySelector('[data-nav="realms"]').textContent=text('Reinos','Realms');
    document.querySelector('[data-nav="media"]').textContent=text('Mídia','Media');
    document.querySelectorAll('.site-header nav a').forEach(link=>link.removeAttribute('aria-current'));
    const nav=params.has('media')?'media':(['regions','regionInfo','realms','realm','connectedRealm'].some(k=>params.has(k)))?'realms':(['achievements','achievementCategory','achievement','fromAchievement'].some(k=>params.has(k)))?'achievements':(['housing','decor','fixture','fixtureHook','room','fromDecor'].some(k=>params.has(k)))?'housing':(['transmog','appearanceSet','appearance','fromAppearance'].some(k=>params.has(k)))?'transmog':(['professions','profession','recipe','fromRecipe'].some(k=>params.has(k)))?'professions':(params.has('mounts')||params.has('mount'))?'mounts':(['journal','expansion','instance','encounter','item'].some(k=>params.has(k))?'journal':'classes');
    document.querySelector('[data-nav="'+nav+'"]')?.setAttribute('aria-current','page');
    for(const [id,lang] of [['lang-en','en_US'],['lang-pt','pt_BR']])document.getElementById(id).classList.toggle('active',locale===lang);
    output.className='loading';output.textContent=text('Carregando…','Loading…');output.setAttribute('aria-busy','true');icon.hidden=true;
    try {
      if(params.has('media'))await officialMediaView(version);
      else if(params.get('regions')==='1')await regionsView(version);
      else if(numeric('regionInfo'))await regionInfoView(numeric('regionInfo'),version);
      else if(params.get('realms')==='1')await realmsView(version);
      else if(realmParameter())await realmView(realmParameter(),version);
      else if(numeric('connectedRealm'))await connectedRealmView(numeric('connectedRealm'),version);
      else if(params.has('achievements'))await achievementsView(version);
      else if(numeric('achievementCategory'))await achievementCategoryView(numeric('achievementCategory'),version);
      else if(numeric('achievement'))await achievementView(numeric('achievement'),version);
      else if(params.has('housing'))await housingView(version);
      else if(numeric('decor'))await decorView(numeric('decor'),version);
      else if(numeric('fixture'))await fixtureView(numeric('fixture'),version);
      else if(numeric('fixtureHook'))await fixtureHookView(numeric('fixtureHook'),version);
      else if(numeric('room'))await roomView(numeric('room'),version);
      else if(params.get('transmog')==='1')await transmogView(version);
      else if(numeric('appearanceSet'))await appearanceSetView(numeric('appearanceSet'),version);
      else if(numeric('appearance'))await appearanceView(numeric('appearance'),version);
      else if(params.get('professions')==='1')await professionsView(version);
      else if(numeric('recipe'))await recipeView(numeric('recipe'),version);
      else if(numeric('profession')&&numeric('tier'))await skillTierView(numeric('profession'),numeric('tier'),version);
      else if(numeric('profession'))await professionView(numeric('profession'),version);
      else if(params.get('mounts')==='1')await mountCatalogueView(version);
      else if(numeric('mount'))await mountView(numeric('mount'),version);
      else if(params.get('journal')==='1')await journalView(version);
      else if(numeric('expansion'))await expansionView(numeric('expansion'),version);
      else if(numeric('instance'))await instanceView(numeric('instance'),version);
      else if(numeric('encounter'))await encounterView(numeric('encounter'),version);
      else if(numeric('item'))await itemView(numeric('item'),version);
      else if(params.has('browse'))await browseView(params.get('browse'),version);
      else if(numeric('class'))await classView(numeric('class'),version);
      else if(numeric('spec'))await specView(numeric('spec'),version);
      else if(numeric('race'))await raceView(numeric('race'),version);
      else if(numeric('family'))await familyView(numeric('family'),version,numeric('page')||1);
      else if(params.get('hunters')==='1')await huntersView(version);
      else throw Error(text('Escolha uma classe para explorar.','Choose a class to explore.'));
      if(version===generation){output.className='';document.title=title.textContent+' — Azeroth Explorer';
        if(location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView({block:'start'});}
    }catch(error){if(version===generation){output.className='error';output.textContent=error.message;}}
    finally{if(version===generation)output.setAttribute('aria-busy','false');}
  }
  for(const [id,lang] of [['lang-en','en_US'],['lang-pt','pt_BR']])document.getElementById(id).addEventListener('click',()=>{locale=lang;sessionStorage.setItem('wow-language',lang);render();});
  render();
})();

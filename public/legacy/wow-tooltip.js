(() => {
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const box=document.createElement('div');box.id='wow-floating-tooltip';box.className='wow-tooltip';box.setAttribute('role','tooltip');box.hidden=true;document.body.appendChild(box);
  let owner=null,sequence=0,hideTimer=null,showTimer=null,config={locale:'en_US',load:null};
  const bindings=new WeakMap();
  const t=(pt,en)=>config.locale==='pt_BR'?pt:en;
  function position(){
    if(!owner?.isConnected){hide();return;}
    const rect=owner.getBoundingClientRect();const width=box.offsetWidth,height=box.offsetHeight;
    let left=rect.right+12,top=rect.top;
    if(left+width>innerWidth-10)left=rect.left-width-12;
    left=Math.max(10,Math.min(left,innerWidth-width-10));top=Math.max(10,Math.min(top,innerHeight-height-10));
    box.style.left=left+'px';box.style.top=top+'px';
  }
  function html(model){
    const color=model.kind==='item'?ExplorerData.itemQualityColor(model.quality):'#fff1bc';
    return `<div class="wow-tooltip-title" style="color:${color}">${esc(model.title)}</div>${(model.sections||[]).map((section,index)=>`<section class="wow-tooltip-section">${index||model.sections.length>1?`<strong>${esc(section.name)}</strong>`:''}<div class="wow-tooltip-meta">${section.rank?`<span>${t('Grau','Rank')} ${section.rank}</span>`:''}${(section.meta||[]).map(text=>`<span>${esc(text)}</span>`).join('')}</div><p class="wow-tooltip-gold">${esc(section.description)}</p></section>`).join('')}${(model.lines||[]).map(line=>`<div class="wow-tooltip-line wow-tooltip-${esc(line.tone||'normal')}"><span>${esc(line.text)}</span>${line.right?`<span class="wow-tooltip-right">${esc(line.right)}</span>`:''}${line.coins?`<span class="wow-tooltip-coins">${line.coins.map(coin=>`<span>${coin.amount}<i class="wow-coin ${coin.type}" aria-label="${esc(coin.name)}" title="${esc(coin.name)}"></i></span>`).join('')}</span>`:''}</div>`).join('')}`;
  }
  async function show(element,load){
    clearTimeout(hideTimer);clearTimeout(showTimer);
    if(owner&&owner!==element)owner.removeAttribute('aria-describedby');
    owner=element;const version=++sequence;
    owner.setAttribute('aria-describedby',box.id);box.hidden=false;box.innerHTML=`<span class="wow-tooltip-muted">${t('Carregando…','Loading…')}</span>`;position();
    try{const model=await load();if(version!==sequence||owner!==element||!element.isConnected)return;box.innerHTML=html(model);position();}
    catch{if(version===sequence){box.innerHTML=`<span class="wow-tooltip-muted">${t('Informações indisponíveis.','Information unavailable.')}</span>`;position();}}
  }
  function hide(){clearTimeout(hideTimer);clearTimeout(showTimer);sequence++;owner?.removeAttribute('aria-describedby');owner=null;box.hidden=true;}
  function bind(element,load){
    if(bindings.has(element))return;bindings.set(element,load);let longPress=null,suppressUntil=0;
    element.addEventListener('pointerenter',event=>{if(event.pointerType==='touch')return;clearTimeout(hideTimer);clearTimeout(showTimer);showTimer=setTimeout(()=>show(element,load),90);});
    element.addEventListener('pointerleave',()=>{clearTimeout(showTimer);hideTimer=setTimeout(hide,180);});
    element.addEventListener('focus',()=>show(element,load));element.addEventListener('blur',()=>{hideTimer=setTimeout(hide,180);});
    element.addEventListener('pointerdown',event=>{if(event.pointerType==='touch')longPress=setTimeout(()=>{suppressUntil=Date.now()+800;show(element,load);},450);});
    for(const type of ['pointerup','pointercancel','pointerleave'])element.addEventListener(type,()=>clearTimeout(longPress));
    element.addEventListener('click',event=>{if(Date.now()<suppressUntil){event.preventDefault();event.stopPropagation();}},true);
    element.addEventListener('contextmenu',event=>{if(Date.now()<suppressUntil)event.preventDefault();});
  }
  const iconQueue=[];let iconRequests=0;
  const waitingIcons=new Set();
  const iconObserver=new IntersectionObserver(entries=>{
    for(const entry of entries)if(entry.isIntersecting){iconObserver.unobserve(entry.target);waitingIcons.delete(entry.target);iconQueue.push(entry.target);}
    loadIcons();
  },{rootMargin:'150px'});
  function loadIcons(){
    while(iconRequests<3&&iconQueue.length){
      const element=iconQueue.shift();if(!element.isConnected)continue;
      const load=config.load;iconRequests++;
      load('media/item/'+element.dataset.itemId).then(data=>{
        if(!element.isConnected)return;const url=data.assets?.find(asset=>asset.key==='icon')?.value;
        if(url?.startsWith('https://'))element.querySelector('.wow-item-icon').innerHTML=`<img src="${esc(url)}" alt="" width="48" height="48" loading="lazy">`;
      }).catch(()=>{}).finally(()=>{iconRequests--;loadIcons();});
    }
  }
  function itemIcon(element,id){
    element.classList.add('wow-item-link');element.dataset.itemId=id;
    const copy=document.createElement('span');copy.className='wow-item-copy';while(element.firstChild)copy.appendChild(element.firstChild);
    const icon=document.createElement('span');icon.className='wow-item-icon';icon.setAttribute('aria-hidden','true');
    element.append(icon,copy);waitingIcons.add(element);iconObserver.observe(element);
  }
  function decorate(){
    for(const element of waitingIcons)if(!element.isConnected){iconObserver.unobserve(element);waitingIcons.delete(element);}
    document.querySelectorAll('a[href], [data-spell-tooltip]').forEach(element=>{
      if(bindings.has(element)||!config.load)return;
      let kind,id;
      if(element.dataset.spellTooltip){kind='spell';id=element.dataset.spellTooltip;}
      else{try{const url=new URL(element.href,location.href);if(url.origin!==location.origin)return;kind='item';id=url.searchParams.get('item');}catch{return;}}
      if(!/^[1-9]\d{0,8}$/.test(id||''))return;
      bind(element,async()=>{
        const data=await config.load(kind+'/'+id);
        if(kind!=='item')return ExplorerData.spellTooltip(data);
        const model=ExplorerData.itemTooltip(data,config.locale);
        const color=ExplorerData.itemQualityColor(model.quality);element.querySelector('.wow-item-icon')?.style.setProperty('border-color',color);
        element.querySelector('h3,.item-link-name')?.style.setProperty('color',color);
        return model;
      });
      if(kind==='item')itemIcon(element,id);
    });
  }
  new MutationObserver(()=>{if(owner&&!owner.isConnected)hide();decorate();}).observe(document.getElementById('output'),{childList:true,subtree:true});
  box.addEventListener('pointerenter',()=>clearTimeout(hideTimer));box.addEventListener('pointerleave',()=>{hideTimer=setTimeout(hide,180);});
  document.addEventListener('keydown',event=>{if(event.key==='Escape')hide();});
  document.addEventListener('pointerdown',event=>{if(owner&&!box.contains(event.target)&&!owner.contains(event.target))hide();},true);
  window.addEventListener('resize',()=>{if(owner)position();});window.addEventListener('scroll',()=>{if(owner)position();},true);
  window.WowTooltip={bind,hide,render:html,configure(options){hide();config=options;decorate();}};
})();

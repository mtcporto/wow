(() => {
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let cataloguePromise;
  const iconCatalogue=()=>cataloguePromise||(cataloguePromise=fetch(window.WowConfig.basePath+'/data/spell-icons.json').then(r=>{if(!r.ok)throw Error('No icon catalogue');return r.json();}).then(data=>data.icons).catch(()=>({})));
  async function mount(target,groups,{locale='en_US',allNodes=[],classId=0,className='',specName=''}={}) {
    const t=(pt,en)=>locale==='pt_BR'?pt:en;
    const options=node=>(node.ranks||[]).flatMap(rank=>(rank.choice_of_tooltips||[rank.tooltip]).filter(Boolean).map(option=>({...option,rank:rank.rank})));
    const nodeName=node=>options(node)[0]?.talent?.name||(node.node_type?.type==='CHOICE'?t('Escolha de talento','Talent choice'):t('Talento sem descrição','Talent without description'));
    const cleaned=group=>({...group,nodes:group.nodes.filter(node=>options(node).length||(node.locked_by||[]).length||(node.unlocks||[]).length)});
    const classGroup=cleaned(groups.find(g=>g.kind==='class')||{name:t('Classe','Class'),nodes:[]});
    const specGroup=cleaned(groups.find(g=>g.kind==='spec')||{name:t('Especialização','Specialization'),nodes:[]});
    const heroes=groups.filter(g=>g.kind==='hero').map(cleaned);
    const names=new Map(allNodes.map(node=>[node.id,nodeName(node)]));
    const colors={1:'#c79c6e',2:'#f58cba',3:'#abd473',4:'#fff569',5:'#ffffff',6:'#c41e3a',7:'#0070de',8:'#69ccf0',9:'#9482c9',10:'#00ff96',11:'#ff7d0a',12:'#a330c9',13:'#33937f'};
    let heroIndex=null,selected=null,zoom=1,mode='tree',focus='all',showNames=false,icons={};
    target.innerHTML=`<div class="wow-talents" style="--class-accent:${colors[classId]||'#dfb56a'}"><div class="wow-talents-toolbar"><div class="talent-mode"><button class="back-btn" data-mode="tree">${t('Árvore','Tree')}</button><button class="back-btn" data-mode="list">${t('Lista','List')}</button></div><label><input type="checkbox" class="wow-show-names"> ${t('Mostrar nomes','Show names')}</label><label class="wow-focus-label">${t('Visualização','View')} <select class="wow-tree-focus"><option value="all">${t('Todas as árvores','All trees')}</option><option value="class">${esc(className||t('Classe','Class'))}</option><option value="hero">${t('Heroicos','Hero')}</option><option value="spec">${esc(specName||t('Especialização','Specialization'))}</option></select></label><div class="talent-zoom"><button class="back-btn" data-zoom="-1" aria-label="${t('Diminuir zoom','Zoom out')}">−</button><output>100%</output><button class="back-btn" data-zoom="1" aria-label="${t('Aumentar zoom','Zoom in')}">+</button></div><span class="tag">${t('Modo consulta','Inspection mode')}</span></div><p class="explorer-note">${t('Passe o mouse ou use Tab para ver informações. No celular, pressione e segure um talento. Clique para fixar os detalhes abaixo.','Hover or use Tab for information. On mobile, press and hold a talent. Click to pin its details below.')}</p><div class="wow-board-scroll" tabindex="0" aria-label="${t('Árvores de talentos','Talent trees')}"><div class="wow-board-stage"></div></div><div class="talent-list" hidden></div><div class="talent-legend">${t('Círculo: passivo · Quadrado: ativo · Ícone dividido: escolha','Circle: passive · Square: active · Split icon: choice')}</div><details class="wow-pinned-details"><summary>${t('Detalhes do talento selecionado','Selected talent details')}</summary><aside class="talent-inspector" aria-live="polite"></aside></details></div>`;
    const root=target.firstElementChild,stage=root.querySelector('.wow-board-stage'),scroll=root.querySelector('.wow-board-scroll'),list=root.querySelector('.talent-list'),inspector=root.querySelector('.talent-inspector');
    function visibleGroups(){const values=[{...classGroup,key:'class',label:className||classGroup.name},heroes.length?{...(heroIndex===null?{name:t('Heroicos','Hero'),nodes:[]}:heroes[heroIndex]),key:'hero',label:t('Heroicos','Hero')}:{name:t('Heroicos','Hero'),nodes:[],key:'hero',label:t('Heroicos','Hero')},{...specGroup,key:'spec',label:specName||specGroup.name}];return focus==='all'?values:values.filter(g=>g.key===focus);}
    function inspect(node,pin=false){
      selected=node.id;
      const model=ExplorerData.talentTooltip(node,locale);const neighbors=new Set([node.id,...(node.locked_by||[]),...(node.unlocks||[])]);
      root.querySelectorAll('[data-node]').forEach(button=>{button.setAttribute('aria-pressed',String(Number(button.dataset.node)===selected));button.classList.toggle('connected',neighbors.has(Number(button.dataset.node)));});
      root.querySelectorAll('[data-from]').forEach(line=>line.classList.toggle('connected',Number(line.dataset.from)===selected||Number(line.dataset.to)===selected));
      const references=(label,ids)=>ids?.length?`<div class="talent-related"><h4>${label}</h4>${ids.map(id=>groups.some(group=>group.nodes.some(n=>n.id===id))?`<button class="talent-reference" data-reference="${id}">${esc(names.get(id)||t('Outro talento','Another talent'))}</button>`:`<span class="tag">${esc(names.get(id)||t('Outra árvore','Another tree'))}</span>`).join('')}</div>`:'';
      inspector.innerHTML=`<h3>${esc(model.title)}</h3>${model.sections.length?model.sections.map(section=>`<div class="talent-option"><h4>${esc(section.name)} ${section.rank?`<small>${t('Grau','Rank')} ${section.rank}</small>`:''}</h4><p>${esc(section.description)}</p><div class="tags">${section.meta.map(tag=>`<span class="tag">${esc(tag)}</span>`).join('')}</div></div>`).join(''):`<p>${esc(model.lines[0]?.text)}</p>`}${references(t('Conexões anteriores','Previous connections'),node.locked_by)}${references(t('Conexões seguintes','Next connections'),node.unlocks)}`;
      inspector.querySelectorAll('[data-reference]').forEach(button=>button.addEventListener('click',()=>{
        const id=Number(button.dataset.reference);const hero=heroes.findIndex(group=>group.nodes.some(n=>n.id===id));if(hero>=0)heroIndex=hero;
        selected=id;focus='all';render();root.querySelector('.wow-tree-focus').value='all';root.querySelector(`[data-node="${id}"]`)?.scrollIntoView({block:'nearest',inline:'center'});
      }));
      if(pin)root.querySelector('.wow-pinned-details').open=true;
    }
    function nodeButton(node,groupKey){
      const choices=options(node),spells=[...new Set(choices.map(c=>c.spell_tooltip?.spell?.id).filter(Boolean))].slice(0,node.node_type?.type==='CHOICE'?2:1);
      const images=spells.map(id=>icons[id]).filter(Boolean);
      const rank=Math.max(0,...(node.ranks||[]).map(r=>r.rank||0));
      return `<button class="wow-talent-node ${esc((node.node_type?.type||'PASSIVE').toLowerCase())}" data-node="${node.id}" data-tree="${groupKey}" style="left:${node.x}px;top:${node.y}px" aria-label="${esc(nodeName(node))}" aria-pressed="false"><span class="wow-node-images">${images.length?images.map(url=>`<img src="${esc(url)}" alt="" width="36" height="36" loading="lazy" decoding="async">`).join(''):'<span class="wow-node-placeholder" aria-hidden="true">✦</span>'}</span>${rank>1?`<span class="wow-node-rank" aria-hidden="true">${rank}</span>`:''}<span class="wow-node-name">${esc(nodeName(node))}</span></button>`;
    }
    function heroImage(hero){
      const first=[...hero.nodes].sort((a,b)=>(a.display_row||0)-(b.display_row||0)).find(node=>options(node).length);
      const spell=first&&options(first)[0]?.spell_tooltip?.spell?.id;
      return icons[spell]?`<img src="${esc(icons[spell])}" alt="" width="64" height="64">`:'<span aria-hidden="true">✦</span>';
    }
    function heroSelector(){
      if(!heroes.length)return '';
      const chosen=heroIndex!==null;
      return `<div class="wow-hero-picker"><span class="wow-hero-prompt">${chosen?esc(heroes[heroIndex].name):t('Escolha sua árvore heroica','Select hero tree')}</span><button class="wow-hero-toggle ${chosen?'is-chosen':'is-split'}" aria-expanded="false" aria-label="${t('Escolher ou trocar árvore heroica','Select or change hero tree')}">${chosen?heroImage(heroes[heroIndex]):heroes.map(hero=>`<span class="wow-hero-half">${heroImage(hero)}</span>`).join('')}</button><div class="wow-hero-menu" role="group" aria-label="${t('Árvores heroicas','Hero trees')}" hidden>${heroes.map((hero,index)=>`<button class="wow-hero-menu-option" data-hero="${index}" aria-pressed="${index===heroIndex}">${heroImage(hero)}<span>${esc(hero.name)}</span></button>`).join('')}</div></div>`;
    }
    function bindHeroSelector(){
      root.querySelectorAll('.wow-hero-toggle').forEach(button=>button.addEventListener('click',()=>{
        const menu=button.nextElementSibling;menu.hidden=!menu.hidden;button.setAttribute('aria-expanded',String(!menu.hidden));
        if(!menu.hidden)menu.querySelector('[data-hero]')?.focus({preventScroll:true});
      }));
      root.querySelectorAll('.wow-hero-picker').forEach(picker=>{
        picker.addEventListener('keydown',event=>{if(event.key==='Escape'){picker.querySelector('.wow-hero-menu').hidden=true;const button=picker.querySelector('.wow-hero-toggle');button.setAttribute('aria-expanded','false');button.focus({preventScroll:true});event.stopPropagation();}});
        picker.addEventListener('focusout',()=>queueMicrotask(()=>{if(!picker.contains(document.activeElement)){picker.querySelector('.wow-hero-menu').hidden=true;picker.querySelector('.wow-hero-toggle').setAttribute('aria-expanded','false');}}));
      });
      root.querySelectorAll('[data-hero]').forEach(button=>button.addEventListener('click',()=>{
        heroIndex=Number(button.dataset.hero);selected=null;render();
        const surface=mode==='list'?list:stage;surface.querySelector('.wow-hero-toggle')?.focus({preventScroll:true});
      }));
    }
    function render(){
      if(!target.isConnected)return;WowTooltip.hide();
      const visible=visibleGroups(),models=visible.map(group=>({group,graph:ExplorerData.talentGraph(group.nodes,{stepX:showNames?105:42,stepY:showNames?78:48,marginX:25,marginY:30,minWidth:group.key==='hero'?210:240,minHeight:group.key==='hero'?300:180})}));
      const width=models.reduce((sum,value)=>sum+value.graph.width,0)+Math.max(0,models.length-1)*12;
      const height=Math.max(180,...models.map(m=>m.graph.height+(m.group.key==='hero'?124:0)))+64;
      const auto=innerWidth>=1000?Math.max(.78,Math.min(1,scroll.clientWidth/width)):1;
      const scale=auto*zoom;stage.style.width=width*scale+'px';stage.style.height=height*scale+'px';
      root.classList.toggle('show-node-names',showNames);scroll.hidden=mode==='list';list.hidden=mode==='tree';root.querySelector('.talent-zoom').hidden=mode==='list';
      root.querySelectorAll('[data-mode]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.mode===mode)));
      root.querySelector('output').textContent=Math.round(scale*100)+'%';root.querySelector('[data-zoom="-1"]').disabled=zoom<=.7;root.querySelector('[data-zoom="1"]').disabled=zoom>=1.5;
      let offset=0;
      const panes=models.map(({group,graph})=>{
        const byId=new Map(graph.nodes.map(n=>[n.id,n]));
        const lines=graph.edges.map(edge=>{const a=byId.get(edge.from),b=byId.get(edge.to);return `<path data-from="${a.id}" data-to="${b.id}" d="M ${a.x} ${a.y+17} L ${b.x} ${b.y-17}"/>`;}).join('');
        const hero=group.key==='hero';
        const header=hero?`<strong>${esc(group.name)}</strong><small>${group.nodes.length} ${t('talentos','talents')}</small>`:`<strong>${esc(group.label)}</strong><small>${group.nodes.length} ${t('talentos','talents')}</small>`;
        const pane=`<section class="wow-tree-pane ${hero?'wow-hero-pane':''}" style="left:${offset}px;width:${graph.width}px;height:${height}px" aria-label="${esc(group.name)}"><header>${header}</header>${hero?heroSelector():''}<div class="wow-tree-content" style="height:${graph.height}px"><svg viewBox="0 0 ${graph.width} ${graph.height}" aria-hidden="true">${lines}</svg>${hero&&heroIndex===null?'<div class="wow-hero-empty" aria-hidden="true"><span></span><div>'+Array.from({length:12},()=>'<i></i>').join('')+'</div></div>':graph.nodes.map(node=>nodeButton(node,group.key)).join('')}</div></section>`;
        offset+=graph.width+12;return pane;
      }).join('');
      stage.innerHTML=`<div class="wow-board-canvas" style="width:${width}px;height:${height}px;transform:scale(${scale})">${panes}</div>`;
      list.innerHTML=visible.map(group=>`<section><h3>${esc(group.name)}</h3>${group.key==='hero'?heroSelector():''}<div class="wow-talent-list-grid">${group.nodes.map(node=>`<button class="talent-list-node" data-node="${node.id}" aria-pressed="false">${esc(nodeName(node))}</button>`).join('')}</div></section>`).join('');
      const byId=new Map(visible.flatMap(group=>group.nodes).map(node=>[node.id,node]));
      root.querySelectorAll('[data-node]').forEach(button=>{const node=byId.get(Number(button.dataset.node));button.addEventListener('click',()=>inspect(node,true));WowTooltip.bind(button,()=>ExplorerData.talentTooltip(node,locale));});
      bindHeroSelector();
      const choice=byId.get(selected)||visible.flatMap(g=>g.nodes).find(node=>options(node).length)||visible.flatMap(g=>g.nodes)[0];if(choice)inspect(choice);
    }
    root.querySelectorAll('[data-mode]').forEach(button=>button.addEventListener('click',()=>{mode=button.dataset.mode;render();}));
    root.querySelectorAll('[data-zoom]').forEach(button=>button.addEventListener('click',()=>{zoom=Math.max(.7,Math.min(1.5,Math.round((zoom+Number(button.dataset.zoom)*.1)*10)/10));render();}));
    root.querySelector('.wow-show-names').addEventListener('change',event=>{showNames=event.target.checked;render();});
    root.querySelector('.wow-tree-focus').addEventListener('change',event=>{focus=event.target.value;selected=null;render();});
    render();
    icons=await iconCatalogue();if(target.isConnected)render();
  }
  window.TalentTree={mount};
})();

(() => {
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function mount(target,groups,{locale='en_US',allNodes=[]}={}) {
    const t=(pt,en)=>locale==='pt_BR'?pt:en;
    const options=node=>(node.ranks||[]).flatMap(rank=>(rank.choice_of_tooltips||[rank.tooltip]).filter(Boolean).map(option=>({...option,rank:rank.rank})));
    const nodeName=node=>options(node)[0]?.talent?.name||(node.node_type?.type==='CHOICE'?t('Escolha de talento','Talent choice'):t('Talento sem descrição','Talent without description'));
    const names=new Map(allNodes.map(node=>[node.id,nodeName(node)]));
    let groupIndex=0;let selected=null;let zoom=1;let mode='tree';
    target.innerHTML=`<div class="talent-explorer"><div class="talent-group-tabs" role="tablist" aria-label="${t('Árvores de talentos','Talent trees')}">${groups.map((group,index)=>`<button class="back-btn" id="talent-tab-${index}" role="tab" aria-controls="talent-panel" data-group="${index}">${esc(group.name)} <span>${group.nodes.length}</span></button>`).join('')}</div><div class="talent-toolbar"><div class="talent-mode"><button class="back-btn" data-mode="tree">${t('Árvore','Tree')}</button><button class="back-btn" data-mode="list">${t('Lista','List')}</button></div><div class="talent-zoom"><button class="back-btn" data-zoom="-1" aria-label="${t('Diminuir zoom','Zoom out')}">−</button><output>100%</output><button class="back-btn" data-zoom="1" aria-label="${t('Aumentar zoom','Zoom in')}">+</button></div></div><p class="explorer-note">${t('Selecione um talento para ver habilidades e conexões. Arraste a barra horizontal para explorar a árvore.','Select a talent to see abilities and connections. Scroll horizontally to explore the tree.')}</p><div id="talent-panel" role="tabpanel"><div class="talent-scroll" tabindex="0" aria-label="${t('Árvore navegável de talentos','Scrollable talent tree')}"><div class="talent-stage"></div></div><div class="talent-list" hidden></div></div><div class="talent-legend">${t('Círculo: passivo · Quadrado: ativo · Borda dupla: escolha','Circle: passive · Square: active · Double border: choice')}</div><aside class="talent-inspector" aria-live="polite"></aside></div>`;
    const root=target.firstElementChild;const stage=root.querySelector('.talent-stage');const scroll=root.querySelector('.talent-scroll');const list=root.querySelector('.talent-list');const inspector=root.querySelector('.talent-inspector');
    function inspect(node){
      selected=node.id;
      root.querySelectorAll('[data-node]').forEach(button=>button.setAttribute('aria-pressed',String(Number(button.dataset.node)===selected)));
      const neighbors=new Set([selected,...(node.locked_by||[]),...(node.unlocks||[])]);
      stage.querySelectorAll('[data-node]').forEach(button=>button.classList.toggle('connected',neighbors.has(Number(button.dataset.node))));
      stage.querySelectorAll('[data-from]').forEach(line=>line.classList.toggle('connected',Number(line.dataset.from)===selected||Number(line.dataset.to)===selected));
      const choices=options(node);
      const references=(label,ids)=>ids?.length?`<div class="talent-related"><h4>${label}</h4>${ids.map(id=>groups.some(group=>group.nodes.some(n=>n.id===id))?`<button class="talent-reference" data-reference="${id}">${esc(names.get(id)||t('Talento de outra árvore','Talent in another tree'))}</button>`:`<span class="tag">${esc(names.get(id)||t('Talento de outra árvore','Talent in another tree'))}</span>`).join('')}</div>`:'';
      inspector.innerHTML=`<h3>${esc(nodeName(node))}</h3>${choices.length?choices.map(choice=>`<div class="talent-option"><h4>${esc(choice.talent?.name)} <small>${t('Grau','Rank')} ${choice.rank||1}</small></h4><p>${esc(choice.spell_tooltip?.description||t('Descrição indisponível na API.','Description unavailable from the API.'))}</p><div class="tags">${['cast_time','power_cost','range','cooldown'].filter(key=>choice.spell_tooltip?.[key]).map(key=>`<span class="tag">${esc(choice.spell_tooltip[key])}</span>`).join('')}</div></div>`).join(''):`<p>${t('A API retornou a posição deste nó, mas não forneceu as habilidades.','The API returned this node position without its abilities.')}</p>`}${references(t('Conexões anteriores','Previous connections'),node.locked_by)}${references(t('Conexões seguintes','Next connections'),node.unlocks)}`;
      inspector.querySelectorAll('[data-reference]').forEach(button=>button.addEventListener('click',()=>{
        const id=Number(button.dataset.reference);const index=groups.findIndex(group=>group.nodes.some(n=>n.id===id));if(index<0)return;
        if(index!==groupIndex){groupIndex=index;selected=id;render();}else inspect(groups[groupIndex].nodes.find(n=>n.id===id));
        stage.querySelector(`[data-node="${id}"]`)?.scrollIntoView({block:'nearest',inline:'center'});
      }));
    }
    function render(){
      const group=groups[groupIndex];const model=ExplorerData.talentGraph(group.nodes);const byId=new Map(model.nodes.map(node=>[node.id,node]));
      root.querySelectorAll('[data-group]').forEach((button,index)=>{button.setAttribute('aria-selected',String(index===groupIndex));button.tabIndex=index===groupIndex?0:-1;});
      root.querySelector('[role="tabpanel"]').setAttribute('aria-labelledby','talent-tab-'+groupIndex);
      root.querySelectorAll('[data-mode]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.mode===mode)));
      root.querySelector('.talent-zoom').hidden=mode==='list';
      scroll.hidden=mode==='list';list.hidden=mode==='tree';root.querySelector('.talent-legend').hidden=mode==='list';
      root.querySelector('output').textContent=Math.round(zoom*100)+'%';
      root.querySelector('[data-zoom="-1"]').disabled=zoom<=.6;root.querySelector('[data-zoom="1"]').disabled=zoom>=1.4;
      stage.style.width=model.width*zoom+'px';stage.style.height=model.height*zoom+'px';
      const lines=model.edges.map(edge=>{const a=byId.get(edge.from),b=byId.get(edge.to);return `<path data-from="${a.id}" data-to="${b.id}" d="M ${a.x} ${a.y+25} C ${a.x} ${(a.y+b.y)/2}, ${b.x} ${(a.y+b.y)/2}, ${b.x} ${b.y-25}"/>`;}).join('');
      stage.innerHTML=`<div class="talent-canvas" style="width:${model.width}px;height:${model.height}px;transform:scale(${zoom})"><svg viewBox="0 0 ${model.width} ${model.height}" aria-hidden="true">${lines}</svg>${model.nodes.map(node=>`<button class="talent-node ${esc((node.node_type?.type||'PASSIVE').toLowerCase())}" data-node="${node.id}" style="left:${node.x}px;top:${node.y}px" title="${esc(nodeName(node))}" aria-label="${esc(nodeName(node))}" aria-pressed="false"><span>${esc(nodeName(node))}</span></button>`).join('')}</div>`;
      list.innerHTML=group.nodes.map(node=>`<button class="talent-list-node" data-node="${node.id}" aria-pressed="false">${esc(nodeName(node))}</button>`).join('');
      root.querySelectorAll('[data-node]').forEach(button=>button.addEventListener('click',()=>inspect(byId.get(Number(button.dataset.node)))));
      const choice=byId.get(selected)||model.nodes.find(node=>options(node).length)||model.nodes[0];
      if(choice)inspect(choice);else inspector.textContent=t('Nenhum talento informado.','No talents reported.');
    }
    root.querySelectorAll('[data-group]').forEach(button=>{
      button.addEventListener('click',()=>{groupIndex=Number(button.dataset.group);selected=null;scroll.scrollLeft=0;scroll.scrollTop=0;render();});
      button.addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();const count=groups.length;groupIndex=event.key==='Home'?0:event.key==='End'?count-1:(groupIndex+(event.key==='ArrowRight'?1:-1)+count)%count;selected=null;render();root.querySelector(`[data-group="${groupIndex}"]`).focus();});
    });
    root.querySelectorAll('[data-mode]').forEach(button=>button.addEventListener('click',()=>{mode=button.dataset.mode;render();}));
    root.querySelectorAll('[data-zoom]').forEach(button=>button.addEventListener('click',()=>{zoom=Math.max(.6,Math.min(1.4,Math.round((zoom+Number(button.dataset.zoom)*.2)*10)/10));render();}));
    render();
  }
  window.TalentTree={mount};
})();

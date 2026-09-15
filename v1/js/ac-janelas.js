/* Identidade e ordem das caixas de A Casa.
   No telefone a cena ganha a tela. Cartões e botões saem. */
(function(){
  const types={1:['🔎','Investigação','#FF9638'],2:['🧭','Orientações','#45ADFF'],3:['🧩','Pista encontrada','#42DA8B'],4:['❔','Dica da pista','#B18AFF'],5:['🗂️','Dossiê','#DCC9A3'],6:['🤝','Cooperação','#A2DCD5'],7:['☑️','Confirmação de ação','#F2C3AD'],8:['🏆','Resultado da tarefa','#EEC4DC'],9:['⚠️','Atenção / aviso técnico','#FFE14A'],10:['📖','Como jogar','#CAD7E8']};
  function telefone(){
    try { return matchMedia('(max-width:700px)').matches; } catch (e) { return innerWidth <= 700; }
  }
  function decorate(){
    for(const [selector,n] of [['#mosaico-ra-inspect-modal .mosaico-ra-modal-card',2],['#mosaico-ra-prompt .mosaico-ra-prompt-card',2],['#oito',2],['#ra-investigation-modal .ra-inv-wrapper',3],['#pistas',5],['#master',2],['#mestre',2],['#dragonRoomGate',2],['#portao',10],['.partida-pausada',9],['.fragmento-confirmado',3]])document.querySelectorAll(selector).forEach(el=>el.dataset.acPriority=n);
    const screen=document.getElementById('app')?.dataset.acScreen;
    const screenTypes={resultado:8,apuracao:8,minhaPontuacao:8,classificacao:8,encerrada:8,deducao:1,mosaico:1,cooperacao:6,esperando:6,mercado:5,revelacao:3};
    document.querySelectorAll('#app .card:not([data-ac-priority]),#app .pergunta-mae:not([data-ac-priority])').forEach(el=>{
      el.dataset.acPriority=el.matches('.pergunta-mae,.deducao-card')?1:(screenTypes[screen]||2);
    });
    document.querySelectorAll('[data-ac-priority]').forEach(el=>{
      const n=Number(el.dataset.acPriority),t=types[n];if(!t)return;
      el.style.setProperty('--ac-accent',t[2]);if(el.parentElement?.classList.contains('ac-panel-stack'))el.style.order=n;
      el.dataset.acSymbol=t[0];el.dataset.acTitle=t[1];
    });
  }
  function sortRuns(parent){
    let run=[];
    function flush(){
      const sorted=run.slice().sort((a,b)=>Number(a.dataset.acPriority)-Number(b.dataset.acPriority));
      if(sorted.some((e,i)=>e!==run[i])){const anchor=run[run.length-1].nextSibling;sorted.forEach(e=>parent.insertBefore(e,anchor));}
      run=[];
    }
    for(const child of Array.from(parent.children)){if(child.hasAttribute('data-ac-priority'))run.push(child);else flush();}flush();
  }
  function orderPanels(){
    const parents=new Set(Array.from(document.querySelectorAll('[data-ac-priority]')).map(e=>e.parentElement));
    for(const parent of parents)if(parent&&parent!==document.body&&!parent.closest('dialog,[role=dialog],[role=alertdialog],.modal-fundo,.dialogo-fundo')&&!parent.classList.contains('ac-panel-stack'))sortRuns(parent);
  }
  function medirFerramentas(){
    const tools=document.querySelector('.tools');if(!tools)return;
    const aplicar=()=>{
      const vis=Array.from(tools.children).some(b=>!b.hidden&&getComputedStyle(b).display!=='none');
      const r=tools.getBoundingClientRect();
      const espaco=vis&&r.height?Math.max(0,Math.round(window.innerHeight-r.top)):16;
      document.documentElement.style.setProperty('--ac-tools-space',espaco+'px');
    };
    aplicar();
    if(window.ResizeObserver)new ResizeObserver(aplicar).observe(tools);
    new MutationObserver(aplicar).observe(tools,{attributes:true,subtree:true,childList:true});
    window.addEventListener('resize',aplicar);
  }
  function travarMarcaNoSolo(){
    if(new URLSearchParams(location.search).get('demo')!=='solo')return;
    const brand=document.querySelector('.topbar .brand');
    if(brand){brand.removeAttribute('href');brand.addEventListener('click',e=>e.preventDefault());}
  }
  function recolher(){
    document.body.classList.add('ac-cena-livre');
    const b=document.getElementById('ac-ver-cena');
    if(b) b.textContent='i';
    document.querySelectorAll('dialog[open]').forEach(function(d){ try { d.close(); } catch (e) {} });
  }
  function mostrarCartoes(){
    document.body.classList.remove('ac-cena-livre');
    const b=document.getElementById('ac-ver-cena');
    if(b) b.textContent='Ver a cena';
  }
  function botaoCena(){
    if(document.getElementById('ac-ver-cena'))return;
    if(!document.getElementById('ac-cena-css')){
      const css=document.createElement('style');css.id='ac-cena-css';
      css.textContent=[
        '#ac-ver-cena{position:fixed;z-index:40;right:10px;top:max(8px,env(safe-area-inset-top));width:44px;height:44px;border-radius:22px;border:1px solid #c9a66c;background:#241a08;color:#ffe1ac;font:800 18px/1 Georgia,serif}',
        '@media(max-width:700px){',
        'body.ac-cena-livre .ac-panel-stack,',
        'body.ac-cena-livre .chapter,',
        'body.ac-cena-livre .tools,',
        'body.ac-cena-livre .caption,',
        'body.ac-cena-livre .topbar,',
        'body.ac-cena-livre #coop-status,',
        'body.ac-cena-livre #notice,',
        'body.ac-cena-livre #loading,',
        'body.ac-cena-livre #ar-ios{opacity:0!important;pointer-events:none!important;visibility:hidden!important}',
        'body.ac-cena-livre #candle-grip,body.ac-cena-livre #socket{visibility:visible;opacity:1;pointer-events:auto}',
        '}',
        'body.ac-cena-livre #ac-ver-cena{visibility:visible!important;opacity:1!important;pointer-events:auto!important}'
      ].join('');
      document.head.appendChild(css);
    }
    const b=document.createElement('button');
    b.id='ac-ver-cena';b.type='button';b.setAttribute('aria-label','Instruções');
    b.textContent='i';
    b.addEventListener('click',function(ev){
      ev.stopPropagation();
      if(document.body.classList.contains('ac-cena-livre')) mostrarCartoes();
      else recolher();
    });
    document.body.appendChild(b);
  }
  function cenaPrimeiro(){
    if(!telefone()) return;
    recolher();
    document.addEventListener('pointerdown', function(ev){
      if(ev.target.closest('#ac-ver-cena,.instruction,#primary,dialog,#help,#candle-grip')) return;
      if(ev.target.closest('.ac-panel-stack') && !document.body.classList.contains('ac-cena-livre')) return;
      recolher();
    }, {passive:true});
  }
  function start(){
    travarMarcaNoSolo();
    const desk=document.querySelector('.instruction');
    if(desk){
      const stack=document.createElement('section');stack.className='ac-panel-stack';stack.setAttribute('aria-label','Investigação e orientações');document.body.append(stack);
      for(const el of [document.getElementById('manuscript'),desk,document.getElementById('coop-status')].filter(Boolean))stack.append(el);
    }
    botaoCena();
    cenaPrimeiro();
    medirFerramentas();decorate();orderPanels();new MutationObserver(records=>{if(records.some(r=>r.addedNodes.length)){decorate();orderPanels();}}).observe(document.body,{childList:true,subtree:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();

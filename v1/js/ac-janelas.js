/* Identidade e ordem das caixas de A Casa.
   No telefone: cena livre. O i fala uma frase e some. */
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
      // Pseudo-elementos nao alteram o texto usado pelos controladores existentes.
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
  /* A pilha de painéis precisa saber onde começam as ferramentas, que mudam de
     altura quando quebram em duas linhas ou quando botões aparecem/somem. */
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
  /* No Solo, a marca AC não pode levar o quadro para fora do percurso. */
  function travarMarcaNoSolo(){
    if(new URLSearchParams(location.search).get('demo')!=='solo')return;
    const brand=document.querySelector('.topbar .brand');
    if(brand){brand.removeAttribute('href');brand.addEventListener('click',e=>e.preventDefault());}
  }
  function recolher(){
    document.body.classList.add('ac-cena-livre');
    document.querySelectorAll('dialog[open]').forEach(function(d){ try { d.close(); } catch (e) {} });
  }
  function frase(){
    const h=document.getElementById('heading');
    const p=document.getElementById('description');
    let n=document.getElementById('ac-frase');
    if(!n){
      n=document.createElement('p');n.id='ac-frase';
      n.style.cssText='position:fixed;left:12px;right:12px;bottom:max(18px,env(safe-area-inset-bottom));z-index:45;margin:0;padding:12px 14px;border-radius:14px;background:#1a1408f2;color:#ffe9c4;font:600 15px/1.35 system-ui;text-align:center;pointer-events:none';
      document.body.appendChild(n);
    }
    n.textContent=(h&&h.textContent?h.textContent+' ':'')+(p&&p.textContent?p.textContent:'');
    n.hidden=false;
    clearTimeout(n._t);
    n._t=setTimeout(function(){ n.hidden=true; }, 4000);
  }
  function botaoCena(){
    if(document.getElementById('ac-ver-cena'))return;
    const b=document.createElement('button');
    b.id='ac-ver-cena';b.type='button';b.setAttribute('aria-label','O que fazer agora');
    b.textContent='i';
    b.style.cssText='position:fixed;z-index:40;right:10px;top:max(8px,env(safe-area-inset-top));width:44px;height:44px;border-radius:22px;border:1px solid #c9a66c;background:#241a08;color:#ffe1ac;font:800 18px/1 Georgia,serif';
    b.addEventListener('click',function(ev){ ev.stopPropagation(); frase(); });
    document.body.appendChild(b);
  }
  function start(){
    travarMarcaNoSolo();
    const desk=document.querySelector('.instruction');
    if(desk){
      const stack=document.createElement('section');stack.className='ac-panel-stack';stack.setAttribute('aria-label','Investigação e orientações');document.body.append(stack);
      for(const el of [document.getElementById('manuscript'),desk,document.getElementById('coop-status')].filter(Boolean))stack.append(el);
    }
    if(telefone()) document.body.classList.add('ac-cena-livre');
    botaoCena();
    medirFerramentas();decorate();orderPanels();new MutationObserver(records=>{if(records.some(r=>r.addedNodes.length)){decorate();orderPanels();}}).observe(document.body,{childList:true,subtree:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();

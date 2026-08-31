/* MOSAICO — A Manhã do Carro-Forte
   Efeito de terminal aplicado às mensagens narrativas.
   A leitura percorre a tela de cima para baixo: um único cursor lógico,
   terminando cada bloco antes de iniciar o próximo. */
(function(){
  const SELECTORS=[
    '.hero > p','.intro-copy > p','.section-head > p','.question-banner',
    '.contraproof > p','.principle > span:last-child','.reveal-stage > p',
    '.reveal-stage p:first-of-type','.score-wrap > p','.ending-card > p'
  ].join(',');
  const signatures=new WeakMap();
  let scheduled=false,runId=0,lastScreen=null;

  function sourceText(el){
    const live=(el.textContent||'').replace(/\s+/g,' ').trim();
    const saved=el.dataset.terminalSource;
    if(el.dataset.terminalTyping==='1'&&saved)return saved;
    if(live)return live;
    return saved||el.getAttribute('aria-label')||'';
  }
  function prepare(el){
    if(!el||!el.isConnected)return null;
    const text=sourceText(el);if(!text)return null;
    if(signatures.get(el)===text&&el.dataset.terminalDone==='1')return null;
    signatures.set(el,text);el.dataset.terminalSource=text;el.dataset.terminalTyping='0';el.dataset.terminalDone='0';el.classList.add('terminal-copy');if(!el.getAttribute('aria-label'))el.setAttribute('aria-label',text);el.textContent='';return {el,text};
  }
  function wait(ms){return new Promise(r=>setTimeout(r,ms));}
  async function typeOne(job,id){
    const {el,text}=job;if(!el.isConnected||id!==runId)return false;
    el.dataset.terminalTyping='1';
    for(let i=0;i<text.length;){
      if(id!==runId||!el.isConnected)return false;
      i=Math.min(text.length,i+(Math.random()>.9?2:1));el.textContent=text.slice(0,i);
      await wait(22+Math.random()*34);
    }
    el.dataset.terminalTyping='0';el.dataset.terminalDone='1';return true;
  }
  async function startSequence(elements){
    const jobs=elements.map(prepare).filter(Boolean);if(!jobs.length)return;
    const id=++runId;
    if(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches){jobs.forEach(j=>{j.el.textContent=j.text;j.el.dataset.terminalDone='1'});return;}
    await wait(420);
    for(const job of jobs){
      if(id!==runId)return;
      const ok=await typeOne(job,id);if(!ok)return;
      await wait(120);
    }
  }
  function activeNarratives(){
    const active=document.querySelector('#app .screen.active');if(!active)return {active:null,els:[]};
    const els=[...new Set([...active.querySelectorAll(SELECTORS)])].filter(el=>!(el.matches('.reveal-stage p:first-of-type')&&el.parentElement?.querySelector(':scope > p')!==el));
    els.sort((a,b)=>{const ar=a.getBoundingClientRect(),br=b.getBoundingClientRect();return ar.top-br.top||ar.left-br.left;});
    return {active,els};
  }
  function refresh(){
    scheduled=false;const {active,els}=activeNarratives();
    if(active!==lastScreen){runId++;lastScreen=active;}
    startSequence(els);
  }
  function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(refresh);}
  const observer=new MutationObserver(mutations=>{
    const relevant=mutations.some(m=>{const target=m.target.nodeType===1?m.target:m.target.parentElement;if(target?.closest?.('.terminal-copy[data-terminal-typing="1"]'))return false;if(m.type==='attributes'&&m.attributeName==='class'&&target?.classList?.contains('screen'))return true;return !!target?.closest?.('#app .screen.active');});if(relevant)schedule();
  });
  function init(){const app=document.getElementById('app');if(!app)return;observer.observe(app,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['class']});schedule();document.addEventListener('click',()=>setTimeout(schedule,40),true);window.addEventListener('popstate',()=>setTimeout(schedule,40));}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

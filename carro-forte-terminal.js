/* MOSAICO — A Manhã do Carro-Forte
   Efeito de terminal aplicado às mensagens narrativas.
   Todos os blocos narrativos visíveis de uma mesma tela começam juntos. */
(function(){
  const SELECTORS=[
    '.hero > p',
    '.intro-copy > p',
    '.section-head > p',
    '.question-banner',
    '.contraproof > p',
    '.principle > span:last-child',
    '.reveal-stage > p',
    '.reveal-stage p:first-of-type',
    '.score-wrap > p',
    '.ending-card > p'
  ].join(',');

  const timers=new WeakMap();
  const signatures=new WeakMap();
  let scheduled=false;
  let screenEpoch=0;
  let lastScreen=null;

  function clearTimers(el){
    const t=timers.get(el);
    if(t){clearTimeout(t.delay);clearTimeout(t.write);timers.delete(el);}
  }

  function sourceText(el){
    const live=(el.textContent||'').replace(/\s+/g,' ').trim();
    const saved=el.dataset.terminalSource;
    if(el.dataset.terminalTyping==='1' && saved) return saved;
    if(live) return live;
    return saved||el.getAttribute('aria-label')||'';
  }

  function prepare(el,force=false){
    if(!el||!el.isConnected)return null;
    const text=sourceText(el);if(!text)return null;
    if(!force&&signatures.get(el)===text&&el.dataset.terminalDone==='1')return null;
    clearTimers(el);signatures.set(el,text);el.dataset.terminalSource=text;el.dataset.terminalTyping='1';el.dataset.terminalDone='0';el.classList.add('terminal-copy');if(!el.getAttribute('aria-label'))el.setAttribute('aria-label',text);el.textContent='';
    return {el,text,i:0,holder:{delay:null,write:null}};
  }

  function startBatch(elements){
    const reduced=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const jobs=elements.map(el=>prepare(el)).filter(Boolean);
    if(!jobs.length)return;
    if(reduced){jobs.forEach(j=>{j.el.textContent=j.text;j.el.dataset.terminalTyping='0';j.el.dataset.terminalDone='1';});return;}
    const epoch=screenEpoch;
    jobs.forEach(j=>timers.set(j.el,j.holder));
    const tick=()=>{
      if(epoch!==screenEpoch)return;
      let pending=false;
      jobs.forEach(j=>{
        if(!j.el.isConnected||j.i>=j.text.length)return;
        const step=Math.random()>.9?2:1;j.i=Math.min(j.text.length,j.i+step);j.el.textContent=j.text.slice(0,j.i);pending=true;
        if(j.i>=j.text.length){j.el.dataset.terminalTyping='0';j.el.dataset.terminalDone='1';timers.delete(j.el);}
      });
      if(pending){const h=setTimeout(tick,22+Math.random()*34);jobs.forEach(j=>{if(j.i<j.text.length)j.holder.write=h;});}
    };
    const h=setTimeout(tick,420);jobs.forEach(j=>j.holder.delay=h);
  }

  function activeNarratives(){
    const active=document.querySelector('#app .screen.active');if(!active)return {active:null,els:[]};
    const els=[...new Set([...active.querySelectorAll(SELECTORS)])].filter(el=>{
      if(el.matches('.reveal-stage p:first-of-type')&&el.parentElement?.querySelector(':scope > p')!==el)return false;
      return true;
    });
    return {active,els};
  }

  function refresh(){
    scheduled=false;const {active,els}=activeNarratives();
    if(active!==lastScreen){screenEpoch++;lastScreen=active;}
    startBatch(els);
  }
  function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(refresh);}

  const observer=new MutationObserver(mutations=>{
    const relevant=mutations.some(m=>{
      const target=m.target.nodeType===1?m.target:m.target.parentElement;
      if(target?.closest?.('.terminal-copy[data-terminal-typing="1"]'))return false;
      if(m.type==='attributes'&&m.attributeName==='class'&&target?.classList?.contains('screen'))return true;
      return !!target?.closest?.('#app .screen.active');
    });
    if(relevant)schedule();
  });

  function init(){const app=document.getElementById('app');if(!app)return;observer.observe(app,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['class']});schedule();document.addEventListener('click',()=>setTimeout(schedule,40),true);window.addEventListener('popstate',()=>setTimeout(schedule,40));}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

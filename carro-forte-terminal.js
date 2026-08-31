/* MOSAICO — A Manhã do Carro-Forte
   Efeito de terminal recuperado da V3 e aplicado às mensagens narrativas
   de todas as telas, sem afetar botões, rótulos ou conteúdo operacional. */
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

  function clearTimers(el){
    const t=timers.get(el);
    if(t){
      clearTimeout(t.delay);
      clearTimeout(t.write);
      timers.delete(el);
    }
  }

  function sourceText(el){
    const live=(el.textContent||'').replace(/\s+/g,' ').trim();
    const saved=el.dataset.terminalSource;
    if(el.dataset.terminalTyping==='1' && saved) return saved;
    if(live) return live;
    return saved||el.getAttribute('aria-label')||'';
  }

  function typeTerminal(el,force=false){
    if(!el || !el.isConnected) return;
    const text=sourceText(el);
    if(!text) return;

    const signature=text;
    if(!force && signatures.get(el)===signature && el.dataset.terminalDone==='1') return;

    clearTimers(el);
    signatures.set(el,signature);
    el.dataset.terminalSource=text;
    el.dataset.terminalTyping='1';
    el.dataset.terminalDone='0';
    el.classList.add('terminal-copy');
    if(!el.getAttribute('aria-label')) el.setAttribute('aria-label',text);

    if(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches){
      el.textContent=text;
      el.dataset.terminalTyping='0';
      el.dataset.terminalDone='1';
      return;
    }

    let i=0;
    el.textContent='';
    const holder={delay:null,write:null};
    timers.set(el,holder);

    const write=()=>{
      if(!el.isConnected) return;
      if(i<text.length){
        const step=Math.random()>.9?2:1;
        i=Math.min(text.length,i+step);
        el.textContent=text.slice(0,i);
        holder.write=setTimeout(write,22+Math.random()*34);
      }else{
        el.dataset.terminalTyping='0';
        el.dataset.terminalDone='1';
        timers.delete(el);
      }
    };
    holder.delay=setTimeout(write,420);
  }

  function activeNarratives(){
    const active=document.querySelector('#app .screen.active');
    if(!active) return [];
    return [...new Set([...active.querySelectorAll(SELECTORS)])].filter(el=>{
      if(el.matches('.reveal-stage p:first-of-type') && el.parentElement?.querySelector(':scope > p')!==el) return false;
      return true;
    });
  }

  function refresh(){
    scheduled=false;
    activeNarratives().forEach(el=>typeTerminal(el));
  }

  function schedule(){
    if(scheduled) return;
    scheduled=true;
    requestAnimationFrame(refresh);
  }

  const observer=new MutationObserver(mutations=>{
    const relevant=mutations.some(m=>{
      const target=m.target.nodeType===1?m.target:m.target.parentElement;
      if(target?.closest?.('.terminal-copy[data-terminal-typing="1"]')) return false;
      if(m.type==='attributes' && m.attributeName==='class' && target?.classList?.contains('screen')) return true;
      return !!target?.closest?.('#app .screen.active');
    });
    if(relevant) schedule();
  });

  function init(){
    const app=document.getElementById('app');
    if(!app) return;
    observer.observe(app,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['class']});
    schedule();

    document.addEventListener('click',()=>setTimeout(schedule,40),true);
    window.addEventListener('popstate',()=>setTimeout(schedule,40));
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();

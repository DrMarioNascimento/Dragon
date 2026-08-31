/* MOSAICO — terminal narrativo */
(function(){
 const SELECTORS='.hero > p,.intro-copy > p,.section-head > p,.question-banner,.contraproof > p,.principle > span:last-child,.reveal-stage > p,.score-wrap > p,.ending-card > p';
 const done=new WeakSet();let token=0;
 const wait=ms=>new Promise(r=>setTimeout(r,ms));
 async function type(el){
   if(!el||done.has(el)||!el.isConnected)return;
   const text=(el.dataset.terminalSource||el.textContent||'').replace(/\s+/g,' ').trim();if(!text)return;
   done.add(el);el.dataset.terminalSource=text;el.classList.add('terminal-copy');el.setAttribute('aria-label',text);el.textContent='';
   const my=++token;
   if(matchMedia('(prefers-reduced-motion: reduce)').matches){el.textContent=text;after(el);return}
   await wait(180);
   for(let i=1;i<=text.length;i++){if(my!==token||!el.isConnected)return;el.textContent=text.slice(0,i);await wait(18+Math.random()*22)}
   after(el);
 }
 function after(el){
   el.dataset.terminalDone='1';
   if(el.id==='questionBanner')setTimeout(()=>{if(el.isConnected&&el.dataset.terminalDone==='1')el.classList.add('collapsed')},3000);
 }
 function run(){const active=document.querySelector('#app .screen.active');if(!active)return;const els=[...active.querySelectorAll(SELECTORS)];(async()=>{for(const el of els)await type(el)})()}
 function init(){run();const app=document.getElementById('app');if(!app)return;new MutationObserver(ms=>{if(ms.some(m=>m.type==='attributes'&&m.attributeName==='class')){token++;setTimeout(run,40)}}).observe(app,{subtree:true,attributes:true,attributeFilter:['class']});document.addEventListener('click',()=>setTimeout(run,60),true)}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

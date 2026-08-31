/* MOSAICO — terminal verde apenas na abertura inicial */
(function(){
 const wait=ms=>new Promise(r=>setTimeout(r,ms));
 async function typeIntro(){
   const el=document.querySelector('#app .screen[data-screen="intro"].active .intro-copy > p');
   if(!el||el.dataset.terminalDone==='1')return;
   const text=(el.textContent||'').replace(/\s+/g,' ').trim();if(!text)return;
   el.dataset.terminalDone='1';el.dataset.terminalSource=text;el.classList.add('terminal-copy');el.setAttribute('aria-label',text);el.textContent='';
   if(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches){el.textContent=text;return}
   await wait(180);for(let i=1;i<=text.length;i++){if(!el.isConnected)return;el.textContent=text.slice(0,i);await wait(18+Math.random()*22)}
 }
 function init(){typeIntro()}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

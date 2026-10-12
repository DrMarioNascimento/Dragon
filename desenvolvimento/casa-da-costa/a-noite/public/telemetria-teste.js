/* MOSAICO — telemetria de playtest (05/09/2026)
 * Usa `acoes`, canal já autorizado nas regras atualmente publicadas.
 * Não altera a lógica do jogo; apenas cria registros do próprio participante.
 */
(function(){
'use strict';
let iniciado=false,seq=0;
function lim(v,n=180){return String(v==null?'':v).slice(0,n)}
function iniciar(){
 const S=window.MosaicoSala;
 if(iniciado||!S||!S.online||!S.db||!S.roomCode||!S.auth||!S.auth.currentUser)return false;
 iniciado=true;
 const uid=()=>S.auth.currentUser&&S.auth.currentUser.uid;
 const ref=()=>S.db.collection('noite').doc(S.roomCode).collection('acoes');
 async function registrar(tipo,dados={}){
  const u=uid();if(!u)return;
  const id=`telemetria_${u}_${Date.now()}_${(++seq).toString(36)}`;
  try{
   await ref().doc(id).set({jogadorId:u,tipo:'telemetria:'+lim(tipo,48),ms:Date.now(),pagina:lim(location.pathname+location.search,240),role:lim(S.role||'',20),partidaId:lim((S.roomData&&S.roomData.partidaId)||'',40),dados});
   window.__MOSAICO_FIREBASE_OK=Date.now();
  }catch(e){
   window.__MOSAICO_FIREBASE_ERRO={ms:Date.now(),codigo:e&&e.code||'',mensagem:e&&e.message||String(e)};
   console.error('MOSAICO TELEMETRIA: Firestore recusou a gravação',e);
  }
 }
 window.MosaicoTelemetria={registrar};
 registrar('jogo_carregado',{online:true});
 document.addEventListener('click',e=>{const b=e.target&&e.target.closest&&e.target.closest('button,a,[data-mod]');if(!b)return;registrar('clique',{id:lim(b.id,80),texto:lim((b.innerText||b.textContent||'').replace(/\s+/g,' ').trim(),140),modulo:lim(b.dataset&&b.dataset.mod,40),liberar:lim(b.dataset&&b.dataset.liberar,40)});},true);
 document.addEventListener('change',e=>{const el=e.target;if(el&&el.matches&&el.matches('[data-c]'))registrar('decisao_campo',{campo:lim(el.dataset.c,80),valor:lim(el.value,180)});},true);
 window.addEventListener('error',e=>registrar('erro_js',{mensagem:lim(e.message,220),arquivo:lim(e.filename,220),linha:e.lineno||0}));
 window.addEventListener('unhandledrejection',e=>registrar('promise_rejeitada',{mensagem:lim(e.reason&&e.reason.message||e.reason,220)}));
 return true;
}
if(!iniciar()){let tentativas=0;const t=setInterval(()=>{if(iniciar()||++tentativas>120)clearInterval(t)},250);}
})();
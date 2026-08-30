/* MOSAICO — ponte de estado do Modo Solo para a sincronização Firebase.
   O jogo continua com estado em memória para ser rápido; esta camada cria
   um snapshot pequeno no localStorage. firebase-user.js sincroniza esse
   snapshot com usuarios/{uid}/experiencias/casa-da-costa-solo. */
(function(){
  "use strict";
  var KEY="mosaico_solo_costa_cloud",restaurado=false,ultima="";
  function snap(){
    if(typeof state==="undefined"||!state)return null;
    return {phase:state.phase,key:state.key,i:state.i,order:state.order,pick:state.pick,seen:state.seen,facts:state.facts,answers:state.answers,scoreFacts:state.scoreFacts,correct:state.correct};
  }
  function save(force){
    var s=snap();if(!s)return;var txt=JSON.stringify(s);if(!force&&txt===ultima)return;ultima=txt;
    try{localStorage.setItem(KEY,txt)}catch(e){}
    if(force&&window.MosaicoUserCloud&&window.MosaicoUserCloud.sincronizarAgora)window.MosaicoUserCloud.sincronizarAgora();
  }
  function restore(){
    if(restaurado||typeof state==="undefined"||!state||!state.caso)return false;
    restaurado=true;var x=null;try{x=JSON.parse(localStorage.getItem(KEY)||"null")}catch(e){}
    if(!x||!x.key||!state.caso.partidas||!state.caso.partidas[x.key])return false;
    if(x.phase&&x.phase!=="home"){
      state.phase=x.phase;state.key=x.key;state.i=Number(x.i)||0;state.order=Array.isArray(x.order)?x.order:[0,1,2,3];state.pick=x.pick==null?null:x.pick;state.seen=Array.isArray(x.seen)?x.seen:[];state.facts=x.facts||{};state.answers=x.answers||{};state.scoreFacts=Number(x.scoreFacts)||0;state.correct=Number(x.correct)||0;
      try{render()}catch(e){console.warn("MOSAICO Solo: não foi possível restaurar a tela",e)}
      return true;
    }
    return false;
  }
  setInterval(function(){restore();save(false)},800);
  document.addEventListener("visibilitychange",function(){if(document.visibilityState==="hidden")save(true)});
  window.addEventListener("pagehide",function(){save(true)});
})();
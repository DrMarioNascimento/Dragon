/* MOSAICO — ponte de estado do Modo Solo para a sincronização Firebase.
   O jogo continua com estado em memória para ser rápido; esta camada cria
   um snapshot pequeno no localStorage. firebase-user.js sincroniza esse
   snapshot com usuarios/{uid}/experiencias/casa-da-costa-solo. */
(function(){
  "use strict";
  var KEY="mosaico_solo_costa_cloud",restaurado=false,ultima="";
  function snap(){
    if(typeof state==="undefined"||!state)return null;
    return {phase:state.phase,key:state.key,i:state.i,order:state.order,pick:state.pick,seen:state.seen,facts:state.facts,answers:state.answers,scoreFacts:state.scoreFacts,correct:state.correct,
      percursoPronto:state.percursoPronto,percursoResultado:state.percursoResultado,percursoEtapa:state.percursoEtapa,atividades:state.atividades,atividadeI:state.atividadeI,sensorPronto:state.sensorPronto,sensorTempos:state.sensorTempos,mosaico:state.mosaico,mosaicoPick:state.mosaicoPick,
      mercadoEtapa:state.mercadoEtapa,mercadoEscolhas:state.mercadoEscolhas,contraponto:state.contraponto,pontuacao:state.pontuacao,resultadoVista:state.resultadoVista,apuracaoEtapa:state.apuracaoEtapa};
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
      state.percursoPronto=!!x.percursoPronto;state.percursoResultado=x.percursoResultado||null;state.percursoEtapa=x.percursoEtapa==='janela'?'janela':'escrivaninha';state.atividades=Array.isArray(x.atividades)?x.atividades:parAtividades();state.atividadeI=Number(x.atividadeI)||0;state.sensorPronto=!!x.sensorPronto;state.sensorTempos=Array.isArray(x.sensorTempos)?x.sensorTempos:[];
      state.mosaico=Array.isArray(x.mosaico)?x.mosaico:[];state.mosaicoPick=x.mosaicoPick==null?null:Number(x.mosaicoPick);
      state.mercadoEtapa=Number(x.mercadoEtapa)||0;state.mercadoEscolhas=Array.isArray(x.mercadoEscolhas)?x.mercadoEscolhas:[];state.contraponto=x.contraponto==null?null:Number(x.contraponto);state.pontuacao=x.pontuacao||null;state.resultadoVista=x.resultadoVista==='podio'?'podio':'apuracao';state.apuracaoEtapa=Math.min(5,Math.max(0,Number(x.apuracaoEtapa)||0));
      try{render()}catch(e){console.warn("MOSAICO Solo: não foi possível restaurar a tela",e)}
      return true;
    }
    return false;
  }
  setInterval(function(){restore();save(false)},800);
  document.addEventListener("visibilitychange",function(){if(document.visibilityState==="hidden")save(true)});
  window.addEventListener("pagehide",function(){save(true)});
})();

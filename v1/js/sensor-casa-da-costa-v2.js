/* Conteúdo canônico das três tarefas sensoriais — Casa da Costa 2026.08.
   A engenharia visual/sensorial original permanece intacta. */
(function(){
  "use strict";
  var path=location.pathname.toLowerCase();
  var tipo=path.indexOf('janela-do-norte')>=0?'janela':path.indexOf('vidro-embacado')>=0?'vidro':path.indexOf('sala-as-escuras')>=0?'escura':'';
  if(!tipo)return;

  var dados={
    janela:{
      rotulo:'A primeira versão da noite',
      texto:'A casa já está diante de vocês. Não procure quem entrou. Observe o que se move do lado de dentro.',
      pista:'A sombra não prova entrada. Prova presença.',
      cor:'#ffd9b0'
    },
    vidro:{
      rotulo:'Cinco meses de casa fechada',
      texto:'Uma casa vazia acumula ausência. Procure o contrário: uso, cuidado, água, calor e rotina.',
      pista:'Sete xícaras e pouca poeira não explicam um instante. Explicam permanência.',
      cor:'#b9e7ff'
    },
    escura:{
      rotulo:'21h29–21h31 · dois minutos e dois segundos',
      texto:'No escuro, posição vale mais que suspeita. Separe os sons da casa dos sinais que exigem massa, respiração e movimento.',
      pista:'Respiração, vulto e colher formam um trajeto que não cabe nas posições dos seis.',
      cor:'#ffd0c6'
    }
  }[tipo];

  function inserir(){
    if(document.getElementById('nota-canonica-casa'))return;
    var intro=document.getElementById('intro');
    if(!intro)return;
    var box=document.createElement('div');
    box.id='nota-canonica-casa';
    box.style.cssText='width:min(520px,92vw);margin:8px auto 15px;padding:12px 14px;border:1px solid rgba(255,217,176,.38);border-left:4px solid '+dados.cor+';border-radius:9px;background:rgba(3,7,12,.78);box-shadow:inset 0 1px rgba(255,255,255,.06),0 5px 0 rgba(0,0,0,.55),0 16px 30px rgba(0,0,0,.28);text-align:left;';
    box.innerHTML='<b style="display:block;color:'+dados.cor+';font:700 11px/1.2 Inter,system-ui,sans-serif;letter-spacing:.14em;text-transform:uppercase;margin-bottom:6px">'+dados.rotulo+'</b><span style="display:block;color:#f6f9fc;font:500 16px/1.45 Literata,Georgia,serif">'+dados.texto+'</span><em style="display:block;color:'+dados.cor+';font:600 15px/1.4 Literata,Georgia,serif;margin-top:7px">'+dados.pista+'</em>';
    var go=intro.querySelector('.go');
    if(go)intro.insertBefore(box,go);else intro.appendChild(box);
  }

  function corrigirTexto(root){
    var walker=document.createTreeWalker(root||document.body,NodeFilter.SHOW_TEXT);
    var n;
    while((n=walker.nextNode())){
      var t=n.nodeValue||'';
      if(!t.trim())continue;
      if(tipo==='janela'){
        t=t.replace(/procure (?:a )?marca recente na trava do cofre/gi,'procure o movimento que acontece pelo lado de dentro');
        t=t.replace(/o pequeno objeto metálico[^.]*\.?/gi,'o vulto cruza uma zona que nenhum dos seis deveria ocupar.');
        t=t.replace(/a marca recente na trava[^.]*\.?/gi,'a posição do vulto permanece como ponto fixo da observação.');
      }
      if(tipo==='vidro'){
        t=t.replace(/marca recente na trava do cofre/gi,'sete xícaras limpas na cozinha');
        t=t.replace(/marca da trava/gi,'diferença de poeira entre os cômodos');
        t=t.replace(/pequeno objeto metálico/gi,'sinal de uso recente');
      }
      if(tipo==='escura'){
        t=t.replace(/a busca convergiu para o cofre/gi,'as posições dos seis deixam um ponto sem autor');
        t=t.replace(/marca recente na trava[^.]*\.?/gi,'respiração, vulto e colher permanecem como sinais de um trajeto.');
        t=t.replace(/procure o cofre/gi,'reconstrua as posições');
      }
      n.nodeValue=t;
    }
  }

  function aplicar(){ inserir(); corrigirTexto(document.body); }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',aplicar);else aplicar();

  var ocupado=false;
  new MutationObserver(function(muts){
    if(ocupado)return;ocupado=true;
    try{muts.forEach(function(m){m.addedNodes.forEach(function(n){if(n.nodeType===1)corrigirTexto(n);});});}finally{ocupado=false;}
  }).observe(document.documentElement,{childList:true,subtree:true});
})();
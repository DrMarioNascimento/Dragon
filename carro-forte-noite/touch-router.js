/* MOSAICO · A Noite · roteador de interação
   Executa controles essenciais na fase de captura do click. Assim o comando
   não depende da ordem dos listeners nem do layout compacto. */
(function(){
  function alvo(e){return e.target?.closest?.('#infoBtn,#hudSalaMirror,#hudSala,#scoreBtn,#modalClose,#drawerClose,[data-action]')||null}
  function intercept(e){
    const b=alvo(e);if(!b)return;
    const id=b.id||'';
    if(id==='infoBtn'){e.preventDefault();e.stopImmediatePropagation();document.getElementById('drawer')?.classList.add('on');return}
    if(id==='drawerClose'){e.preventDefault();e.stopImmediatePropagation();document.getElementById('drawer')?.classList.remove('on');return}
    if(id==='modalClose'){e.preventDefault();e.stopImmediatePropagation();const d=document.getElementById('modal');if(d?.open)d.close();return}
    if(id==='hudSala'||id==='hudSalaMirror'){
      e.preventDefault();e.stopImmediatePropagation();
      if(new URLSearchParams(location.search).get('soloLab')==='1'){document.getElementById('soloRoomPanel')?.classList.add('on');window.MosaicoSoloSalaCasa?.render?.()}
      else document.getElementById('dragonSalaBtn')?.click();
      return;
    }
    if(id==='scoreBtn'){
      e.preventDefault();e.stopImmediatePropagation();
      if(typeof window.modal==='function')window.modal('CUSTOS DAS AÇÕES','Consulta estratégica','<p><b>Arriscar 3 moedas</b><br><b>Capturar 2 moedas</b><br><b>Comprar fragmento 4 moedas</b></p>');
      return;
    }
    const ac=b.dataset?.action;if(!ac)return;
    e.preventDefault();e.stopImmediatePropagation();if(b.disabled)return;
    const fn={risk:'risk',capture:'capture',buy:'buy'}[ac];if(fn&&typeof window[fn]==='function')window[fn]();
  }
  document.addEventListener('click',intercept,true);
})();

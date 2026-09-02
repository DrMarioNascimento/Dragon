/* MOSAICO · A Noite · roteador de interação
   Captura o toque antes das camadas de apresentação. Evita que mudanças de
   layout, pseudo-elementos ou listeners intermediários tornem controles
   visíveis porém inertes no Safari/iOS. */
(function(){
  let ultimoTouch=0;
  function alvo(e){return e.target?.closest?.('#infoBtn,#hudSalaMirror,#hudSala,#questionToggle,#fieldsToggle,#scoreBtn,#modalClose,#drawerClose,[data-action]')||null}
  function agir(b,e){
    if(!b)return false;
    const id=b.id||'';
    if(id==='infoBtn'){document.getElementById('drawer')?.classList.add('on');return true}
    if(id==='drawerClose'){document.getElementById('drawer')?.classList.remove('on');return true}
    if(id==='modalClose'){const d=document.getElementById('modal');if(d?.open)d.close();return true}
    if(id==='hudSala'||id==='hudSalaMirror'){
      if(new URLSearchParams(location.search).get('soloLab')==='1'){
        document.getElementById('soloRoomPanel')?.classList.add('on');window.MosaicoSoloSalaCasa?.render?.();
      }else document.getElementById('dragonSalaBtn')?.click();
      return true;
    }
    if(id==='questionToggle'){b.dispatchEvent(new CustomEvent('mosaico-touch-router-question'));return false}
    if(id==='fieldsToggle'){b.dispatchEvent(new CustomEvent('mosaico-touch-router-fields'));return false}
    if(id==='scoreBtn'){
      if(typeof window.modal==='function')window.modal('CUSTOS DAS AÇÕES','Consulta estratégica','<p><b>Arriscar 3 moedas</b><br><b>Capturar 2 moedas</b><br><b>Comprar fragmento 4 moedas</b></p>');
      else b.onclick?.();
      return true;
    }
    const ac=b.dataset?.action;
    if(ac){
      if(b.disabled)return true;
      const fn={risk:'risk',capture:'capture',buy:'buy'}[ac];
      if(fn&&typeof window[fn]==='function')window[fn]();else b.onclick?.();
      return true;
    }
    return false;
  }
  function intercept(e){
    const b=alvo(e);if(!b)return;
    if(e.type==='touchend')ultimoTouch=Date.now();
    if(e.type==='click'&&Date.now()-ultimoTouch<700){e.preventDefault();e.stopImmediatePropagation();return}
    const handled=agir(b,e);
    if(handled){e.preventDefault();e.stopImmediatePropagation()}
  }
  document.addEventListener('touchend',intercept,{capture:true,passive:false});
  document.addEventListener('click',intercept,true);
  /* Question/fields continuam usando a lógica já instalada no index; estes
     dois sinais apenas convertem o toque capturado em click confiável. */
  document.addEventListener('mosaico-touch-router-question',e=>{const b=e.target;setTimeout(()=>b.click(),0)});
  document.addEventListener('mosaico-touch-router-fields',e=>{const b=e.target;setTimeout(()=>b.click(),0)});
})();

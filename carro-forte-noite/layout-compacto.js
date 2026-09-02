/* MOSAICO · layout compacto seguro e não invasivo */
(function () {
  if (!document.querySelector('link[data-layout-compacto]')) { const css=document.createElement('link');css.rel='stylesheet';css.href='layout-compacto.css?v=20260901-auditoria';css.dataset.layoutCompacto='1';document.head.appendChild(css) }
  const brand=document.querySelector('.brand'),topline=document.querySelector('.topline'),hud=document.querySelector('.hud'),turn=document.querySelector('.turnline'),dock=document.querySelector('.action-dock');if(!brand||!topline||!hud||!turn||!dock)return;
  brand.classList.add('compact-brand');const brandB=brand.querySelector('b'),brandSmall=brand.querySelector('small');if(brandB)brandB.textContent='MOSAICO · A MANHÃ DO CARRO-FORTE · A NOITE';if(brandSmall)brandSmall.hidden=true;topline.classList.add('compact-topline');const info=hud.querySelector('#infoBtn');if(info)topline.appendChild(info);hud.classList.add('compact-source-hidden');turn.classList.add('compact-source-hidden');
  if(dock.querySelector('.action-status'))return;
  const status=document.createElement('div');status.className='action-status';status.innerHTML='<div class="action-status-left"><small class="status-vez">VEZ</small><b id="hudTurnMirror">—</b></div><div class="action-status-right"><button id="hudSalaMirror" hidden>SALA</button><span class="hud-pill">⏱ <b id="hudTimerMirror">--:--</b></span><span class="hud-pill">💵 <b id="hudCoinsMirror">--</b></span></div>';
  const buttons=document.createElement('div');buttons.className='action-buttons';[...dock.children].filter(el=>el.classList?.contains('action')).forEach(b=>buttons.appendChild(b));dock.append(status,buttons);
  const salaMirror=status.querySelector('#hudSalaMirror');salaMirror.addEventListener('click',()=>document.getElementById('hudSala')?.click());
  function mirror(){const sourceTurn=document.getElementById('hudTurn'),sourceTimer=document.getElementById('hudTimer'),sourceCoins=document.getElementById('hudCoins'),sourceSala=document.getElementById('hudSala'),mTurn=document.getElementById('hudTurnMirror'),mTimer=document.getElementById('hudTimerMirror'),mCoins=document.getElementById('hudCoinsMirror');if(mTurn)mTurn.textContent=sourceTurn?.textContent||'—';if(mTimer)mTimer.textContent=sourceTimer?.textContent||'--:--';if(mCoins)mCoins.textContent=sourceCoins?.textContent||'--';if(salaMirror)salaMirror.hidden=sourceSala?.hidden!==false;
    /* Fonte de verdade: o núcleo sabe qual slot está jogando. O texto do HUD é só apresentação e não deve bloquear toque. */
    const table=document.querySelector('[data-screen="table"]')?.classList.contains('active');let minhaVez=false;try{minhaVez=table&&window.MosaicoCore?.getSnapshot?.().turn===0}catch(e){}if(minhaVez)document.querySelectorAll('.action-dock [data-action]').forEach(b=>{b.disabled=false;b.classList.remove('turn-disabled')});
  }
  mirror();window.setInterval(mirror,120);
})();

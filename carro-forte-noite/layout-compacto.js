/* MOSAICO · layout compacto seguro e não invasivo */
(function(){
  if(!document.querySelector('link[data-layout-compacto]')){
    const css=document.createElement('link');css.rel='stylesheet';css.href='layout-compacto.css?v=20260901-ordem1';css.dataset.layoutCompacto='1';document.head.appendChild(css);
  }
  const brand=document.querySelector('.brand');
  const topline=document.querySelector('.topline');
  const hud=document.querySelector('.hud');
  const turn=document.querySelector('.turnline');
  const dock=document.querySelector('.action-dock');
  if(!brand||!topline||!hud||!turn||!dock)return;

  /* Somente apresentação: nenhum nó funcional é movido, removido ou renomeado. */
  brand.classList.add('compact-brand');
  const brandB=brand.querySelector('b'),brandSmall=brand.querySelector('small'),mark=brand.querySelector('.mark');
  if(brandB)brandB.textContent='MOSAICO · A MANHÃ DO CARRO-FORTE · A NOITE';
  if(brandSmall)brandSmall.hidden=true;
  /* O M continua na linha, ao lado do nome — a folha dá o tamanho maior. */
  topline.classList.add('compact-topline');
  /* O ⓘ mora dentro do .hud, que sai de cena logo abaixo. Sem mudar de pai
     ele iria junto e a gaveta de regras ficaria sem porta. appendChild move
     o nó com o ouvinte que o núcleo já pendurou; o CSS já o esperava aqui. */
  const info=hud.querySelector('#infoBtn');
  if(info)topline.appendChild(info);
  hud.classList.add('compact-source-hidden');
  turn.classList.add('compact-source-hidden');

  if(dock.querySelector('.action-status'))return;
  const status=document.createElement('div');status.className='action-status';
  status.innerHTML='<div class="action-status-left"><small class="status-vez">VEZ</small><b id="hudTurnMirror">—</b></div><div class="action-status-right"><button id="hudSalaMirror" hidden>SALA</button><span class="hud-pill">⏱ <b id="hudTimerMirror">--:--</b></span><span class="hud-pill">💵 <b id="hudCoinsMirror">--</b></span></div>';
  const buttons=document.createElement('div');buttons.className='action-buttons';
  /* Mantém os próprios botões, já com seus listeners; apenas os agrupa visualmente. */
  [...dock.children].filter(el=>el.classList?.contains('action')).forEach(b=>buttons.appendChild(b));
  dock.append(status,buttons);

  const salaMirror=status.querySelector('#hudSalaMirror');
  salaMirror.addEventListener('click',()=>document.getElementById('hudSala')?.click());
  function mirror(){
    const sourceTurn=document.getElementById('hudTurn'),sourceTimer=document.getElementById('hudTimer'),sourceCoins=document.getElementById('hudCoins'),sourceSala=document.getElementById('hudSala');
    const mTurn=document.getElementById('hudTurnMirror'),mTimer=document.getElementById('hudTimerMirror'),mCoins=document.getElementById('hudCoinsMirror');
    if(mTurn)mTurn.textContent=sourceTurn?.textContent||'—';if(mTimer)mTimer.textContent=sourceTimer?.textContent||'--:--';if(mCoins)mCoins.textContent=sourceCoins?.textContent||'--';if(salaMirror)salaMirror.hidden=sourceSala?.hidden!==false;
  }
  mirror();window.setInterval(mirror,250);
})();
/* MOSAICO · layout compacto seguro: título no topo; status espelhado junto às ações */
(function(){
  if(!document.querySelector('link[data-layout-compacto]')){
    const css=document.createElement('link');css.rel='stylesheet';css.href='layout-compacto.css?v=20260831-hud2';css.dataset.layoutCompacto='1';document.head.appendChild(css);
  }
  const topline=document.querySelector('.topline'),brand=document.querySelector('.brand'),info=document.getElementById('infoBtn'),hud=document.querySelector('.hud'),turn=document.querySelector('.turnline'),dock=document.querySelector('.action-dock');
  if(!topline||!brand||!info||!hud||!turn||!dock)return;

  /* Não move nem remove nós usados pelo núcleo. Apenas muda apresentação e cria espelhos. */
  brand.innerHTML='<b>MOSAICO · A MANHÃ DO CARRO-FORTE · A NOITE</b>';
  topline.classList.add('compact-topline');
  hud.classList.add('compact-source-hidden');
  turn.classList.add('compact-source-hidden');

  const status=document.createElement('div');status.className='action-status';
  const left=document.createElement('div');left.className='action-status-left';
  const right=document.createElement('div');right.className='action-status-right';
  const vez=document.createElement('small');vez.className='status-vez';vez.textContent='VEZ';
  const name=document.createElement('b');name.id='hudTurnMirror';name.textContent='—';
  left.append(vez,name);
  const sala=document.createElement('button');sala.id='hudSalaMirror';sala.textContent='SALA';sala.hidden=true;
  const tempo=document.createElement('span');tempo.className='hud-pill';tempo.innerHTML='⏱ <b id="hudTimerMirror">--:--</b>';
  const money=document.createElement('span');money.className='hud-pill';money.innerHTML='💵 <b id="hudCoinsMirror">--</b>';
  right.append(sala,tempo,money);status.append(left,right);
  const buttons=document.createElement('div');buttons.className='action-buttons';[...dock.querySelectorAll(':scope > .action')].forEach(b=>buttons.append(b));dock.prepend(status);dock.append(buttons);

  sala.onclick=()=>document.getElementById('hudSala')?.click();
  function mirror(){
    name.textContent=document.getElementById('hudTurn')?.textContent||'—';
    document.getElementById('hudTimerMirror').textContent=document.getElementById('hudTimer')?.textContent||'--:--';
    document.getElementById('hudCoinsMirror').textContent=document.getElementById('hudCoins')?.textContent||'--';
    sala.hidden=document.getElementById('hudSala')?.hidden!==false;
  }
  mirror();setInterval(mirror,250);
})();
/* MOSAICO · layout compacto: título no topo; vez/sala/tempo/dinheiro junto às ações */
(function(){
  if(!document.querySelector('link[data-layout-compacto]')){
    const css=document.createElement('link');css.rel='stylesheet';css.href='layout-compacto.css?v=20260831-hud1';css.dataset.layoutCompacto='1';document.head.appendChild(css);
  }
  const topbar=document.querySelector('.topbar');
  const topline=document.querySelector('.topline');
  const brand=document.querySelector('.brand');
  const info=document.getElementById('infoBtn');
  const hud=document.querySelector('.hud');
  const turn=document.querySelector('.turnline');
  const dock=document.querySelector('.action-dock');
  if(!topbar||!topline||!brand||!info||!hud||!turn||!dock)return;
  brand.innerHTML='<b>MOSAICO · A MANHÃ DO CARRO-FORTE · A NOITE</b>';
  topline.innerHTML='';topline.append(brand,info);
  const status=document.createElement('div');status.className='action-status';
  const left=document.createElement('div');left.className='action-status-left';
  const right=document.createElement('div');right.className='action-status-right';
  const turnLabel=turn.querySelector('small'),turnName=document.getElementById('hudTurn'),sala=document.getElementById('hudSala'),timer=document.getElementById('hudTimer')?.closest('.hud-pill'),money=document.getElementById('hudCoins')?.closest('.hud-pill');
  if(turnLabel)left.append(turnLabel);if(turnName)left.append(turnName);
  /* ordem fechada: Sala → Tempo → Dinheiro */
  if(sala)right.append(sala);if(timer)right.append(timer);if(money)right.append(money);
  status.append(left,right);
  const buttons=document.createElement('div');buttons.className='action-buttons';[...dock.querySelectorAll(':scope > .action')].forEach(b=>buttons.append(b));
  dock.prepend(status);dock.append(buttons);hud.remove();turn.remove();
})();
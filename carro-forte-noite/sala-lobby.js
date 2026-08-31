/* MOSAICO · Carro-Forte · reforço do lobby normativo no painel Sala */
(function(){
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function roomCode(){
    const fromWindow=String(window.MOSAICO_ROOM?.code||'').trim().toUpperCase();
    if(/^[A-Z2-9]{6}$/.test(fromWindow))return fromWindow;
    const nodes=[...document.querySelectorAll('.dr-sala-code,.dr-code,#drCode')];
    for(const n of nodes){const v=String(n.value||n.textContent||'').trim().toUpperCase();if(/^[A-Z2-9]{6}$/.test(v))return v}
    return '';
  }
  function joinUrl(code){const u=new URL(location.href);u.search='';u.hash='';u.searchParams.set('sala',code);return u.toString()}
  function enhance(){
    const panel=document.getElementById('dragonSalaPanel');
    if(!panel)return;
    const code=roomCode();
    if(!code)return;
    window.MOSAICO_ROOM={...(window.MOSAICO_ROOM||{}),code};
    let lobby=panel.querySelector('#carroLobbyQR');
    if(!lobby){
      lobby=document.createElement('section');lobby.id='carroLobbyQR';lobby.className='dr-sala-section';
      const head=panel.querySelector('.dr-sala-head');
      if(head)head.insertAdjacentElement('afterend',lobby);else panel.querySelector('.dr-sala-card')?.prepend(lobby);
    }
    const url=joinUrl(code),qr=window.MosaicoQR?window.MosaicoQR.svg(url,{nivel:'M',margem:4,rotulo:'QR para entrar na sala'}):'';
    lobby.innerHTML=`<div style="text-align:center"><div class="dr-ident">ENTRADA DOS JOGADORES</div><div class="dr-sala-code">${esc(code)}</div><p class="dr-note">Aponte a câmera para o QR ou informe o código acima.</p><div style="width:min(300px,82vw);margin:12px auto;padding:12px;background:#fff;border-radius:12px;color:#071014">${qr||`<b>${esc(url)}</b>`}</div></div>`;
  }
  document.addEventListener('click',e=>{if(e.target.closest?.('#dragonSalaBtn'))setTimeout(enhance,60)},true);
  new MutationObserver(()=>{if(document.getElementById('dragonSalaPanel'))enhance()}).observe(document.documentElement,{subtree:true,childList:true});
})();
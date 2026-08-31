/* Carro-Forte · Ensaio — menu Sala copiado do padrão da Casa da Costa */
(function(){
 if(new URLSearchParams(location.search).get('soloLab')!=='1')return;
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function code(){return String(window.MOSAICO_ROOM?.code||window.MOSAICO_SOLO_LOBBY?.code||'').trim().toUpperCase()}
 function link(c){const u=new URL(location.href);u.search='';u.hash='';u.searchParams.set('sala',c);return u.toString()}
 function render(){
  const c=code(),panel=document.getElementById('soloRoomPanel');if(!panel)return;
  const state=document.querySelector('[data-screen="table"]')?.classList.contains('active')?'Partida em andamento':'Preparação da partida';
  const qr=c&&window.MosaicoQR?window.MosaicoQR.svg(link(c),{nivel:'M',margem:4,rotulo:'QR da sala'}):'';
  panel.innerHTML=`<div class="drawer-card depth-card"><div class="modal-head"><div><small>MESTRE · ENSAIO</small><h2>Sala</h2><p>Laboratório da partida</p></div><button id="soloRoomClose" class="icon-btn">×</button></div>
  <details class="sala-acordeao"><summary>Código e QR da sala</summary><div class="sala-acordeao-conteudo"><div style="font:800 34px monospace;letter-spacing:.12em;text-align:center;margin:10px">${esc(c||'CRIANDO…')}</div><div style="width:min(290px,80vw);margin:12px auto;padding:12px;background:#fff;border-radius:12px">${qr}</div><button class="btn" id="soloCopy" style="width:100%" ${c?'':'disabled'}>Copiar link</button></div></details>
  <details class="sala-acordeao"><summary>Participantes · 8</summary><div class="sala-acordeao-conteudo"><p><b>Você + 7 participantes simulados</b></p><p>Aparelhos reais podem entrar pelo QR para validar a conexão.</p></div></details>
  <details class="sala-acordeao" open><summary>Acompanhamento da rodada</summary><div class="sala-acordeao-conteudo"><p>${state}</p></div></details>
  <details class="sala-acordeao"><summary>Encerrar sala</summary><div class="sala-acordeao-conteudo"><button class="btn" id="soloEnd2" style="width:100%">Encerrar sala</button></div></details></div>`;
  panel.querySelector('#soloRoomClose').onclick=()=>panel.classList.remove('on');
  panel.querySelector('#soloCopy').onclick=async()=>{if(c)try{await navigator.clipboard.writeText(link(c))}catch{}};
  panel.querySelector('#soloEnd2').onclick=()=>document.getElementById('soloEnd')?.click()||location.assign(location.pathname+'?soloLab=1&bots=max');
 }
 window.MosaicoSoloSalaCasa={render};
 window.addEventListener('mosaico-solo-lobby-ready',()=>setTimeout(render,0));
 document.addEventListener('click',e=>{if(e.target.closest?.('#hudSala'))setTimeout(render,0)},true);
})();
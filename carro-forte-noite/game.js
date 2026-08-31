/* MOSAICO A Noite — fluxo celular em validação */
(function(){
  const l=document.createElement('script');
  l.src='layout-compacto.js?v=20260831-hud1';
  l.onerror=()=>console.error('MOSAICO: falha ao carregar layout compacto.');
  document.head.appendChild(l);

  const s=document.createElement('script');
  s.src='game-fixed.js?v=20260831-actions3';
  s.onerror=()=>console.error('MOSAICO: falha ao carregar núcleo funcional.');
  document.head.appendChild(s);

  const o=document.createElement('script');
  o.src='opening-flow.js?v=20260831-opening2';
  o.onerror=()=>console.error('MOSAICO: falha ao carregar abertura celular.');
  document.head.appendChild(o);
})();
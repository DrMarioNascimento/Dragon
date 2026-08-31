/* MOSAICO A Noite — carregador estável */
(function(){
  const s=document.createElement('script');
  s.src='game-fixed.js?v=20260831-fix-enter-1';
  s.onerror=()=>console.error('MOSAICO: falha ao carregar núcleo funcional.');
  document.head.appendChild(s);
  const b=document.createElement('script');
  b.src='firebase-opening-bridge.js?v=20260831-bridge1';
  b.onload=()=>{
    const o=document.createElement('script');
    o.src='opening-flow.js?v=20260831-opening-bridge1';
    o.onerror=()=>console.error('MOSAICO: falha ao carregar abertura audiovisual.');
    document.head.appendChild(o);
  };
  b.onerror=()=>console.error('MOSAICO: falha ao carregar ponte Firebase da abertura.');
  document.head.appendChild(b);
})();
/* MOSAICO A Noite — carregador estável */
(function(){
  const s=document.createElement('script');
  s.src='game-fixed.js?v=20260831-fix-enter-1';
  s.onerror=()=>console.error('MOSAICO: falha ao carregar núcleo funcional.');
  document.head.appendChild(s);
})();
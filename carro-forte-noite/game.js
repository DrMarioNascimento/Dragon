/* MOSAICO A Noite — carregador funcional sem interferência de layout */
(function(){
  const s=document.createElement('script');
  s.async=false;
  s.src='game-fixed.js?v=20260831-actions4';
  s.onerror=()=>console.error('MOSAICO: falha ao carregar núcleo funcional.');
  s.onload=()=>{
    const o=document.createElement('script');
    o.async=false;
    o.src='opening-flow.js?v=20260831-opening3';
    o.onerror=()=>console.error('MOSAICO: falha ao carregar abertura celular.');
    document.head.appendChild(o);
  };
  document.head.appendChild(s);
})();
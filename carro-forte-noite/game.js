/* MOSAICO A Noite — cascata do núcleo: primeiro o que joga, depois o que veste.
   A ordem importa: o layout compacto move os botões de ação para dentro de um
   grupo próprio, e só pode fazer isso depois que o núcleo já pendurou os
   ouvintes neles. appendChild move o nó com os ouvintes junto; recriar, não. */
(function(){
  const s=document.createElement('script');
  s.async=false;
  s.src='game-fixed.js?v=20260901-pergunta1';
  s.onerror=()=>console.error('MOSAICO: falha ao carregar núcleo funcional.');
  s.onload=()=>{
    const o=document.createElement('script');
    o.async=false;
    o.src='opening-flow.js?v=20260831-opening3';
    o.onerror=()=>console.error('MOSAICO: falha ao carregar abertura celular.');
    o.onload=()=>{
      const l=document.createElement('script');
      l.async=false;
      l.src='layout-compacto.js?v=20260831-hud7';
      l.onerror=()=>console.error('MOSAICO: falha ao carregar layout compacto.');
      document.head.appendChild(l);
    };
    document.head.appendChild(o);
  };
  document.head.appendChild(s);
})();

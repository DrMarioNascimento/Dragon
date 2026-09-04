/* MOSAICO A Noite — cascata do carregamento.
   Abertura antes do núcleo; apresentação e roteador de interação depois. */
(function () {
  const carregar = (src, depois) => {
    const s = document.createElement('script');
    s.async = false;
    s.src = src;
    s.onerror = () => { console.error('MOSAICO: falha ao carregar ' + src); depois?.(); };
    s.onload = () => depois?.();
    document.head.appendChild(s);
  };
  carregar('opening-flow.js?v=20260901-ios2', () => {
    carregar('game-fixed.js?v=20260901-auditoria', () => {
      carregar('layout-compacto.js?v=20260901-toque3', () => {
        carregar('touch-router.js?v=20260901-toque1', () => {
          /* Depois do núcleo, porque lê QUESTIONS e a sala. É acessório: se
             falhar, o console avisa e a partida segue sem telão. */
          carregar('telao-publica.js?v=20260904-telao1');
        });
      });
    });
  });
})();

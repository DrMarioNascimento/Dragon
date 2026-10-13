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
  carregar('opening-flow.js?v=20260915-audio-cta', () => {
    /* 11/10/2026 (Tarefa 4): as variações da solução, antes do núcleo */
    carregar('../../../jogos/a-manha-do-carro-forte/a-mesa/variacoes-carro-dados.js?v=20261012-v2', () => carregar('../../../jogos/a-manha-do-carro-forte/a-mesa/variacoes-carro.js?v=20261012-v2', () => {
    carregar('game-fixed.js?v=20261012-v2', () => {
      carregar('layout-compacto.js?v=20260901-toque3', () => {
        carregar('touch-router.js?v=20260901-toque1', () => {
          carregar('telemetria-teste.js?v=20261011-sdk12', () => {
            /* Depois do núcleo, porque lê QUESTIONS e a sala. É acessório: se
               falhar, o console avisa e a partida segue sem telão. */
            carregar('telao-publica.js?v=20261011-sdk12');
            /* 11/10/2026: o aprendizado da tela (o mesmo arquivo da manhã) */
            carregar('../../../jogos/a-manha-do-carro-forte/a-mesa/aprendizado-carro.js?v=20261011-pele2');
          });
        });
      });
    });
    }));
  });
})();

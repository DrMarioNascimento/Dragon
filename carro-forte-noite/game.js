/* MOSAICO A Noite — cascata do carregamento.

   A ordem aqui não é estética, é corrida evitada. Quem dá vida ao botão
   "Entrar na reunião" é o game-fixed.js, na última linha do arquivo. Quem
   cria a abertura é o opening-flow.js. Enquanto a abertura vinha depois do
   núcleo, existia uma janela — um pedido de rede inteiro — em que o botão já
   respondia e `window.MosaicoOpening` ainda era undefined. O Mestre que
   tocasse dentro dessa janela caía no caminho de baixo e a abertura era
   pulada, em silêncio, sem erro nenhum. Em localhost a janela é de zero
   milissegundo e o defeito não aparece; no celular, em rede de verdade, sim.

   A abertura vem primeiro porque não depende de ninguém: monta o próprio DOM
   e só dispara `mosaico-opening-finished` quando alguém age, muito depois.
   Assim, no instante em que o botão passa a responder, ela já existe.

   O layout compacto continua por último: ele move os botões de ação para
   dentro de um grupo, e só pode fazer isso depois que o núcleo pendurou os
   ouvintes neles. appendChild move o nó com os ouvintes junto; recriar, não. */
(function () {
  const carregar = (src, depois) => {
    const s = document.createElement('script');
    s.async = false;
    s.src = src;
    s.onerror = () => {
      console.error('MOSAICO: falha ao carregar ' + src);
      depois?.();
    };
    s.onload = () => depois?.();
    document.head.appendChild(s);
  };

  carregar('opening-flow.js?v=20260901-ordem1', () => {
    carregar('game-fixed.js?v=20260901-auditoria', () => {
      carregar('layout-compacto.js?v=20260901-auditoria');
    });
  });
})();

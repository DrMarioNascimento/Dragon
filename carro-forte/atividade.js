/* MOSAICO — A Manhã do Carro-Forte · núcleo das atividades sensoriais.

   As três páginas compartilham: ler o lote que a Mesa entregou pela URL,
   mostrar o quanto já foi alcançado, e devolver a colheita quando a mesa
   concluir. O que cada uma tem de próprio é o gesto — e só isso.

   Duas regras valem para todas:

   1. Concluir está sempre liberado. Sair com dois de quatro é uma jogada, não
      um erro de operação: o custo aparece no dossiê, não num botão travado.
   2. O texto do fragmento não existe no DOM antes de ser alcançado. Antes o
      Vidro Embaçado escrevia os quatro fatos no carregamento e cobria com um
      CSS embaçado — quem abrisse o inspetor lia tudo sem passar o dedo. */
(function () {
  const par = new URLSearchParams(location.search);
  const banco = window.MOSAICO_FRAGMENTOS || {};
  const partida = par.get('partida') || 'peso';

  function itens(sensor) {
    const pedidos = (par.get('itens') || '').split(',').map((s) => s.trim()).filter((c) => banco[c]);
    if (pedidos.length) return pedidos;
    /* Aberta fora da Mesa — para conferir a atividade, ou por link solto. Sem
       lote, a página se serve de alguns fragmentos para ter o que mostrar; a
       colheita não chega a mesa nenhuma. */
    return Object.keys(banco).slice(sensor === 'vidro' ? 12 : 0, (sensor === 'vidro' ? 12 : 0) + 4);
  }

  const titulo = (cod) => banco[cod]?.t || cod;
  const texto = (cod) => banco[cod]?.d || '';

  function marcar(achados, todos) {
    const conta = document.getElementById('conta');
    if (conta) conta.textContent = `${achados.size} de ${todos.length}`;
    const lista = document.getElementById('lista');
    if (lista)
      lista.innerHTML = todos
        .filter((c) => achados.has(c))
        .map((c) => `<div class="achado"><b>${c} · ${titulo(c)}</b><span>${texto(c)}</span></div>`)
        .join('');
  }

  function iniciar({ sensor, itens: todos, achados }) {
    const botao = document.getElementById('finish');
    const kicker = document.getElementById('kicker');
    if (kicker) kicker.textContent = `MOSAICO · ${partida.toUpperCase()}`;
    marcar(achados, todos);

    const rotular = () => {
      botao.textContent = achados.size === todos.length
        ? `Concluir com os ${todos.length} ✓`
        : `Concluir com ${achados.size} de ${todos.length}`;
    };
    rotular();
    const observador = setInterval(rotular, 200);

    botao.onclick = () => {
      clearInterval(observador);
      const aviso = {
        fonte: 'mosaico-carro-forte',
        tipo: 'sensor-concluido',
        sensor,
        partida,
        colheita: todos.filter((c) => achados.has(c)),
      };
      /* Duas vias: o BroadcastChannel alcança qualquer aba da mesma origem, e o
         opener cobre quem não tem BroadcastChannel. Marcar é idempotente. */
      try { new BroadcastChannel('mosaico-carro-forte').postMessage(aviso) } catch (e) {}
      try { opener && opener.postMessage(aviso, location.origin) } catch (e) {}
      botao.textContent = 'Concluída ✓ · volte para a Mesa';
      botao.disabled = true;
      document.body.classList.add('encerrada');
    };
  }

  window.MosaicoAtividade = { itens, titulo, texto, marcar, iniciar, partida };
})();

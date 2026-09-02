/* MOSAICO — A Casa da Costa · o Mercado do Captura, sobreposto
   02/09/2026. Mario: "traz tudo de lá e sobrepõe, só usa daqui a confiança".

   SAIU: o mercado de negociação da Casa, em que cada um punha a própria pista
   à venda escolhendo a faixa (baixo 1 / justo 3 / alto 5) e os outros
   compravam às cegas.

   ENTROU: a banca do Captura, com preço fixo — mas SIMULTÂNEA, sem rodízio de
   vez: todos agem ao mesmo tempo, no próprio aparelho, com teto de 3 ações.

     COMPRAR NOVA — 4 · uma peça do monte, que aqui é o que NINGUÉM descobriu
       nas atividades. Metade do dossiê nunca chegava a jogador nenhum; agora
       tem uma segunda porta, e ela é cara.
     COMPRAR REPASSADA — 2 · uma peça do balaio, às cegas. Metade do preço
       porque vem com desconfiança embutida: alguém decidiu que não a queria.
     CONSIGNAR — entrega ao balaio e NÃO paga nada agora. O crédito de 2 só
       entra se alguém levar; se ninguém levar, ficou sem a peça e sem a
       moeda. É aposta, não venda.
     ARRISCAR — 3 · compromete uma resposta da decisão final antes da hora.
       Acertou, a moeda volta e o campo fica fechado com a resposta certa.
       Errou, você fica preso à resposta errada — o campo fecha assim mesmo.

   Fecha PARA VOCÊ, não para a mesa: a decisão da Casa é individual e
   simultânea, e fechar para todos esvaziaria os 13 pontos de qualidade e
   premiaria quem não gastou nada. Arriscar não compra ponto — compra
   VELOCIDADE, e velocidade já vale 29 na colocação da decisão.

   A CONFIANÇA é a única coisa que ficou da Casa, e muda de objeto: ela
   julgava o preço que você pedia; passa a julgar O QUE VOCÊ PÔS NO BALAIO,
   quando alguém pagou por isso. Consignar peça forte e alguém levar conta a
   favor; empurrar contextual conta contra. A matriz e os limites do V5 são os
   mesmos, e por isso o componente `economia` continua fechando em 20. */
(function (global) {
  "use strict";

  function caso() { return global.CASO || null; }
  function regras() {
    var c = caso();
    return (c && c.mercado) || { precos: { nova: 4, repassada: 2, arriscar: 3 }, lacradosPorVez: 3, consignadaVolta: false };
  }
  function preco(k) { return Number(regras().precos[k]) || 0; }
  function esc0(s) { return typeof esc === "function" ? esc(s) : String(s == null ? "" : s); }
  function frag(cod) { var c = caso(); return (c && c.fragmentos && c.fragmentos[cod]) || null; }

  /* ── Estado ─────────────────────────────────────────────────────────────
     O balaio é da SALA: todos precisam ver a mesma pilha, e quem consignou
     precisa ser creditado no aparelho de quem comprou. Os travamentos são do
     JOGADOR: arriscar fecha para você. */
  function balaio() { return (global.STATE && STATE.doc && STATE.doc.balaio) || []; }
  function meuEstado() {
    var eu = typeof meuJogador === "function" ? meuJogador() : null;
    return eu || null;
  }
  function travados() { var eu = meuEstado(); return (eu && eu.travados) || {}; }
  function moedas() { var eu = meuEstado(); return Math.max(0, Math.trunc(Number(eu && eu.moedas) || 0)); }

  /* SIMULTÂNEO, sem rodízio de vez: todos agem ao mesmo tempo, no próprio
     aparelho, durante os 180 s da fase. O que limita não é o relógio — numa
     mesa de 12 o rodízio daria UMA ação por pessoa — e sim o teto.

     Arriscar conta como ação. Acertar devolve a moeda, então sem o teto daria
     para fechar a decisão inteira de graça, bastando saber as respostas. */
  function tetoAcoes() { return Number(regras().acoesPorPessoa) || 3; }
  function acoesUsadas() { var eu = meuEstado(); return Math.max(0, Number(eu && eu.acoesMercado) || 0); }
  function podeAgir() { return acoesUsadas() < tetoAcoes(); }

  /* O monte é o que sobrou: fragmentos do dossiê que ninguém descobriu nas
     atividades e que também não estão no balaio. Se o banco não estiver
     carregado, o mercado simplesmente não oferece "nova" — melhor não
     oferecer do que oferecer vazio. */
  function monte() {
    var B = global.MosaicoBancoCasa;
    if (!B || !B.dossie) return [];
    var d = B.dossie(); if (!d) return [];
    var fora = {};
    (global.STATE && STATE.jogadores || []).forEach(function (j) {
      (j.pistas || []).forEach(function (p) { if (p.frag) fora[p.frag] = 1; });
    });
    balaio().forEach(function (x) { fora[x.frag] = 1; });
    return d.lista.filter(function (cod) { return !fora[cod]; });
  }

  function minhasPecas() {
    return (typeof minhasPistas === "function" ? minhasPistas() : [])
      .filter(function (p) { return p.frag; });
  }

  /* ── Campos da decisão, para o ARRISCAR ─────────────────────────────── */
  function campos() {
    var c = caso(); if (!c || !c.partidas) return [];
    var id = (global.STATE && STATE.doc && STATE.doc.partidaId) ||
             (global.STATE && STATE.partidaId) || c.perguntaPadrao;
    var p = c.partidas[id];
    return (p && p.campos) || [];
  }
  function abertos() {
    var t = travados();
    return campos().filter(function (c) { return !t[c.id]; });
  }

  /* ── Gravação ───────────────────────────────────────────────────────── */
  async function salvarJogador(dados) {
    var eu = global.STATE && STATE.eu; if (!eu) return;
    var FB = await esperarFB();
    await FB.atualizarJogador(eu.codigo, eu.id, dados);
  }
  /* Mesmo problema do rendimento: `STATE.mesa` é null no celular de quem
     entrou pelo QR, e o código da sala está em `STATE.eu.codigo`. */
  function codigoSala() {
    return (global.STATE && STATE.mesa && STATE.mesa.codigo) ||
           (global.STATE && STATE.eu && STATE.eu.codigo) || "";
  }
  /* ESTA FUNÇÃO TEM DE LANÇAR, e não voltar calada. Ela voltava, e as duas
     chamadas seguiam adiante como se a gravação tivesse acontecido:

       consignar — `salvarJogador` tirava a peça da mão logo depois, e o
                   balaio nunca recebia. O fragmento simplesmente sumia.
       comprar   — a peça saía da lista local e continuava no balaio de todo
                   mundo. Dois jogadores ficavam com a mesma peça.

     Lançando, o `await` de quem chamou interrompe antes de mexer na mão, e
     a peça fica onde estava. Perder a ação é recuperável; perder a peça não. */
  async function salvarBalaio(lista) {
    var codigo = codigoSala();
    if (!codigo) throw new Error("sala sem código: o balaio não pode ser gravado");
    var FB = await esperarFB();
    await FB.atualizarMesa(codigo, { balaio: lista });
  }

  /* A confiança reaproveita a matriz do V5 sem tocar nela: a faixa é sempre
     "justo" — não há preço a escolher —, e a qualidade sai da FUNÇÃO da peça
     consignada. Assim consignar estrutural e alguém levar conta a favor,
     empurrar contextual conta contra, e o teto de ±7 continua valendo. */
  var QUALIDADE = { estrutural: "boa", relacional: "mediana", interpretativo: "mediana", contextual: "ruim" };
  async function registrarNegociacao(cod, vendedorId, compradorId) {
    if (!vendedorId || vendedorId === compradorId) return;
    var f = frag(cod); if (!f) return;
    var FB = await esperarFB();
    await FB.gravarServidor(STATE.eu.codigo, "negociacoes", vendedorId + "_" + cod, {
      vendedorId: vendedorId, compradorId: compradorId, pistaId: "lote-" + cod,
      status: "comprada", faixaPreco: "justo", qualidade: QUALIDADE[f.f] || "mediana"
    }, "fechadaEm");
  }

  /* ── Ações ──────────────────────────────────────────────────────────── */
  global.mercadoComprarNova = async function () {
    var m = monte(), custo = preco("nova");
    if (!podeAgir()) return avisa("Você já usou as suas " + tetoAcoes() + " ações.");
    if (moedas() < custo) return avisa("Moedas insuficientes.");
    if (!m.length) return avisa("O monte acabou.");
    STATE.mercadoPainel = { tipo: "nova", opcoes: m.slice(0, Number(regras().lacradosPorVez) || 3) };
    render();
  };
  global.mercadoComprarRepassada = async function () {
    var b = balaio(), custo = preco("repassada");
    if (!podeAgir()) return avisa("Você já usou as suas " + tetoAcoes() + " ações.");
    if (moedas() < custo) return avisa("Moedas insuficientes.");
    if (!b.length) return avisa("O balaio está vazio.");
    STATE.mercadoPainel = { tipo: "repassada", opcoes: b.map(function (x) { return x.frag; }) };
    render();
  };
  global.mercadoFechaPainel = function () { STATE.mercadoPainel = null; render(); };

  global.mercadoLevar = async function (cod) {
    var painel = STATE.mercadoPainel; if (!painel) return;
    var custo = preco(painel.tipo === "nova" ? "nova" : "repassada");
    var eu = meuEstado(); if (!eu || eu.moedas < custo) return avisa("Moedas insuficientes.");
    var f = frag(cod); if (!f) return;
    STATE.mercadoPainel = null;

    var dono = null;
    if (painel.tipo === "repassada") {
      var atual = balaio();
      /* GUARDA DA CORRIDA. O balaio mora no documento da sala e some da tela
         de todos assim que alguém leva — mas entre dois cliques no mesmo
         instante cabe uma janela antes do snapshot chegar. Se a peça já não
         está lá, o clique não faz nada: ninguém paga por ar, ninguém perde a
         ação, e a pessoa escolhe outra. */
      if (!atual.some(function (x) { return x.frag === cod; })) {
        return avisa("Essa já foi levada. Escolha outra.");
      }
      var resto = atual.filter(function (x) {
        if (x.frag === cod && dono === null) { dono = x.dono; return false; }
        return true;
      });
      await salvarBalaio(resto);
    }
    var FB = await esperarFB();
    await FB.acrescentarPista(STATE.eu.codigo, STATE.eu.id, {
      id: "mercado-" + cod, hora: f.h || "—", txt: f.d,
      adquirida: true, origem: "mercado", frag: cod
    });
    await salvarJogador({ moedas: eu.moedas - custo, acoesMercado: acoesUsadas() + 1 });
    /* O crédito do consignante entra aqui, no aparelho de quem comprou: é o
       único momento em que se sabe que a peça saiu. */
    if (dono) {
      var vendedor = (STATE.jogadores || []).find(function (j) { return j.id === dono; });
      if (vendedor) await FB.atualizarJogador(STATE.eu.codigo, dono, { moedas: (Number(vendedor.moedas) || 0) + custo });
      await registrarNegociacao(cod, dono, STATE.eu.id);
    }
    render();
  };

  global.mercadoConsignar = function () {
    var pecas = minhasPecas();
    if (!podeAgir()) return avisa("Você já usou as suas " + tetoAcoes() + " ações.");
    if (!pecas.length) return avisa("Você não tem fragmento para consignar.");
    STATE.mercadoPainel = { tipo: "consignar", opcoes: pecas.map(function (p) { return p.frag; }) };
    render();
  };
  global.mercadoConfirmaConsignar = async function (cod) {
    STATE.mercadoPainel = null;
    var eu = STATE.eu; if (!eu) return;
    await salvarBalaio(balaio().concat([{ frag: cod, dono: eu.id }]));
    var minhas = minhasPistas().filter(function (p) { return p.frag !== cod; });
    await salvarJogador({ pistas: minhas, acoesMercado: acoesUsadas() + 1 });
    render();
  };

  global.mercadoArriscar = function () {
    if (!podeAgir()) return avisa("Você já usou as suas " + tetoAcoes() + " ações.");
    if (moedas() < preco("arriscar")) return avisa("Moedas insuficientes.");
    if (!abertos().length) return avisa("Todos os campos já estão fechados.");
    STATE.mercadoPainel = { tipo: "arriscar" };
    render();
  };
  global.mercadoArriscarCampo = function (campoId) {
    STATE.mercadoPainel = { tipo: "arriscar-resposta", campoId: campoId };
    render();
  };
  global.mercadoResponder = async function (campoId, valor) {
    STATE.mercadoPainel = null;
    var eu = meuEstado(); if (!eu) return;
    var c = campos().find(function (x) { return x.id === campoId; }); if (!c) return;
    var certo = valor === c.resposta;
    var t = Object.assign({}, travados());
    t[campoId] = { resposta: valor, ok: certo };
    /* Acertar é de graça: a moeda volta. Errar custa 3 E prende você à
       resposta errada, que entra assim na decisão final. */
    await salvarJogador({ travados: t, moedas: eu.moedas - (certo ? 0 : preco("arriscar")), acoesMercado: acoesUsadas() + 1 });
    render();
  };

  /* ── Tela ───────────────────────────────────────────────────────────── */
  var css = document.createElement("style");
  css.textContent = `
    .mkt-linha{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin:14px 0}
    .mkt-acao{padding:13px 12px;border:1px solid rgba(232,164,76,.42);border-radius:10px;text-align:left;
      background:linear-gradient(165deg,rgba(20,30,42,.96),rgba(7,11,17,.98));color:var(--texto);
      /* volume: css/profundidade.css. Nao redesenhar aqui — ver o item 5 de la. */}
    .mkt-acao:disabled{opacity:1;border-color:rgba(143,163,184,.2);color:#7d8a97}
    .mkt-acao b{display:block;color:#fff;font:700 16px/1.15 var(--serif)}
    .mkt-acao small{display:block;color:#f0b45f;font:800 11px/1.3 var(--sans);letter-spacing:.1em;text-transform:uppercase;margin-top:3px}
    .mkt-acao span{display:block;color:var(--texto);font:500 13px/1.4 var(--serif);margin-top:4px}
    .mkt-lacres{display:grid;grid-template-columns:repeat(auto-fit,minmax(96px,1fr));gap:9px;margin:12px 0}
    .mkt-lacre{padding:20px 10px;border-radius:10px;text-align:center;border:1px solid;font:800 12px/1.3 var(--sans);
      letter-spacing:.08em;text-transform:uppercase}
    /* Cores distintas, como o Mario pediu: nova é âmbar da casa, repassada é
       fria. A cor é o único jeito de a mesa ler a procedência sem abrir. */
    .mkt-lacre.nova{border-color:rgba(232,164,76,.7);color:#ffd9a8;background:linear-gradient(165deg,rgba(74,50,20,.96),rgba(24,16,8,.98))}
    .mkt-lacre.repassada{border-color:rgba(127,212,255,.55);color:#cfeaff;background:linear-gradient(165deg,rgba(18,40,54,.96),rgba(6,14,20,.98))}
    .mkt-lacre.peca{border-color:rgba(143,163,184,.4);color:var(--texto);background:rgba(10,15,22,.94);
      font:600 14px/1.3 var(--serif);letter-spacing:0;text-transform:none;padding:13px 11px}
    .mkt-campo{width:100%;margin:0 0 8px;padding:12px;text-align:left;border:1px solid rgba(232,164,76,.3);
      border-radius:9px;background:rgba(10,15,22,.94);color:var(--texto);font:600 15px/1.35 var(--serif)}
    .mkt-travado{padding:9px 11px;border-left:3px solid;border-radius:0 7px 7px 0;background:rgba(8,13,20,.9);margin-bottom:7px}
    .mkt-travado.ok{border-left-color:#6fd48a}
    .mkt-travado.erro{border-left-color:var(--vermelho)}
    .mkt-travado b{display:block;color:#fff;font:700 14px/1.2 var(--serif)}
    .mkt-travado span{display:block;color:var(--texto);font:500 13px/1.4 var(--serif);margin-top:2px}
  `;
  document.head.appendChild(css);

  function painelHtml() {
    var p = STATE.mercadoPainel; if (!p) return "";
    if (p.tipo === "arriscar") {
      return '<div class="card"><span class="eyebrow">Arriscar · ' + preco("arriscar") + ' moedas</span>' +
        '<p class="muted">Qual campo você quer comprometer agora? Acertando, a moeda volta.</p>' +
        abertos().map(function (c) {
          return '<button class="mkt-campo" onclick="mercadoArriscarCampo(\'' + esc0(c.id) + '\')">' + esc0(c.rotulo) + '</button>';
        }).join('') +
        '<button class="btn btn-frio" onclick="mercadoFechaPainel()">Voltar</button></div>';
    }
    if (p.tipo === "arriscar-resposta") {
      var c = campos().find(function (x) { return x.id === p.campoId; }); if (!c) return "";
      return '<div class="card"><span class="eyebrow">' + esc0(c.rotulo) + '</span>' +
        '<p class="muted">Errando, você fica preso a esta resposta na decisão final.</p>' +
        c.opcoes.map(function (o) {
          return '<button class="mkt-campo" onclick="mercadoResponder(\'' + esc0(c.id) + '\',this.dataset.v)" data-v="' + esc0(o) + '">' + esc0(o) + '</button>';
        }).join('') +
        '<button class="btn btn-frio" onclick="mercadoFechaPainel()">Voltar</button></div>';
    }
    if (p.tipo === "consignar") {
      return '<div class="card"><span class="eyebrow">Consignar no balaio</span>' +
        '<p class="muted">Você entrega agora e só recebe se alguém levar. Se ninguém levar, ficou sem a peça.</p>' +
        '<div class="mkt-lacres">' + p.opcoes.map(function (cod) {
          var f = frag(cod); if (!f) return '';
          return '<button class="mkt-lacre peca" onclick="mercadoConfirmaConsignar(\'' + esc0(cod) + '\')">' + esc0(f.t) + '</button>';
        }).join('') + '</div>' +
        '<button class="btn btn-frio" onclick="mercadoFechaPainel()">Voltar</button></div>';
    }
    /* Compra: as peças ficam de costas. Só a COR diz a procedência. */
    var rot = regras().rotulos || {};
    var nome = p.tipo === "nova" ? (rot.nova || "Nova") : (rot.repassada || "Repassada");
    return '<div class="card"><span class="eyebrow">' + esc0(nome) + ' · ' + preco(p.tipo) + ' moedas</span>' +
      '<p class="muted">Escolha uma. O conteúdo só aparece depois de paga.</p>' +
      '<div class="mkt-lacres">' + p.opcoes.map(function (cod, i) {
        return '<button class="mkt-lacre ' + (p.tipo === "nova" ? "nova" : "repassada") + '" onclick="mercadoLevar(\'' + esc0(cod) + '\')">' + esc0(nome) + '<br>' + (i + 1) + '</button>';
      }).join('') + '</div>' +
      '<button class="btn btn-frio" onclick="mercadoFechaPainel()">Voltar</button></div>';
  }

  global.telaMercado = function () {
    var eu = meuEstado(); if (!eu) return '';
    if (STATE.mercadoPainel) return painelHtml();
    var t = travados(), fechados = Object.keys(t).length, total = campos().length;
    var lista = campos().filter(function (c) { return t[c.id]; }).map(function (c) {
      var v = t[c.id];
      return '<div class="mkt-travado ' + (v.ok ? 'ok' : 'erro') + '"><b>' + esc0(c.rotulo) + '</b><span>' + esc0(v.resposta) + '</span></div>';
    }).join('');
    var m = monte().length, b = balaio().length, moeda = moedas();

    return (typeof cronometroMercadoHTML === "function" ? cronometroMercadoHTML() : '') +
      '<span class="eyebrow">Mercado</span><h2>' + moeda + ' moedas</h2>' +
      '<p class="muted">' + (tetoAcoes() - acoesUsadas()) + ' de ' + tetoAcoes() + ' ações restantes</p>' +
      '<p class="lead">Nova nunca esteve com ninguém. Repassada alguém decidiu não querer.</p>' +
      '<div class="mkt-linha">' +
        '<button class="mkt-acao" onclick="mercadoComprarNova()" ' + (!podeAgir() || moeda < preco("nova") || !m ? 'disabled' : '') + '>' +
          '<b>Nova</b><small>' + preco("nova") + ' moedas</small><span>' + m + ' no monte</span></button>' +
        '<button class="mkt-acao" onclick="mercadoComprarRepassada()" ' + (!podeAgir() || moeda < preco("repassada") || !b ? 'disabled' : '') + '>' +
          '<b>Repassada</b><small>' + preco("repassada") + ' moedas</small><span>' + b + ' no balaio</span></button>' +
        '<button class="mkt-acao" onclick="mercadoConsignar()" ' + (podeAgir() && minhasPecas().length ? '' : 'disabled') + '>' +
          '<b>Consignar</b><small>recebe ' + preco("repassada") + ' se sair</small><span>entrega agora, crédito depois</span></button>' +
        '<button class="mkt-acao" onclick="mercadoArriscar()" ' + (!podeAgir() || moeda < preco("arriscar") || !abertos().length ? 'disabled' : '') + '>' +
          '<b>Arriscar</b><small>' + preco("arriscar") + ' moedas</small><span>acertou, a moeda volta</span></button>' +
      '</div>' +
      (fechados ? '<span class="eyebrow">Já comprometido</span>' + lista : '') +
      (meuEstado() && meuEstado().mercadoPronto
        ? '<p class="muted" style="text-align:center">Você encerrou. A fase avança quando todos encerrarem.</p>'
        : (podeAgir() ? '<button class="btn btn-frio" onclick="mercadoEncerrar()">Encerrei — não vou usar as ações que sobraram</button>' : '')) +
      '<p class="muted" style="text-align:center">' + fechados + ' de ' + total + ' campos fechados.' +
        (fechados >= total && total ? ' Sua decisão está pronta.' : '') + '</p>';
  };

  /* ── A decisão herda o que foi comprometido ─────────────────────────── */
  var deducaoBase = global.telaDeducao;
  global.telaDeducao = function () {
    var html = deducaoBase.apply(this, arguments);
    var t = travados(); if (!html || !Object.keys(t).length) return html;
    /* Campo comprometido no Mercado chega preenchido e travado — inclusive o
       errado. Foi o que a pessoa comprou; voltar atrás anularia o risco. */
    Object.keys(t).forEach(function (id) {
      var v = t[id], marca = 'id="ded-' + id + '"';
      html = html.replace(marca, marca + ' disabled data-travado="' + (v.ok ? "ok" : "erro") + '"')
                 .replace(new RegExp('(id="ded-' + id + '"[^>]*>)([\\s\\S]*?)</select>'), function (todo, abre, corpo) {
                   return abre + corpo.replace('<option value="' + v.resposta + '"', '<option value="' + v.resposta + '" selected') + '</select>';
                 });
    });
    return html;
  };

  var enviarBase = global.enviarDeducao;
  global.enviarDeducao = async function () {
    /* `disabled` não entra em formulário nem é lido por getElementById().value
       de forma confiável quando o navegador não repinta — então o valor
       comprometido é reposto antes do envio. Sem isto, quem arriscou não
       consegue enviar: o campo parece vazio e o aviso pede para preencher. */
    var t = travados();
    Object.keys(t).forEach(function (id) {
      var el = document.getElementById("ded-" + id);
      if (el) { el.disabled = false; el.value = t[id].resposta; }
    });
    return enviarBase.apply(this, arguments);
  };

  /* ── O Mercado avança quando ninguém tem mais o que fazer ─────────────
     Ele era `somentePrazo: true`: esperava os 180 s inteiros mesmo com a mesa
     parada. Fazia sentido no mercado antigo, onde comprar e vender não tinham
     fim — não havia como saber que alguém "terminou". Agora há: três ações e
     acabou.

     Quem guarda moeda de propósito (a reserva pontua) continua com opções, e
     por isso existe o "Encerrei": é como essa pessoa libera a mesa sem ser
     obrigada a gastar. Sem esse botão, um único poupador segura todo mundo
     olhando o relógio por três minutos. */
  function acabou(j) {
    if (j && j.mercadoPronto) return true;
    return (Number(j && j.acoesMercado) || 0) >= tetoAcoes();
  }
  global.mercadoEncerrar = async function () {
    await salvarJogador({ mercadoPronto: true });
    render();
  };

  var automacaoBase = global.dadosAutomacao;
  global.dadosAutomacao = function () {
    var d = automacaoBase.apply(this, arguments);
    if (!d || d.fase !== "mercado") return d;
    var js = (global.STATE && STATE.jogadores) || [];
    return {
      fase: d.fase, inicio: d.inicio, limite: d.limite, acao: d.acao,
      recebidos: js.filter(acabou).length,
      total: Math.max(1, js.length)
    };
  };

  global.MosaicoMercadoCasa = {
    monte: monte, balaio: balaio, travados: travados, regras: regras,
    acabou: acabou, tetoAcoes: tetoAcoes, acoesUsadas: acoesUsadas
  };
})(window);

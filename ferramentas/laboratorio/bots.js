/* MOSAICO — BOTS EXTERNOS
 * ============================================================================
 * Bots que são JOGADORES DE VERDADE no dado, dirigidos de fora do jogo.
 *
 * O jogo não sabe que eles existem. Não há uma linha de `se for bot` em v1/
 * nem em v2/: cada bot é um documento em `jogadores`, com moeda, pistas e
 * ações como qualquer pessoa. É isso que faz o teste valer — moeda que o bot
 * gasta é moeda que saiu do balaio de verdade, e a contagem de "todos
 * prontos" conta ele sem exceção.
 *
 * ---------------------------------------------------------------------------
 * POR QUE UMA SESSÃO POR BOT
 *
 * As regras (firestore.rules, provado em tests/regras.test.mjs) exigem
 * `playerId == request.auth.uid` para criar o jogador e
 * `jogadorId == request.auth.uid` para criar em `acoes`, `tarefas`, `votos` e
 * `deducoes`. O Mestre NÃO pode agir por eles nessas coleções. Cada bot
 * precisa mesmo da própria autenticação.
 *
 * ---------------------------------------------------------------------------
 * POR QUE REST, E NÃO O SDK
 *
 * A primeira versão criava um `initializeApp` por bot. O terceiro TRAVOU:
 * leitura e escrita paradas, sem erro nenhum. Cada instância do Firestore
 * abre streams próprios, e o navegador limita conexões por domínio — não era
 * regra negando, era fila de socket cheia. Medido, não suposto.
 *
 * Os bots passaram a falar REST (ferramentas/laboratorio/rest.js): cada ação
 * é uma requisição que nasce e morre. Bot não precisa de tempo real, precisa
 * AGIR. A sala também é lida por REST, na mesma volta — a página não
 * carrega o SDK do Firebase de jeito nenhum.
 *
 * ---------------------------------------------------------------------------
 * O QUE ELES NÃO FAZEM
 *
 * Não jogam as atividades sensoriais: aquilo é sensor de aparelho, e bot
 * girando telefone imaginário não ensina nada. Carimbam chegada e conclusão,
 * o que exercita o placar e o lote sem fingir que mediu gesto.
 *
 * E não dizem se o jogo é bom. Para NÚMERO existem as bancadas em
 * ferramentas/; para feel, gente jogando. Isto serve ao que falta entre as
 * duas: uma mesa cheia, de verdade, no caminho publicado.
 * ==========================================================================*/
(function () {
  "use strict";

  var UI = {}, bots = [], sala = null, cfg = null, timer = null;
  var codigoAtivo = "", log = [];

  function $(id) { return document.getElementById(id); }
  function diz(t) {
    log.unshift(new Date().toLocaleTimeString() + " · " + t);
    log = log.slice(0, 200);
    $("log").textContent = log.join("\n");
  }
  function rnd(a) { return a[Math.floor(Math.random() * a.length)]; }
  function colecao() { return $("colecao").value; }
  function emulador() { return $("emulador").checked; }
  function lerConfig() {
    try { return JSON.parse($("cfg").value); }
    catch (e) { diz("config inválida: " + e.message); return null; }
  }

  var NOMES = ["Helena", "Augusto", "Lia", "Rafael", "Beatriz", "Caio", "Nina",
               "Otávio", "Marta", "Élio", "Sofia"];

  /* OS CÓDIGOS DO CASO.
     O bot precisa pedir um fragmento que EXISTE: a primeira linha do Mestre
     busca o código e devolve "sem-fragmento" se não achar, então pedir null
     seria recusa garantida e a bancada mediria zero compra para sempre.
     Ele não conhece o monte — isso é do jogo, e é o Mestre quem confere. Pede
     um código do caso que não está na sua mão, e a recusa, quando vier, é
     resposta de verdade ('ja-levada', 'sem-moeda'), que é o que se quer medir. */
  var CODIGOS = [];
  async function carregarCodigos() {
    try {
      var r = await fetch("../../v1/casos/casa-da-costa.json");
      var caso = await r.json();
      CODIGOS = Object.keys(caso.fragmentos || {});
    } catch (e) { CODIGOS = []; }
    if (!CODIGOS.length) {
      for (var i = 1; i <= 36; i++) CODIGOS.push("F" + String(i).padStart(2, "0"));
      diz("banco do caso não carregou — usando F01–F36");
    }
  }

  function caminho(bot, resto) {
    return colecao() + "/" + codigoAtivo + (resto ? "/" + resto : "");
  }

  /* ── entrar na mesa ───────────────────────────────────────────────────── */
  async function acender(nome) {
    var s = await LabREST.entrarAnonimo(cfg, emulador());
    return {
      nome: nome, uid: s.uid, sessao: s, estado: "ligado",
      moedas: null, acoes: 0, pistas: 0, pedidos: 0, recusas: 0,
      esperando: 0, marca: null,
    };
  }
  async function entrar(bot, moedasIniciais) {
    await LabREST.gravar(cfg, emulador(), bot.sessao, caminho(bot, "jogadores/" + bot.uid), {
      nome: bot.nome, personagem: "", forma: "n", pronto: false,
      entrouMs: Date.now(), votos: 0, moedas: moedasIniciais, total: 0,
      pistas: [], bot: true,
    });
    bot.estado = "na mesa";
    /* `pronto` é uma das quatro chaves que o próprio jogador pode mexer, e a
       máscara é o que faz a regra ver só ela em `affectedKeys` */
    await LabREST.gravar(cfg, emulador(), bot.sessao, caminho(bot, "jogadores/" + bot.uid),
      { pronto: true, atualizadoEmMs: Date.now() }, ["pronto", "atualizadoEmMs"]);
    bot.estado = "pronto";
  }

  /* ── o que faz em cada fase ───────────────────────────────────────────── */
  async function pedir(bot, tipo, dados) {
    var id = bot.uid + "-lab-" + Date.now().toString(36);
    await LabREST.gravar(cfg, emulador(), bot.sessao, caminho(bot, "acoes/" + id),
      Object.assign({ tipo: tipo, jogadorId: bot.uid, criadaEm: new Date() }, dados || {}));
    bot.pedidos++;
    /* FREIO. O bot não manda outro pedido enquanto o anterior não produzir
       efeito. Sem isto ele dispara a cada volta e afoga a fila do Mestre —
       medido: três pedidos em dez segundos por bot, e o teto de ações não os
       segura porque quem incrementa acoesMercado é o Mestre, depois.
       A marca é o estado observável; muda, é porque foi aplicado. */
    bot.esperando = Date.now();
    bot.marca = marcaDe(bot._meu);
    bot.estado = "pediu " + tipo.replace("mercado", "").toLowerCase();
    diz(bot.nome + " pediu " + tipo + " " + JSON.stringify(dados || {}));
  }

  /* o que muda quando um pedido é aplicado: ação gasta, pista a mais, moeda a
     menos. Qualquer um dos três serve de recibo. */
  function marcaDe(meu) {
    if (!meu) return "";
    return [meu.acoesMercado || 0, (meu.pistas || []).length, meu.moedas].join("|");
  }
  var PACIENCIA = 20000;   /* se o Mestre não responder, tenta de novo */

  async function noMercado(bot, meu) {
    bot._meu = meu;
    if (bot.esperando) {
      if (marcaDe(meu) !== bot.marca) { bot.esperando = 0; }
      else if (Date.now() - bot.esperando < PACIENCIA) { bot.estado = "aguarda o Mestre"; return; }
      else { bot.esperando = 0; diz(bot.nome + ": o Mestre não respondeu, tentando de novo"); }
    }
    var teto = 3, precos = { nova: 4, repassada: 2 };
    if ((Number(meu.acoesMercado) || 0) >= teto) { bot.estado = "sem ações"; return; }
    var moeda = Number(meu.moedas) || 0;
    var balaio = (sala.balaio || []).filter(function (x) { return x.dono !== bot.uid; });
    var minhas = (meu.pistas || []).filter(function (p) { return p.frag; });

    if (balaio.length && moeda >= precos.repassada && Math.random() < 0.55) {
      return pedir(bot, "mercadoComprar", { frag: rnd(balaio).frag, origem: "balaio" });
    }
    if (minhas.length > 1 && Math.random() < 0.4) {
      return pedir(bot, "mercadoConsignar", { frag: rnd(minhas).frag });
    }
    if (moeda >= precos.nova) {
      var fora = CODIGOS.filter(function (c) {
        return !minhas.some(function (p) { return p.frag === c; })
            && !(sala.balaio || []).some(function (x) { return x.frag === c; });
      });
      if (fora.length) return pedir(bot, "mercadoComprar", { frag: rnd(fora), origem: "nova" });
    }
    bot.estado = "sem jogada";
  }

  async function naAtividade(bot, fase) {
    var id = bot.uid + "_" + fase;
    var t = await LabREST.ler(cfg, emulador(), bot.sessao, caminho(bot, "tarefas/" + id));
    if (t && t.concluidoEm) { bot.estado = "concluiu " + fase; return; }
    if (!t) {
      await LabREST.gravar(cfg, emulador(), bot.sessao, caminho(bot, "tarefas/" + id),
        { tarefa: fase, jogadorId: bot.uid, prontoEm: new Date() });
      bot.estado = "na atividade";
      return;                       /* conclui na próxima volta: dura tempo */
    }
    await LabREST.gravar(cfg, emulador(), bot.sessao, caminho(bot, "tarefas/" + id),
      { tarefa: fase, jogadorId: bot.uid, concluidoEm: new Date() });
    bot.estado = "concluiu " + fase;
    diz(bot.nome + " concluiu " + fase);
  }

  /* ── laço ─────────────────────────────────────────────────────────────── */
  var girando = false;
  async function volta() {
    if (girando || !bots.length) return;
    girando = true;
    try {
      sala = await LabREST.ler(cfg, emulador(), bots[0].sessao, colecao() + "/" + codigoAtivo);
      if (!sala) { diz("sala " + codigoAtivo + " não encontrada ou encerrada"); return; }
      for (var i = 0; i < bots.length; i++) {
        var bot = bots[i];
        try {
          var meu = await LabREST.ler(cfg, emulador(), bot.sessao,
            caminho(bot, "jogadores/" + bot.uid));
          if (!meu) { bot.estado = "fora da mesa"; continue; }
          bot.moedas = meu.moedas;
          bot.acoes = meu.acoesMercado || 0;
          bot.pistas = (meu.pistas || []).length;

          if (sala.fase === "mercado") await noMercado(bot, meu);
          else if (sala.fase === "inclinacao" || sala.fase === "constelacao") await naAtividade(bot, sala.fase);
          else bot.estado = "aguarda · " + sala.fase;
        } catch (e) {
          bot.recusas++;
          bot.estado = e.negado ? "negado pela regra" : "erro";
          diz(bot.nome + ": " + e.message);
        }
      }
    } finally { girando = false; pintar(); }
  }

  function pintar() {
    $("mesa").innerHTML = bots.map(function (b) {
      return '<div class="bot"><b>' + b.nome + "</b>"
        + '<span class="est">' + b.estado + "</span>"
        + '<span class="num">' + (b.moedas == null ? "—" : b.moedas) + " moedas · "
        + b.pistas + " pistas · " + b.acoes + " ações · " + b.pedidos + " pedidos"
        + (b.recusas ? " · " + b.recusas + " recusas" : "") + "</span></div>";
    }).join("") || '<p class="muted">Nenhum bot na mesa.</p>';
    $("sala").textContent = sala
      ? "fase: " + sala.fase + " · balaio: " + ((sala.balaio || []).length)
      : "sem sala";
  }

  /* ── entrada ──────────────────────────────────────────────────────────── */
  UI.entrar = async function () {
    if (!daMaquina()) {
      return diz("esta bancada só roda na sua máquina (localhost ou arquivo local). "
        + "Servida pela internet ela viraria uma porta para encher a mesa dos outros.");
    }
    cfg = lerConfig(); if (!cfg) return;
    codigoAtivo = ($("codigo").value || "").trim().toUpperCase();
    if (codigoAtivo.length !== 6) return diz("o código da sala tem 6 caracteres");
    var quantos = Math.max(1, Math.min(11, Number($("quantos").value) || 3));
    await carregarCodigos();
    var moedas = Number($("moedas").value) || 12;

    $("entrar").disabled = true;
    try {
      /* CONFERIR A SALA ANTES.
         As regras só deixam entrar em sala que existe e está ativa, e quando
         não existe elas negam a criação do jogador com um despejo de linhas do
         .rules que não diz nada a quem está na bancada. Uma leitura antes troca
         isso por uma frase. */
      var porta = await acender("porta");
      var existe = await LabREST.ler(cfg, emulador(), porta.sessao,
        colecao() + "/" + codigoAtivo);
      if (!existe) {
        $("entrar").disabled = false;
        return diz("a sala " + codigoAtivo + " não existe em " + colecao()
          + " — abra a mesa no jogo primeiro, e confira o código e a config");
      }
      if (existe.ativa === false) diz("atenção: a sala está encerrada");

      for (var i = 0; i < quantos; i++) {
        var bot = await acender(NOMES[i % NOMES.length]);
        bots.push(bot); pintar();
        await entrar(bot, moedas);
        diz(bot.nome + " entrou (" + bot.uid.slice(0, 6) + "…)");
        pintar();
      }
      /* NEM O SDK PARA OLHAR. A sala é lida por REST com a sessão do primeiro
         bot, na mesma volta em que eles agem. Perde-se o tempo real, e não
         faz falta: bancada não precisa de reflexo, precisa de verdade. E a
         página deixa de depender do CDN do Firebase inteiro. */
      timer = setInterval(volta, 4000);
      volta();
      diz("na sala " + codigoAtivo + " — " + quantos + " bots na mesa");
    } catch (e) {
      diz("falhou ao entrar: " + e.message);
      $("entrar").disabled = false;
    }
  };

  UI.sair = function () {
    if (timer) { clearInterval(timer); timer = null; }
    bots = []; sala = null; pintar();
    $("entrar").disabled = false;
    diz("bots desligados — os documentos ficam na sala, porque as regras negam delete");
  };

  /* ── a bancada não sai da máquina ──────────────────────────────────────
     O Pages serve a RAIZ do repositório, então esta pasta ficaria de pé em
     /Dragon/ferramentas/laboratorio/ junto com o jogo. Com um código de sala,
     qualquer um encheria a mesa de outra gente de bots — e a config d'A Noite
     é pública de qualquer jeito, então ela não é a tranca.

     A tranca é o lugar: bancada roda em localhost ou em arquivo local. Não é
     segurança contra quem quer burlar (é só JavaScript), é a mesma frase de
     sempre — nada que existe só para testar fica de pé no caminho publicado. */
  function daMaquina() {
    var h = location.hostname;
    return location.protocol === "file:" || h === "localhost" ||
           h === "127.0.0.1" || h === "[::1]" || /.local$/.test(h);
  }

  window.LabBots = UI;
  document.addEventListener("DOMContentLoaded", pintar);
})();

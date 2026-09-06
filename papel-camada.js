/*! MOSAICO · Papel cognitivo + camada de acessibilidade
 * Fonte de design: MOSAICO-ACESSIBILIDADE-PAPEIS.md
 * UI: seletor compacto (celular/solo), chips no cabeçalho, andaimes Assistida/Guiada.
 * Hipóteses/decisão por camada: integra MosaicoHipotesesCamada (hipoteses-por-camada.js).
 * Telão NÃO carrega isto — é somente leitura.
 */
(function (global) {
  "use strict";

  var PAPEIS = [
    { id: "investigador", label: "Investigador", subtitulo: "Investigador de campo", acao: "Junte pistas e monte uma teoria", competencia: "Relacionar pistas e formular hipóteses." },
    { id: "cetico", label: "Cético", subtitulo: "Contestador", acao: "Ataque a teoria que está ganhando", competencia: "Testar a hipótese dominante e procurar contradições." },
    { id: "arquivista", label: "Arquivista", subtitulo: "Custódio dos registros", acao: "Separe fato, achismo e dúvida", competencia: "Separar fatos, interpretações e dúvidas." },
    { id: "cronista", label: "Cronista", subtitulo: "Reconstrutor da sequência", acao: "Coloque os fatos na ordem certa", competencia: "Reconstruir sequência e compatibilidade temporal." },
    { id: "decisor", label: "Decisor", subtitulo: "Coordenador da investigação", acao: "Escolha a versão e feche o caso", competencia: "Sintetizar alternativas e transformar análise em decisão." }
  ];

  var CAMADAS = [
    { id: "livre", label: "Livre", subtitulo: "Modo Veterano", desc: "Você resolve sozinho" },
    { id: "assistida", label: "Assistida", subtitulo: "Modo Organizado", desc: "O jogo te ajuda a arrumar as ideias" },
    { id: "guiada", label: "Guiada", subtitulo: "Modo Acompanhado", desc: "O jogo te ajuda com os próximos passos" }
  ];

  /* caso → papel → alias narrativo (matriz do doc §5) */
  var ALIAS = {
    "casa-da-costa": {
      investigador: "Investigador de campo",
      cetico: "Contestador",
      arquivista: "Custódio dos registros",
      cronista: "Reconstrutor da sequência",
      decisor: "Coordenador da investigação"
    },
    "carro-forte": {
      investigador: "Analista da ocorrência",
      cetico: "Analista crítico",
      arquivista: "Analista documental",
      cronista: "Analista temporal",
      decisor: "Coordenador da resposta"
    },
    noite: {
      investigador: "Investigador noturno",
      cetico: "Contraponto",
      arquivista: "Controlador de evidências",
      cronista: "Reconstrutor da noite",
      decisor: "Coordenador operacional"
    }
  };

  var SOCRATICAS = {
    investigador: [
      "Qual evidência sustenta sua hipótese?",
      "Esta evidência prova ou apenas é compatível?",
      "Há pistas ainda não examinadas que mudariam o quadro?"
    ],
    cetico: [
      "O que teria de ser verdadeiro para essa hipótese funcionar?",
      "Existe outra explicação para os mesmos fatos?",
      "O que não encaixa na leitura dominante?"
    ],
    arquivista: [
      "Isso foi observado ou inferido?",
      "Há itens ainda sem classificação?",
      "Existe conflito entre duas classificações?"
    ],
    cronista: [
      "Há uma lacuna nesta sequência?",
      "A ordem desses eventos é compatível?",
      "Esse horário é confirmado ou estimado?"
    ],
    decisor: [
      "Qual hipótese explica mais fatos?",
      "Qual exige mais suposições?",
      "O que permanece sem explicação?"
    ]
  };

  var STORAGE_KEY = "mosaico_papel_camada";
  var cssInjetado = false;

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c];
    });
  }

  function normalizarCaso(caso) {
    var c = String(caso || "").toLowerCase();
    if (c.indexOf("casa") >= 0) return "casa-da-costa";
    if (c.indexOf("carro") >= 0 || c.indexOf("forte") >= 0) return "carro-forte";
    if (c.indexOf("noite") >= 0) return "noite";
    return c || "casa-da-costa";
  }

  function carregar(caso) {
    var key = STORAGE_KEY + ":" + normalizarCaso(caso);
    try {
      var raw = localStorage.getItem(key) || localStorage.getItem(STORAGE_KEY);
      if (!raw) return { papel: "investigador", camada: "livre" };
      var o = JSON.parse(raw);
      return {
        papel: papelValido(o.papel) || "investigador",
        camada: camadaValida(o.camada) || "livre"
      };
    } catch (e) {
      return { papel: "investigador", camada: "livre" };
    }
  }

  function salvar(caso, escolha) {
    var e = {
      papel: papelValido(escolha && escolha.papel) || "investigador",
      camada: camadaValida(escolha && escolha.camada) || "livre"
    };
    try {
      localStorage.setItem(STORAGE_KEY + ":" + normalizarCaso(caso), JSON.stringify(e));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(e));
    } catch (err) { /* ignore quota */ }
    /* Se já há sala Firebase, espelha papel/camada no doc do jogador
       (ownPlayerUpdate). Solo / pré-sala ficam só no localStorage. */
    try {
      var alias = aliasNarrativo(caso, e.papel);
      var patch = {
        papelCognitivo: e.papel,
        camadaAcessibilidade: e.camada,
        aliasNarrativo: alias
      };
      if (global.DragonSala && typeof global.DragonSala.patchMe === "function" && global.MOSAICO_ROOM) {
        global.DragonSala.patchMe(patch);
      } else if (global.MosaicoFB && typeof global.MosaicoFB.atualizarJogador === "function" &&
                 global.STATE && global.STATE.eu && global.STATE.eu.codigo && global.STATE.eu.id) {
        global.MosaicoFB.atualizarJogador(global.STATE.eu.codigo, global.STATE.eu.id, patch);
      }
    } catch (syncErr) { /* rede / regras — localStorage já salvou */ }
    return e;
  }

  function papelValido(id) {
    return PAPEIS.some(function (p) { return p.id === id; }) ? id : null;
  }
  function camadaValida(id) {
    return CAMADAS.some(function (c) { return c.id === id; }) ? id : null;
  }

  function aliasNarrativo(caso, papel) {
    var mapa = ALIAS[normalizarCaso(caso)] || ALIAS["casa-da-costa"];
    return (mapa && mapa[papel]) || (PAPEIS.find(function (p) { return p.id === papel; }) || {}).label || papel;
  }

  function metaPapel(id) {
    return PAPEIS.find(function (p) { return p.id === id; }) || PAPEIS[0];
  }
  function metaCamada(id) {
    return CAMADAS.find(function (c) { return c.id === id; }) || CAMADAS[0];
  }

  function injetarCss() {
    if (typeof document === "undefined" || !document.createElement) return;
    if (cssInjetado || document.getElementById("mosaico-papel-camada-css")) return;
    cssInjetado = true;
    var st = document.createElement("style");
    st.id = "mosaico-papel-camada-css";
    st.textContent = [
      ".mpc-bloco{margin-top:14px}",
      ".mpc-rotulo{font-size:11px;letter-spacing:.14em;text-transform:uppercase;font-weight:800;color:#e8a94a;margin:14px 0 8px}",
      ".mpc-grade{display:flex;flex-direction:column;border:1px solid #3d5360;border-radius:12px;overflow:hidden;background:#071014}",
      ".mpc-papeis,.mpc-camadas{gap:0}",
      ".mpc-celula{display:block;width:100%;text-align:left;padding:14px 16px;border:0;border-bottom:1px solid #2d3f48;border-radius:0;background:#0a1419;color:#dce8ed;cursor:pointer;box-sizing:border-box}",
      ".mpc-celula:last-child{border-bottom:0}",
      ".mpc-celula.on{background:#25190e;color:#ffc46b;box-shadow:inset 0 0 0 2px #e8a94a;position:relative;z-index:1}",
      ".mpc-celula b{display:block;font-size:16px;line-height:1.25}",
      ".mpc-celula .alias{display:block;margin-top:5px;font-style:italic;color:#c9b48a;font-size:13px;line-height:1.35}",
      ".mpc-celula small{display:block;margin-top:5px;color:#9eafb8;font-size:13px;line-height:1.4}",
      ".mpc-celula.on .alias,.mpc-celula.on small{color:#e8d2a4}",
      ".mpc-papel,.mpc-camada{display:block;width:100%;text-align:left;padding:14px 16px;border:0;border-bottom:1px solid #2d3f48;border-radius:0;background:#0a1419;color:#dce8ed;cursor:pointer;box-sizing:border-box}",
      ".mpc-papel:last-child,.mpc-camada:last-child{border-bottom:0}",
      ".mpc-papel.on,.mpc-camada.on{background:#25190e;color:#ffc46b;box-shadow:inset 0 0 0 2px #e8a94a;position:relative;z-index:1}",
      ".mpc-papel b,.mpc-camada b{display:block;font-size:16px;line-height:1.25}",
      ".mpc-papel .alias,.mpc-camada .alias{display:block;margin-top:5px;font-style:italic;color:#c9b48a;font-size:13px;line-height:1.35}",
      ".mpc-papel small,.mpc-camada small{display:block;margin-top:5px;color:#9eafb8;font-size:13px;line-height:1.4}",
      ".mpc-papel.on .alias,.mpc-papel.on small,.mpc-camada.on .alias,.mpc-camada.on small{color:#e8d2a4}",
      ".mpc-chips{display:inline-flex;flex-wrap:wrap;gap:6px;align-items:center;vertical-align:middle}",
      ".mpc-sessao{display:block;width:100%;font:600 10px/1.2 Inter,system-ui,sans-serif;letter-spacing:.04em;color:#9eb6c2;margin-top:2px}",
      ".mpc-chip{display:inline-flex;align-items:center;gap:5px;padding:4px 9px;border-radius:999px;border:1px solid rgba(232,169,74,.35);background:rgba(20,16,10,.75);color:#efc878;font:700 10px/1.2 Inter,system-ui,sans-serif;letter-spacing:.06em;text-transform:uppercase}",
      ".mpc-chip em{font-style:normal;color:#c6b69f;font-weight:600;text-transform:none;letter-spacing:0;font-size:11px}",
      ".mpc-andaime{margin:12px 0;padding:12px 14px;border:1px solid rgba(232,169,74,.28);border-radius:12px;background:rgba(8,12,16,.72)}",
      ".mpc-andaime h3{margin:0 0 8px;font:700 12px Inter,system-ui,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#e8a94a}",
      ".mpc-andaime .mpc-slots{display:grid;gap:8px}",
      ".mpc-slot{padding:10px;border:1px dashed #3a4c56;border-radius:8px;background:#0a1318;min-height:52px}",
      ".mpc-slot b{display:block;font-size:12px;color:#afc8d5;letter-spacing:.08em;text-transform:uppercase}",
      ".mpc-slot textarea,.mpc-slot input{width:100%;margin-top:6px;min-height:44px;border:0;background:transparent;color:#e6edf2;font:500 14px Inter,system-ui,sans-serif;resize:vertical}",
      ".mpc-mestre{margin-top:10px;padding:10px 12px;border-left:3px solid #70d6a0;background:#0a1814;border-radius:8px}",
      ".mpc-mestre b{display:block;color:#8ce4b0;font-size:11px;letter-spacing:.12em;text-transform:uppercase}",
      ".mpc-mestre p{margin:6px 0 0;color:#c5d8cf;font-size:14px;line-height:1.45}",
      ".mpc-mestre .mpc-prog{display:flex;gap:6px;margin-top:8px;flex-wrap:wrap}",
      ".mpc-mestre button{border:1px solid #3d6a55;background:#102820;color:#bde8d0;border-radius:7px;padding:6px 10px;font-weight:700;cursor:pointer;font-size:12px}",
      "#mpcOverlay{position:fixed;inset:0;z-index:100050;background:rgba(0,0,0,.78);display:flex;align-items:flex-end;justify-content:center;padding:16px;overflow:auto}",
      "#mpcOverlay .mpc-sheet{width:min(520px,100%);margin:auto;background:#071014;border:1px solid #334750;border-radius:16px 16px 12px 12px;padding:18px;color:#e6edf2;box-shadow:0 22px 60px rgba(0,0,0,.55);font-family:Inter,system-ui,sans-serif}",
      "#mpcOverlay .mpc-sheet h2{font:600 28px Georgia,serif;margin:0 0 6px}",
      "#mpcOverlay .mpc-sheet .lead{color:#afbdc5;font-size:14px;line-height:1.45;margin:0 0 8px}",
      "#mpcOverlay .mpc-ok{width:100%;min-height:52px;margin-top:14px;border:0;border-radius:10px;padding:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;cursor:pointer;background:linear-gradient(#ffc266,#dd8b2e);color:#1b1005}"
    ].join("");
    document.head.appendChild(st);
  }

  function htmlSeletor(caso, escolha) {
    var c = normalizarCaso(caso);
    var e = escolha || carregar(c);
    var papeis = PAPEIS.map(function (p) {
      var on = e.papel === p.id ? " on" : "";
      return '<button type="button" class="mpc-celula mpc-papel' + on + '" data-mpc-papel="' + p.id + '">' +
        "<b>" + esc(p.label) + "</b>" +
        '<span class="alias">' + esc(p.subtitulo) + "</span>" +
        "<small>" + esc(p.acao) + "</small></button>";
    }).join("");
    var camadas = CAMADAS.map(function (cam) {
      var on = e.camada === cam.id ? " on" : "";
      return '<button type="button" class="mpc-celula mpc-camada' + on + '" data-mpc-camada="' + cam.id + '">' +
        "<b>" + esc(cam.label) + "</b>" +
        '<span class="alias">' + esc(cam.subtitulo) + "</span>" +
        "<small>" + esc(cam.desc) + "</small></button>";
    }).join("");
    return '<div class="mpc-bloco" data-mpc-caso="' + esc(c) + '">' +
      '<div class="mpc-rotulo">Papel Cognitivo</div><div class="mpc-grade mpc-papeis">' + papeis + "</div>" +
      '<div class="mpc-rotulo">Camada de Assistência</div><div class="mpc-grade mpc-camadas">' + camadas + "</div>" +
      "</div>";
  }

  function ligarSeletor(raiz, estado) {
    if (!raiz) return estado;
    raiz.querySelectorAll("[data-mpc-papel]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        estado.papel = btn.getAttribute("data-mpc-papel");
        raiz.querySelectorAll("[data-mpc-papel]").forEach(function (b) {
          b.classList.toggle("on", b === btn);
        });
      });
    });
    raiz.querySelectorAll("[data-mpc-camada]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        estado.camada = btn.getAttribute("data-mpc-camada");
        raiz.querySelectorAll("[data-mpc-camada]").forEach(function (b) {
          b.classList.toggle("on", b === btn);
        });
      });
    });
    return estado;
  }

  function lerSeletor(raiz, fallback) {
    var papel = (raiz && raiz.querySelector("[data-mpc-papel].on") || {}).getAttribute
      ? raiz.querySelector("[data-mpc-papel].on").getAttribute("data-mpc-papel")
      : null;
    var camada = (raiz && raiz.querySelector("[data-mpc-camada].on") || {}).getAttribute
      ? raiz.querySelector("[data-mpc-camada].on").getAttribute("data-mpc-camada")
      : null;
    return {
      papel: papelValido(papel) || (fallback && fallback.papel) || "investigador",
      camada: camadaValida(camada) || (fallback && fallback.camada) || "livre"
    };
  }

  /** Overlay de uma tela (solo / pré-play). Resolve com {papel,camada}. */
  function mostrarSeletor(opts) {
    injetarCss();
    opts = opts || {};
    var caso = normalizarCaso(opts.caso);
    var estado = Object.assign({}, carregar(caso), opts.inicial || {});
    return new Promise(function (resolve) {
      var ov = document.createElement("div");
      ov.id = "mpcOverlay";
      ov.setAttribute("role", "dialog");
      ov.setAttribute("aria-label", "Papel e camada");
      ov.innerHTML = '<div class="mpc-sheet">' +
        "<h2>Seu papel nesta partida</h2>" +
        '<p class="lead">Escolha a responsabilidade cognitiva e o nível de apoio. Mesma verdade — diferentes andaimes.</p>' +
        htmlSeletor(caso, estado) +
        '<button type="button" class="mpc-ok" id="mpcOk">Continuar</button></div>';
      document.body.appendChild(ov);
      var bloco = ov.querySelector(".mpc-bloco");
      ligarSeletor(bloco, estado);
      ov.querySelector("#mpcOk").onclick = function () {
        var e = lerSeletor(bloco, estado);
        salvar(caso, e);
        ov.remove();
        resolve(e);
      };
    });
  }

  function chipHtml(caso, escolha, opts) {
    var e = escolha || carregar(caso);
    var alias = aliasNarrativo(caso, e.papel);
    var cam = metaCamada(e.camada);
    var sessao = opts && opts.sessao;
    /* Micro-rótulo de sessão (Mestre/Jogador) — linha secundária, sem substituir o papel cognitivo. */
    var linhaSessao = sessao
      ? '<span class="mpc-sessao" title="Papel na sessão">' + esc(sessao) + "</span>"
      : "";
    return '<span class="mpc-chips" data-mpc-chips>' +
      '<span class="mpc-chip" title="Papel cognitivo"><em>' + esc(alias) + "</em> · " + esc(metaPapel(e.papel).label) + "</span>" +
      '<span class="mpc-chip" title="Camada de assistência">' + esc(cam.label) + "</span>" +
      linhaSessao +
      "</span>";
  }

  function montarChip(alvo, caso, escolha, opts) {
    injetarCss();
    if (!alvo) return;
    var html = chipHtml(caso, escolha || carregar(caso), opts);
    if (typeof alvo === "string") {
      var el = document.querySelector(alvo);
      if (el) el.insertAdjacentHTML("beforeend", html);
      return;
    }
    if (alvo.insertAdjacentHTML) alvo.insertAdjacentHTML("beforeend", html);
  }

  function slotsPara(papel) {
    switch (papel) {
      case "cetico":
        return [
          { id: "favor", titulo: "Evidências a favor" },
          { id: "contra", titulo: "Evidências contrárias" },
          { id: "outra", titulo: "Outra explicação possível" },
          { id: "nao-encaixa", titulo: "O que não encaixa?" }
        ];
      case "arquivista":
        return [
          { id: "fatos", titulo: "Fatos" },
          { id: "interpretacoes", titulo: "Interpretações" },
          { id: "duvidas", titulo: "Dúvidas" }
        ];
      case "cronista":
        return [
          { id: "timeline", titulo: "Linha do tempo / sequência" },
          { id: "lacunas", titulo: "Lacunas temporais" },
          { id: "horarios", titulo: "Horários confirmados × estimados" }
        ];
      case "decisor":
        return [
          { id: "hip-a", titulo: "Hipótese A" },
          { id: "hip-b", titulo: "Hipótese B" },
          { id: "pendentes", titulo: "Dúvidas pendentes" },
          { id: "justificativa", titulo: "Justificativa da decisão" }
        ];
      default: /* investigador */
        return [
          { id: "hipotese", titulo: "Minha hipótese" },
          { id: "relacionadas", titulo: "Pistas relacionadas" },
          { id: "nao-examinadas", titulo: "Ainda não examinadas" }
        ];
    }
  }

  function htmlAndaime(caso, escolha, opts) {
    var e = escolha || carregar(caso);
    if (e.camada === "livre") return "";
    injetarCss();
    opts = opts || {};
    /* Preferir painel real de hipóteses/decisão (mesmo catálogo do jogo). */
    var HPC = global.MosaicoHipotesesCamada;
    if (HPC && typeof HPC.htmlPainel === "function" && !opts.forceSlots) {
      HPC.injetarCss && HPC.injetarCss();
      var scaffold = (HPC.carregarScaffold
        ? HPC.carregarScaffold(caso, {
            partidaId: opts.partidaId,
            playerId: opts.playerId,
            state: opts.state || {}
          })
        : (opts.state || {}));
      var painel = HPC.htmlPainel({
        caso: caso,
        papel: e.papel,
        camada: e.camada,
        partidaId: opts.partidaId,
        state: scaffold
      });
      return '<aside class="mpc-andaime mpc-andaime-hpc" data-mpc-andaime data-mpc-papel="' + esc(e.papel) +
        '" data-mpc-camada="' + esc(e.camada) + '">' +
        "<h3>Andaime · " + esc(aliasNarrativo(caso, e.papel)) + " · " + esc(metaCamada(e.camada).label) + "</h3>" +
        painel + "</aside>";
    }
    var slots = slotsPara(e.papel).map(function (s) {
      return '<div class="mpc-slot" data-mpc-slot="' + esc(s.id) + '"><b>' + esc(s.titulo) +
        '</b><textarea rows="2" placeholder="Anote aqui…" data-mpc-note="' + esc(s.id) + '"></textarea></div>';
    }).join("");
    var mestre = "";
    if (e.camada === "guiada") {
      var qs = SOCRATICAS[e.papel] || SOCRATICAS.investigador;
      mestre = '<div class="mpc-mestre" data-mpc-mestre data-mpc-qi="0">' +
        "<b>Mestre socrático</b>" +
        '<p class="mpc-q">' + esc(qs[0]) + "</p>" +
        '<div class="mpc-prog">' +
        '<button type="button" data-mpc-prev>Anterior</button>' +
        '<button type="button" data-mpc-next>Próxima pergunta</button>' +
        "</div></div>";
    }
    return '<aside class="mpc-andaime" data-mpc-andaime data-mpc-papel="' + esc(e.papel) +
      '" data-mpc-camada="' + esc(e.camada) + '">' +
      "<h3>Andaime · " + esc(aliasNarrativo(caso, e.papel)) + " · " + esc(metaCamada(e.camada).label) + "</h3>" +
      '<div class="mpc-slots">' + slots + "</div>" + mestre + "</aside>";
  }

  function ligarAndaime(raiz, caso, escolha, opts) {
    if (!raiz) return;
    var e = escolha || carregar(caso);
    opts = opts || {};
    var HPC = global.MosaicoHipotesesCamada;
    if (HPC && typeof HPC.ligarPainel === "function" && raiz.querySelector("[data-hpc-painel]")) {
      HPC.ligarPainel(raiz, {
        caso: caso,
        papel: e.papel,
        camada: e.camada,
        partidaId: opts.partidaId,
        playerId: opts.playerId,
        persist: opts.persist !== false,
        onChange: opts.onScaffoldChange,
        state: opts.state || {}
      });
    }
    var qs = SOCRATICAS[e.papel] || SOCRATICAS.investigador;
    var mestre = raiz.querySelector("[data-mpc-mestre]");
    if (!mestre) return;
    function pintar() {
      var i = Number(mestre.getAttribute("data-mpc-qi") || 0);
      var p = mestre.querySelector(".mpc-q");
      if (p) p.textContent = qs[i] || qs[0];
    }
    mestre.querySelector("[data-mpc-next]")?.addEventListener("click", function () {
      var i = Number(mestre.getAttribute("data-mpc-qi") || 0);
      mestre.setAttribute("data-mpc-qi", String(Math.min(qs.length - 1, i + 1)));
      pintar();
    });
    mestre.querySelector("[data-mpc-prev]")?.addEventListener("click", function () {
      var i = Number(mestre.getAttribute("data-mpc-qi") || 0);
      mestre.setAttribute("data-mpc-qi", String(Math.max(0, i - 1)));
      pintar();
    });
  }

  /** Injeta andaime + chip. Troca densidade se a camada mudou (data-mpc-camada). */
  function aplicarEmJogo(opts) {
    opts = opts || {};
    var caso = normalizarCaso(opts.caso);
    var e = opts.escolha || carregar(caso);
    injetarCss();
    if (opts.chipAlvo && !document.querySelector("[data-mpc-chips]")) {
      montarChip(opts.chipAlvo, caso, e, opts.sessao ? { sessao: opts.sessao } : opts.chipOpts);
    }
    if (opts.andaimeAlvo) {
      var alvo = typeof opts.andaimeAlvo === "string"
        ? document.querySelector(opts.andaimeAlvo)
        : opts.andaimeAlvo;
      if (alvo) {
        var atual = document.querySelector("[data-mpc-andaime]");
        var precisa = e.camada !== "livre";
        var camadaMudou = atual && atual.getAttribute("data-mpc-camada") !== e.camada;
        var papelMudou = atual && atual.getAttribute("data-mpc-papel") !== e.papel;
        if (atual && (!precisa || camadaMudou || papelMudou || opts.forcar)) {
          atual.remove();
          atual = null;
        }
        if (precisa && !document.querySelector("[data-mpc-andaime]")) {
          alvo.insertAdjacentHTML(opts.andaimePos || "afterbegin", htmlAndaime(caso, e, opts));
          ligarAndaime(alvo, caso, e, opts);
        }
      }
    }
    return e;
  }

  global.MosaicoPapelCamada = {
    PAPEIS: PAPEIS,
    CAMADAS: CAMADAS,
    ALIAS: ALIAS,
    SOCRATICAS: SOCRATICAS,
    carregar: carregar,
    salvar: salvar,
    aliasNarrativo: aliasNarrativo,
    htmlSeletor: htmlSeletor,
    ligarSeletor: ligarSeletor,
    lerSeletor: lerSeletor,
    mostrarSeletor: mostrarSeletor,
    chipHtml: chipHtml,
    montarChip: montarChip,
    htmlAndaime: htmlAndaime,
    ligarAndaime: ligarAndaime,
    aplicarEmJogo: aplicarEmJogo,
    slotsPara: slotsPara,
    injetarCss: injetarCss,
    normalizarCaso: normalizarCaso,
    /** Troca camada/papel e re-renderiza andaime (mesmas hipóteses). */
    trocarCamada: function (opts) {
      opts = opts || {};
      var caso = normalizarCaso(opts.caso);
      var e = salvar(caso, {
        papel: opts.papel || (carregar(caso).papel),
        camada: opts.camada || (carregar(caso).camada)
      });
      opts.escolha = e;
      opts.forcar = true;
      return aplicarEmJogo(opts);
    }
  };
})(typeof window !== "undefined" ? window : globalThis);

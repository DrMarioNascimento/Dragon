/* Protocolo e ativação de sensor das tarefas do MOSAICO. */
(function (global) {
  "use strict";
  var TS = {};
  TS.alvoMsg = function () {
    var o = location.origin;
    return (o && o !== "null") ? o : "*";
  };
  TS.enviar = function (dados, ctx) {
    ctx = ctx || {};
    if (!ctx.embed) return;
    if (ctx.runId) dados.runId = ctx.runId;
    try { global.parent.postMessage(dados, TS.alvoMsg()); } catch (e) {}
  };
  TS.concluir = function (tempoMs, ctx) {
    TS.enviar({ mosaico: "tarefa-ok", tempoMs: tempoMs }, ctx);
  };
  /* PRONTO: a tarefa ficou jogável — permissão resolvida, calibragem feita.
     Até 02/09/2026 o `enviarStatus` dos módulos só guardava uma variável
     local: os estados que o Documento V8 diz serem "registrados" pela Mesa
     nunca saíam de dentro do iframe. Agora saem, e a Mesa carimba a chegada
     no servidor — é a ponta de largada da duração que pontua.

     Medir daqui, e não da abertura da fase, é o que tira do iPhone o custo da
     permissão, do diálogo do sistema e do oito no ar. */
  TS.status = function (estado, ctx) {
    TS.enviar({ mosaico: "tarefa-status", estado: String(estado || "") }, ctx);
  };

  /* NÃO existe canal de progresso parcial, e é decisão, não esquecimento.
     Cheguei a construí-lo — a tarefa avisava "estou em 4 de 7" — para que
     travar no sexto passo não custasse o mesmo que nunca ter começado. Mario
     decidiu em 02/09/2026 que quem não conclui leva ZERO fragmento, e aí o
     canal não pagava mais nada: sinal disparado no vazio é código morto com
     aparência de vivo, que é justamente o que a auditoria de A Noite proíbe.
     Se um dia o progresso parcial voltar a valer, ele volta aqui. */
  TS.ouvirMesa = function (acoes, ctx) {
    ctx = ctx || {};
    function aoReceber(ev) {
      if (!ctx.embed) return;
      if (ev.source !== global.parent) return;
      var alvo = TS.alvoMsg();
      if (alvo !== "*" && ev.origin !== alvo) return;
      var d = ev.data;
      if (!d || d.mosaico !== "controle-tarefa") return;
      if (String(d.runId == null ? "" : d.runId) !== String(ctx.runId)) return;
      var acao = acoes[d.acao];
      if (typeof acao === "function") acao();
    }
    global.addEventListener("message", aoReceber);
    return function () { global.removeEventListener("message", aoReceber); };
  };
  TS.formatarTempo = function (ms) {
    var totalCent = Math.floor(ms / 10);
    var cent = totalCent % 100;
    var totalSeg = Math.floor(totalCent / 100);
    var seg = totalSeg % 60;
    var min = Math.floor(totalSeg / 60);
    return String(min).padStart(2, "0") + ":" + String(seg).padStart(2, "0") + "," + String(cent).padStart(2, "0");
  };
  TS.ativarOrientacao = function (opcoes) {
    opcoes = opcoes || {};
    var DOE = global.DeviceOrientationEvent;
    var nada = function () {};
    var aoLigar = opcoes.aoLigar || nada;
    var aoNegar = opcoes.aoNegar || nada;
    var aoIndisponivel = opcoes.aoIndisponivel || nada;
    var aoNaoResponder = opcoes.aoNaoResponder || nada;
    var absoluto = opcoes.absoluto !== false;
    function liga() {
      if (absoluto && ("ondeviceorientationabsolute" in global)) global.addEventListener("deviceorientationabsolute", opcoes.aoOrientar, true);
      global.addEventListener("deviceorientation", opcoes.aoOrientar, true);
      aoLigar();
      var espera = opcoes.esperaMs == null ? 1800 : opcoes.esperaMs;
      setTimeout(function () {
        var veio = typeof opcoes.respondeu === "function" ? opcoes.respondeu() : true;
        if (!veio) aoNaoResponder();
      }, espera);
    }
    if (DOE && typeof DOE.requestPermission === "function") {
      var pedido;
      try { pedido = DOE.requestPermission(); } catch (e) { aoNegar(e); return; }
      Promise.resolve(pedido).then(function (s) { if (s === "granted") liga(); else aoNegar(); }).catch(function (e) { aoNegar(e); });
    } else if (DOE) liga(); else aoIndisponivel();
  };
  /* Soft deadline por item (50s): sem giroscópio / travado no gesto não pode
     segurar a sala. Quem estoura conclui com o que tiver — “sem precisão”. */
  TS.SOFT_DEADLINE_MS = 50000;
  TS.prazoSuave = function (ctx, aoEstourar) {
    ctx = ctx || {};
    var ms = Number(ctx.deadlineMs);
    if (!Number.isFinite(ms) || ms <= 0) ms = TS.SOFT_DEADLINE_MS;
    var done = false;
    var t = setTimeout(function () {
      if (done) return;
      done = true;
      try { aoEstourar && aoEstourar({ semPrecisao: true, deadlineMs: ms }); } catch (e) {}
    }, ms);
    return function cancelar() {
      done = true;
      clearTimeout(t);
    };
  };
  /* Antes do modo dedo (giroscópio ausente / negado / mudo): modal flutuante
     com contagem + OK. Só libera o dedo quando AMBOS: countdown zerou E OK.
     Não atrasa o soft deadline — quem chama arma prazoSuave à parte. */
  TS.AVISO_MODO_DEDO_SEG = 3;
  TS.AVISO_MODO_DEDO_TIT =
    "Seu telefone não tem ou não funciona o giroscópio.";
  TS.avisoModoDedoTexto = function (segundos) {
    var s = Number(segundos);
    if (!Number.isFinite(s) || s < 0) s = TS.AVISO_MODO_DEDO_SEG;
    var n = Math.max(0, Math.ceil(s));
    return "Após " + n + " segundos ele será liberado para deslize por dedo. Aguarde.";
  };
  /* Gate puro — testável sem DOM. */
  TS.modoDedoPodeLiberar = function (estado) {
    estado = estado || {};
    return !!(estado.countdownOk && estado.usuarioOk);
  };
  TS.avisoAntesModoDedo = function (opcoes) {
    opcoes = opcoes || {};
    var seg = Number(opcoes.segundos);
    if (!Number.isFinite(seg) || seg < 0) seg = TS.AVISO_MODO_DEDO_SEG;
    var aoLiberar = typeof opcoes.aoLiberar === "function" ? opcoes.aoLiberar : function () {};
    var estado = { countdownOk: seg <= 0, usuarioOk: false };
    var liberou = false;
    function tentarLiberar() {
      if (liberou || !TS.modoDedoPodeLiberar(estado)) return;
      liberou = true;
      limparUi();
      try { aoLiberar(); } catch (e) {}
    }
    var doc = global.document;
    var root = null;
    var tick = null;
    var fimTimer = null;
    function limparUi() {
      if (tick) { clearInterval(tick); tick = null; }
      if (fimTimer) { clearTimeout(fimTimer); fimTimer = null; }
      if (root && root.parentNode) root.parentNode.removeChild(root);
      root = null;
    }
    function marcarCountdown() {
      estado.countdownOk = true;
      tentarLiberar();
    }
    if (!doc || !doc.body) {
      /* Sem DOM (Node/teste): quem testa usa modoDedoPodeLiberar.
         Aqui só agenda o countdown; OK precisa vir de opcoes.usuarioOk. */
      if (opcoes.usuarioOk) estado.usuarioOk = true;
      if (estado.countdownOk) tentarLiberar();
      else {
        fimTimer = setTimeout(marcarCountdown, Math.ceil(seg * 1000));
      }
      return function cancelar() { limparUi(); liberou = true; };
    }
    root = doc.createElement("div");
    root.id = "ts-aviso-modo-dedo";
    root.setAttribute("role", "alertdialog");
    root.setAttribute("aria-modal", "true");
    root.setAttribute("aria-live", "polite");
    root.style.cssText = [
      "position:fixed", "inset:0", "z-index:99999",
      "display:flex", "align-items:center", "justify-content:center",
      "padding:max(16px,env(safe-area-inset-top)) 18px calc(env(safe-area-inset-bottom,0px) + 18px)",
      "background:rgba(0,0,0,.72)", "box-sizing:border-box",
      "-webkit-tap-highlight-color:transparent"
    ].join(";");
    var card = doc.createElement("div");
    card.style.cssText = [
      "width:min(420px,92vw)", "background:#0c121a", "color:#f4f9fd",
      "border:1px solid #2a3949", "border-radius:18px",
      "padding:28px 22px 22px", "box-shadow:0 18px 60px #000c",
      "display:flex", "flex-direction:column", "gap:16px", "text-align:center"
    ].join(";");
    var tit = doc.createElement("div");
    tit.style.cssText = "font:600 clamp(18px,4.6vw,22px)/1.35 system-ui,-apple-system,sans-serif";
    tit.textContent = TS.AVISO_MODO_DEDO_TIT;
    var msg = doc.createElement("div");
    msg.style.cssText = "font:500 clamp(15px,3.8vw,17px)/1.45 system-ui,-apple-system,sans-serif;color:#dfeaf5";
    var restam = seg;
    function pintarMsg() {
      msg.textContent = TS.avisoModoDedoTexto(restam);
    }
    pintarMsg();
    var ok = doc.createElement("button");
    ok.type = "button";
    ok.textContent = "OK";
    ok.setAttribute("aria-label", "OK");
    ok.style.cssText = [
      "margin-top:8px", "width:100%", "min-height:56px",
      "padding:16px 18px", "border:none", "border-radius:14px",
      "background:#ff9a4d", "color:#140c06",
      "font:700 clamp(18px,4.8vw,22px)/1.1 system-ui,-apple-system,sans-serif",
      "letter-spacing:.06em", "cursor:pointer"
    ].join(";");
    ok.addEventListener("click", function () {
      estado.usuarioOk = true;
      tentarLiberar();
    });
    card.appendChild(tit);
    card.appendChild(msg);
    card.appendChild(ok);
    root.appendChild(card);
    doc.body.appendChild(root);
    if (estado.countdownOk) {
      /* já zerado: espera só o OK */
    } else {
      tick = setInterval(function () {
        restam = Math.max(0, restam - 1);
        pintarMsg();
        if (restam <= 0) {
          clearInterval(tick);
          tick = null;
          marcarCountdown();
        }
      }, 1000);
      fimTimer = setTimeout(marcarCountdown, Math.ceil(seg * 1000));
    }
    return function cancelar() { limparUi(); liberou = true; };
  };
  global.TarefaSensor = TS;

  /* Conteúdo narrativo específico do caso fica separado da engenharia dos
     sensores. Assim futuras correções de iOS não reabrem a realidade canônica. */
  /* O caminho sai do endereço DESTE arquivo, não do documento. Para a Mesa dá
     exatamente a mesma URL — o script mora em v1/js/ e o documento em v1/ —,
     então nada muda hoje. Mas relativo ao documento é o que impede A Noite de
     reaproveitar esta folha: de `v2/modulos/` viraria
     `/Dragon/v2/modulos/js/sensor-…`, um 404 silencioso, e o módulo passaria a
     contar o cânone antigo sem ninguém perceber. Devolver a extração perdida
     começa por aqui. */
  var AQUI = (document.currentScript && document.currentScript.src) ||
    (function(){ var t=document.querySelector('script[src*="tarefa-sensor.js"]'); return t?t.src:location.href })();
  setTimeout(function(){
    if(document.querySelector('script[data-sensor-casa-costa-v2]'))return;
    var s=document.createElement('script');
    s.src=new URL('sensor-casa-da-costa-v2.js?v=20260902-profundidade', AQUI).href;
    s.dataset.sensorCasaCostaV2='1';
    document.head.appendChild(s);
  },0);
})(typeof window !== "undefined" ? window : globalThis);
/* Protocolo e ativação de sensor das tarefas do MOSAICO.

   As três tarefas sensoriais — A Janela do Norte, O Vidro Embaçado e A Sala
   às Escuras — repetiam entre si o mesmo diálogo com a Mesa e a mesma dança
   de permissão de movimento do iOS e do Android. Era o único lugar do
   repositório onde uma correção precisava ser aplicada três vezes, e é
   justamente o código que mais vai mudar depois dos testes em aparelho
   real. Agora mora aqui.

   O que NÃO está aqui, de propósito: cronômetro, pausa e aborto continuam
   em cada tarefa, porque cada uma os entrelaça com o próprio laço de
   desenho. Este arquivo só cuida do que é igual para as três.

   Contrato com a Mesa, inalterado:
     tarefa -> Mesa   { mosaico:"tarefa-ok", runId, tempoMs }
     Mesa -> tarefa   { mosaico:"controle-tarefa", runId, acao }
                      acao ∈ pausar | retomar | abortar                  */
(function (global) {
  "use strict";

  var TS = {};

  /* postMessage exige a origem do PAI. Servidos por http(s), pai e filho
     compartilham origem e location.origin serve. Aberto por file:// (que é
     como se testa na mão), location.origin vira a string "null" e o
     postMessage lança — ali não existe fronteira de segurança, então só
     nesse caso cai para "*". Em produção nunca usa "*".                 */
  TS.alvoMsg = function () {
    var o = location.origin;
    return (o && o !== "null") ? o : "*";
  };

  /* Envia para a Mesa. Fora do iframe (`embed` falso) não faz nada: a
     tarefa aberta sozinha no navegador é modo de teste, não partida. */
  TS.enviar = function (dados, ctx) {
    ctx = ctx || {};
    if (!ctx.embed) return;
    if (ctx.runId) dados.runId = ctx.runId;
    try { global.parent.postMessage(dados, TS.alvoMsg()); } catch (e) {}
  };

  TS.concluir = function (tempoMs, ctx) {
    TS.enviar({ mosaico: "tarefa-ok", tempoMs: tempoMs }, ctx);
  };

  /* Escuta os comandos da Mesa.

     Sem as checagens abaixo, qualquer aba ou script conseguiria mandar um
     "abortar" para dentro do iframe: origem e remetente são conferidos
     antes da ação, e runId diferente do da execução corrente é ignorado.

     `acoes` é um objeto { pausar, retomar, abortar } com o que fazer. */
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
    return String(min).padStart(2, "0") + ":" + String(seg).padStart(2, "0") + "," +
           String(cent).padStart(2, "0");
  };

  /* Ativação da orientação do aparelho.

     iOS 13+ exige DeviceOrientationEvent.requestPermission() a partir de um
     gesto da pessoa, e devolve uma Promise. O Android não pede permissão,
     mas dispara DOIS eventos: "deviceorientationabsolute" traz o rumo do
     mundo e "deviceorientation" traz um alpha relativo ao ponto em que a
     página abriu — quem precisa de norte verdadeiro tem de ouvir os dois e
     escolher. Chamar isto fora de um gesto falha silenciosamente no iOS.

     opcoes:
       aoOrientar   função de evento (obrigatória)
       aoLigar      chamado assim que os ouvintes entram no ar
       esperaMs     quanto esperar antes de declarar sensor mudo
       respondeu    devolve true se algum dado já chegou
       aoNaoResponder / aoNegar / aoIndisponivel   mensagens de falha
       absoluto     false para ouvir só "deviceorientation" (padrão true) */
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
      if (absoluto && ("ondeviceorientationabsolute" in global))
        global.addEventListener("deviceorientationabsolute", opcoes.aoOrientar, true);
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
      try { pedido = DOE.requestPermission(); }
      catch (e) { aoNegar(e); return; }
      /* Promise: um try/catch em volta não pega a recusa. */
      Promise.resolve(pedido).then(function (s) {
        if (s === "granted") liga(); else aoNegar();
      }).catch(function (e) { aoNegar(e); });
    } else if (DOE) {
      liga();
    } else {
      aoIndisponivel();
    }
  };

  global.TarefaSensor = TS;
})(typeof window !== "undefined" ? window : globalThis);

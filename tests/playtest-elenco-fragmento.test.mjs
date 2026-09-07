/**
 * Playtest Casa (Mestre iPhone + jogadora Android): elenco antes da
 * encenação, lista só dos assentos ocupados, CTA verde, sala escura no
 * Android, Fragmento ≤3 / tinta / portador / voto / envio.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createContext, runInContext } from "node:vm";
import { describe, it } from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const ler = (p) => readFileSync(join(root, p), "utf8").replace(/\r\n/g, "\n");

function fnSlice(src, name, nextNames) {
  const start = src.indexOf(name);
  assert.ok(start >= 0, `não achei ${name}`);
  let end = src.length;
  for (const n of nextNames) {
    const i = src.indexOf(n, start + name.length);
    if (i > start && i < end) end = i;
  }
  return src.slice(start, end);
}

const TS = ler("v1/js/tarefa-sensor.js");
const MESA = ler("v1/MOSAICO-mesa.html");
const JANELA = ler("v1/MOSAICO-26-a-janela-do-norte.html");
const SALA = ler("v1/MOSAICO-26-a-sala-as-escuras.html");
const RULES = ler("firestore.rules");
const ROOM = ler("firebase-room.js");
const PF = ler("v1/css/profundidade-1mais1.css");
const MPC = ler("papel-camada.js");

function loadTS() {
  const ctx = createContext({
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    URL,
    location: { href: "http://localhost/" },
    document: {
      currentScript: null,
      querySelector: () => null,
      createElement: () => ({
        dataset: {},
        style: {},
        setAttribute() {},
        addEventListener() {},
        appendChild() {},
      }),
      body: { appendChild() {} },
      head: { appendChild() {} },
      documentElement: { classList: { toggle() {} } },
    },
  });
  ctx.window = ctx;
  ctx.globalThis = ctx;
  runInContext(TS + "; this.__TS = TarefaSensor;", ctx);
  return ctx.__TS;
}

describe("elenco · só personagens em jogo + você é X", () => {
  it("filtra pelos assentos ocupados; sem jogadores não despeja o cânone", () => {
    const api = loadTS();
    const casa = JSON.parse(ler("v1/casos/casa-da-costa.json"));
    const soEu = api.resolverElenco({
      elenco: casa.elenco,
      eu: { personagem: "jornalista", forma: "f" },
    });
    assert.equal(soEu.personagens.length, 1, "sem jogadores: só quem você é");
    assert.equal(soEu.meu.nome, "A Jornalista");

    const dois = api.resolverElenco({
      elenco: casa.elenco,
      eu: { personagem: "jornalista", forma: "f" },
      jogadores: [
        { personagem: "jornalista" },
        { personagem: "herdeiro" },
        { nome: "sem papel" },
      ],
    });
    assert.equal(
      dois.personagens.map((p) => String(p.id)).sort().join(","),
      "herdeiro,jornalista",
    );
    assert.equal(dois.meu.id, "jornalista");
  });

  it("mesa e TarefaSensor usam a mesma regra de assentos ocupados", () => {
    assert.match(MESA, /function elencoEmJogo\(/);
    assert.match(MESA, /j\.personagem/);
    assert.match(TS, /elencoOcupado\s*=\s*function/);
    assert.match(TS, /jogadoresVivo\s*=\s*function/);
  });
});

describe("elenco · ANTES da encenação, não da Janela", () => {
  it("mesa mostra o elenco na fase encenacao antes do roteiro", () => {
    const enc = fnSlice(MESA, "function telaEncenacao(", ["function revelacaoMostraPersonagem("]);
    assert.match(enc, /precisaElencoAntesEncenacao|elencoJaVisto|telaElencoIntro/);
    assert.match(MESA, /Os personagens do jogo são:/);
    assert.match(MESA, /O seu personagem é:/);
    const passiva = fnSlice(MESA, "var encenacaoPassiva=", ["document.body.classList.toggle(\"fase-sala\""]);
    assert.match(passiva, /elencoJaVisto|precisaElencoAntesEncenacao/);
  });

  it("Janela da Casa não bloqueia mais no modal de elenco", () => {
    assert.equal(/avisoElencoAntesJanela/.test(JANELA), false);
    assert.match(JANELA, /_elencoJanelaOk\s*=\s*true/);
  });
});

describe("cores · título único e CTA verde de avançar", () => {
  it("tokens de título e go existem na mesa, 1+1, gate e papel/camada", () => {
    assert.match(MESA, /--titulo:#f4f9fd/);
    assert.match(MESA, /--go-face:#8ee4ad/);
    assert.match(PF, /--go-face:#8ee4ad|--pf-go-face:#8ee4ad/);
    assert.match(PF, /pf-btn-go/);
    assert.match(ROOM, /linear-gradient\(180deg,#8ee4ad,#3ea86a\)/);
    assert.match(MPC, /#8ee4ad|#3ea86a/);
    assert.match(TS, /pf-btn-go|#8ee4ad/);
  });

  it("h2 da mesa usa --titulo; OK do elenco é verde", () => {
    assert.match(MESA, /h1,h2\{[^}]*color:var\(--titulo\)|h2\{[^}]*color:var\(--titulo\)/);
    assert.match(MESA, /confirmarElencoIntro|marcarElencoVisto/);
    assert.match(MESA, /pf-btn-go|btn-go/);
  });
});

describe("sala às escuras · Android mais longo + texto das pistas", () => {
  it("hold Android > hold base e o cartão usa o número real de pistas", () => {
    const api = loadTS();
    const iphone = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)";
    const crios = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) CriOS/120.0.0.0";
    const android = "Mozilla/5.0 (Linux; Android 14)";
    assert.equal(api.holdMsPorPlataforma(iphone, { base: 1400, android: 2400 }), 1400);
    assert.equal(api.holdMsPorPlataforma(crios, { base: 1400, android: 2400 }), 1400);
    assert.equal(
      api.holdMsPorPlataforma("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", { base: 1400, android: 2400 }, { platform: "MacIntel", maxTouchPoints: 5 }),
      1400,
      "iPadOS disfarçado de Mac não herda o hold do Android",
    );
    assert.equal(api.holdMsPorPlataforma(android, { base: 1400, android: 2400 }), 2400);
    assert.equal(api.uaEhIOS(iphone), true);
    assert.equal(api.uaEhAndroid(iphone), false);
    assert.equal(api.uaEhAndroid(android), true);
    assert.match(SALA, /function holdAlvo\(/);
    assert.match(SALA, /HOLD_MS_ANDROID/);
    assert.equal(/CFG\.HOLD_MS\s*=/.test(SALA), false, "não sobrescrever HOLD_MS no boot (iOS herdaria o Android)");
    assert.match(SALA, /As luzes caíram e você está no escuro/);
    assert.match(SALA, /São .+ pistas para achar|sala-explica-n|OBJETOS\.length/);
  });

  it("cópias da Noite não endurecem o iPhone", () => {
    const noite = ler("mosaico-web/public/modulos/sala-as-escuras.html");
    const v2 = ler("v2/modulos/sala-as-escuras.html");
    for (const src of [noite, v2]) {
      const fn = fnSlice(src, "function holdAlvo(", ["function drenoMao("]);
      assert.match(fn, /if\s*\(\s*IPHONE\s*\)\s*return 850/);
      assert.match(fn, /Android/);
      assert.match(src, /As luzes caíram e você está no escuro/);
    }
  });
});

describe("Fragmento · ≤3, tinta, portador, voto, envio", () => {
  it("≤3 não manda achar grupo", () => {
    const enc = fnSlice(MESA, "function telaMosaico(", ["function telaCooperacao("]);
    assert.match(MESA, /function deveEncontrarFragmento\(/);
    assert.match(MESA, /if\s*\(\s*fragmentoCompartilhado\(\)\s*\)\s*return false/);
    assert.match(enc, /deveEncontrarFragmento/);
  });

  it("tinta do Fragmento vale na busca E na reconstrução", () => {
    assert.match(MESA, /mosaico-reconstrucao\.fragmento-cor-1/);
    const loop = fnSlice(MESA, "for(var corFragmento=1;", ["iframe"]);
    assert.match(loop, /mosaico-reconstrucao|tintaFragmento|faseAgora==="mosaico"/);
  });

  it("caixa do portador e voto unânime antes do envio", () => {
    assert.match(MESA, /Converse com o portador do Fragmento/);
    assert.match(MESA, /só ele pode enviar as respostas do grupo|so ele pode enviar as respostas do grupo/);
    assert.match(MESA, /Você concorda com o envio das hipóteses do seu Fragmento/);
    assert.match(MESA, /function acordoEnvioUnanime\(/);
    assert.match(MESA, /function rodadaEnvioMs\(/);
    assert.match(MESA, /votoEnvioSim/);
    assert.match(MESA, /pedidoEnvioFragmento/);
  });

  it("envio grava concluidoEm e mostra erro em vez de travar", () => {
    const envio = fnSlice(MESA, "async function enviarMosaico(", ["async function abrirVotoCooperacao("]);
    assert.match(envio, /concluirNucleo/);
    assert.match(envio, /catch|_envioMosaicoTrava|avisa\(/);
    assert.match(RULES, /concluidoEm/);
    assert.match(RULES, /request\.resource\.data\.concluidoEm is timestamp/);
  });
});

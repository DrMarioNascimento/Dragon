/**
 * Casa da Costa Celular → gate canônico firebase-room.js
 * Port: uma implementação de gate/lobby; ponte para o motor v1.
 */
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { describe, it } from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const ler = (p) => readFileSync(join(root, p), "utf8").replace(/\r\n/g, "\n");

const ROOM = ler("firebase-room.js");
const CASA = ler("v1/MOSAICO-mesa.html");
const BRIDGE = ler("v1/js/casa-firebase-room-bridge.js");
const PADRAO = ler("PADRAO-SALA-MULTIPLAYER.md");
const ISO = ler("FIREBASE-ISOLAMENTO.md");
const CEL = ler("carro-forte/celular.html");
const NOITE = ler("carro-forte/noite/index.html");

function stripComments(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[\n\r])\s*\/\/[^\n\r]*/g, "$1");
}

describe("Casa carrega firebase-room no projeto certo", () => {
  it("tag module com data-project=mesa, root=mosaico, case=casa-da-costa", () => {
    assert.match(CASA, /firebase-room\.js\?v=/);
    assert.match(CASA, /data-project="mesa"/);
    assert.match(CASA, /data-root="mosaico"/);
    assert.match(CASA, /data-case="casa-da-costa"/);
    assert.match(CASA, /data-ready-event="casa-mesa-ready"/);
    assert.match(CASA, /data-telao="\.\.\/telao\.html\?jogo=casa-da-costa"/);
    assert.match(CASA, /data-title="A Casa da Costa"/);
  });

  it("ponte existe e marca gate externo", () => {
    assert.ok(existsSync(join(root, "v1/js/casa-firebase-room-bridge.js")));
    assert.match(CASA, /casa-firebase-room-bridge\.js\?v=/);
    assert.match(BRIDGE, /MOSAICO_GATE_EXTERNO\s*=\s*true/);
    assert.match(BRIDGE, /casa-mesa-ready/);
    assert.match(BRIDGE, /DragonSalaAntesDeIniciar/);
    assert.match(BRIDGE, /DragonSalaAoEntrar/);
  });

  it("Ensaiar no gate redireciona para Solo", () => {
    assert.match(BRIDGE, /\.\.\/solo\//);
    assert.match(BRIDGE, /detail\.ensaio|detail\.local/);
  });
});

describe("firebase-room · liberação pós-lobby e hooks", () => {
  it("libera quando fase !== sala (Casa encenacao / Carro jogo)", () => {
    const plain = stripComments(ROOM);
    assert.match(plain, /fase\s*&&\s*room\.fase\s*!==\s*['"]sala['"]/);
    assert.match(ROOM, /DragonSalaAntesDeIniciar/);
    assert.match(ROOM, /DragonSalaAoEntrar/);
  });

  it("DragonSala exporta app/auth/db para MosaicoFB compartilhar sessão", () => {
    assert.match(ROOM, /get app\(\)\s*\{\s*return app\s*\}/);
    assert.match(ROOM, /get auth\(\)\s*\{\s*return auth\s*\}/);
    assert.match(ROOM, /get db\(\)\s*\{\s*return db\s*\}/);
  });

  it("SDK alinhado ao MosaicoFB (12.x)", () => {
    assert.match(ROOM, /firebasejs\/12\./);
    assert.match(CASA, /firebasejs\/12\./);
  });
});

describe("MosaicoFB reutiliza dragon-mesa", () => {
  it("initializeApp / getApps com nome dragon-mesa", () => {
    assert.match(CASA, /getApps\(\)/);
    assert.match(CASA, /dragon-mesa/);
    assert.match(CASA, /auth\.currentUser/);
  });

  it("caseId da Casa permanece na API de criarMesa (legado / defesa)", () => {
    assert.match(CASA, /caseId:"casa-da-costa"/);
  });

  it("iniciarEncenacao / motor de fases intactos", () => {
    assert.match(CASA, /async function iniciarEncenacao/);
    assert.match(CASA, /fase:"encenacao"/);
    assert.match(BRIDGE, /fase:\s*"encenacao"/);
  });
});

describe("init respeita gate externo", () => {
  it("#app começa hidden; init não força tela entrar com ?sala=", () => {
    assert.match(CASA, /id="app" hidden/);
    assert.match(CASA, /MOSAICO_GATE_EXTERNO/);
    assert.match(CASA, /gateExterno/);
    const init = CASA.slice(CASA.indexOf("(function init()"), CASA.indexOf("})();", CASA.indexOf("(function init()")) + 5);
    assert.match(init, /if\(gateExterno\)/);
    assert.match(init, /if\(codigoUrl && !gateExterno\)/);
    /* Ramo externo: return antes de tentarReconectar. */
    const ramo = init.slice(init.indexOf("if(gateExterno)"));
    assert.match(ramo, /return;/);
    assert.ok(ramo.indexOf("return;") < ramo.indexOf("tentarReconectar") || !/tentarReconectar/.test(ramo),
      "gate externo deve retornar antes de tentarReconectar");
  });

  it("souMestreDaMesa reconhece DragonSala / MOSAICO_ROOM", () => {
    assert.match(CASA, /DragonSala\.papel==="master"/);
    assert.match(CASA, /MOSAICO_ROOM\.role==="master"/);
  });
});

describe("Carro/Noite não quebram", () => {
  it("Carro Celular continua noite/mosaico", () => {
    assert.match(CEL, /data-project="noite"/);
    assert.match(CEL, /data-root="mosaico"/);
    assert.match(CEL, /firebase-room\.js/);
  });

  it("Noite continua project noite / root noite", () => {
    assert.match(NOITE, /project:'noite'|project:"noite"/);
    assert.match(NOITE, /root:'noite'|root:"noite"/);
  });
});

describe("docs · gap estrutural fechado", () => {
  it("PADRAO não fala mais em gap dual da Casa", () => {
    assert.equal(/gap estrutural/i.test(PADRAO), false);
    assert.match(PADRAO, /casa-firebase-room-bridge/);
    assert.match(PADRAO, /firebase-room\.js/);
    assert.match(PADRAO, /data-project="mesa"/);
  });

  it("FIREBASE-ISOLAMENTO documenta gate compartilhado", () => {
    assert.match(ISO, /Gate compartilhado|firebase-room/);
    assert.match(ISO, /data-project/);
  });
});

describe("ponte · contrato de clique (estático)", () => {
  it("AntesDeIniciar devolve encenacao + tarefaInterior + abertura", () => {
    assert.match(BRIDGE, /encenacaoIntroducaoConcluida:\s*false/);
    assert.match(BRIDGE, /aberturaIniciadaMs/);
    assert.match(BRIDGE, /tarefaInterior/);
  });

  it("AoEntrar devolve personagem e moedas no create", () => {
    assert.match(BRIDGE, /personagem:\s*personagem/);
    assert.match(BRIDGE, /moedas:\s*moedasIniciais/);
  });

  it("montarPartida assina sala e sincroniza jogador", () => {
    assert.match(BRIDGE, /assinarSala/);
    assert.match(BRIDGE, /sincronizarJogador/);
    assert.match(BRIDGE, /STATE\.eu/);
    assert.match(BRIDGE, /STATE\.mesa/);
  });
});

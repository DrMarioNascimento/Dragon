/* Modo (Celular · Telão · Solo) + papel cognitivo + camada de acessibilidade.
 * =========================================================================
 * Só o hub pergunta Celular · Telão · Solo. /casa-da-costa/ e /carro-forte/
 * redirecionam ao gate Celular. Celular / Solo têm seletor; Telão NÃO.
 */
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { describe, it } from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import vm from "node:vm";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const ler = (p) => readFileSync(join(root, p), "utf8").replace(/\r\n/g, "\n");

const CASA = ler("casa-da-costa/index.html");
const CARRO = ler("carro-forte/index.html");
const HUB = ler("index.html");
const TELAO = ler("telao.html");
const MESA = ler("v1/MOSAICO-mesa.html");
const CEL = ler("carro-forte/celular.html");
const ROOM = ler("firebase-room.js");
const MPC = ler("papel-camada.js");
const SOLO = ler("solo/index.html");
const SOLO_JS = ler("solo/solo-auto.js");
const GAME = ler("carro-forte/game.js");
const DOC = ler("MOSAICO-ACESSIBILIDADE-PAPEIS.md");
const README = ler("README.md");

describe("hub · único seletor de modo", () => {
  it("hub pergunta Celular · Telão · Solo", () => {
    assert.match(HUB, />\s*Celular\s*</);
    assert.match(HUB, />\s*Telão\s*</);
    assert.match(HUB, />\s*Solo\s*</);
  });

  it("hub Celular vai direto ao gate (não à pasta do caso)", () => {
    assert.match(HUB, /href="v1\/MOSAICO-mesa\.html"/);
    assert.match(HUB, /href="carro-forte\/celular\.html"/);
    assert.equal(/href="casa-da-costa\/"/.test(HUB), false);
    assert.equal(/href="carro-forte\/"/.test(HUB), false);
  });

  it("hub Telão deep-link aponta telao.html?jogo=… e a página pede sala", () => {
    assert.match(HUB, /telao\.html\?jogo=casa-da-costa/);
    assert.match(HUB, /telao\.html\?jogo=carro-forte/);
    assert.match(TELAO, /telaoSalaInput/);
    assert.match(TELAO, /Digite o código da sala/);
    assert.ok(!/mpc-papel|papelCognitivo|MosaicoPapelCamada/.test(TELAO), "telão não deve carregar seletor de papel");
  });
});

describe("pasta do caso · redirect ao Celular, sem três portas", () => {
  it("Casa /casa-da-costa/ redireciona ao gate Celular", () => {
    assert.match(CASA, /location\.replace\(["']\.\.\/v1\/MOSAICO-mesa\.html/);
    assert.match(CASA, /http-equiv="refresh"/);
    assert.match(CASA, /href="\.\.\/v1\/MOSAICO-mesa\.html"/);
    assert.equal(/data-mode-ctas/.test(CASA), false);
    assert.equal(/Tr[eê]s portas/.test(CASA), false);
  });

  it("Carro /carro-forte/ redireciona ao gate Celular", () => {
    assert.match(CARRO, /location\.replace\(["']celular\.html/);
    assert.match(CARRO, /http-equiv="refresh"/);
    assert.match(CARRO, /href="celular\.html"/);
    assert.equal(/data-mode-ctas/.test(CARRO), false);
    assert.equal(/Tr[eê]s portas/.test(CARRO), false);
  });
});

describe("módulo papel-camada", () => {
  it("existe na raiz e expõe a API", () => {
    assert.equal(existsSync(join(root, "papel-camada.js")), true);
    const sandbox = { window: {}, globalThis: {} };
    sandbox.window = sandbox;
    sandbox.globalThis = sandbox;
    vm.runInNewContext(MPC, sandbox);
    const api = sandbox.MosaicoPapelCamada || sandbox.window.MosaicoPapelCamada;
    assert.ok(api);
    assert.equal(api.PAPEIS.length, 5);
    assert.equal(api.CAMADAS.length, 3);
    assert.equal(api.aliasNarrativo("casa-da-costa", "investigador"), "Investigador de campo");
    assert.equal(api.aliasNarrativo("carro-forte", "cronista"), "Analista temporal");
    assert.match(api.htmlSeletor("casa-da-costa"), /data-mpc-papel="arquivista"/);
    assert.match(api.htmlSeletor("casa-da-costa"), /data-mpc-camada="guiada"/);
    const seletor = api.htmlSeletor("casa-da-costa");
    assert.match(seletor, /mpc-grade mpc-papeis/);
    assert.match(seletor, /mpc-grade mpc-camadas/);
    assert.match(seletor, /Papel Cognitivo/);
    assert.match(seletor, /Camada de Assistência/);
    assert.match(seletor, /Investigador de campo/);
    assert.match(seletor, /Junte pistas e monte uma teoria/);
    assert.match(seletor, /Contestador/);
    assert.match(seletor, /Ataque a teoria que está ganhando/);
    assert.match(seletor, /Custódio dos registros/);
    assert.match(seletor, /Separe fato, achismo e dúvida/);
    assert.match(seletor, /Reconstrutor da sequência/);
    assert.match(seletor, /Coloque os fatos na ordem certa/);
    assert.match(seletor, /Coordenador da investigação/);
    assert.match(seletor, /Escolha a versão e feche o caso/);
    assert.equal(/Instiga[cç][aã]o/.test(seletor), false);
    assert.match(seletor, /Modo Veterano/);
    assert.match(seletor, /Você resolve sozinho/);
    assert.match(seletor, /Modo Organizado/);
    assert.match(seletor, /O jogo te ajuda a arrumar as ideias/);
    assert.match(seletor, /Modo Acompanhado/);
    assert.match(seletor, /O jogo te ajuda com os próximos passos/);
    assert.equal(api.PAPEIS.find((p) => p.id === "decisor").subtitulo, "Coordenador da investigação");
    assert.match(MPC, /mpc-grade\{/);
    assert.equal(/grid-template-columns:repeat\(3/.test(MPC), false);
    assert.match(api.htmlAndaime("casa-da-costa", { papel: "arquivista", camada: "assistida" }), /FATOS|Fatos/i);
    assert.match(api.htmlAndaime("casa-da-costa", { papel: "investigador", camada: "guiada" }), /Mestre socrático/);
    assert.equal(api.htmlAndaime("casa-da-costa", { papel: "investigador", camada: "livre" }), "");
  });
});

describe("celular / solo · seletor presente", () => {
  it("Casa Celular (mesa) carrega o módulo e o seletor na entrada", () => {
    assert.match(MESA, /papel-camada\.js/);
    assert.match(MESA, /htmlSeletor\('casa-da-costa'/);
    assert.match(MESA, /papelCognitivo/);
    assert.match(MESA, /camadaAcessibilidade/);
  });

  it("Carro Celular carrega o módulo e o lobby grava papel/camada", () => {
    assert.match(CEL, /papel-camada\.js/);
    assert.match(ROOM, /htmlSeletor/);
    assert.match(ROOM, /papelCognitivo:escolha\.papel/);
    assert.match(ROOM, /camadaAcessibilidade:escolha\.camada/);
    assert.match(ROOM, /mostrarSeletor/);
  });

  it("Solo Casa abre o seletor antes de jogar", () => {
    assert.match(SOLO, /papel-camada\.js/);
    assert.match(SOLO_JS, /mostrarSeletor/);
    assert.match(SOLO_JS, /chipHtml/);
  });

  it("chrome in-game tem chip / andaime (Carro)", () => {
    assert.match(CEL, /mpcChipHost/);
    assert.match(GAME, /aplicarEmJogo/);
  });
});

describe("telão · sem papel/camada", () => {
  it("entrada do telão no firebase-room só pede código", () => {
    assert.match(ROOM, /function formTelao/);
    const trecho = ROOM.slice(ROOM.indexOf("function formTelao"), ROOM.indexOf("function renderMasterGate"));
    assert.ok(!/htmlSeletor|mpc-papel|papelCognitivo/.test(trecho));
  });
});

describe("docs", () => {
  it("aponta onde a UI vive", () => {
    const pointer =
      /papel-camada\.js/.test(DOC) ||
      /papel-camada\.js/.test(README) ||
      /Modo · Papel · Camada/.test(DOC) ||
      /Modo · Papel · Camada/.test(README);
    assert.ok(pointer, "README ou MOSAICO-ACESSIBILIDADE-PAPEIS.md deve apontar para a UI");
  });
});

describe("sync Firestore · papel/camada + HPC", () => {
  it("DragonSala.patchMe existe e salvar espelha papel/camada quando há sala", () => {
    assert.match(ROOM, /patchMe/, "DragonSala.patchMe sumiu");
    assert.match(ROOM, /PATCH_ME_KEYS|papelCognitivo/, "allowlist client do patchMe");
    assert.match(MPC, /DragonSala\.patchMe|MosaicoFB\.atualizarJogador/, "salvar não sincroniza FS");
    assert.match(MPC, /aliasNarrativo/, "sync deve incluir alias narrativo");
  });
});

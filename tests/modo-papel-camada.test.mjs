/* Modo (Celular · Telão · Solo) + papel cognitivo + camada de acessibilidade.
 * =========================================================================
 * Landing de caso = três CTAs grandes, sem misturar papel/camada.
 * Celular / Solo têm seletor; Telão NÃO.
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

function modes(html) {
  const block = html.match(/data-mode-ctas[\s\S]*?<\/div>/)?.[0] || "";
  return {
    celular: /data-mode="celular"/.test(block),
    telao: /data-mode="telao"/.test(block),
    solo: /data-mode="solo"/.test(block),
    block,
  };
}

describe("landing · só três modos", () => {
  it("Casa da Costa tem CTAs Celular · Telão · Solo", () => {
    const m = modes(CASA);
    assert.equal(m.celular && m.telao && m.solo, true);
    assert.match(CASA, />\s*Celular\s*</);
    assert.match(CASA, />\s*Telão\s*</);
    assert.match(CASA, />\s*Solo\s*</);
  });

  it("Carro-Forte tem CTAs Celular · Telão · Solo", () => {
    const m = modes(CARRO);
    assert.equal(m.celular && m.telao && m.solo, true);
  });

  it("landing NÃO mistura papel/camada no modo", () => {
    for (const [nome, html] of [
      ["casa", CASA],
      ["carro", CARRO],
    ]) {
      assert.ok(!/Investigador|Arquivista|Assistida|Guiada|papel cognitivo/i.test(html.match(/data-mode-ctas[\s\S]*?<\/div>/)?.[0] || ""), nome);
      assert.match(html, /nunca nesta tela/i);
    }
  });

  it("Telão deep-link aponta telao.html?jogo=… e a página pede sala", () => {
    assert.match(CASA, /telao\.html\?jogo=casa-da-costa/);
    assert.match(CARRO, /telao\.html\?jogo=carro-forte/);
    assert.match(TELAO, /telaoSalaInput/);
    assert.match(TELAO, /Digite o código da sala/);
    assert.ok(!/mpc-papel|papelCognitivo|MosaicoPapelCamada/.test(TELAO), "telão não deve carregar seletor de papel");
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

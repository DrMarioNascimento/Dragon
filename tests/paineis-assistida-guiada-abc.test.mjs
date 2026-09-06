/* Painéis Assistida/Guiada: estado A/B/C, persistência, placar de processo, proibições. */
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { describe, it, beforeEach } from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const ler = (p) => readFileSync(join(root, p), "utf8").replace(/\r\n/g, "\n");

const HPC_SRC = ler("hipoteses-por-camada.js");
const MPC_SRC = ler("papel-camada.js");
const DOC = ler("MOSAICO-ACESSIBILIDADE-PAPEIS.md");
const README = ler("README.md");
const GAME = ler("carro-forte/game.js");
const SOLO = ler("solo/solo-auto.js");
const MESA = ler("v1/MOSAICO-mesa.html");

function loadApis(storage = {}) {
  const localStorage = {
    _d: { ...storage },
    getItem(k) {
      return Object.prototype.hasOwnProperty.call(this._d, k) ? this._d[k] : null;
    },
    setItem(k, v) {
      this._d[k] = String(v);
    },
    removeItem(k) {
      delete this._d[k];
    },
  };
  const sandbox = { window: {}, globalThis: {}, console, localStorage };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  sandbox.window.localStorage = localStorage;
  vm.runInNewContext(HPC_SRC + "\n" + MPC_SRC, sandbox);
  return {
    HPC: sandbox.MosaicoHipotesesCamada,
    MPC: sandbox.MosaicoPapelCamada,
    localStorage,
  };
}

const host = (v) => JSON.parse(JSON.stringify(v));

describe("scaffold state · empty + normalize", () => {
  it("emptyScaffoldState tem compare A/B/C, notes, unexamined, socratic", () => {
    const { HPC } = loadApis();
    const s = HPC.emptyScaffoldState();
    assert.deepEqual(host(s.compare), { A: "", B: "", C: "" });
    assert.equal(typeof s.notes.favor, "string");
    assert.equal(typeof s.notes.contra, "string");
    assert.deepEqual(host(s.unexamined), {});
    assert.ok(s.socratic);
    assert.ok(Array.isArray(s.socratic.acknowledged));
  });

  it("normalize aceita buckets legados favor/against", () => {
    const { HPC } = loadApis();
    const s = HPC.normalizeScaffoldState({
      compare: { A: "H1", B: "H8" },
      buckets: { favor: ["pista X", "pista Y"], against: "tensão Z" },
      unexamined: { H3: true, H4: false },
    });
    assert.equal(s.compare.A, "H1");
    assert.equal(s.compare.C, "");
    assert.match(s.notes.favor, /pista X/);
    assert.match(s.notes.contra, /tensão Z/);
    assert.equal(s.unexamined.H3, true);
    assert.equal(!!s.unexamined.H4, false);
  });
});

describe("persistência localStorage", () => {
  it("salvarScaffold / carregarScaffold redonda compare + unexamined + socratic", () => {
    const { HPC, localStorage } = loadApis();
    const st = HPC.normalizeScaffoldState({
      compare: { A: "H2", B: "H5", C: "H10" },
      notes: { favor: "peso 5,1", contra: "lacre ML-8847", justificativa: "fecha o fluxo" },
      unexamined: { H1: true, H7: true },
      socratic: { index: 1, acknowledged: [0], answers: { "0": "compatível, não prova" } },
    });
    HPC.salvarScaffold("carro-forte", st, { partidaId: "peso", playerId: "p1" });
    const key = HPC.scaffoldStorageKey("carro-forte", { partidaId: "peso", playerId: "p1" });
    assert.ok(localStorage.getItem(key));
    const loaded = HPC.carregarScaffold("carro-forte", { partidaId: "peso", playerId: "p1" });
    assert.deepEqual(host(loaded.compare), { A: "H2", B: "H5", C: "H10" });
    assert.equal(loaded.unexamined.H1, true);
    assert.equal(loaded.unexamined.H7, true);
    assert.equal(loaded.socratic.answers["0"], "compatível, não prova");
    assert.equal(loaded.notes.justificativa, "fecha o fluxo");
  });

  it("jogadores diferentes não compartilham scaffold", () => {
    const { HPC } = loadApis();
    HPC.salvarScaffold("casa-da-costa", { compare: { A: "H9" } }, { partidaId: "sete", playerId: "alice" });
    HPC.salvarScaffold("casa-da-costa", { compare: { A: "H1" } }, { partidaId: "sete", playerId: "bob" });
    assert.equal(HPC.carregarScaffold("casa-da-costa", { partidaId: "sete", playerId: "alice" }).compare.A, "H9");
    assert.equal(HPC.carregarScaffold("casa-da-costa", { partidaId: "sete", playerId: "bob" }).compare.A, "H1");
  });
});

describe("affordances Livre < Assistida < Guiada (com persistência)", () => {
  it("Livre sem compareSlots; Assistida com A/B/C; Guiada com socrático + ans", () => {
    const { HPC } = loadApis();
    const livre = HPC.htmlPainel({ caso: "carro-forte", camada: "livre", papel: "investigador", partidaId: "peso" });
    const assistida = HPC.htmlPainel({
      caso: "carro-forte",
      camada: "assistida",
      papel: "decisor",
      partidaId: "peso",
      state: { compare: { A: "H8", B: "H10", C: "" }, notes: { favor: "lacre", justificativa: "x" } },
    });
    const guiada = HPC.htmlPainel({
      caso: "carro-forte",
      camada: "guiada",
      papel: "investigador",
      partidaId: "peso",
      state: { socratic: { index: 0, answers: { "0": "prova" }, acknowledged: [0] } },
    });

    assert.ok(!/data-hpc-widget="compareSlots"/.test(livre));
    assert.match(livre, /data-hpc-livre="1"/);

    assert.match(assistida, /data-hpc-widget="compareSlots"/);
    assert.match(assistida, /data-hpc-compare-sel="A"/);
    assert.match(assistida, /value="H8" selected/);
    assert.match(assistida, /data-hpc-note="favor"[^>]*>lacre</);
    assert.ok(!/data-hpc-widget="socraticPrompts"/.test(assistida));

    assert.match(guiada, /data-hpc-widget="socraticPrompts"/);
    assert.match(guiada, /data-hpc-socratic-ans/);
    assert.match(guiada, /data-hpc-socratic-ack/);
    assert.match(guiada, />prova</);
  });

  it("toggle não examinada aparece no HTML Assistida e reflete state", () => {
    const { HPC } = loadApis();
    const html = HPC.htmlPainel({
      caso: "casa-da-costa",
      camada: "assistida",
      papel: "investigador",
      partidaId: "sete",
      state: { unexamined: { H4: true } },
    });
    assert.match(html, /data-hpc-toggle-unexamined="H4"/);
    assert.match(html, /aria-pressed="true"/);
    assert.match(html, /não examinada ✓/);
  });
});

describe("ênfase por papel (MVP-rico)", () => {
  it("Investigador / Cético / Arquivista / Cronista / Decisor têm widgets distintos", () => {
    const { HPC } = loadApis();
    const inv = HPC.htmlPainel({ caso: "carro-forte", camada: "assistida", papel: "investigador", partidaId: "peso" });
    const cet = HPC.htmlPainel({ caso: "carro-forte", camada: "assistida", papel: "cetico", partidaId: "peso" });
    const arq = HPC.htmlPainel({ caso: "carro-forte", camada: "assistida", papel: "arquivista", partidaId: "peso" });
    const cro = HPC.htmlPainel({ caso: "carro-forte", camada: "assistida", papel: "cronista", partidaId: "peso" });
    const dec = HPC.htmlPainel({ caso: "carro-forte", camada: "guiada", papel: "decisor", partidaId: "peso" });

    assert.match(inv, /linkedEvidence|relacionadas/);
    assert.match(cet, /objectionSlot|outra/);
    assert.match(arq, /classifyBuckets/);
    assert.match(arq, /data-hpc-note="fatos"/);
    assert.match(cro, /timelineScaffold/);
    assert.match(cro, /data-hpc-note="lacunas"/);
    assert.match(dec, /justificativa/);
    assert.match(dec, /obrigatória na Guiada/);
  });
});

describe("processMetrics + ABC no relatório", () => {
  it("métricas contam trabalho do jogador sem % / mais provável", () => {
    const { HPC } = loadApis();
    const m = HPC.processMetrics({
      compare: { A: "H8", B: "H10", C: "H2" },
      notes: { favor: "a\nb\nc", contra: "x\ny", justificativa: "porque" },
      unexamined: { H1: true },
      socratic: { answers: { "0": "ok" }, acknowledged: [0] },
    });
    assert.equal(m.compareFilled, 3);
    assert.equal(m.favorLines, 3);
    assert.equal(m.againstLines, 2);
    assert.equal(m.unexaminedCount, 1);
    assert.equal(m.organizedComparison, true);
    assert.equal(m.telaoSnippet, "3 hipóteses em comparação");
    assert.equal(HPC.containsForbidden(m.telaoSnippet), false);
    assert.equal(HPC.containsForbidden(m.compareSummary), false);
  });

  it("htmlRelatorioProcesso renderiza A/B/C e contagens; vazio se scaffold vazio", () => {
    const { HPC } = loadApis();
    assert.equal(HPC.htmlRelatorioProcesso(HPC.emptyScaffoldState()), "");
    const html = HPC.htmlRelatorioProcesso(
      {
        compare: { A: "H8", B: "H10", C: "" },
        notes: { favor: "lacre novo", contra: "saco vazio" },
      },
      { caso: "carro-forte" }
    );
    assert.match(html, /data-hpc-processo/);
    assert.match(html, /PROCESSO · COMPARAÇÃO A\/B\/C/);
    assert.match(html, /2 em comparação/);
    assert.match(html, /A favor:/);
    assert.match(html, /Contra:/);
    assert.equal(HPC.containsForbidden(html), false);
    assert.ok(!/mais\s+prov[aá]vel/i.test(html));
    assert.ok(!/\d+\s*%/.test(html));
  });

  it("canConfirmGuiada exige justificativa só para Decisor+Guiada", () => {
    const { HPC } = loadApis();
    assert.equal(HPC.canConfirmGuiada({ notes: {} }, { papel: "decisor", camada: "assistida" }).ok, true);
    assert.equal(HPC.canConfirmGuiada({ notes: {} }, { papel: "investigador", camada: "guiada" }).ok, true);
    assert.equal(HPC.canConfirmGuiada({ notes: {} }, { papel: "decisor", camada: "guiada" }).ok, false);
    assert.equal(
      HPC.canConfirmGuiada({ notes: { justificativa: "fecha" } }, { papel: "decisor", camada: "guiada" }).ok,
      true
    );
  });

  it("roomPlayerFields não inclui resposta/canonica", () => {
    const { HPC } = loadApis();
    const patch = HPC.roomPlayerFields({
      compare: { A: "H8", B: "H10", C: "H1" },
      notes: { favor: "a", contra: "b" },
    });
    const dump = JSON.stringify(patch);
    assert.ok(!/"canonica"/.test(dump));
    assert.ok(!/"resposta"/.test(dump));
    assert.equal(patch.hpcScaffold.compareFilled, 3);
  });
});

describe("invariância de chaves (answer keys intactas)", () => {
  it("hypothesisKeys e decisionFields inalterados após scaffold", () => {
    const { HPC } = loadApis();
    const rep = HPC.invarianceReport("carro-forte", "peso");
    assert.equal(rep.ok, true);
    assert.deepEqual(host(rep.hypothesisKeys), [
      "H1", "H2", "H3", "H4", "H5", "H6", "H7", "H8", "H9", "H10",
    ]);
    assert.equal(rep.decisionFieldKeys.length, 5);
    /* game.js ainda tem as mesmas ids canônicas */
    for (const id of rep.hypothesisKeys) {
      assert.match(GAME, new RegExp(`id:'${id}'`));
    }
  });
});

describe("wiring placar · Carro / Solo / Casa", () => {
  it("Carro renderScore usa htmlRelatorioProcesso; Solo result também", () => {
    assert.match(GAME, /htmlRelatorioProcesso/);
    assert.match(GAME, /hpcScaffold/);
    assert.match(GAME, /canConfirmGuiada/);
    assert.match(SOLO, /htmlRelatorioProcesso/);
    assert.match(SOLO, /canConfirmGuiada/);
    assert.match(MESA, /htmlRelatorioProcesso/);
    assert.match(MESA, /telaMinhaPontuacao/);
  });

  it("trocarCamada / carregarScaffold presentes na integração papel-camada", () => {
    const { MPC, HPC } = loadApis();
    assert.equal(typeof MPC.trocarCamada, "function");
    assert.equal(typeof HPC.carregarScaffold, "function");
    const htmlLivre = MPC.htmlAndaime("carro-forte", { papel: "investigador", camada: "livre" });
    assert.equal(htmlLivre, "");
    const htmlA = MPC.htmlAndaime(
      "carro-forte",
      { papel: "decisor", camada: "assistida" },
      { partidaId: "peso", state: { compare: { A: "H8" } } }
    );
    assert.match(htmlA, /data-hpc-painel/);
    assert.match(htmlA, /compareSlots/);
  });
});

describe("docs §14.2", () => {
  it("MOSAICO-ACESSIBILIDADE-PAPEIS ou README descreve persistência ABC", () => {
    const ok =
      /14\.2|mosaico_hpc_scaffold|COMPARAÇÃO A\/B\/C/.test(DOC) ||
      /processo|A\/B\/C/.test(README);
    assert.ok(ok);
    assert.match(DOC, /mosaico_hpc_scaffold/);
  });
});

/* Hipóteses / respostas por camada (Livre · Assistida · Guiada).
 * Invariância MOSAICO: mesmas chaves canônicas; camadas só mudam andaime.
 */
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { describe, it } from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const ler = (p) => readFileSync(join(root, p), "utf8").replace(/\r\n/g, "\n");

const HPC_SRC = ler("hipoteses-por-camada.js");
const MPC_SRC = ler("papel-camada.js");
const JSON_SRC = ler("hipoteses-por-camada.json");
const DOC = ler("MOSAICO-ACESSIBILIDADE-PAPEIS.md");
const README = ler("README.md");
const GAME = ler("carro-forte/game.js");
const CEL = ler("carro-forte/celular.html");
const SOLO = ler("solo/index.html");
const MESA = ler("v1/MOSAICO-mesa.html");
const TELAO = ler("telao.html");

function loadApis() {
  const sandbox = { window: {}, globalThis: {}, console };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  vm.runInNewContext(HPC_SRC + "\n" + MPC_SRC, sandbox);
  return {
    HPC: sandbox.MosaicoHipotesesCamada,
    MPC: sandbox.MosaicoPapelCamada,
  };
}

/** Arrays from vm.runInNewContext are another realm — normalize for deepEqual. */
const host = (v) => JSON.parse(JSON.stringify(v));

describe("módulo hipoteses-por-camada", () => {
  it("existe JS + JSON e expõe a API", () => {
    assert.equal(existsSync(join(root, "hipoteses-por-camada.js")), true);
    assert.equal(existsSync(join(root, "hipoteses-por-camada.json")), true);
    const { HPC } = loadApis();
    assert.ok(HPC);
    assert.ok(HPC.CATALOG.casos["casa-da-costa"]);
    assert.ok(HPC.CATALOG.casos["carro-forte"]);
    assert.equal(HPC.hypothesisKeys("casa-da-costa").length, 10);
    assert.equal(HPC.hypothesisKeys("carro-forte").length, 10);
  });

  it("catálogo JSON espelha as chaves do módulo", () => {
    const cat = JSON.parse(JSON_SRC);
    const { HPC } = loadApis();
    assert.deepEqual(
      cat.casos["carro-forte"].hipoteses.map((h) => h.id),
      host(HPC.hypothesisKeys("carro-forte"))
    );
    assert.deepEqual(
      Object.keys(cat.casos["casa-da-costa"].partidas).sort(),
      host(HPC.partidaIds("casa-da-costa")).sort()
    );
  });
});

describe("invariância · mesmas chaves em todas as camadas", () => {
  it("Casa da Costa · hipóteses e campos iguais Livre/Assistida/Guiada", () => {
    const { HPC } = loadApis();
    for (const partidaId of HPC.partidaIds("casa-da-costa")) {
      const rep = HPC.invarianceReport("casa-da-costa", partidaId);
      assert.equal(rep.ok, true, partidaId);
      assert.ok(rep.hypothesisKeys.includes("H1"));
      assert.ok(rep.hypothesisKeys.includes("H10"));
      assert.ok(rep.decisionFieldKeys.length >= 1, partidaId);
    }
  });

  it("Carro-Forte · hipóteses e campos iguais por pergunta-mãe", () => {
    const { HPC } = loadApis();
    for (const partidaId of HPC.partidaIds("carro-forte")) {
      const rep = HPC.invarianceReport("carro-forte", partidaId);
      assert.equal(rep.ok, true, partidaId);
      assert.deepEqual(host(rep.hypothesisKeys), [
        "H1","H2","H3","H4","H5","H6","H7","H8","H9","H10",
      ]);
      assert.equal(rep.decisionFieldKeys.length, 5, partidaId);
    }
  });

  it("não inventa segunda chave de solução (ids = catálogo do jogo)", () => {
    const { HPC } = loadApis();
    const ids = HPC.hypothesisKeys("carro-forte");
    for (const id of ids) {
      assert.match(GAME, new RegExp(`id:'${id}'`));
    }
    /* Campos de decisão batem com labels em PARTIDAS (player-facing). */
    const peso = HPC.decisionFields("carro-forte", "peso");
    assert.ok(peso.some((c) => c.rotulo === "Valor declarado"));
    assert.ok(GAME.includes("Valor declarado"));
  });
});

describe("densidade UI · Livre < Assistida < Guiada", () => {
  it("contagem de affordances cresce com a camada", () => {
    const { HPC } = loadApis();
    const papeis = ["investigador", "cetico", "arquivista", "cronista", "decisor"];
    for (const papel of papeis) {
      const livre = HPC.affordancesCount("carro-forte", papel, "livre", "peso");
      const assistida = HPC.affordancesCount("carro-forte", papel, "assistida", "peso");
      const guiada = HPC.affordancesCount("carro-forte", papel, "guiada", "peso");
      assert.ok(livre < assistida, `${papel}: livre(${livre}) < assistida(${assistida})`);
      assert.ok(assistida < guiada, `${papel}: assistida(${assistida}) < guiada(${guiada})`);
    }
  });

  it("HTML Livre é lista crua; Assistida tem compare/buckets; Guiada tem socrático", () => {
    const { HPC } = loadApis();
    const livre = HPC.htmlPainel({ caso: "carro-forte", camada: "livre", papel: "investigador", partidaId: "peso" });
    const assistida = HPC.htmlPainel({ caso: "carro-forte", camada: "assistida", papel: "decisor", partidaId: "peso" });
    const guiada = HPC.htmlPainel({ caso: "carro-forte", camada: "guiada", papel: "investigador", partidaId: "peso" });

    assert.match(livre, /hpc-raw/);
    assert.ok(!/compareSlots|favorAgainst|socraticPrompts/.test(livre) || !/data-hpc-widget="compareSlots"/.test(livre));
    assert.ok(!/data-hpc-widget="compareSlots"/.test(livre));
    assert.ok(!/data-hpc-widget="socraticPrompts"/.test(livre));

    assert.match(assistida, /data-hpc-widget="compareSlots"/);
    assert.match(assistida, /data-hpc-widget="favorAgainst"/);
    assert.ok(!/data-hpc-widget="socraticPrompts"/.test(assistida));

    assert.match(guiada, /data-hpc-widget="socraticPrompts"/);
    assert.match(guiada, /Mestre socrático/);
    assert.match(guiada, /Qual evidência sustenta sua hipótese/i);
    assert.match(guiada, /data-hpc-next/);
  });
});

describe("proibições MOSAICO", () => {
  it("HTML gerado não contém % / mais provável / ranking de solução", () => {
    const { HPC } = loadApis();
    const cams = ["livre", "assistida", "guiada"];
    const papeis = ["investigador", "cetico", "arquivista", "cronista", "decisor"];
    for (const camada of cams) {
      for (const papel of papeis) {
        const html = HPC.htmlPainel({
          caso: "casa-da-costa",
          camada,
          papel,
          partidaId: "sete",
        });
        assert.equal(HPC.containsForbidden(html), false, `${camada}/${papel}`);
        assert.ok(!/mais\s+prov[aá]vel/i.test(html));
        assert.ok(!/\d+\s*%/.test(html));
      }
    }
  });

  it("catálogo player-facing não inclui resposta/canonica", () => {
    const cat = JSON.parse(JSON_SRC);
    const dump = JSON.stringify(cat.casos);
    assert.ok(!/"canonica"/.test(dump));
    assert.ok(!/"resposta"\s*:/.test(dump));
  });
});

describe("papel muda ênfase sem remover campos obrigatórios", () => {
  it("todo papel mantém hypothesisKeys + decisionFields", () => {
    const { HPC } = loadApis();
    const baseH = HPC.hypothesisKeys("carro-forte");
    const baseD = HPC.decisionFieldKeys("carro-forte", "janela");
    for (const papel of ["investigador", "cetico", "arquivista", "cronista", "decisor"]) {
      const p = HPC.presentation({
        caso: "carro-forte",
        papel,
        camada: "assistida",
        partidaId: "janela",
      });
      assert.deepEqual(host(p.hypothesisKeys), host(baseH));
      assert.deepEqual(host(p.decisionFieldKeys), host(baseD));
      assert.ok(p.enfase.primario);
      assert.match(HPC.htmlPainel({
        caso: "carro-forte", papel, camada: "assistida", partidaId: "janela",
      }), /data-hpc-widget="decisionFields"/);
    }
  });

  it("papel-camada integra o painel HPC no andaime Assistida/Guiada", () => {
    const { MPC, HPC } = loadApis();
    assert.ok(MPC.SOCRATICAS);
    const html = MPC.htmlAndaime("casa-da-costa", { papel: "arquivista", camada: "assistida" }, { partidaId: "sete" });
    assert.match(html, /data-hpc-painel/);
    assert.match(html, /data-hpc-campo=/);
    assert.equal(MPC.htmlAndaime("casa-da-costa", { papel: "investigador", camada: "livre" }), "");
    /* Guiada inclui prompts */
    const g = MPC.htmlAndaime("carro-forte", { papel: "cetico", camada: "guiada" }, { partidaId: "roubo" });
    assert.match(g, /socraticPrompts|Mestre socrático/);
    assert.equal(HPC.containsForbidden(g), false);
  });
});

describe("wiring shells · Telão sem UI de camada", () => {
  it("Celular / Solo / Mesa carregam hipoteses-por-camada.js antes do papel-camada", () => {
    for (const [nome, html] of [
      ["celular", CEL],
      ["solo", SOLO],
      ["mesa", MESA],
    ]) {
      assert.match(html, /hipoteses-por-camada\.js/, nome);
      const iH = html.indexOf("hipoteses-por-camada.js");
      const iP = html.indexOf("papel-camada.js");
      assert.ok(iH >= 0 && iP > iH, `${nome}: hpc antes de papel-camada`);
    }
  });

  it("game.js usa MosaicoHipotesesCamada na fase de hipótese", () => {
    assert.match(GAME, /MosaicoHipotesesCamada/);
    assert.match(GAME, /htmlPainel/);
    assert.match(GAME, /data-hpc-hyp-scaffold/);
  });

  it("Telão não carrega papel/camada nem hipóteses por camada", () => {
    assert.ok(!/hipoteses-por-camada|MosaicoHipotesesCamada|MosaicoPapelCamada|mpc-papel/.test(TELAO));
  });
});

describe("docs", () => {
  it("MOSAICO-ACESSIBILIDADE-PAPEIS ou README aponta o módulo de hipóteses por camada", () => {
    const pointer =
      /hipoteses-por-camada\.js/.test(DOC) ||
      /hipoteses-por-camada\.js/.test(README);
    assert.ok(pointer);
  });
});

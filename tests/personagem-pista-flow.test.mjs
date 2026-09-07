/**
 * Catraca do fluxo Personagem → OK → pista (Casa + Carro, portas de produção).
 * Playtest iPhone: elenco duplicado, pista atrás do Safari, números de carta ilegíveis.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
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
const PF = ler("v1/css/profundidade-1mais1.css");

describe("elenco · destaque uma vez", () => {
  it("lista limpa + rodapé único; overlay opaco some o vazamento da Janela", async () => {
    assert.match(TS, /ELENCO_DESTAQUE\s*=\s*["']rodape["']/);
    assert.equal(/li\.className\s*=\s*ehMeu\s*\?\s*["']ts-pf-li meu["']/.test(TS), false);
    assert.match(TS, /data-elenco-destaque["']\s*,\s*["']uma-vez["']/);
    assert.match(TS, /background:#050b12/);
    assert.match(TS, /safe-area-inset-bottom,0px\) \+ 88px/);
    assert.match(TS, /html\.ts-elenco-aberto #intro/);
    assert.match(TS, /mosaico:\s*["']elenco-modal["']/);
    const { createContext, runInContext } = await import("node:vm");
    const ctx = createContext({
      setTimeout,
      clearTimeout,
      URL,
      location: { href: "http://localhost/" },
      document: {
        currentScript: null,
        querySelector: () => null,
        createElement: () => ({ dataset: {}, style: {}, setAttribute() {}, addEventListener() {}, appendChild() {} }),
        body: { appendChild() {} },
        head: { appendChild() {} },
        documentElement: { classList: { toggle() {} } },
      },
    });
    ctx.window = ctx;
    ctx.globalThis = ctx;
    runInContext(TS + "; this.__TS = TarefaSensor;", ctx);
    const api = ctx.__TS;
    assert.equal(api.elencoChromeDuplo(true, true), true);
    assert.equal(api.elencoChromeDuplo(api.elencoDestacaNaLista(), api.elencoDestacaNoRodape()), false);
  });

  it("Janela Casa manda embed ao elenco e some o intro enquanto o modal está aberto", () => {
    assert.match(JANELA, /avisoElencoAntesJanela/);
    assert.match(JANELA, /embed:ctxElenco\.embed/);
    assert.match(JANELA, /tarefa-sensor\.js\?v=20260907-elenco-pista/);
  });

  it("Mesa esconde o mural enquanto o elenco cobre o iframe", () => {
    assert.match(MESA, /elenco-modal-aberto/);
    assert.match(MESA, /mosaico===['"]elenco-modal['"]/);
  });
});

describe("revelação · personagem depois pista", () => {
  it("passos são exclusivos — não monta personagem e pista-card no mesmo return", () => {
    const fn = fnSlice(MESA, "function telaRevelacao(", ["function confirmarPersonagemRevelacao("]);
    assert.match(fn, /revelacaoMostraPersonagem/);
    assert.match(fn, /revelacaoMostraPista|htmlPistaCard/);
    assert.match(fn, /data-revelacao-passo="personagem"/);
    assert.match(fn, /data-revelacao-passo="pista"/);
    assert.match(fn, /confirmarPersonagemRevelacao/);
    assert.match(fn, /if\(revelacaoMostraPersonagem\(passo\)\)/);
    const personagemBranch = fn.slice(fn.indexOf("if(revelacaoMostraPersonagem"), fn.indexOf("return '<div class=\"revelacao-passo\" data-revelacao-passo=\"pista\""));
    assert.match(personagemBranch, /htmlPersonagemRevelacao/);
    assert.equal(/htmlPistaCard/.test(personagemBranch), false, "passo personagem não pode embutir a pista");
  });

  it("gates puros: personagem XOR pista", () => {
    const src = fnSlice(MESA, "function revelacaoMostraPersonagem(", ["function htmlPersonagemRevelacao("]);
    const { createContext, runInContext } = requireVm(src);
    assert.equal(createContext && runInContext ? true : true, true);
    const g = runHelpers();
    assert.equal(g.revelacaoMostraPersonagem("personagem"), true);
    assert.equal(g.revelacaoMostraPista("personagem"), false);
    assert.equal(g.revelacaoMostraPersonagem("pista"), false);
    assert.equal(g.revelacaoMostraPista("pista"), true);
    assert.equal(g.revelacaoMostraPersonagem("personagem") && g.revelacaoMostraPista("personagem"), false);
  });

  it("pista do sensor concluído reusa htmlPistaCard (sem personagem)", () => {
    const fn = fnSlice(MESA, "function telaTarefaSensor(", ["function meuJogador("]);
    assert.match(fn, /htmlPistaCard\(pista\)/);
    assert.equal(/Voc&ecirc; era/.test(fn), false);
  });

  it("pista-card: corpo off-white pesado + safe-area abaixo do Safari", () => {
    assert.match(MESA, /\.pista-card \.pt\{[^}]*color:#f4f9fd/);
    assert.match(MESA, /\.pista-card \.pt\{[^}]*system-ui/);
    assert.match(MESA, /\.revelacao-passo\{[^}]*safe-area-inset-bottom/);
    assert.match(MESA, /revelacaoPasso:"personagem"/);
  });
});

describe("números de carta · mínimo 22px", () => {
  it("token compartilhado --carta-num-min:22px", () => {
    assert.match(PF, /--carta-num-min:\s*22px/);
    assert.match(PF, /clamp\(22px,\s*6\.5vw,\s*34px\)/);
    assert.match(PF, /#carta-cod/);
    assert.match(PF, /\.fragment small/);
  });

  it("Casa mosaico / troca de horários usa carta-num ≥22px", () => {
    assert.match(MESA, /clamp\(22px,\s*6\.4vw,\s*34px\)/);
    assert.match(MESA, /time class="carta-num"/);
    assert.equal(/\.mosaico-campo time\{[^}]*font:900 15px/.test(MESA), false);
  });

  it("Carro: códigos F## nas cartas de sensor e no dossiê", () => {
    for (const p of [
      "carro-forte/janela-do-norte.html",
      "carro-forte/vidro-embacado.html",
      "carro-forte/sala-as-escuras.html",
    ]) {
      const src = ler(p);
      assert.match(src, /id="carta-cod"[^>]*carta-num/, p);
      assert.match(src, /clamp\(22px,\s*6\.5vw,\s*34px\)/, p);
      assert.equal(/#carta b\{display:block;font:700 10px/.test(src), false, p);
    }
    const css = ler("carro-forte/styles.css");
    assert.match(css, /\.fragment small\{font:800 clamp\(22px/);
    assert.equal(/\.fragment small\{font:700 8px/.test(css), false);
    assert.match(ler("carro-forte/game.js"), /class="carta-num"/);
  });
});

describe("portas sem este padrão", () => {
  it("Casa Solo não tem elenco+pista privada (reconstrução factual)", () => {
    const solo = ler("solo/solo-auto.js");
    assert.equal(/avisoElencoAntesJanela/.test(solo), false);
    assert.equal(/telaRevelacao/.test(solo), false);
  });

  it("Carro Janela não inventa elenco da Casa", () => {
    const carro = ler("carro-forte/janela-do-norte.html");
    assert.equal(/avisoElencoAntesJanela/.test(carro), false);
    assert.equal(/O seu personagem é:/.test(carro), false);
  });

  it("Telão não pinta personagem+pista privada no mesmo quadro", () => {
    const telao = ler("telao.html");
    assert.equal(/htmlPersonagemRevelacao/.test(telao), false);
    assert.equal(/avisoElencoAntesJanela/.test(telao), false);
  });
});

function requireVm(src) {
  return { createContext: true, runInContext: true };
}

function runHelpers() {
  const src = fnSlice(MESA, "function revelacaoMostraPersonagem(", ["function htmlPersonagemRevelacao("]);
  const g = {};
  const wrapped = src + "; this.revelacaoMostraPersonagem=revelacaoMostraPersonagem; this.revelacaoMostraPista=revelacaoMostraPista;";
  const fn = new Function(wrapped);
  fn.call(g);
  return g;
}

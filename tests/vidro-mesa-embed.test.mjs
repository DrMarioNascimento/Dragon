/**
 * Vidro Embaçado na Mesa (?embed=1): uma bolinha, um acerto.
 *
 * Playtest solo (Mario, 07/09/2026): as seis marcas do modo sozinho
 * preenchiam uma e voltavam a zero em loop. Na Mesa revela() manda
 * tarefa-ok no primeiro acerto e fecharPista() encerra; um render(true)
 * (Caso / Arquivo / Sala) recriava o iframe → embaralha() → feitos=0.
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

const VIDRO = ler("v1/MOSAICO-26-vidro-embacado.html");
const MESA = ler("v1/MOSAICO-mesa.html");

function fragmentosDoVidro(src) {
  const ini = src.indexOf("var FRAGMENTOS = [");
  const fim = src.indexOf("\n];", ini);
  assert.ok(ini > 0 && fim > ini, "array FRAGMENTOS não localizado");
  return (src.slice(ini, fim).match(/\{ hora:/g) || []).length;
}

function fakeDoc(kids) {
  const marcas = { innerHTML: "x", appendChild(d) { kids.push(d); } };
  return {
    getElementById: () => marcas,
    createElement: () => ({ className: "" }),
  };
}

function rodarMarcas(src, embed, feitosIni) {
  const totalFn = fnSlice(src, "function totalMarcas()", ["function marcas("]);
  const marcasFn = fnSlice(src, "function marcas()", ["function embaralha("]);
  const kids = [];
  const ctx = createContext({
    EMBED: embed,
    FRAGMENTOS: Array.from({ length: 6 }, () => ({})),
    feitos: feitosIni,
    document: fakeDoc(kids),
  });
  runInContext(totalFn + "\n" + marcasFn + "\nmarcas();", ctx);
  return kids;
}

function rodarEmbaralha(src, embed) {
  const totalFn = fnSlice(src, "function totalMarcas()", ["function marcas("]);
  const marcasFn = fnSlice(src, "function marcas()", ["function embaralha("]);
  const embaralhaFn = fnSlice(src, "function embaralha()", ["function comeca("]);
  const kids = [];
  const ctx = createContext({
    EMBED: embed,
    FRAGMENTOS: Array.from({ length: 6 }, (_, i) => ({ i })),
    feitos: 3,
    fila: null,
    sorteio: () => 0.5,
    document: fakeDoc(kids),
  });
  runInContext(totalFn + "\n" + marcasFn + "\n" + embaralhaFn + "\nembaralha();", ctx);
  return { fila: ctx.fila, feitos: ctx.feitos, marcas: kids };
}

describe("Vidro · marcas embed vs sozinho", () => {
  it("o cânone sozinho continua com 6 fragmentos", () => {
    assert.equal(fragmentosDoVidro(VIDRO), 6);
    assert.match(VIDRO, /function totalMarcas\(\)\{\s*return EMBED \? 1 : FRAGMENTOS\.length/);
  });

  it("embed desenha 1 marca; sozinho desenha 6", () => {
    const embed = rodarMarcas(VIDRO, true, 0);
    const solo = rodarMarcas(VIDRO, false, 0);
    assert.equal(embed.length, 1, "mesa não pode implicar 6 rodadas");
    assert.equal(solo.length, 6, "modo sozinho perdeu as 6 marcas");
    assert.equal(embed[0].className, "marca");
    assert.equal(solo.filter((d) => d.className === "marca").length, 6);
  });

  it("após um acerto, a marca única da mesa acende", () => {
    const embed = rodarMarcas(VIDRO, true, 1);
    assert.equal(embed.length, 1);
    assert.equal(embed[0].className, "marca on");
    const solo = rodarMarcas(VIDRO, false, 1);
    assert.equal(solo.length, 6);
    assert.equal(solo[0].className, "marca on");
    assert.equal(solo[1].className, "marca");
  });

  it("embaralha na mesa deixa uma só rodada na fila", () => {
    const mesa = rodarEmbaralha(VIDRO, true);
    assert.equal(mesa.fila.length, 1);
    assert.equal(mesa.feitos, 0);
    assert.equal(mesa.marcas.length, 1);
    const solo = rodarEmbaralha(VIDRO, false);
    assert.equal(solo.fila.length, 6);
    assert.equal(solo.feitos, 0);
    assert.equal(solo.marcas.length, 6);
  });

  it("revela() avisa a mesa no primeiro acerto; fecharPista() não abre rodada nova", () => {
    const revela = fnSlice(VIDRO, "function revela()", ["function fecharPista("]);
    const fecha = fnSlice(VIDRO, "function fecharPista()", ["function descansa("]);
    assert.match(revela, /feitos\+\+/);
    assert.match(revela, /enviarConclusao\(\)/);
    assert.match(fecha, /if\(EMBED\)\{\s*avisaMesa\(\);\s*return;/);
  });
});

describe("Mesa · iframe sensor não remonta no meio da rodada", () => {
  const renderFn = fnSlice(MESA, "function render(forcar)", ["function telaReconectando("]);
  const telaFn = fnSlice(MESA, "function telaTarefaSensor(", ["function meuJogador("]);
  const concluirFn = fnSlice(MESA, "async function concluirTarefaSensor(", ["window.addEventListener('message'"]);

  it("render(true) estaciona o iframe vivo em vez de recriar o src", () => {
    assert.match(renderFn, /if\(forcar&&frameSensor&&!sensorConcluido\)/);
    assert.match(renderFn, /data-sensor-vivo/);
    assert.match(renderFn, /document\.body\.appendChild\(iframeVivo\)/);
    assert.match(renderFn, /telaTarefaSensor\("constelacao", !!iframeVivo\)/);
    assert.match(renderFn, /slot\.appendChild\(iframeVivo\)/);
    assert.match(renderFn, /if\(!forcar&&frameSensor&&!sensorConcluido\)/);
  });

  it("quadro preservado não emite um iframe novo (evita intro com 0 bolinhas)", () => {
    assert.match(telaFn, /function telaTarefaSensor\(tipo, preservarQuadro\)/);
    assert.match(telaFn, /var quadro=preservarQuadro/);
    assert.match(telaFn, /sensor-play" id="mosaic"><\/div>/);
  });

  it("tarefa-ok marca a run e troca para Fragmento encontrado antes do Firestore", () => {
    assert.match(MESA, /sensorOkPorRun:\{\}/);
    assert.match(MESA, /function sensorRodadaConcluida\(/);
    assert.match(telaFn, /sensorRodadaConcluida\(tipo\)/);
    assert.match(telaFn, /Fragmento encontrado/);
    assert.match(concluirFn, /STATE\.sensorOkPorRun\[esperado\]=true/);
    assert.match(concluirFn, /render\(\)/);
    const renderIdx = concluirFn.indexOf("render();");
    const awaitIdx = concluirFn.indexOf("await esperarFB()");
    assert.ok(renderIdx > 0 && awaitIdx > renderIdx,
      "Fragmento encontrado tem de aparecer antes do round-trip do Firestore");
  });

  it("Caso, Arquivo e Sala ainda forçam render — e o parque do iframe cobre esses cliques", () => {
    assert.match(MESA, /function alternarMenuMestre\(\)[\s\S]*render\(true\)/);
    assert.match(MESA, /function alternarCaso\(\)[\s\S]*render\(true\)/);
    assert.match(MESA, /btn-pistas[\s\S]*render\(true\)/);
    assert.match(renderFn, /abrir Caso, Arquivo ou Sala/);
  });
});

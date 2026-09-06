/**
 * Catraca do layout iPhone na Casa Celular (rodada sensor / Janela do Norte).
 * O quadro precisa comer o vão entre o chrome de cima e o mural; o mural
 * cola no safe-area. Sem isto volta o void preto sob “Mural coletivo”.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const ler = (p) => readFileSync(join(root, p), "utf8").replace(/\r\n/g, "\n");

function sliceCss(mesa) {
  const start = mesa.indexOf("body.fase-sensor{");
  assert.ok(start >= 0, "não achei o bloco body.fase-sensor");
  const end = mesa.indexOf(".revelacao-final", start);
  assert.ok(end > start, "bloco fase-sensor não termina antes de .revelacao-final");
  return mesa.slice(start, end);
}

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

const MESA = ler("v1/MOSAICO-mesa.html");
const CASA = ler("v1/js/casa-da-costa-v2.js");
const CSS = sliceCss(MESA);

describe("Casa Celular · viewport iPhone (fase-sensor)", () => {
  it("body e #app são coluna flex que trava a viewport", () => {
    assert.match(CSS, /body\.fase-sensor\{[^}]*display:flex/);
    assert.match(CSS, /body\.fase-sensor\{[^}]*flex-direction:column/);
    assert.match(CSS, /body\.fase-sensor\{[^}]*height:100dvh/);
    assert.match(CSS, /body\.fase-sensor\{[^}]*overflow:hidden/);
    assert.match(CSS, /body\.fase-sensor #app[^}]*flex:1 1 0/);
    assert.match(CSS, /body\.fase-sensor #app[^}]*min-height:0/);
    assert.match(CSS, /padding:6px 10px 0/);
    assert.equal(/body\.fase-sensor #app\{padding:[^}]*barra-reserva/.test(CSS), false);
  });

  it("quadro do sensor (#mosaic / .sensor-play) preenche o vão", () => {
    assert.match(CSS, /\.sensor-play\{[^}]*flex:1 1 0/);
    assert.match(CSS, /\.sensor-play\{[^}]*min-height:0/);
    assert.match(CSS, /\.tarefa-frame\{[^}]*flex:1 1 0/);
    assert.match(CSS, /\.tarefa-frame\{[^}]*min-height:0/);
    assert.equal(/min-height:300px/.test(CSS), false);
  });

  it("mural cola no safe-area — sem margem 78px de barra antiga", () => {
    assert.match(CSS, /\.mural-movel\{[^}]*flex:0 0 auto/);
    assert.match(CSS, /\.mural-movel\{[^}]*safe-area-inset-bottom/);
    assert.equal(/fase-sensor[\s\S]*mural-movel\{[^}]*78px/.test(CSS), false);
    assert.match(MESA, /\.mural-movel\{margin:18px 0 78px/);
    assert.match(CSS, /\.mural-movel summary\{[^}]*min-height:44px/);
  });

  it("chrome de cima compacto: Caso|Sala ≥44px, card e copy apertados", () => {
    assert.match(CSS, /\.barra-jogo \.btn-caso[^}]*min-height:44px/);
    assert.match(CSS, /\.rodada-celular\{[^}]*padding:6px 10px/);
    assert.match(CSS, /\.sensor-copy\{[^}]*flex-direction:column/);
    assert.match(CSS, /\.sensor-copy\{[^}]*gap:3px/);
    assert.equal(/sensor-copy\{[^}]*grid-template-columns/.test(CSS), false);
    assert.equal(/sensor-copy\{[^}]*grid-auto-flow/.test(CSS), false);
  });

  it("telaTarefaSensor emite um bloco de copy + #mosaic, sem 2 colunas", () => {
    const fn = fnSlice(MESA, "function telaTarefaSensor(", ["function meuJogador("]);
    assert.match(fn, /sensor-copy/);
    assert.match(fn, /sensor-pergunta/);
    assert.match(fn, /id="mosaic"/);
    assert.match(fn, /sensor-play/);
    assert.match(fn, /Mantenha a tela voltada para voc/);
    assert.equal(/grid-template-columns/.test(fn), false);
  });

  it("pergunta da partida não duplica acima do sensor-copy", () => {
    const wrap = fnSlice(CASA, "global.cabecalhoRodada=function", ["if(global.CASO&&CASO.partidas)"]);
    assert.match(wrap, /STATE\.tela==='inclinacao'/);
    assert.match(wrap, /STATE\.tela==='constelacao'/);
    assert.match(wrap, /partida-pergunta/);
  });
});

describe("overlays embed · quadro da Mesa, não dvh do Safari", () => {
  const pares = [
    ["v1/MOSAICO-26-a-janela-do-norte.html", "v1/MOSAICO-26-a-sala-as-escuras.html", "v1/MOSAICO-26-vidro-embacado.html"],
    ["mosaico-web/public/modulos/janela-do-norte.html", "mosaico-web/public/modulos/sala-as-escuras.html", "mosaico-web/public/modulos/vidro-embacado.html"],
  ];
  it("html.embed trava altura em 100% do iframe", () => {
    for (const grupo of pares) {
      for (const p of grupo) {
        const src = ler(p);
        assert.match(src, /html\.embed,html\.embed body\{height:100%;max-height:100%;overflow:hidden\}/, p);
        assert.match(src, /document\.documentElement\.classList\.add\("embed"\)/, p);
      }
    }
  });
});

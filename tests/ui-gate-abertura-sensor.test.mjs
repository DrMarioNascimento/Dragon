/**
 * Gate Celular Abrir|Entrar, abertura Solo/Mestre/Telão, sensor soft deadline.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const ler = (p) => readFileSync(join(root, p), "utf8").replace(/\r\n/g, "\n");

const ROOM = ler("firebase-room.js");
const PAUTA = ler("carro-forte/pauta-da-mesa.js");
const MESA = ler("v1/MOSAICO-mesa.html");
const TS = ler("v1/js/tarefa-sensor.js");
const JANELA = ler("v1/MOSAICO-26-a-janela-do-norte.html");
const ATIV = ler("carro-forte/atividade.js");
const TELAO = ler("telao.html");
const PADRAO = ler("PADRAO-SALA-MULTIPLAYER.md");

describe("abertura · roteamento", () => {
  it("Carro: convidado espera; Mestre toca local ou aciona telão", () => {
    assert.match(PAUTA, /async function abertura\(/);
    assert.match(PAUTA, /if \(!souMestre\(\)\)/);
    assert.match(PAUTA, /usouTelao = await telaoVivo/);
    assert.match(PAUTA, /opening\.command.*start|opening\.command': 'start'/);
  });

  it("Casa: com telão vivo manda opening.command; sem telão toca no Mestre", () => {
    const fn = MESA.slice(MESA.indexOf("function sincronizarAudioAbertura"), MESA.indexOf("function vozDaFase"));
    assert.match(fn, /DragonSala\.telaoPronto/);
    assert.match(fn, /opening\.command/);
    assert.match(fn, /tocarAberturaComAmbiente/);
  });

  it("Telão Casa tem áudio da abertura", () => {
    assert.match(TELAO, /casa-da-costa[\s\S]*A-Casa-da-Costa-Abertura\.mp3/);
  });
});

describe("sensor · finger + soft deadline", () => {
  it("tarefa-sensor expõe prazoSuave 50s", () => {
    assert.match(TS, /SOFT_DEADLINE_MS\s*=\s*50000/);
    assert.match(TS, /prazoSuave\s*=\s*function/);
  });

  it("tarefa-sensor: avisoAntesModoDedo (3s) + gate OK+countdown", async () => {
    assert.match(TS, /AVISO_MODO_DEDO_SEG\s*=\s*3/);
    assert.match(TS, /avisoAntesModoDedo\s*=\s*function/);
    assert.match(TS, /modoDedoPodeLiberar\s*=\s*function/);
    assert.match(TS, /Seu telefone não tem ou não funciona o giroscópio/);
    assert.match(TS, /liberado para deslize por dedo/);
    const { createContext, runInContext } = await import("node:vm");
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
        createElement: () => ({ dataset: {}, style: {}, setAttribute() {}, addEventListener() {}, appendChild() {} }),
        body: { appendChild() {} },
        head: { appendChild() {} },
      },
    });
    ctx.window = ctx;
    ctx.globalThis = ctx;
    runInContext(TS + "; this.__TS = TarefaSensor;", ctx);
    const api = ctx.__TS;
    assert.equal(api.AVISO_MODO_DEDO_SEG, 3);
    assert.equal(
      api.AVISO_MODO_DEDO_TIT,
      "Seu telefone não tem ou não funciona o giroscópio."
    );
    assert.equal(
      api.avisoModoDedoTexto(3),
      "Após 3 segundos ele será liberado para deslize por dedo. Aguarde."
    );
    assert.equal(api.modoDedoPodeLiberar({ countdownOk: false, usuarioOk: true }), false);
    assert.equal(api.modoDedoPodeLiberar({ countdownOk: true, usuarioOk: false }), false);
    assert.equal(api.modoDedoPodeLiberar({ countdownOk: true, usuarioOk: true }), true);
  });

  it("Janela do Norte Casa: finger mode + prazo suave; CTA Casa-correto", () => {
    assert.match(JANELA, /entrarModoDedo/);
    assert.match(JANELA, /cairNoModoDedo/);
    assert.match(JANELA, /avisoAntesModoDedo/);
    assert.match(JANELA, /armarPrazoSuave/);
    assert.match(JANELA, /Apontar a janela/);
    assert.equal(/Descer do carro/i.test(JANELA), false);
  });

  it("Vidro e Sala Casa: cairNoModoDedo antes do dedo", () => {
    const VIDRO = ler("v1/MOSAICO-26-vidro-embacado.html");
    const SALA = ler("v1/MOSAICO-26-a-sala-as-escuras.html");
    for (const src of [VIDRO, SALA, JANELA]) {
      assert.match(src, /function cairNoModoDedo/);
      assert.match(src, /avisoAntesModoDedo/);
      assert.match(src, /aoNegar:\s*function\(\)\{\s*cairNoModoDedo/);
    }
  });

  it("Carro atividade: soft 50s sem fimMs da mesa", () => {
    assert.match(ATIV, /SOFT_MS\s*=\s*50000/);
    assert.match(ATIV, /sem-precisao/);
    assert.match(ATIV, /if \(!fimMs\) setTimeout/);
  });
});

describe("PADRAO · nota Celular gate + abertura", () => {
  it("documenta Abrir|Entrar only e roteamento abertura", () => {
    assert.match(PADRAO, /NÃO repete a escolha de modo/);
    assert.match(PADRAO, /Solo.*neste aparelho/s);
    assert.match(PADRAO, /Multiplayer sem telão/);
    assert.match(PADRAO, /Multiplayer com telão/);
  });

  it("firebase-room não tem passoTelao", () => {
    const criar = ROOM.slice(ROOM.indexOf("async function criarSalaBase"), ROOM.indexOf("const TELAO_VIVO_MS"));
    assert.equal(/function passoTelao/.test(ROOM), false);
    assert.equal(/passoTelao\(\)/.test(criar), false);
    assert.match(criar, /formEntrar\('',true\)/);
  });
});

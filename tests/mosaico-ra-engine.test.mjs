import assert from "node:assert/strict";
import { readFileSync, statSync, existsSync } from "node:fs";
import { describe, it } from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const ler = (p) => readFileSync(join(root, p), "utf8").replace(/\r\n/g, "\n");

describe("Mosaico RA & Sala 3D Volumétrica · Motor e Integração", () => {
  const threePath = join(root, "v1/js/three.min.js");
  const engineSrc = ler("v1/js/mosaico-ra-engine.js");
  const mesaHtml = ler("v1/MOSAICO-mesa.html");
  const salaHtml = ler("v1/MOSAICO-26-a-sala-as-escuras.html");
  const cssSrc = ler("v1/css/mosaico-3d.css");

  it("Three.js local offline está presente e tem tamanho adequado (> 500 KB)", () => {
    assert.ok(existsSync(threePath), "v1/js/three.min.js deve existir");
    const st = statSync(threePath);
    assert.ok(st.size > 500000, `Three.js deve ser a biblioteca completa (>500KB), achou ${st.size}`);
  });

  it("mosaico-ra-engine.js define o módulo global MosaicoRA com todas as capacidades", () => {
    assert.match(engineSrc, /global\.MosaicoRA\s*=\s*MosaicoRA/);
    assert.match(engineSrc, /MosaicoRA\.iniciar\s*=/);
    assert.match(engineSrc, /MosaicoRA\.encerrar\s*=/);
    assert.match(engineSrc, /MosaicoRA\.trocarModo\s*=/);
    assert.match(engineSrc, /MosaicoRA\.construirSala3D\s*=/);
    assert.match(engineSrc, /MosaicoRA\.construirAnamorfose\s*=/);
    assert.match(engineSrc, /MosaicoRA\.ativarCameraRA\s*=/);
    assert.match(engineSrc, /MosaicoRA\.desativarCameraRA\s*=/);
    assert.match(engineSrc, /MosaicoRA\.examinarObjeto\s*=/);
    assert.match(engineSrc, /MosaicoRA\.fecharInspecao\s*=/);
  });

  it("mosaico-ra-engine.js contempla os 9 objetos canônicos da Casa da Costa em 3D", () => {
    const objetos = [
      "quadro", "cofre", "vaso", "escrivaninha",
      "gaveta", "secretaria", "espelho", "janela", "relogio"
    ];
    for (const obj of objetos) {
      assert.match(engineSrc, new RegExp(`objetos3D\\["${obj}"\\]`), `Objeto canônico 3D ausente: ${obj}`);
    }
  });

  it("anamorfose espacial ('A Marca Partida') possui ângulo de alinhamento e tolerância", () => {
    assert.match(engineSrc, /anamorfoseAlvo:\s*\{\s*yaw:\s*137,\s*pitch:\s*11\s*\}/);
    assert.match(engineSrc, /desvioTotal\s*<\s*3\.2/);
    assert.match(engineSrc, /ANAMORFOSE ALINHADA/);
  });

  it("câmera RA suporta shader de luz negra UV forense com pegadas e envelope lacrado", () => {
    assert.match(engineSrc, /criarPistasUV\s*=/);
    assert.match(engineSrc, /pegadaMat/);
    assert.match(engineSrc, /selo/);
  });

  it("MOSAICO-mesa.html integra Three.js e motor RA sem quebrar cache stamps", () => {
    assert.match(mesaHtml, /<script src="js\/three\.min\.js"><\/script>/);
    assert.match(mesaHtml, /<script src="js\/mosaico-ra-engine\.js"><\/script>/);
    assert.match(mesaHtml, /irParaFaseTeste3D\(\\?['"]sala3d\\?['"]\)/);
    assert.match(mesaHtml, /🕯️ Sala 3D & RA/);
  });

  it("MOSAICO-26-a-sala-as-escuras.html integra Three.js, RA e botão seletor mantendo canônico", () => {
    assert.match(salaHtml, /<script src="js\/three\.min\.js"><\/script>/);
    assert.match(salaHtml, /<script src="js\/mosaico-ra-engine\.js"><\/script>/);
    assert.match(salaHtml, /id="b-ra"/);
    assert.match(salaHtml, /alternarModo3DRA/);
  });

  it("mosaico-3d.css contém estilos para HUD, visor RA, abas e modal de inspeção 360°", () => {
    assert.match(cssSrc, /\.mosaico-ra-container/);
    assert.match(cssSrc, /\.mosaico-ra-hud/);
    assert.match(cssSrc, /\.mosaico-ra-tabs/);
    assert.match(cssSrc, /\.mosaico-ra-tab/);
    assert.match(cssSrc, /\.mosaico-ra-modal/);
  });
});

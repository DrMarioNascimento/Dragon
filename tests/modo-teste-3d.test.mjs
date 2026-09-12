import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const ler = (p) => readFileSync(join(root, p), "utf8").replace(/\r\n/g, "\n");

describe("Modo de Teste Rápido 3D · Acesso direto sem sala", () => {
  const html = ler("v1/MOSAICO-mesa.html");
  const css = ler("v1/css/mosaico-3d.css");

  it("MOSAICO-mesa.html expõe funções globais de teste 3D", () => {
    assert.match(html, /window\.iniciarTeste3D\s*=\s*function/);
    assert.match(html, /window\.irParaFaseTeste3D\s*=\s*function/);
    assert.match(html, /window\.sairTeste3D\s*=\s*function/);
    assert.match(html, /function atualizarDockTeste3D\(\)/);
    assert.match(html, /function atualizarBotaoFlutuanteTeste\(\)/);
  });

  it("render atualiza o dock e o botão flutuante", () => {
    assert.match(html, /atualizarDockTeste3D\(\)/);
    assert.match(html, /atualizarBotaoFlutuanteTeste\(\)/);
  });

  it("ações interceptam localmente quando STATE.modoTeste3D está ativo", () => {
    assert.match(html, /if\(STATE\.modoTeste3D\)\s*\{\s*if\(n\)\s*n\.rascunho\s*=\s*rascunho;/);
    assert.match(html, /if\(STATE\.modoTeste3D\)\s*\{\s*if\(n\)\{\s*n\.rascunho\s*=\s*rascunhoFinal;/);
    assert.match(html, /if\(STATE\.modoTeste3D\)\s*\{\s*STATE\.v5\.ofertas\s*=\s*STATE\.v5\.ofertas/);
    assert.match(html, /if\(STATE\.modoTeste3D\)\s*\{\s*var ofItem\s*=\s*\(STATE\.v5\.ofertas/);
    assert.match(html, /if\(STATE\.modoTeste3D\)\s*\{\s*dados\.submetidoEm\s*=/);
  });

  it("css contém regras para dock e badge flutuante de teste", () => {
    assert.match(css, /\.m3d-dock-teste/);
    assert.match(css, /\.m3d-badge-launch/);
    assert.match(css, /\.m3d-pulse-gold/);
  });

  it("suporta parâmetro de URL ?teste= para inicialização imediata", () => {
    assert.match(html, /paramsTeste\.get\("teste"\)/);
    assert.match(html, /window\.iniciarTeste3D\(f\)/);
  });
});

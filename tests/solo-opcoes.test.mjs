import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const html = readFileSync(join(root, "solo/index.html"), "utf8");
const jogo = readFileSync(join(root, "solo/mesa-solo.js"), "utf8");

describe("modo solo", () => {
  it("a página publicada carrega o jogo modular", () => {
    assert.match(html, /id="app"/);
    assert.match(html, /mesa-solo\.js/);
    assert.match(html, /mosaico-cloud-ready/);
    assert.match(jogo, /function tocarMosaico\(/);
    assert.match(jogo, /function load\(/);
  });

  /* As perguntas de fato ("o que esta evidência permite afirmar?") saíram do
     Solo em 18/09/2026 — não existem na Mesa. A régua fica no que sobrou de
     ordem sorteada: o Mosaico não pode nascer já na ordem certa. */
  it("a verdade não fica sempre na primeira opção", () => {
    assert.match(jogo, /function shuffle/);
    assert.match(jogo, /state\.mosaico=shuffle\(itensMosaico\(\)\);if\(state\.mosaico\.every\(\(x,i\)=>x\.id===itensMosaico\(\)\[i\]\.id\)\)state\.mosaico\.reverse\(\)/);
    assert.doesNotMatch(jogo, /shuffle\(\[e\.fact/, "as perguntas de fato voltaram ao Solo");
  });

  it("não há uma segunda cópia em solo\/src", () => {
    assert.equal(existsSync(join(root, "solo/src")), false);
  });
});

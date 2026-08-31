import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const html = readFileSync(join(root, "solo/index.html"), "utf8");
const jogo = readFileSync(join(root, "solo/solo-auto.js"), "utf8");

describe("modo solo", () => {
  it("a página publicada carrega o jogo modular", () => {
    assert.match(html, /id="app"/);
    assert.match(html, /solo-auto\.js/);
    assert.match(html, /mosaico-cloud-ready/);
    assert.match(jogo, /function tap\(/);
    assert.match(jogo, /function load\(/);
  });

  it("a verdade não fica sempre na primeira opção", () => {
    assert.match(jogo, /function shuffle/);
    assert.match(jogo, /shuffle\(\[e\.fact/);
    assert.match(jogo, /state\.order=shuffle/);
  });

  it("não há uma segunda cópia em solo\/src", () => {
    assert.equal(existsSync(join(root, "solo/src")), false);
  });
});

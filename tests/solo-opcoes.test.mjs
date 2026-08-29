import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const html = readFileSync(join(root, "solo/index.html"), "utf8");

describe("modo solo", () => {
  it("a página publicada é o jogo, não um cartaz", () => {
    assert.match(html, /<script>/);
    assert.match(html, /data-act="brief"/);
    assert.match(html, /function tapPiece/);
    assert.match(html, /function decksFor/);
  });

  it("a verdade não fica sempre na primeira opção", () => {
    assert.match(html, /function shuffle/);
    assert.match(html, /shuffle\(MOTIVES/);
    assert.match(html, /shuffle\(ACTIONS/);
    assert.match(html, /shuffle\(PROOFS/);
    assert.match(html, /shuffle\(GAPS/);
    assert.match(html, /shuffle\(SUSPECTS/);
  });

  it("não há uma segunda cópia em solo/src", () => {
    assert.equal(existsSync(join(root, "solo/src")), false);
  });
});

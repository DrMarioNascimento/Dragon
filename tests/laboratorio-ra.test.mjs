import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const text = path => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("o hub não oferece mais o card 03 do Laboratório RA", async () => {
  const home = await text("index.html");
  assert.doesNotMatch(home, /id="laboratorio-ra"/);
  assert.doesNotMatch(home, /id="ra-access-form"/);
  assert.match(home, /lab-ra/i);
});

test("laboratorio-ra/ redireciona para o repositório Lab RA", async () => {
  const stub = await text("laboratorio-ra/index.html");
  assert.match(stub, /drmarionascimento\.github\.io\/lab-ra/);
  assert.match(stub, /location\.replace/);
});

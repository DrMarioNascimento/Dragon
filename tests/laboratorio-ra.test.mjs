import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import test from "node:test";

const text = path => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("o hub não oferece mais o card 03 do Laboratório RA", async () => {
  const home = await text("index.html");
  assert.doesNotMatch(home, /id="laboratorio-ra"/);
  assert.doesNotMatch(home, /id="ra-access-form"/);
  assert.doesNotMatch(home, /lab-ra/i);
});

test("Dragon não mantém pasta de redirecionamento nem links para Lab RA", async () => {
  assert.equal(existsSync(new URL("../laboratorio-ra", import.meta.url)), false);
  for (const path of ["index.html", "README.md"]) {
    assert.doesNotMatch(await text(path), /https?:\/\/(?:drmarionascimento\.github\.io\/lab-ra|github\.com\/DrMarioNascimento\/lab-ra)/i);
  }
});

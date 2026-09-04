import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const text = path => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const bytes = path => readFile(new URL(`../${path}`, import.meta.url));

test("o card 03 abre o laboratório protegido", async () => {
  const [home, guard] = await Promise.all([
    text("index.html"),
    text("laboratorio-ra/guard.js"),
  ]);

  assert.match(home, /id="laboratorio-ra"/);
  assert.match(home, /id="ra-access-form"/);
  assert.match(home, /type="password"/);
  assert.doesNotMatch(home, /03 · em breve/i);
  assert.match(guard, /crypto\.subtle\.digest\("SHA-256"/);
  assert.match(guard, /sessionStorage/);
});

test("as páginas protegidas e seus recursos estão publicáveis", async () => {
  const [hub, comparison, spatial, css, model] = await Promise.all([
    text("laboratorio-ra/index.html"),
    text("laboratorio-ra/comparacao.html"),
    text("laboratorio-ra/laboratorio-ra.html"),
    text("laboratorio-ra/laboratorio.css"),
    bytes("laboratorio-ra/escrivaninha.glb"),
  ]);

  for (const page of [hub, comparison, spatial]) {
    assert.match(page, /data-ra-protected/);
    assert.match(page, /guard\.js/);
  }
  assert.match(hub, /href="comparacao\.html"/);
  assert.match(hub, /href="laboratorio-ra\.html"/);
  assert.match(comparison, /getUserMedia/);
  assert.match(comparison, /mra-offset/);
  assert.match(spatial, /src="escrivaninha\.glb"/);
  assert.match(spatial, /ar-modes="webxr scene-viewer quick-look"/);
  assert.match(spatial, /ar-scale="fixed"/);
  assert.ok(css.length > 1000);
  assert.equal(model.toString("ascii", 0, 4), "glTF");
  assert.equal(model.readUInt32LE(4), 2);
  assert.equal(model.readUInt32LE(8), model.length);
});

test("o modelo conserva a largura física aproximada de 1,28 m", async () => {
  const model = await bytes("laboratorio-ra/escrivaninha.glb");
  const jsonLength = model.readUInt32LE(12);
  const json = JSON.parse(model.toString("utf8", 20, 20 + jsonLength).replace(/\0+$/u, ""));
  const position = json.accessors.find(accessor => accessor.type === "VEC3" && accessor.min && accessor.max);
  assert.ok(position);
  assert.ok(Math.abs((position.max[0] - position.min[0]) - 1.28) < 0.001);
});

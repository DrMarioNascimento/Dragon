#!/usr/bin/env node
/* Publica a noite em ../v2/ para o GitHub Pages.
 *
 * Este passo era feito à mão: build, copiar dist/client por cima de v2/,
 * duplicar _shell.html como index.html e 404.html, lembrar do .nojekyll. Nada
 * verificava que o publicado correspondia à fonte, e já houve deriva — o
 * favicon foi editado direto no v2/ e o build seguinte o desfez sem avisar.
 *
 * A limpeza é o ponto principal: sem apagar v2/ antes, um arquivo que sai da
 * fonte fica para trás no build para sempre, e o site continua servindo um
 * asset que ninguém mais consegue explicar.
 *
 *   node scripts/publicar-pages.mjs
 */
import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync, copyFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const AQUI = dirname(fileURLToPath(import.meta.url));
const WEB = join(AQUI, "..");
const RAIZ = join(WEB, "..");
const DIST = join(WEB, "dist", "client");
const V2 = join(RAIZ, "v2");

function passo(texto) {
  process.stdout.write("· " + texto + "\n");
}

passo("build com base /Dragon/v2/");
execFileSync(process.execPath, [join(WEB, "node_modules", "vite", "bin", "vite.js"), "build"], {
  cwd: WEB,
  stdio: "inherit",
  env: { ...process.env, MOSAICO_PAGES: "1" },
});

if (!existsSync(join(DIST, "_shell.html"))) {
  throw new Error("dist/client/_shell.html não saiu do build — a base de Pages não foi aplicada");
}

passo("apaga v2/ (senão asset removido da fonte fica para sempre)");
rmSync(V2, { recursive: true, force: true });
mkdirSync(V2, { recursive: true });

passo("copia dist/client → v2/");
cpSync(DIST, V2, { recursive: true });

passo("_shell.html vira index.html e 404.html");
/* O Pages serve 404.html para qualquer endereço sem arquivo; sendo o mesmo
   documento, uma rota digitada à mão ainda carrega o app, que então lê o
   hash. Os três TÊM de ser idênticos — tests/v2-publicado.test.mjs confere. */
for (const nome of ["index.html", "404.html"]) {
  copyFileSync(join(V2, "_shell.html"), join(V2, nome));
}

passo(".nojekyll (o Jekyll do Pages engole pastas com _ na frente)");
writeFileSync(join(V2, ".nojekyll"), "");

const n = (function conta(dir) {
  let total = 0;
  for (const nome of readdirSync(dir, { withFileTypes: true })) {
    total += nome.isDirectory() ? conta(join(dir, nome.name)) : 1;
  }
  return total;
})(V2);

process.stdout.write(`\nv2/ publicado: ${n} arquivos.\n`);
process.stdout.write("Confira com:  npm test  (na raiz)\n");

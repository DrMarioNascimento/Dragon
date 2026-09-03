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
 * NADA SE ESCREVE EM v2/. Ele é apagado inteiro a cada publicação, então
 * arquivo editado ali é arquivo perdido — e não em teoria: em 02/09/2026 este
 * rmSync comeu seis arquivos escritos à mão (room-shell.js, noite-auto.js,
 * noite.js, master-sala.js, noite.css, room.css), e a restauração por git
 * levou junto a reescrita do dia, que teve de ser refeita de memória.
 *
 * Os seis passaram a morar em public/, que o Vite copia verbatim para o
 * build. Continuam chegando a v2/ com o mesmo nome e a mesma URL — o que muda
 * é que agora saem da fonte, e a limpeza não os alcança. A conferência no fim
 * deste arquivo é o alarme para o dia em que alguém mover um de volta.
 *
 * Restaram CINCO mais a casca. `noite.js` era o gêmeo velho do `noite-auto.js`
 * — os dois definiam `window.MosaicoNoite={fecharModulo}` e traziam listas de
 * fragmentos diferentes — e o `room-shell.js` só carrega o `noite-auto.js`,
 * nos dois caminhos. Sobreviveu à limpeza do cânone porque a conferência daqui
 * o exigia no build, e um arquivo exigido parece um arquivo usado. Apagado em
 * 02/09/2026.
 *
 * A PÁGINA que carrega os seis — noite-shell.html — mora em public/ pelo mesmo
 * motivo, e é ela que vira index.html, 404.html e _shell.html no fim. Salvar
 * um arquivo do apagamento não adianta se a página que o carrega é
 * sobrescrita na linha seguinte; foi exatamente o que aconteceu.
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

/* Tudo o que v2/ precisa ter nasce do build. O que não nascer é apagado aqui
   e cobrado na conferência lá embaixo. */
passo("apaga v2/ (senão asset removido da fonte fica para sempre)");
rmSync(V2, { recursive: true, force: true });
mkdirSync(V2, { recursive: true });

passo("copia dist/client → v2/");
cpSync(DIST, V2, { recursive: true });

/* A ENTRADA DE /Dragon/v2/ É A NOITE, NÃO O APP REACT.
 *
 * Aqui estava `copyFileSync(_shell.html → index.html)`, e isso foi o segundo
 * estrago desta publicação, gêmeo do rmSync: em 02/09/2026 ele substituiu a
 * página escrita à mão de A Noite pela casca do React. Os arquivos dela
 * sobreviveram — room-shell.js, noite-auto.js, master-sala.js e as duas CSS —,
 * mas nada mais os carregava. A Noite publicada passou a ser o app React, cujo
 * caso ainda é o antigo (case.ts, TRUTH: elias/m-heranca/a-disjuntor), e
 * ninguém percebeu porque a página abre normalmente: ela só abre OUTRO jogo.
 *
 * Salvar um arquivo do apagamento não adianta se a página que o carrega é
 * sobrescrita na linha seguinte.
 *
 * Os três nomes recebem noite-shell.html, que mora em public/ como todo o
 * resto escrito à mão. O Pages serve 404.html para qualquer endereço sem
 * arquivo, então os três TÊM de ser o mesmo documento —
 * tests/v2-publicado.test.mjs confere isso. */
passo("noite-shell.html vira _shell.html, index.html e 404.html");
const SHELL = join(V2, "noite-shell.html");
if (!existsSync(SHELL)) {
  throw new Error(
    "noite-shell.html não chegou ao build.\n" +
    "É a página de entrada de A Noite e mora em mosaico-web/public/.\n" +
    "Sem ela, /Dragon/v2/ abre o app React em vez do jogo."
  );
}
for (const nome of ["_shell.html", "index.html", "404.html"]) {
  copyFileSync(SHELL, join(V2, nome));
}

passo(".nojekyll (o Jekyll do Pages engole pastas com _ na frente)");
writeFileSync(join(V2, ".nojekyll"), "");

/* A SALA NÃO É COMPILADA: room-shell.js e companhia são JavaScript escrito à
   mão que o Vite apenas copia. Se um deles sumir de public/, o build passa, o
   site sobe, e A Noite abre numa página em branco — sem erro em lugar nenhum,
   porque <script> que dá 404 é descartado em silêncio. A publicação falha
   aqui, antes de alguém descobrir isso numa mesa. */
passo("confere os arquivos escritos à mão");
const A_MAO = ["noite-shell.html", "room-shell.js", "noite-auto.js",
               "master-sala.js", "noite.css", "room.css"];
const faltando = A_MAO.filter((nome) => !existsSync(join(V2, nome)));
if (faltando.length) {
  throw new Error(
    "não chegaram ao build: " + faltando.join(", ") +
    "\nEles moram em mosaico-web/public/ e o Vite os copia verbatim." +
    "\nSe foram movidos para v2/, mova de volta: v2/ é apagado a cada publicação."
  );
}

const n = (function conta(dir) {
  let total = 0;
  for (const nome of readdirSync(dir, { withFileTypes: true })) {
    total += nome.isDirectory() ? conta(join(dir, nome.name)) : 1;
  }
  return total;
})(V2);

process.stdout.write(`\nv2/ publicado: ${n} arquivos.\n`);
process.stdout.write("Confira com:  npm test  (na raiz)\n");

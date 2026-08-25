/* O carimbo de cache é escrito à mão em cinco tags `?v=`: `js/mosaico-v5.js`
   e `js/qr.js` na mesa, e `js/tarefa-sensor.js` em cada um dos três módulos
   sensoriais. Cada módulo sensorial é um documento próprio e não enxerga a
   mesa, então não há como reduzir a um lugar só.

   O comentário no código já disse, por um tempo, que era "um lugar só". Não
   era — e o efeito de acreditar nisso é publicar uma correção trocando uma
   data e deixando quatro para trás, com os aparelhos servindo do cache o
   módulo antigo ao lado do HTML novo. Nenhum outro teste pega isso: o
   arquivo continua válido, o jogo continua abrindo, e a versão errada só
   aparece na mesa.

   Esta auditoria exige que os cinco carimbos digam a mesma coisa. */

import { readFileSync } from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

const ARQUIVOS = [
  "MOSAICO-mesa.html",
  "MOSAICO-26-a-janela-do-norte.html",
  "MOSAICO-26-a-sala-as-escuras.html",
  "MOSAICO-26-vidro-embacado.html"
];

function carimbos() {
  const achados = [];
  for (const nome of ARQUIVOS) {
    const texto = readFileSync(new URL(`../${nome}`, import.meta.url), "utf8");
    const re = /src="(js\/[^"?]+)\?v=([^"]+)"/g;
    let m;
    while ((m = re.exec(texto)) !== null) {
      achados.push({ arquivo: nome, modulo: m[1], versao: m[2] });
    }
  }
  return achados;
}

test("todo módulo carregado pelo ?v= traz um carimbo", () => {
  const achados = carimbos();
  assert.ok(achados.length >= 5,
    `esperava ao menos 5 tags com ?v=, encontrei ${achados.length}. ` +
    `Se uma tag perdeu o carimbo, ela deixou de furar o cache dos aparelhos.`);
});

test("os cinco carimbos dizem a mesma versão", () => {
  const achados = carimbos();
  const versoes = [...new Set(achados.map(a => a.versao))];
  const mapa = achados.map(a => `  ${a.arquivo} → ${a.modulo} = ${a.versao}`).join("\n");
  assert.equal(versoes.length, 1,
    `os carimbos divergiram (${versoes.join(", ")}). Ao publicar, todos os ` +
    `?v= sobem juntos, senão o aparelho serve do cache um módulo antigo ao ` +
    `lado do HTML novo:\n${mapa}`);
});

test("o carimbo lido em window.MOSAICO_VERSAO é o mesmo das tags", () => {
  const html = readFileSync(new URL("../MOSAICO-mesa.html", import.meta.url), "utf8");
  const daTag = /src="js\/mosaico-v5\.js\?v=([^"]+)"/.exec(html);
  assert.ok(daTag, "não encontrei a tag de js/mosaico-v5.js com ?v=");
  assert.ok(/querySelector\('script\[src\*="mosaico-v5\.js"\]'\)/.test(html),
    "window.MOSAICO_VERSAO deixou de ler a tag do mosaico-v5.js. " +
    "Se a fonte do carimbo mudou, este teste precisa mudar junto.");
});

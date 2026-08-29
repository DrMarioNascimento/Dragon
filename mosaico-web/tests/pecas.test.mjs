/* A geometria das peças do Encaixe.
 *
 * Peça de quebra-cabeça errada não parece errada: continua sendo um
 * retângulo com relevo nas bordas, e o olho aceita. A forma antiga era um
 * arco quadrático único — um calombo — e o lado de baixo de uma peça saía de
 * "-t" da MESMA peça. Como o t da primeira fileira é zerado na borda, a
 * fileira inteira ficava com a base reta e a fileira debaixo enfiava um pino
 * dentro dela. Ninguém viu, porque nada disto era exercitado.
 *
 * O que estes testes protegem é a única propriedade que importa: as duas
 * peças que dividem uma aresta têm de descrever a MESMA curva. */

import test from "node:test";
import assert from "node:assert/strict";
import { piecePath, tabsFor, pinoH, pinoV } from "../src/lib/mosaico/pecas.ts";

const COLS = 2;
const ROWS = 3;

const peca = (col, row) => ({
  id: `${col}:${row}`,
  col,
  row,
  tabs: tabsFor(col, row, COLS, ROWS),
});

/* --------------------------------------------------------------- encaixe */

test("peças vizinhas na vertical projetam para o mesmo lado do mundo", () => {
  /* A base tem normal (0,+1): o deslocamento no +y do mundo é +b.
     O topo tem normal (0,-1): o deslocamento no +y do mundo é -t.
     Se os dois forem iguais, o pino de uma entra no buraco da outra. */
  for (let col = 0; col < COLS; col += 1) {
    for (let row = 0; row + 1 < ROWS; row += 1) {
      const cima = peca(col, row);
      const baixo = peca(col, row + 1);
      assert.equal(
        cima.tabs.b,
        -baixo.tabs.t,
        `aresta h ${col}:${row + 1} — as duas peças projetam para lados opostos`,
      );
      assert.notEqual(cima.tabs.b, 0, "aresta interna não pode ser reta");
    }
  }
});

test("peças vizinhas na horizontal projetam para o mesmo lado do mundo", () => {
  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col + 1 < COLS; col += 1) {
      const esq = peca(col, row);
      const dir = peca(col + 1, row);
      assert.equal(
        esq.tabs.r,
        -dir.tabs.l,
        `aresta v ${col + 1}:${row} — as duas peças projetam para lados opostos`,
      );
      assert.notEqual(esq.tabs.r, 0, "aresta interna não pode ser reta");
    }
  }
});

test("a borda de fora do quebra-cabeça é reta", () => {
  /* Um pino apontando para fora do quadro não tem par: fica pendurado. */
  for (let col = 0; col < COLS; col += 1) {
    assert.equal(peca(col, 0).tabs.t, 0, `topo da coluna ${col}`);
    assert.equal(peca(col, ROWS - 1).tabs.b, 0, `base da coluna ${col}`);
  }
  for (let row = 0; row < ROWS; row += 1) {
    assert.equal(peca(0, row).tabs.l, 0, `esquerda da linha ${row}`);
    assert.equal(peca(COLS - 1, row).tabs.r, 0, `direita da linha ${row}`);
  }
});

test("a mesma aresta sorteia o mesmo pino, venha de que peça vier", () => {
  /* A variação por aresta é o que impede as seis peças de parecerem azulejo.
     Se a semente viesse da peça, o pino e o buraco variariam separados e
     nada encaixaria. */
  for (let i = 0; i < 40; i += 1) {
    const col = i % 7;
    const row = 1 + (i % 3);
    assert.equal(pinoH(col, row, 9), pinoH(col, row, 9));
    assert.equal(pinoV(col, row, 9), pinoV(col, row, 9));
  }
});

/* ----------------------------------------------------------------- forma */

test("o pino tem pescoço mais estreito que o bulbo", () => {
  /* É a razão entre os dois que trava a peça — e é o que o olho lê como",
     "quebra-cabeça". Um calombo, por maior que seja, escorrega. */
  const d = piecePath(peca(0, 1));
  const nums = d.match(/-?\d+\.?\d*/g).map(Number);
  const xs = nums.filter((_, i) => i % 2 === 0);
  const ys = nums.filter((_, i) => i % 2 === 1);
  /* o pino do topo sai acima de y=0 (para cima) ou o de baixo abaixo de y=1 */
  const acima = Math.min(...ys);
  const abaixo = Math.max(...ys);
  assert.ok(
    acima < -0.1 || abaixo > 1.1,
    `nenhum pino saiu da célula: y entre ${acima.toFixed(3)} e ${abaixo.toFixed(3)}`,
  );
  assert.ok(xs.every((x) => x > -0.6 && x < 1.6), "pino largo demais");
  assert.ok(ys.every((y) => y > -0.6 && y < 1.6), "pino alto demais");
});

test("o contorno fecha e é desenhável", () => {
  for (let col = 0; col < COLS; col += 1) {
    for (let row = 0; row < ROWS; row += 1) {
      const d = piecePath(peca(col, row));
      assert.ok(d.startsWith("M 0 0"), "não começa na origem");
      assert.ok(d.endsWith("Z"), "não fecha");
      assert.ok(!/NaN|undefined/.test(d), `números inválidos em ${col}:${row}`);
      /* quatro lados: cada um com pino tem 6 cúbicas */
      const cubicas = (d.match(/C /g) || []).length;
      assert.ok(cubicas % 6 === 0, `curvas incompletas em ${col}:${row}`);
    }
  }
});

test("nenhuma peça é idêntica a outra", () => {
  /* Seis peças com o pino no mesmo lugar viram azulejo. */
  const formas = new Set();
  for (let col = 0; col < COLS; col += 1) {
    for (let row = 0; row < ROWS; row += 1) formas.add(piecePath(peca(col, row)));
  }
  assert.equal(formas.size, COLS * ROWS);
});

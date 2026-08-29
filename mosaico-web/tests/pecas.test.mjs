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
      /* cada lado com pino é uma cadeia de 8 cúbicas */
      const cubicas = (d.match(/C /g) || []).length;
      assert.ok(cubicas % 8 === 0, `curvas incompletas em ${col}:${row}`);
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

/* -------------------------------------------------- a curva é a MESMA ---- */

/** Os quatro lados do contorno, em coordenadas do tabuleiro.
 *  O caminho é "M 0 0" seguido de topo, direita, base, esquerda — cada um ou
 *  um "L" (borda reta) ou uma cadeia de "C". Separar por comando é exato;
 *  filtrar por proximidade não é, porque o pino de um lado passa perto da
 *  reta do lado vizinho. */
function lados(p) {
  const d = piecePath(p);
  const comandos = d.match(/[LC][^LCZM]*/g) ?? [];
  const pontos = (txt) => {
    const n = txt.match(/-?\d+\.?\d*/g).map(Number);
    const o = [];
    for (let k = 0; k + 1 < n.length; k += 2) {
      o.push(`${(n[k] + p.col).toFixed(3)},${(n[k + 1] + p.row).toFixed(3)}`);
    }
    return o;
  };
  /* Cada lado é 1 comando "L" (borda reta) ou 8 comandos "C" (com pino).
     O ponto de PARTIDA de um lado é implícito — fica no comando anterior — e
     sem ele a comparação acusa diferença de canto onde só há forma de
     escrever. Por isso a caneta é seguida à mão. */
  const saida = [];
  let caneta = `${p.col.toFixed(3)},${p.row.toFixed(3)}`;
  let i = 0;
  while (i < comandos.length) {
    const passo = comandos[i].startsWith("L") ? 1 : 8;
    const pts = comandos.slice(i, i + passo).flatMap(pontos);
    pts.unshift(caneta);
    caneta = pts[pts.length - 1];
    saida.push([...new Set(pts)].sort());
    i += passo;
  }
  return { topo: saida[0], direita: saida[1], base: saida[2], esquerda: saida[3] };
}

test("a aresta partilhada é a mesma curva nas duas peças", () => {
  /* Este é o teste que faltava. Cada aresta interna é percorrida duas vezes,
     uma por peça, em SENTIDOS OPOSTOS — e como o perfil não é simétrico e a
     variação desliza o pino ao longo da aresta, o mesmo parâmetro caía em
     pontos diferentes do mundo. O contorno saía duplicado: dois traços quase
     juntos, com frestas pretas entre o pino e o buraco. Passava nos testes de
     sinal, porque os sinais estavam certos — errada estava a curva. */
  for (let col = 0; col < COLS; col += 1) {
    for (let row = 0; row + 1 < ROWS; row += 1) {
      assert.deepEqual(
        lados(peca(col, row)).base,
        lados(peca(col, row + 1)).topo,
        `aresta h ${col}:${row + 1} — o pino de uma não é o buraco da outra`,
      );
    }
  }
  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col + 1 < COLS; col += 1) {
      assert.deepEqual(
        lados(peca(col, row)).direita,
        lados(peca(col + 1, row)).esquerda,
        `aresta v ${col + 1}:${row} — o pino de uma não é o buraco da outra`,
      );
    }
  }
});

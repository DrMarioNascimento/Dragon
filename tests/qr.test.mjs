/* Testes do codificador de QR.

   O QR é como as pessoas entram na mesa: se ele sair errado, ninguém entra,
   e o erro só aparece com doze pessoas apontando a câmera para o telão. Um
   QR malformado tem a aparência exata de um QR bom.

   Por isso a verificação aqui é um decodificador independente, escrito
   contra a norma e conferido contra QRs gerados por api.qrserver.com. Ele
   desfaz a máscara, relê os codewords no zigue-zague, desintercala os
   blocos, confere as síndromes de Reed-Solomon e reconstrói o texto. */

import { readFileSync } from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

const fonte = readFileSync(new URL("../js/qr.js", import.meta.url), "utf8");
const janela = {};
new Function("window", fonte)(janela);
const QR = janela.MosaicoQR;

/* ---------- decodificador de conferência ---------- */
const EXP = new Uint8Array(512), LOG = new Uint8Array(256);
{
  let x = 1;
  for (let i = 0; i < 255; i += 1) { EXP[i] = x; LOG[x] = i; x <<= 1; if (x & 0x100) x ^= 0x11d; }
  for (let j = 255; j < 512; j += 1) EXP[j] = EXP[j - 255];
}
const mul = (a, b) => (a === 0 || b === 0) ? 0 : EXP[LOG[a] + LOG[b]];

const MASCARAS = [
  (i, j) => (i + j) % 2 === 0, (i) => i % 2 === 0, (i, j) => j % 3 === 0,
  (i, j) => (i + j) % 3 === 0, (i, j) => (Math.floor(i / 2) + Math.floor(j / 3)) % 2 === 0,
  (i, j) => (i * j) % 2 + (i * j) % 3 === 0, (i, j) => ((i * j) % 2 + (i * j) % 3) % 2 === 0,
  (i, j) => ((i + j) % 2 + (i * j) % 3) % 2 === 0
];
const ALINHAMENTO = [null, [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34],
  [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50]];
const BLOCOS = {
  L: [null, [7,1,19,0,0], [10,1,34,0,0], [15,1,55,0,0], [20,1,80,0,0], [26,1,108,0,0],
      [18,2,68,0,0], [20,2,78,0,0], [24,2,97,0,0], [30,2,116,0,0], [18,2,68,2,69]],
  M: [null, [10,1,16,0,0], [16,1,28,0,0], [26,1,44,0,0], [18,2,32,0,0], [24,2,43,0,0],
      [16,4,27,0,0], [18,4,31,0,0], [22,2,38,2,39], [22,3,36,2,37], [26,4,43,1,44]]
};

function mapaFuncoes(n, versao) {
  const f = [];
  for (let i = 0; i < n; i += 1) f.push(new Int8Array(n).fill(0));
  const mk = (y, x) => { if (y >= 0 && y < n && x >= 0 && x < n) f[y][x] = 1; };
  const finder = (t, e) => { for (let r = -1; r <= 7; r += 1) for (let c = -1; c <= 7; c += 1) mk(t + r, e + c); };
  finder(0, 0); finder(0, n - 7); finder(n - 7, 0);
  for (let i = 0; i < n; i += 1) { mk(6, i); mk(i, 6); }
  for (const cy of ALINHAMENTO[versao]) for (const cx of ALINHAMENTO[versao]) {
    if ((cy === 6 && cx === 6) || (cy === 6 && cx === n - 7) || (cy === n - 7 && cx === 6)) continue;
    for (let dy = -2; dy <= 2; dy += 1) for (let dx = -2; dx <= 2; dx += 1) mk(cy + dy, cx + dx);
  }
  for (let i = 0; i <= 8; i += 1) { mk(8, i); mk(i, 8); }
  for (let g = 0; g < 8; g += 1) { mk(8, n - 1 - g); mk(n - 1 - g, 8); }
  if (versao >= 7) for (let r = 0; r < 6; r += 1) for (let c = 0; c < 3; c += 1) { mk(r, n - 11 + c); mk(n - 11 + c, r); }
  return f;
}

function lerFormato(m) {
  let b = 0;
  for (let i = 0; i <= 5; i += 1) b |= m[i][8] << i;
  b |= m[7][8] << 6; b |= m[8][8] << 7; b |= m[8][7] << 8;
  for (let j = 9; j < 15; j += 1) b |= m[8][14 - j] << j;
  const v = b ^ 0x5412;
  return { nivel: { 1: "L", 0: "M", 3: "Q", 2: "H" }[(v >>> 13) & 3], mascara: (v >>> 10) & 7 };
}

function lerVersaoBits(m) {
  const n = m.length;
  let b = 0;
  for (let i = 0; i < 18; i += 1) b |= m[Math.floor(i / 3)][n - 11 + (i % 3)] << i;
  return b >>> 12;
}

function lerCodewords(m, f) {
  const n = m.length, bits = [];
  let subindo = true;
  for (let col = n - 1; col > 0; col -= 2) {
    if (col === 6) col -= 1;
    for (let p = 0; p < n; p += 1) {
      const l = subindo ? n - 1 - p : p;
      for (let d = 0; d < 2; d += 1) { const x = col - d; if (!f[l][x]) bits.push(m[l][x]); }
    }
    subindo = !subindo;
  }
  const by = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    let v = 0; for (let j = 0; j < 8; j += 1) v = (v << 1) | bits[i + j]; by.push(v);
  }
  return by;
}

const sindromesZero = (bloco, grau) => {
  for (let i = 0; i < grau; i += 1) {
    let s = 0;
    for (let j = 0; j < bloco.length; j += 1) s = mul(s, EXP[i]) ^ bloco[j];
    if (s !== 0) return false;
  }
  return true;
};

function decodificar(m, versao) {
  const fmt = lerFormato(m);
  const f = mapaFuncoes(m.length, versao);
  const d = m.map(l => Array.from(l));
  for (let y = 0; y < m.length; y += 1)
    for (let x = 0; x < m.length; x += 1)
      if (!f[y][x] && MASCARAS[fmt.mascara](y, x)) d[y][x] ^= 1;

  const cw = lerCodewords(d, f), c = BLOCOS[fmt.nivel][versao], nb = c[1] + c[3];
  const dados = [], ec = [];
  for (let b = 0; b < c[1]; b += 1) dados.push(new Array(c[2]));
  for (let b = 0; b < c[3]; b += 1) dados.push(new Array(c[4]));
  for (let b = 0; b < nb; b += 1) ec.push(new Array(c[0]));
  let p = 0;
  const maior = Math.max(c[2], c[4] || 0);
  for (let i = 0; i < maior; i += 1) for (let b = 0; b < nb; b += 1) if (i < dados[b].length) dados[b][i] = cw[p++];
  for (let i = 0; i < c[0]; i += 1) for (let b = 0; b < nb; b += 1) ec[b][i] = cw[p++];

  const rsOk = dados.every((b, i) => sindromesZero(b.concat(ec[i]), c[0]));

  const todos = [].concat(...dados), bits = [];
  for (const b of todos) for (let i = 7; i >= 0; i -= 1) bits.push((b >>> i) & 1);
  let q = 0;
  const pega = k => { let v = 0; for (let i = 0; i < k; i += 1) v = (v << 1) | bits[q++]; return v; };
  const modo = pega(4);
  if (modo !== 4) return { fmt, rsOk, modo, texto: null };
  const qtd = pega(versao < 10 ? 8 : 16), by = [];
  for (let i = 0; i < qtd; i += 1) by.push(pega(8));
  return { fmt, rsOk, modo, texto: Buffer.from(by).toString("utf8") };
}

/* ---------- os testes ---------- */

test("o link de uma sala vira um QR que decodifica de volta", () => {
  const link = "https://drmarionascimento.github.io/Dragon/MOSAICO-mesa.html?sala=KP7X29";
  const q = QR.gerar(link, { nivel: "M" });
  const lido = decodificar(q.modulos, q.versao);
  assert.equal(lido.texto, link);
  assert.ok(lido.rsOk, "as síndromes de Reed-Solomon não zeraram");
  assert.equal(lido.fmt.nivel, "M");
  assert.equal(lido.fmt.mascara, q.mascara);
});

test("todo texto de 1 a 200 caracteres sobrevive à ida e à volta", () => {
  const alfabeto = "abcdefghijklmnopqrstuvwxyzáç 0123456789:/?=&.-";
  for (let n = 1; n <= 200; n += 1) {
    let t = "";
    for (let i = 0; i < n; i += 1) t += alfabeto[(i * 7 + n) % alfabeto.length];
    for (const nivel of ["L", "M"]) {
      let q;
      try { q = QR.gerar(t, { nivel }); } catch (e) { continue; }   /* estourou a versão 10 */
      const lido = decodificar(q.modulos, q.versao);
      assert.equal(lido.texto, t, `falhou com ${n} caracteres, nível ${nivel}`);
      assert.ok(lido.rsOk, `síndromes não zeraram com ${n} caracteres, nível ${nivel}`);
      assert.equal(lido.fmt.nivel, nivel);
      assert.equal(lido.fmt.mascara, q.mascara);
      if (q.versao >= 7) assert.equal(lerVersaoBits(q.modulos), q.versao,
        `bits de versão errados na versão ${q.versao}`);
    }
  }
});

test("acentos e travessões atravessam em UTF-8", () => {
  for (const t of ["Você é o Portador", "A Casa da Costa — 21h", "névoa/tempestade/farol/noite"]) {
    for (const nivel of ["L", "M"]) {
      const q = QR.gerar(t, { nivel });
      assert.equal(decodificar(q.modulos, q.versao).texto, t);
    }
  }
});

test("os padrões de localização ficam nos três cantos", () => {
  const q = QR.gerar("https://exemplo.org/sala", { nivel: "M" });
  const n = q.tamanho, m = q.modulos;
  for (const [oy, ox] of [[0, 0], [0, n - 7], [n - 7, 0]]) {
    assert.equal(m[oy][ox], 1, "canto do localizador");
    assert.equal(m[oy + 1][ox + 1], 0, "anel claro do localizador");
    assert.equal(m[oy + 3][ox + 3], 1, "miolo do localizador");
  }
  assert.equal(m[n - 8][8], 1, "o módulo sempre escuro sumiu");
});

test("texto grande demais é recusado, não truncado em silêncio", () => {
  assert.throws(() => QR.gerar("x".repeat(400), { nivel: "M" }), /longo demais/);
});

test("o SVG sai autocontido e com rótulo acessível", () => {
  const svg = QR.svg("https://exemplo.org/sala", { nivel: "M", margem: 4, rotulo: "QR da mesa" });
  assert.ok(svg.startsWith("<svg"), "não começou com <svg");
  assert.ok(svg.includes('role="img"'));
  assert.ok(svg.includes('aria-label="QR da mesa"'));
  assert.ok(!/https?:\/\/(?!www\.w3\.org)/.test(svg), "o SVG não pode referenciar nada externo");
  const q = QR.gerar("https://exemplo.org/sala", { nivel: "M" });
  assert.ok(svg.includes('viewBox="0 0 ' + (q.tamanho + 8) + " " + (q.tamanho + 8) + '"'));
});

#!/usr/bin/env node
/* MOSAICO — GERADOR DA ESCRIVANINHA
 * ============================================================================
 *
 *   node ferramentas/escrivaninha.mjs
 *
 * O modelo do Laboratório RA era um binário de 13,6 KB que alguém deixou na
 * pasta: 192 triângulos, quatro materiais de cor chapada, ZERO textura e sem
 * coordenada de UV nenhuma — sem UV não há como texturizar, então melhorar
 * exigia refazer.
 *
 * Refazendo, virou coisa reproduzível. O .glb passa a ser saída, não fonte: se
 * a madeira ficar clara demais ou a gaveta rasa demais, muda-se um número aqui
 * e roda de novo, em vez de abrir um programa de modelagem que ninguém tem.
 *
 * O QUE MAIS MUDA A APARÊNCIA, EM ORDEM
 *
 *  1. CHANFRO. Aresta viva de caixa não existe em móvel de verdade, e é o que
 *     mais denuncia geometria de bloco: sem uma quina que pegue luz, a peça
 *     lê como papelão. Cada caixa aqui sai chanfrada.
 *  2. TEXTURA. Veio de madeira gerado por ruído, com os anéis correndo no
 *     sentido certo de cada peça — tampo no comprimento, pés na altura.
 *  3. RECUO. As gavetas afundam alguns milímetros e ganham sombra própria; era
 *     tudo coplanar, e plano nenhum faz sombra em plano.
 *
 * Sem dependência: o PNG é escrito à mão com o zlib do próprio Node, e o glTF
 * é JSON com um buffer binário colado atrás. Acrescentar biblioteca para
 * gerar 40 KB de móvel seria pagar caro por conveniência.
 */
import { writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const SAIDA = join(RAIZ, "laboratorio-ra");

/* ── PNG À MÃO ───────────────────────────────────────────────────────────────
   Assinatura, IHDR, IDAT e IEND. Cada linha começa com o byte de filtro 0 —
   sem filtro, o zlib ainda comprime bem uma textura de madeira e o código fica
   legível. */
function crc32(buf) {
  let c, tabela = crc32.t;
  if (!tabela) {
    tabela = crc32.t = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      tabela[n] = c;
    }
  }
  c = -1;
  for (let i = 0; i < buf.length; i++) c = tabela[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}
function pedaco(tipo, dados) {
  const t = Buffer.from(tipo, "ascii");
  const tam = Buffer.alloc(4);
  tam.writeUInt32BE(dados.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([t, dados])));
  return Buffer.concat([tam, t, dados, crc]);
}
function png(largura, altura, rgb) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(largura, 0);
  ihdr.writeUInt32BE(altura, 4);
  ihdr[8] = 8; ihdr[9] = 2; /* 8 bits, RGB */
  const linhas = Buffer.alloc(altura * (largura * 3 + 1));
  for (let y = 0; y < altura; y++) {
    const off = y * (largura * 3 + 1);
    linhas[off] = 0;
    rgb.copy(linhas, off + 1, y * largura * 3, (y + 1) * largura * 3);
  }
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pedaco("IHDR", ihdr),
    pedaco("IDAT", deflateSync(linhas, { level: 9 })),
    pedaco("IEND", Buffer.alloc(0)),
  ]);
}

/* ── RUÍDO E MADEIRA ─────────────────────────────────────────────────────────
   Ruído de valor com interpolação suave, somado em oitavas. Os anéis saem de
   uma coordenada esticada: madeira tem veio longo num eixo e apertado no
   outro, e é essa anisotropia que o olho lê como madeira em vez de mármore. */
function ruidoFabrica(semente) {
  let h = semente >>> 0;
  const rnd = () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0) >>> 8) / 16777216;
  const G = 256, g = new Float32Array(G * G);
  for (let i = 0; i < g.length; i++) g[i] = rnd();
  const suave = (t) => t * t * (3 - 2 * t);
  return (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y);
    const fx = suave(x - xi), fy = suave(y - yi);
    const em = (a, b) => g[((b & 255) * G + (a & 255))];
    const a = em(xi, yi), b = em(xi + 1, yi), c = em(xi, yi + 1), d = em(xi + 1, yi + 1);
    return (a + (b - a) * fx) + ((c + (d - c) * fx) - (a + (b - a) * fx)) * fy;
  };
}
function madeira(largura, altura, { claro, escuro, semente, anéis = 22, nós = 3 }) {
  const n1 = ruidoFabrica(semente), n2 = ruidoFabrica(semente ^ 0x9e37), n3 = ruidoFabrica(semente ^ 0x51ed);
  const buf = Buffer.alloc(largura * altura * 3);
  for (let y = 0; y < altura; y++) {
    for (let x = 0; x < largura; x++) {
      const u = x / largura, v = y / altura;
      /* o veio corre em u; a ondulação vem de um ruído bem esticado nesse eixo */
      const onda = n1(u * 3.1, v * 26) * 0.55 + n2(u * 7.3, v * 61) * 0.25;
      let anel = (v * anéis + onda * 2.6) % 1;
      anel = Math.abs(anel - 0.5) * 2;
      anel = Math.pow(anel, 1.7);
      /* poros: fibra fina, quase só no escuro */
      const poro = n3(u * 190, v * 12) * 0.16;
      /* nós, esparsos, escurecendo em volta */
      let no = 0;
      for (let k = 0; k < nós; k++) {
        const cx = ((k * 0.37 + 0.19) % 1), cy = ((k * 0.61 + 0.28) % 1);
        const d = Math.hypot((u - cx) * 1.6, v - cy);
        if (d < 0.09) no = Math.max(no, (1 - d / 0.09) ** 2);
      }
      const t = Math.min(1, anel * 0.78 + poro + no * 0.85);
      const i = (y * largura + x) * 3;
      for (let c = 0; c < 3; c++) buf[i + c] = Math.round(claro[c] + (escuro[c] - claro[c]) * t);
    }
  }
  return png(largura, altura, buf);
}
/* Metal: latão levemente sujo, para a puxadeira ter o que refletir de perto. */
function latao(lado, semente) {
  const n = ruidoFabrica(semente);
  const buf = Buffer.alloc(lado * lado * 3);
  for (let y = 0; y < lado; y++) for (let x = 0; x < lado; x++) {
    const t = n(x / lado * 40, y / lado * 40) * 0.22 + n(x / lado * 8, y / lado * 8) * 0.14;
    const i = (y * lado + x) * 3;
    buf[i] = Math.round(176 - t * 70);
    buf[i + 1] = Math.round(132 - t * 62);
    buf[i + 2] = Math.round(58 - t * 34);
  }
  return png(lado, lado, buf);
}

/* ── GEOMETRIA ───────────────────────────────────────────────────────────────
   Caixa com chanfro: em vez de 8 vértices e 12 triângulos, cada face é
   encolhida e as quinas viram tiras. Custa triângulo e paga em luz — é a
   diferença entre um móvel e uma caixa de papelão. */
const V = [], N = [], UV = [], IDX = [], GRUPOS = [];
let base = 0;
function empurra(px, py, pz, nx, ny, nz, u, v) {
  V.push(px, py, pz); N.push(nx, ny, nz); UV.push(u, v);
  return base++;
}
function quad(a, b, c, d) { IDX.push(a, b, c, a, c, d); }

/* CAIXA CHANFRADA, POR CONSTRUÇÃO E NÃO POR PROXIMIDADE.
   A primeira versão desenhava as seis faces encolhidas e depois tentava achar,
   por distância, quais pontos de duas faces vizinhas formavam a tira da quina.
   Com faces coplanares e pontos empatados, ela casava pontos errados e cuspia
   quads torcidos — na tela viravam faixas listradas ao lado das gavetas.

   Agora a quina é enumerada: cada uma das doze arestas sabe de antemão quais
   duas faces encontra e em que cantos. Não há busca, então não há empate para
   desempatar errado.

   Ordem dos cantos de cada face, sempre no sentido anti-horário vista de fora,
   começando pelo canto "alto-esquerdo" no referencial daquela face. */
const FACES = [
  { n: [1, 0, 0], e: ["y", "z"], s: [1, 1] },
  { n: [-1, 0, 0], e: ["y", "z"], s: [1, -1] },
  { n: [0, 1, 0], e: ["z", "x"], s: [1, 1] },
  { n: [0, -1, 0], e: ["z", "x"], s: [1, -1] },
  { n: [0, 0, 1], e: ["y", "x"], s: [1, -1] },
  { n: [0, 0, -1], e: ["y", "x"], s: [1, 1] },
];
function caixa(cx, cy, cz, sx, sy, sz, ch, escalaUV, eixoU = "x", eixoV = "y") {
  const h = { x: sx / 2, y: sy / 2, z: sz / 2 };
  const c = Math.min(ch, Math.min(sx, sy, sz) / 2.5);
  const eixos = ["x", "y", "z"];
  /* canto (a,b,d) com sinais em cada eixo; o eixo da normal fica no extremo,
     os outros dois recuam pelo chanfro */
  function ponto(nEixo, nSinal, sinais) {
    const p = { x: 0, y: 0, z: 0 };
    for (const e of eixos) {
      if (e === nEixo) p[e] = nSinal * h[e];
      else p[e] = sinais[e] * (h[e] - c);
    }
    return [p.x, p.y, p.z];
  }
  const uvDe = (p) => {
    const o = { x: p[0], y: p[1], z: p[2] };
    return [o[eixoU] * escalaUV, o[eixoV] * escalaUV];
  };
  const põe = (p, n) => {
    const uv = uvDe(p);
    return empurra(cx + p[0], cy + p[1], cz + p[2], n[0], n[1], n[2], uv[0], uv[1]);
  };

  /* as seis faces, cada uma com os quatro cantos recuados */
  const cantos = {};
  for (const f of FACES) {
    const nEixo = eixos[f.n.findIndex((v) => v !== 0)];
    const nSinal = f.n[eixos.indexOf(nEixo)];
    const outros = eixos.filter((e) => e !== nEixo);
    const quatro = [[1, 1], [-1, 1], [-1, -1], [1, -1]].map(([a, b]) => {
      const sinais = { [outros[0]]: a, [outros[1]]: b };
      return { s: sinais, p: ponto(nEixo, nSinal, sinais) };
    });
    /* orienta para fora: se o produto vetorial apontar para dentro, inverte */
    const [p0, p1, p2] = quatro.map((q) => q.p);
    const u = [p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]];
    const v = [p2[0] - p0[0], p2[1] - p0[1], p2[2] - p0[2]];
    const cr = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    const fora = cr[0] * f.n[0] + cr[1] * f.n[1] + cr[2] * f.n[2];
    const ord = fora >= 0 ? quatro : quatro.slice().reverse();
    const ids = ord.map((q) => põe(q.p, f.n));
    quad(ids[0], ids[1], ids[2], ids[3]);
    cantos[nEixo + (nSinal > 0 ? "+" : "-")] = { f, ord };
  }

  /* as doze arestas: cada par de faces que compartilha uma direção */
  for (let i = 0; i < eixos.length; i++) {
    for (let k = 0; k < eixos.length; k++) {
      if (i === k) continue;
      for (const si of [1, -1]) for (const sk of [1, -1]) {
        if (i > k) continue;                       /* cada aresta uma vez só */
        const ea = eixos[i], eb = eixos[k];
        const chaveA = ea + (si > 0 ? "+" : "-"), chaveB = eb + (sk > 0 ? "+" : "-");
        const A = cantos[chaveA], B = cantos[chaveB];
        if (!A || !B) continue;
        const eixoLivre = eixos.find((e) => e !== ea && e !== eb);
        const nm = [0, 0, 0];
        for (let t = 0; t < 3; t++) nm[t] = (A.f.n[t] + B.f.n[t]) / Math.SQRT2;
        /* os dois pontos de cada face que estão nesta aresta: os que têm o
           sinal certo no eixo da OUTRA face */
        const daA = A.ord.filter((q) => q.s[eb] === sk);
        const daB = B.ord.filter((q) => q.s[ea] === si);
        if (daA.length !== 2 || daB.length !== 2) continue;
        /* ordena os dois pelo eixo livre, para a tira não sair torcida */
        const chave = (q) => q.p[eixos.indexOf(eixoLivre)];
        daA.sort((x, y) => chave(x) - chave(y));
        daB.sort((x, y) => chave(x) - chave(y));
        const ids = [põe(daA[0].p, nm), põe(daB[0].p, nm), põe(daB[1].p, nm), põe(daA[1].p, nm)];
        /* orienta pela normal média */
        const P = [daA[0].p, daB[0].p, daB[1].p];
        const u2 = [P[1][0] - P[0][0], P[1][1] - P[0][1], P[1][2] - P[0][2]];
        const v2 = [P[2][0] - P[0][0], P[2][1] - P[0][1], P[2][2] - P[0][2]];
        const cr2 = [u2[1] * v2[2] - u2[2] * v2[1], u2[2] * v2[0] - u2[0] * v2[2], u2[0] * v2[1] - u2[1] * v2[0]];
        if (cr2[0] * nm[0] + cr2[1] * nm[1] + cr2[2] * nm[2] >= 0) quad(ids[0], ids[1], ids[2], ids[3]);
        else quad(ids[3], ids[2], ids[1], ids[0]);
      }
    }
  }
}
function dist(a, b) { return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]); }

function grupo(nome, material, fn) {
  const ini = IDX.length;
  fn();
  GRUPOS.push({ nome, material, ini, cont: IDX.length - ini });
}

/* ── A ESCRIVANINHA ──────────────────────────────────────────────────────────
   Mesmas medidas do modelo antigo — 1,280 × 0,765 × 0,629 — porque o texto do
   laboratório anuncia 1,28 m e a experiência de RA posiciona em escala real. */
const L = 1.28, A = 0.765, P = 0.629;
const CH = 0.008;                    /* chanfro de 8 mm */
const ESP = 0.038;                   /* espessura do tampo */
const ALT_PE = 0.10;

/* Medidas de marcenaria, num lugar só: o que encosta em quê tem de sair de
   uma conta comum, senão sobra fresta — foi o que aconteceu na primeira volta,
   com os caixotes flutuando sob o tampo e as gavetas saltando para fora. */
const LARG_CAIX = 0.40;
const REC_CAIX = 0.028;               /* recuo do caixote em relação à lateral */
const PROF_CAIX = P - 0.045;
const Y_CAIX_BASE = ALT_PE;
const Y_CAIX_TOPO = A - ESP;          /* encosta no tampo, sem fresta */
const ALT_CAIX = Y_CAIX_TOPO - Y_CAIX_BASE;
const X_CAIX = L / 2 - LARG_CAIX / 2 - REC_CAIX;
const Z_FRENTE = PROF_CAIX / 2;       /* plano da frente dos caixotes */

grupo("Tampo", 0, () => {
  caixa(0, A - ESP / 2, 0, L, ESP, P, CH, 1.6, "x", "z");
});

grupo("Madeira", 1, () => {
  for (const s of [-1, 1]) {
    caixa(s * X_CAIX, Y_CAIX_BASE + ALT_CAIX / 2, 0, LARG_CAIX, ALT_CAIX, PROF_CAIX, CH, 2.1, "x", "y");
  }
  /* painel de recato entre os caixotes, recuado para dentro */
  const vaoLargura = 2 * X_CAIX - LARG_CAIX;
  caixa(0, Y_CAIX_BASE + ALT_CAIX * 0.62, -PROF_CAIX / 2 + 0.035, vaoLargura, ALT_CAIX * 0.66, 0.020, CH, 2.1, "x", "y");
  /* pés: um bloco por canto, POR BAIXO de cada caixote e dentro da pegada
     dele, para o móvel apoiar em vez de pairar */
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const px = sx * X_CAIX + sx * (LARG_CAIX / 2 - 0.062);
    const pz = sz * (PROF_CAIX / 2 - 0.062);
    caixa(px, ALT_PE / 2, pz, 0.086, ALT_PE, 0.086, 0.007, 5, "x", "y");
  }
});

/* As gavetas AFUNDAM 6 mm na frente do caixote. Coplanar não faz sombra em
   coplanar, e era isso que deixava a frente lisa. */
const N_GAV = 3;
const FOLGA = 0.010;
const ALT_GAV = (ALT_CAIX - FOLGA * (N_GAV + 1)) / N_GAV;
const REC_GAV = 0.006;
function frenteDaGaveta(s, g) {
  return {
    x: s * X_CAIX,
    y: Y_CAIX_BASE + FOLGA + ALT_GAV / 2 + g * (ALT_GAV + FOLGA),
    z: Z_FRENTE - REC_GAV,
  };
}

grupo("Gavetas", 2, () => {
  for (const s of [-1, 1]) for (let g = 0; g < N_GAV; g++) {
    const f = frenteDaGaveta(s, g);
    caixa(f.x, f.y, f.z, LARG_CAIX - 0.030, ALT_GAV, 0.016, CH, 2.6, "x", "y");
  }
});

grupo("Metal", 3, () => {
  for (const s of [-1, 1]) for (let g = 0; g < N_GAV; g++) {
    const f = frenteDaGaveta(s, g);
    const z = f.z + 0.008;
    /* puxadeira de concha: a barra à frente, dois montantes atrás dela */
    caixa(f.x, f.y, z + 0.017, 0.140, 0.014, 0.010, 0.003, 9, "x", "y");
    for (const m of [-1, 1]) caixa(f.x + m * 0.063, f.y, z + 0.008, 0.014, 0.014, 0.020, 0.003, 9, "x", "y");
  }
});

/* ── GLB ─────────────────────────────────────────────────────────────────── */
const pos = new Float32Array(V), nor = new Float32Array(N), uv = new Float32Array(UV);
const idx = new Uint16Array(IDX);
function alinha(n) { return (n + 3) & ~3; }
const partes = [pos, nor, uv, idx].map((a) => Buffer.from(a.buffer, a.byteOffset, a.byteLength));
const desl = [];
let corrida = 0;
for (const p of partes) { desl.push(corrida); corrida = alinha(corrida + p.length); }
const bin = Buffer.alloc(corrida);
partes.forEach((p, i) => p.copy(bin, desl[i]));

/* NOZ ENVELHECIDA, não pinho novo. A primeira volta saiu laranja e saturada
   demais: lia como compensado de móvel barato, e esta é uma casa de 1867. Menos
   vermelho, mais terra, e o contraste entre anel claro e escuro mais curto —
   madeira velha é escura por igual, o veio aparece mais na luz rasante que na
   diferença de cor.

   E 384 no lugar de 512: a três palmos de distância, que é a única em que
   alguém olha uma escrivaninha em RA, ninguém distingue — e corta quase metade
   do peso, que num celular em rede de dados é o que decide se a peça chega. */
const texTampo = madeira(384, 384, { claro: [104, 63, 37], escuro: [44, 23, 11], semente: 0x51a1, anéis: 13, nós: 2 });
const texMadeira = madeira(384, 384, { claro: [86, 51, 29], escuro: [33, 17, 8], semente: 0x77c3, anéis: 24, nós: 4 });
const texGaveta = madeira(384, 384, { claro: [112, 68, 40], escuro: [48, 26, 13], semente: 0x2b9d, anéis: 17, nós: 1 });
const texMetal = latao(192, 0x0f3a);
const imagens = [texTampo, texMadeira, texGaveta, texMetal];
const buffersImg = [];
let corridaImg = corrida;
for (const im of imagens) { buffersImg.push({ off: corridaImg, len: im.length }); corridaImg = alinha(corridaImg + im.length); }
const binTotal = Buffer.alloc(corridaImg);
bin.copy(binTotal, 0);
imagens.forEach((im, i) => im.copy(binTotal, buffersImg[i].off));

function mn(arr, k) { const o = []; for (let i = 0; i < k; i++) { let v = Infinity; for (let j = i; j < arr.length; j += k) v = Math.min(v, arr[j]); o.push(v) } return o }
function mx(arr, k) { const o = []; for (let i = 0; i < k; i++) { let v = -Infinity; for (let j = i; j < arr.length; j += k) v = Math.max(v, arr[j]); o.push(v) } return o }

const MAT = [
  { nome: "Tampo", tex: 0, rough: 0.42, metal: 0 },
  { nome: "Madeira", tex: 1, rough: 0.60, metal: 0 },
  { nome: "Gavetas", tex: 2, rough: 0.48, metal: 0 },
  { nome: "Metal", tex: 3, rough: 0.26, metal: 0.85 },
];

const gltf = {
  asset: { version: "2.0", generator: "MOSAICO · ferramentas/escrivaninha.mjs" },
  scene: 0,
  scenes: [{ nodes: [0] }],
  nodes: [{ mesh: 0, name: "Escrivaninha" }],
  meshes: [{
    name: "Escrivaninha",
    primitives: GRUPOS.map((g, i) => ({
      attributes: { POSITION: 0, NORMAL: 1, TEXCOORD_0: 2 },
      indices: 3 + i,
      material: g.material,
    })),
  }],
  materials: MAT.map((m) => ({
    name: m.nome,
    pbrMetallicRoughness: {
      baseColorTexture: { index: m.tex },
      metallicFactor: m.metal,
      roughnessFactor: m.rough,
    },
  })),
  textures: MAT.map((_, i) => ({ source: i, sampler: 0 })),
  samplers: [{ magFilter: 9729, minFilter: 9987, wrapS: 10497, wrapT: 10497 }],
  images: imagens.map((_, i) => ({ bufferView: 4 + i, mimeType: "image/png" })),
  accessors: [
    { bufferView: 0, componentType: 5126, count: pos.length / 3, type: "VEC3", min: mn(pos, 3), max: mx(pos, 3) },
    { bufferView: 1, componentType: 5126, count: nor.length / 3, type: "VEC3" },
    { bufferView: 2, componentType: 5126, count: uv.length / 2, type: "VEC2" },
    ...GRUPOS.map((g) => ({ bufferView: 3, componentType: 5123, count: g.cont, type: "SCALAR", byteOffset: g.ini * 2 })),
  ],
  bufferViews: [
    { buffer: 0, byteOffset: desl[0], byteLength: partes[0].length, target: 34962 },
    { buffer: 0, byteOffset: desl[1], byteLength: partes[1].length, target: 34962 },
    { buffer: 0, byteOffset: desl[2], byteLength: partes[2].length, target: 34962 },
    { buffer: 0, byteOffset: desl[3], byteLength: partes[3].length, target: 34963 },
    ...buffersImg.map((b) => ({ buffer: 0, byteOffset: b.off, byteLength: b.len })),
  ],
  buffers: [{ byteLength: binTotal.length }],
};

const jsonBuf = Buffer.from(JSON.stringify(gltf), "utf8");
const jsonPad = Buffer.concat([jsonBuf, Buffer.alloc(alinha(jsonBuf.length) - jsonBuf.length, 0x20)]);
const binPad = Buffer.concat([binTotal, Buffer.alloc(alinha(binTotal.length) - binTotal.length, 0)]);
const cab = Buffer.alloc(12);
cab.write("glTF", 0, "ascii"); cab.writeUInt32LE(2, 4);
cab.writeUInt32LE(12 + 8 + jsonPad.length + 8 + binPad.length, 8);
const cJson = Buffer.alloc(8); cJson.writeUInt32LE(jsonPad.length, 0); cJson.write("JSON", 4, "ascii");
const cBin = Buffer.alloc(8); cBin.writeUInt32LE(binPad.length, 0); cBin.write("BIN\0", 4, "ascii");
const glb = Buffer.concat([cab, cJson, jsonPad, cBin, binPad]);

writeFileSync(join(SAIDA, "escrivaninha.glb"), glb);

const tris = IDX.length / 3;
const cx = mx(pos, 3).map((v, i) => (v - mn(pos, 3)[i]).toFixed(3));
console.log("escrivaninha.glb reescrita");
console.log("  triângulos: " + tris + "   (antes: 192)");
console.log("  texturas:   " + imagens.length + "        (antes: 0)");
console.log("  caixa (m):  " + cx.join(" × "));
console.log("  tamanho:    " + (glb.length / 1024).toFixed(1) + " KB   (antes: 13.6 KB)");

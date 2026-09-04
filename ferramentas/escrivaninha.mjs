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
/* UMA PEÇA, UM NÓ. Animar exige nó próprio: transformação de nó move a malha
   inteira, então gaveta que desliza não pode dividir malha com o caixote que
   fica parado. Cada peça junta a própria geometria e vira um nó no glTF.

   As coordenadas continuam sendo escritas em ABSOLUTO, como antes — na hora de
   emitir, a origem da peça é subtraída dos vértices e vira a translação do nó.
   Assim o código de marcenaria não precisa saber que existe animação. */
const PECAS = [];
let atual = null;
function peca(nome, material, origem, fn) {
  atual = { nome, material, origem, V: [], N: [], UV: [], IDX: [], base: 0 };
  PECAS.push(atual);
  fn();
  atual = null;
}
function empurra(px, py, pz, nx, ny, nz, u, v) {
  atual.V.push(px, py, pz); atual.N.push(nx, ny, nz); atual.UV.push(u, v);
  return atual.base++;
}
function quad(a, b, c, d) { atual.IDX.push(a, b, c, a, c, d); }
function tri(a, b, c) { atual.IDX.push(a, b, c); }

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
/* `giro` gira a caixa em torno de Y, em graus. Sem ele, montar uma armação de
   três braços dava três barras paralelas — na tela, uma pilha de palitos. Peça
   que aponta para uma direção precisa poder apontar. */
function caixa(cx, cy, cz, sx, sy, sz, ch, escalaUV, eixoU = "x", eixoV = "y", giro = 0) {
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
  const g = giro * Math.PI / 180, cg = Math.cos(g), sg = Math.sin(g);
  const gira = (v) => giro ? [v[0] * cg + v[2] * sg, v[1], -v[0] * sg + v[2] * cg] : v;
  const põe = (p, n) => {
    const uv = uvDe(p);
    const q = gira(p), m = gira(n);
    return empurra(cx + q[0], cy + q[1], cz + q[2], m[0], m[1], m[2], uv[0], uv[1]);
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

peca("Tampo", 0, [0,0,0], () => {
  caixa(0, A - ESP / 2, 0, L, ESP, P, CH, 1.6, "x", "z");
});

peca("Madeira", 1, [0,0,0], () => {
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

/* A GAVETA VIVA é a de baixo, à direita. Ela sai das peças fixas e ganha nó
   próprio; as outras cinco continuam sendo cenário. Uma só se move porque uma
   só guarda alguma coisa — seis gavetas abrindo seriam seis lugares de
   procurar, e a atividade tem 75 segundos. */
const GAV_VIVA = { s: 1, g: 0 };
const viva = frenteDaGaveta(GAV_VIVA.s, GAV_VIVA.g);
const CURSO = 0.30;                    /* o quanto ela desliza para fora */

peca("Gavetas", 2, [0, 0, 0], () => {
  for (const s of [-1, 1]) for (let g = 0; g < N_GAV; g++) {
    if (s === GAV_VIVA.s && g === GAV_VIVA.g) continue;
    const f = frenteDaGaveta(s, g);
    caixa(f.x, f.y, f.z, LARG_CAIX - 0.030, ALT_GAV, 0.016, CH, 2.6, "x", "y");
  }
});

peca("Metal", 3, [0,0,0], () => {
  for (const s of [-1, 1]) for (let g = 0; g < N_GAV; g++) {
    const f = frenteDaGaveta(s, g);
    const z = f.z + 0.008;
    /* puxadeira de concha: a barra à frente, dois montantes atrás dela */
    caixa(f.x, f.y, z + 0.017, 0.140, 0.014, 0.010, 0.003, 9, "x", "y");
    for (const m of [-1, 1]) caixa(f.x + m * 0.063, f.y, z + 0.008, 0.014, 0.014, 0.020, 0.003, 9, "x", "y");
  }
});

const D2R = Math.PI / 180;

/* ── SÓLIDOS DE REVOLUÇÃO ────────────────────────────────────────────────────
   Um instrumento é feito destes; um móvel, de caixas. Foi por isso que o
   sextante deu menos trabalho que a escrivaninha — arco e cilindro SÃO a forma
   certa, enquanto caixa é sempre uma aproximação de marcenaria.

   O eixo é Y por padrão; "z" o deita para frente, "x" para o lado. E `giro`
   gira em torno de Y depois disso — é assim que a luneta fica paralela a um
   braço da armação em vez de apontar para um eixo do mundo. Peça que precisa
   apontar para uma direção precisa poder apontar; o mesmo que faltava à caixa. */
function cilindro(cx, cy, cz, raio, altura, lados, escalaUV, eixo = "y", giro = 0) {
  const meia = altura / 2;
  const g = giro * D2R, cg = Math.cos(g), sg = Math.sin(g);
  const troca = (x, y, z) => eixo === "z" ? [x, z, y] : eixo === "x" ? [y, x, z] : [x, y, z];
  const gira = (v) => giro ? [v[0] * cg + v[2] * sg, v[1], -v[0] * sg + v[2] * cg] : v;
  const põe = (x, y, z, nx, ny, nz, u, v) => {
    const p = gira(troca(x, y, z));
    const n = gira(troca(nx, ny, nz));
    const L = Math.hypot(n[0], n[1], n[2]) || 1;
    return empurra(cx + p[0], cy + p[1], cz + p[2], n[0] / L, n[1] / L, n[2] / L, u, v);
  };
  const tampa = (sinal) => {
    const centro = põe(0, sinal * meia, 0, 0, sinal, 0, 0.5, 0.5);
    const anel = [];
    for (let i = 0; i < lados; i++) {
      const a = (i / lados) * Math.PI * 2;
      anel.push(põe(Math.cos(a) * raio, sinal * meia, Math.sin(a) * raio, 0, sinal, 0,
        0.5 + Math.cos(a) * 0.5, 0.5 + Math.sin(a) * 0.5));
    }
    for (let i = 0; i < lados; i++) {
      const a = anel[i], b = anel[(i + 1) % lados];
      if (sinal > 0) tri(centro, a, b); else tri(centro, b, a);
    }
  };
  const parede = [];
  for (let i = 0; i <= lados; i++) {
    const a = (i / lados) * Math.PI * 2;
    const x = Math.cos(a), z = Math.sin(a);
    const u = (i / lados) * escalaUV;
    parede.push([
      põe(x * raio, meia, z * raio, x, 0, z, u, 0),
      põe(x * raio, -meia, z * raio, x, 0, z, u, escalaUV * altura / (raio * 6.28)),
    ]);
  }
  for (let i = 0; i < lados; i++) {
    const A = parede[i], B = parede[i + 1];
    quad(A[0], B[0], B[1], A[1]);
  }
  tampa(1); tampa(-1);
}

/* Arco de seção retangular, no plano HORIZONTAL (XZ), com a espessura em Y —
   que é como um sextante deitado sobre uma mesa fica. A primeira versão vivia
   em XY e eu tentei corrigir trocando argumentos na chamada: saiu invisível.
   O plano certo pertence à função, não a quem a chama.
   `de` e `ate` em graus, do eixo +X, anti-horário visto de cima. */
function arco(cx, cy, cz, raioInt, raioExt, espessura, de, ate, passos, escalaUV) {
  const h = espessura / 2;
  const pt = (r, ang, y) => [cx + Math.cos(ang) * r, cy + y, cz + Math.sin(ang) * r];
  const A = de * D2R, B = ate * D2R;
  let ant = null;
  for (let i = 0; i <= passos; i++) {
    const t = i / passos, ang = A + (B - A) * t;
    const co = Math.cos(ang), si = Math.sin(ang);
    const u = t * escalaUV;
    const atualCantos = {
      ie: empurra(...pt(raioInt, ang, h), -co, 0, -si, u, 0),
      ee: empurra(...pt(raioExt, ang, h), co, 0, si, u, 1),
      it: empurra(...pt(raioInt, ang, -h), -co, 0, -si, u, 0),
      et: empurra(...pt(raioExt, ang, -h), co, 0, si, u, 1),
      fe: empurra(...pt(raioInt, ang, h), 0, 1, 0, u, 0),
      fx: empurra(...pt(raioExt, ang, h), 0, 1, 0, u, 1),
      te: empurra(...pt(raioInt, ang, -h), 0, -1, 0, u, 0),
      tx: empurra(...pt(raioExt, ang, -h), 0, -1, 0, u, 1),
    };
    if (ant) {
      quad(ant.fe, ant.fx, atualCantos.fx, atualCantos.fe);   /* face da frente */
      quad(atualCantos.te, atualCantos.tx, ant.tx, ant.te);   /* face de trás */
      quad(ant.ee, atualCantos.ee, atualCantos.et, ant.et);   /* borda externa */
      quad(atualCantos.ie, ant.ie, ant.it, atualCantos.it);   /* borda interna */
    }
    ant = atualCantos;
  }
}

/* ── O PAPEL ─────────────────────────────────────────────────────────────────
   Uma chapa fina dentro da gaveta, com DUAS caras: a frente é um registro
   comum de escritório, o verso é a pista. Virar é o gesto que entrega — o
   papel não muda, muda o lado que se vê.

   O que vai no verso é PISTA e não resposta: um desenho e uma hora, que só
   valem cruzados com o que a mesa souber de outro lugar. */
const PAPEL_L = 0.185, PAPEL_P = 0.255, PAPEL_E = 0.0016;

function raster(largura, altura, fundo) {
  const b = Buffer.alloc(largura * altura * 3);
  for (let i = 0; i < largura * altura; i++) {
    b[i * 3] = fundo[0]; b[i * 3 + 1] = fundo[1]; b[i * 3 + 2] = fundo[2];
  }
  const põe = (x, y, c, a = 1) => {
    x = Math.round(x); y = Math.round(y);
    if (x < 0 || y < 0 || x >= largura || y >= altura) return;
    const i = (y * largura + x) * 3;
    for (let k = 0; k < 3; k++) b[i + k] = Math.round(b[i + k] * (1 - a) + c[k] * a);
  };
  const linha = (x1, y1, x2, y2, c, esp = 1, a = 1) => {
    const n = Math.ceil(Math.hypot(x2 - x1, y2 - y1) * 1.6) || 1;
    for (let i = 0; i <= n; i++) {
      const t = i / n, x = x1 + (x2 - x1) * t, y = y1 + (y2 - y1) * t;
      for (let ox = -esp; ox <= esp; ox++) for (let oy = -esp; oy <= esp; oy++)
        if (ox * ox + oy * oy <= esp * esp + 0.2) põe(x + ox, y + oy, c, a);
    }
  };
  const retan = (x, y, w, h, c, esp = 1, a = 1) => {
    linha(x, y, x + w, y, c, esp, a); linha(x + w, y, x + w, y + h, c, esp, a);
    linha(x + w, y + h, x, y + h, c, esp, a); linha(x, y + h, x, y, c, esp, a);
  };
  return { b, põe, linha, retan };
}
/* dígitos de sete traços, os mesmos da Marca Partida — mesma casa, mesma mão */
const SETE = { "0": [0,1,2,3,4,5], "1": [1,2], "2": [0,1,6,4,3], "3": [0,1,6,2,3],
  "4": [5,6,1,2], "5": [0,5,6,2,3], "6": [0,5,4,3,2,6], "7": [0,1,2],
  "8": [0,1,2,3,4,5,6], "9": [0,1,2,3,5,6] };
const T7 = [[0,0,1,0],[1,0,1,1],[1,1,1,2],[1,2,0,2],[0,2,0,1],[0,1,0,0],[0,1,1,1]];
function escreveHora(r, txt, x, y, alt, c, esp) {
  const u = alt / 2;
  for (const ch of txt) {
    if (ch === ":") { r.linha(x + u * 0.2, y + u * 0.6, x + u * 0.2, y + u * 0.72, c, esp); r.linha(x + u * 0.2, y + u * 1.3, x + u * 0.2, y + u * 1.42, c, esp); x += u * 0.55; continue; }
    for (const k of (SETE[ch] || [])) {
      const t = T7[k];
      r.linha(x + t[0] * u * 0.66, y + t[1] * u, x + t[2] * u * 0.66, y + t[3] * u, c, esp);
    }
    x += u * 0.95;
  }
}
/* OS GRAUS DA ESCADA, escritos degrau a degrau. A primeira ideia era circular
   só o 26 e deixar os outros em branco: quem lesse a frase saberia contar até
   o quinto, e quem não lesse ficaria olhando para uma escada muda. Com os sete
   números escritos, a escada informa sozinha e a frase escolhe qual deles —
   que é o que uma pista deve fazer. */
const DEGRAUS = [4, 9, 14, 20, 26, 32, 39];

function papelTextura() {
  /* uma folha só, dividida ao meio: metade esquerda é a frente, metade direita
     é o verso. Duas imagens seriam dois downloads pela mesma coisa. */
  const W = 512, H = 384;
  const r = raster(W, H, [214, 203, 178]);
  const tinta = [46, 38, 30], desbotada = [120, 104, 84], vermelho = [122, 44, 34];
  const meio = W / 2;
  const circulo = (cx, cy, raio, c, esp, a) => {
    let px = cx + raio, py = cy;
    for (let i = 1; i <= 16; i++) {
      const t = (i / 16) * Math.PI * 2;
      const x = cx + Math.cos(t) * raio, y = cy + Math.sin(t) * raio;
      r.linha(px, py, x, y, c, esp, a); px = x; py = y;
    }
  };

  /* ── FRENTE: a hora, anotada à mão, e a janela por onde alguma coisa saiu ── */
  r.linha(18, 26, meio - 18, 26, tinta, 1, 0.7);
  escreveHora(r, "21:29", 44, 54, 54, tinta, 1);
  r.retan(56, 150, 118, 132, tinta, 1, 0.92);
  r.linha(115, 150, 115, 282, tinta, 1, 0.85);
  r.linha(56, 216, 174, 216, tinta, 1, 0.85);
  r.linha(44, 288, 186, 288, tinta, 2, 0.9);           /* o peitoril */
  r.linha(115, 262, 115, 190, vermelho, 1, 0.9);       /* saiu de dentro */
  r.linha(115, 190, 104, 206, vermelho, 1, 0.9);
  r.linha(115, 190, 126, 206, vermelho, 1, 0.9);
  r.linha(34, 126, 150, 126, desbotada, 2, 0.5);       /* uma palavra riscada */
  r.linha(40, 120, 146, 132, tinta, 1, 0.55);

  /* ── VERSO: a escada, de lado, com o grau de cada degrau ── */
  const ox = meio;
  const yBase = 336, passo = 41, x1 = ox + 46, x2 = ox + 104;
  r.linha(x1, yBase, x1 - 6, 44, tinta, 1, 0.9);       /* as duas longarinas, */
  r.linha(x2, yBase, x2 + 6, 44, tinta, 1, 0.9);       /* abrindo de leve */
  r.linha(x1 - 8, yBase + 6, x1 + 4, yBase + 6, tinta, 1, 0.8);   /* os pés */
  r.linha(x2 - 4, yBase + 6, x2 + 8, yBase + 6, tinta, 1, 0.8);
  for (let i = 0; i < DEGRAUS.length; i++) {
    const y = yBase - 18 - i * passo;
    const t = (yBase - y) / (yBase - 44);
    const a = x1 - 6 * t, b = x2 + 6 * t;
    r.linha(a, y, b, y, tinta, 1, 0.9);
    escreveHora(r, String(DEGRAUS[i]), b + 16, y - 15, 30, tinta, 1);
    const largura = String(DEGRAUS[i]).length * 30 * 0.475;
    circulo(b + 22 + largura, y - 11, 3.5, tinta, 0, 0.9);        /* o grauzinho */
  }
  /* dobra do papel, no meio de cada metade */
  r.linha(meio, 0, meio, H, [190, 178, 152], 1, 0.6);

  return png(W, H, r.b);
}

/* A gaveta viva e o papel dentro dela. O papel é FILHO da gaveta: assim ele
   sai junto quando ela desliza, sem precisar de uma segunda animação
   sincronizada — sincronizar duas coisas que sempre andam juntas é convite a
   elas se desencontrarem. */
/* O interior da gaveta, num lugar só — porque o papel precisa pousar EM CIMA
   do fundo, e na primeira volta ele nasceu com y de chute e ficou enterrado
   dentro da tábua. Medida que duas peças compartilham sai de conta comum. */
const GAV_LI = LARG_CAIX - 0.052;      /* largura interna */
const GAV_PI = PROF_CAIX - 0.10;       /* profundidade interna */
const GAV_HI = ALT_GAV - 0.030;        /* altura interna */
const GAV_ESP = 0.012;                 /* espessura das tábuas */
const GAV_ZC = viva.z - GAV_PI / 2 - 0.010;
const GAV_Y_FUNDO = viva.y - GAV_HI / 2 + GAV_ESP / 2;   /* centro da tábua */
const GAV_Y_PISO = GAV_Y_FUNDO + GAV_ESP / 2;            /* face de cima dela */

peca("Gaveta", 2, [viva.x, viva.y, viva.z], () => {
  caixa(viva.x, viva.y, viva.z, LARG_CAIX - 0.030, ALT_GAV, 0.016, CH, 2.6, "x", "y");
  /* as laterais e o fundo, que só aparecem depois de abrir */
  caixa(viva.x, GAV_Y_FUNDO, GAV_ZC, GAV_LI, GAV_ESP, GAV_PI, CH * 0.6, 3.2, "x", "z");
  for (const m of [-1, 1]) caixa(viva.x + m * (GAV_LI / 2 - GAV_ESP / 2), viva.y, GAV_ZC, GAV_ESP, GAV_HI, GAV_PI, CH * 0.6, 3.2, "z", "y");
  caixa(viva.x, viva.y, GAV_ZC - GAV_PI / 2 + GAV_ESP / 2, GAV_LI, GAV_HI, GAV_ESP, CH * 0.6, 3.2, "x", "y");
});
/* pousado no fundo, ligeiramente torto — papel guardado com pressa não fica
   alinhado com a gaveta */
const PAPEL_POS = [viva.x - 0.008, GAV_Y_PISO + PAPEL_E / 2 + 0.0012, GAV_ZC + 0.012];
/* O PAPEL NÃO É UMA CAIXA. A caixa genérica mapeia UV em metros e igual nas
   seis faces — o papel saiu liso porque estava lendo um canto em branco da
   textura, e as duas caras precisam ler METADES DIFERENTES dela.

   São duas folhas coincidentes, de costas uma para a outra: a de cima lê a
   metade esquerda (o registro comum), a de baixo lê a direita (a pista). É por
   isso que virar mostra outra coisa, e não a mesma imagem espelhada. */
function folha(cx, cy, cz, largura, prof, uMin, uMax, normalY) {
  const hx = largura / 2, hz = prof / 2;
  const cantos = [[-hx, -hz], [hx, -hz], [hx, hz], [-hx, hz]];
  const ids = cantos.map(([dx, dz]) => {
    const u = uMin + (dx / largura + 0.5) * (uMax - uMin);
    /* o verso espelha em v: virando em torno de X, o que estava em cima vai
       para baixo, e sem inverter aqui a pista sairia de cabeça para baixo */
    const t = dz / prof + 0.5;
    const v = normalY > 0 ? t : 1 - t;
    return empurra(cx + dx, cy, cz + dz, 0, normalY, 0, u, v);
  });
  if (normalY > 0) quad(ids[0], ids[3], ids[2], ids[1]);
  else quad(ids[0], ids[1], ids[2], ids[3]);
}
peca("Papel", 4, PAPEL_POS, () => {
  const p = PAPEL_POS;
  folha(p[0], p[1] + PAPEL_E / 2, p[2], PAPEL_L, PAPEL_P, 0.0, 0.5, 1);
  folha(p[0], p[1] - PAPEL_E / 2, p[2], PAPEL_L, PAPEL_P, 0.5, 1.0, -1);
});

/* ── O SEXTANTE ──────────────────────────────────────────────────────────────
   Em cima do tampo, à esquerda. Um sextante de verdade tem armação vazada de
   fundição; aqui é a forma de TRÊS BRAÇOS com dois vazios, que é feitio
   histórico e não simplificação envergonhada — a renda vitoriana é o que arco
   e cilindro não alcançam, e a essa distância se lê silhueta.

   O braço do índice é peça própria: ele gira em torno do centro do limbo, e é
   o gesto de usar o instrumento. Fica parado aqui; quem o move é a janela.

   E o arco carrega a GRAVAÇÃO. Instrumento de época era gravado — nome do
   fabricante, número, dedicatória. A frase que diz como usá-lo mora no latão,
   e só aparece para quem chega perto e gira a peça. É a pista que a RA existe
   para entregar. */
const SEXT_R = 0.105;                    /* raio externo do limbo */
const SEXT_PE = 0.011;                   /* altura dos pés */
const SEXT_ESP = 0.008;                  /* espessura do quadro */
const SEXT_POS = [-0.30, A, -0.02];      /* o pivô, no tampo */
/* ONDE O BRAÇO FICOU, e de propósito NÃO no 26. O instrumento largado na mesa
   com a resposta já discada entregaria de graça o que a escada e a frase
   existem para fazer alguém descobrir. Fica num ângulo qualquer, como quem
   guardou sem zerar. */
const SEXT_ANG = 12;
const SEXT_Y = A + SEXT_PE + SEXT_ESP / 2;   /* plano do quadro */

/* TUDO POR POLAR, a partir do pivô. A primeira montagem media cada peça por
   conta própria e o resultado foi uma pilha de palitos: barras que não se
   encontravam, luneta boiando a três centímetros da armação, punho enterrado
   no tampo. Instrumento é uma coisa só — um sistema de coordenadas, não uma
   lista de posições. */
const sexX = (r, g) => SEXT_POS[0] + Math.cos(g * D2R) * r;
const sexZ = (r, g) => SEXT_POS[2] + Math.sin(g * D2R) * r;

peca("Sextante", 3, SEXT_POS, () => {
  /* o limbo: o setor de 60° que dá nome ao bicho */
  arco(SEXT_POS[0], SEXT_Y, SEXT_POS[2], SEXT_R - 0.016, SEXT_R, SEXT_ESP, -30, 30, 36, 1);

  /* a graduação, rasa na face de cima do limbo. É o que faz um arco de latão
     virar escala — sem os traços, é uma alça. */
  for (let g = -30; g <= 30; g += 10) {
    caixa(sexX(SEXT_R - 0.008, g), SEXT_Y + SEXT_ESP / 2, sexZ(SEXT_R - 0.008, g),
      0.013, 0.0014, 0.0016, 0.0004, 40, "x", "z", -g);
  }

  /* a armação: três braços do pivô ao limbo, cada um girado para o seu ângulo */
  const comp = SEXT_R - 0.018;
  for (const g of [-30, 0, 30]) {
    caixa(sexX(0.006 + comp / 2, g), SEXT_Y, sexZ(0.006 + comp / 2, g),
      comp, SEXT_ESP, 0.012, 0.002, 24, "x", "z", -g);
  }
  /* a travessa, no comprimento exato do setor onde ela cruza. Antes era mais
     longa que o vão e saía pelos dois lados. */
  const rt = 0.055, meia = rt * Math.tan(30 * D2R);
  caixa(sexX(rt, 0), SEXT_Y, sexZ(rt, 0), 0.011, SEXT_ESP, meia * 2 + 0.012, 0.002, 24, "x", "z", 0);

  /* o pivô, onde o braço do índice gira */
  cilindro(SEXT_POS[0], SEXT_Y + 0.011, SEXT_POS[2], 0.013, 0.012, 20, 1);

  /* O CAMINHO DA LUZ, que é o que ordena o resto: espelho do índice no pivô,
     espelho do horizonte adiante no braço de 30°, luneta atrás dos dois e
     alinhada com eles. Enfileirados no mesmo raio, e por isso se leem. */
  const RH = 0.076, RL = 0.031;
  cilindro(sexX(RH, 30), SEXT_Y + 0.012, sexZ(RH, 30), 0.004, 0.016, 12, 1);
  caixa(sexX(RH, 30), SEXT_Y + 0.032, sexZ(RH, 30), 0.004, 0.026, 0.021, 0.001, 30, "z", "y", -30);
  cilindro(sexX(RL, 30), SEXT_Y + 0.016, sexZ(RL, 30), 0.005, 0.024, 12, 1);
  cilindro(sexX(RL, 30), SEXT_Y + 0.032, sexZ(RL, 30), 0.0065, 0.062, 18, 2, "x", -30);

  /* OS PÉS. Um sextante pousa sobre três pinos na face do quadro — é assim que
     ele fica numa mesa sem deitar sobre os espelhos. O punho da versão
     anterior atravessava o tampo. */
  for (const [g, r] of [[0, 0], [-27, 0.094], [27, 0.094]]) {
    cilindro(sexX(r, g), A + SEXT_PE / 2, sexZ(r, g), 0.008, SEXT_PE, 12, 1);
  }
});

/* O BRAÇO DO ÍNDICE, peça própria porque ele é o que se move. Nasce no ângulo
   em que ficou; quem o disca é a janela. O espelho do índice vem com ele: é
   por girar o espelho que o instrumento mede. */
peca("Braco", 3, SEXT_POS, () => {
  const g = SEXT_ANG - 30, comp = SEXT_R - 0.004;
  caixa(sexX(comp / 2, g), SEXT_Y + 0.008, sexZ(comp / 2, g),
    comp, 0.006, 0.011, 0.002, 24, "x", "z", -g);
  /* o tambor micrométrico, na ponta que corre sobre o limbo */
  cilindro(sexX(SEXT_R - 0.010, g), SEXT_Y + 0.013, sexZ(SEXT_R - 0.010, g), 0.010, 0.016, 16, 1);
  /* o espelho do índice, de pé sobre o pivô, virado para o do horizonte */
  caixa(SEXT_POS[0], SEXT_Y + 0.032, SEXT_POS[2], 0.004, 0.026, 0.023, 0.001, 30, "z", "y", -g);
});

/* ── EMISSÃO ─────────────────────────────────────────────────────────────────
   Uma malha e um nó por peça. A gaveta e o papel ganham animação; o resto é
   cenário. */
const texTampo = madeira(384, 384, { claro: [104, 63, 37], escuro: [44, 23, 11], semente: 0x51a1, anéis: 13, nós: 2 });
const texMadeira = madeira(384, 384, { claro: [86, 51, 29], escuro: [33, 17, 8], semente: 0x77c3, anéis: 24, nós: 4 });
const texGaveta = madeira(384, 384, { claro: [112, 68, 40], escuro: [48, 26, 13], semente: 0x2b9d, anéis: 17, nós: 1 });
const texMetal = latao(192, 0x0f3a);
const texPapel = papelTextura();
const imagens = [texTampo, texMadeira, texGaveta, texMetal, texPapel];

const MAT = [
  { nome: "Tampo", tex: 0, rough: 0.42, metal: 0 },
  { nome: "Madeira", tex: 1, rough: 0.60, metal: 0 },
  { nome: "Gavetas", tex: 2, rough: 0.48, metal: 0 },
  /* LATÃO ACETINADO, e não espelhado. Com rugosidade 0.26 a luneta — um
     cilindro liso e horizontal — devolvia o estúdio inteiro e saía cromada no
     meio de uma armação dourada. Superfície curva reflete muito mais ambiente
     que superfície plana, então o número que servia às puxadeiras não servia
     ao instrumento. */
  { nome: "Metal", tex: 3, rough: 0.42, metal: 0.55 },
  { nome: "Papel", tex: 4, rough: 0.94, metal: 0 },
];

function alinha(n) { return (n + 3) & ~3; }
const vistas = [], acessores = [], blocos = [];
let corrida = 0;
function poeBloco(buf, alvo) {
  const off = alinha(corrida);
  blocos.push({ off, buf });
  corrida = off + buf.length;
  vistas.push({ buffer: 0, byteOffset: off, byteLength: buf.length, ...(alvo ? { target: alvo } : {}) });
  return vistas.length - 1;
}
function mn(a, k) { const o = []; for (let i = 0; i < k; i++) { let v = Infinity; for (let j = i; j < a.length; j += k) v = Math.min(v, a[j]); o.push(v) } return o }
function mx(a, k) { const o = []; for (let i = 0; i < k; i++) { let v = -Infinity; for (let j = i; j < a.length; j += k) v = Math.max(v, a[j]); o.push(v) } return o }

const malhas = [], nos = [];
for (const pc of PECAS) {
  /* posições relativas à origem da peça; a origem vira translação do nó */
  const pos = new Float32Array(pc.V.length);
  for (let i = 0; i < pc.V.length; i += 3) {
    pos[i] = pc.V[i] - pc.origem[0];
    pos[i + 1] = pc.V[i + 1] - pc.origem[1];
    pos[i + 2] = pc.V[i + 2] - pc.origem[2];
  }
  const nor = new Float32Array(pc.N), uvs = new Float32Array(pc.UV), idx = new Uint16Array(pc.IDX);
  const bp = poeBloco(Buffer.from(pos.buffer, pos.byteOffset, pos.byteLength), 34962);
  const bn = poeBloco(Buffer.from(nor.buffer, nor.byteOffset, nor.byteLength), 34962);
  const bu = poeBloco(Buffer.from(uvs.buffer, uvs.byteOffset, uvs.byteLength), 34962);
  const bi = poeBloco(Buffer.from(idx.buffer, idx.byteOffset, idx.byteLength), 34963);
  const aP = acessores.push({ bufferView: bp, componentType: 5126, count: pos.length / 3, type: "VEC3", min: mn(pos, 3), max: mx(pos, 3) }) - 1;
  const aN = acessores.push({ bufferView: bn, componentType: 5126, count: nor.length / 3, type: "VEC3" }) - 1;
  const aU = acessores.push({ bufferView: bu, componentType: 5126, count: uvs.length / 2, type: "VEC2" }) - 1;
  const aI = acessores.push({ bufferView: bi, componentType: 5123, count: idx.length, type: "SCALAR" }) - 1;
  malhas.push({ name: pc.nome, primitives: [{ attributes: { POSITION: aP, NORMAL: aN, TEXCOORD_0: aU }, indices: aI, material: pc.material }] });
  nos.push({ mesh: malhas.length - 1, name: pc.nome, translation: pc.origem });
}
const iGaveta = PECAS.findIndex((p) => p.nome === "Gaveta");
const iPapel = PECAS.findIndex((p) => p.nome === "Papel");
/* o papel é filho da gaveta, e a translação dele passa a ser relativa a ela */
nos[iPapel].translation = [
  PECAS[iPapel].origem[0] - PECAS[iGaveta].origem[0],
  PECAS[iPapel].origem[1] - PECAS[iGaveta].origem[1],
  PECAS[iPapel].origem[2] - PECAS[iGaveta].origem[2],
];
nos[iGaveta].children = [iPapel];
const raizes = PECAS.map((_, i) => i).filter((i) => i !== iPapel);

/* ── ANIMAÇÃO ────────────────────────────────────────────────────────────────
   UMA SÓ, EM DUAS FASES, e isto é conserto de um defeito medido: o
   model-viewer aplica UMA animação por vez, e trocar de faixa devolve os nós
   que a anterior movia à pose de repouso. Com "abrir" e "virar" separadas, o
   toque no papel FECHAVA a gaveta — a gente via o papel virar dentro de uma
   gaveta que tinha acabado de sumir.

   Agora é uma faixa contínua, e cada gesto toca um TRECHO dela:

     0,00 → 0,75   a gaveta sai
     0,75 → 1,75   o papel sobe, gira meia volta e assenta

   A gaveta tem quadro-chave no fim do trecho do papel também, segurando a
   posição aberta: sem ele, a interpolação a puxaria de volta enquanto o papel
   vira. Quadro que não se move ainda precisa existir. */
const T_ABRE = 0.75, T_VIRA = 1.75, T_FIM = 2.10;
/* T_FIM existe só para 1,75 NÃO ser o último quadro. Travar o relógio
   exatamente na duração faz o model-viewer dar a volta e voltar ao zero — a
   gaveta fechava sozinha no instante em que o papel acabava de virar. Um
   trecho morto no fim, e o fim do gesto passa a ser um instante comum. */
const animBlocos = [];
function amostrador(tempos, valores, tipo) {
  const t = new Float32Array(tempos), v = new Float32Array(valores);
  const bt = poeBloco(Buffer.from(t.buffer, t.byteOffset, t.byteLength));
  const bv = poeBloco(Buffer.from(v.buffer, v.byteOffset, v.byteLength));
  const at = acessores.push({ bufferView: bt, componentType: 5126, count: tempos.length, type: "SCALAR", min: [Math.min(...tempos)], max: [Math.max(...tempos)] }) - 1;
  const av = acessores.push({ bufferView: bv, componentType: 5126, count: tempos.length, type: tipo }) - 1;
  return { input: at, output: av, interpolation: "LINEAR" };
}
const gt = nos[iGaveta].translation, pt = nos[iPapel].translation;
const q = (ang) => [Math.sin(ang / 2), 0, 0, Math.cos(ang / 2)];

const sGaveta = amostrador([0, 0.28, T_ABRE, T_VIRA, T_FIM], [
  gt[0], gt[1], gt[2],
  gt[0], gt[1], gt[2] + CURSO * 0.72,
  gt[0], gt[1], gt[2] + CURSO,
  gt[0], gt[1], gt[2] + CURSO,          /* segura aberta enquanto o papel vira */
  gt[0], gt[1], gt[2] + CURSO,
], "VEC3");
const sPapelPos = amostrador([0, T_ABRE, 1.20, T_VIRA, T_FIM], [
  pt[0], pt[1], pt[2],
  pt[0], pt[1], pt[2],
  pt[0], pt[1] + 0.085, pt[2] - 0.02,
  pt[0], pt[1] + 0.004, pt[2],
  pt[0], pt[1] + 0.004, pt[2],
], "VEC3");
const sPapelRot = amostrador([0, T_ABRE, 1.20, T_VIRA, T_FIM],
  [...q(0), ...q(0), ...q(Math.PI * 0.55), ...q(Math.PI), ...q(Math.PI)], "VEC4");

const gesto = {
  name: "gesto",
  samplers: [sGaveta, sPapelPos, sPapelRot],
  channels: [
    { sampler: 0, target: { node: iGaveta, path: "translation" } },
    { sampler: 1, target: { node: iPapel, path: "translation" } },
    { sampler: 2, target: { node: iPapel, path: "rotation" } },
  ],
};

/* imagens no fim do buffer */
const vistasImg = imagens.map((im) => poeBloco(im));

const binTotal = Buffer.alloc(alinha(corrida));
for (const b of blocos) b.buf.copy(binTotal, b.off);

function montaGltf({ comAnimacao }) {
  const g = {
    asset: { version: "2.0", generator: "MOSAICO · ferramentas/escrivaninha.mjs" },
    scene: 0,
    scenes: [{ nodes: raizes }],
    nodes: nos,
    meshes: malhas,
    materials: MAT.map((m) => ({
      name: m.nome,
      pbrMetallicRoughness: { baseColorTexture: { index: m.tex }, metallicFactor: m.metal, roughnessFactor: m.rough },
      doubleSided: false,
    })),
    textures: MAT.map((_, i) => ({ source: i, sampler: 0 })),
    samplers: [{ magFilter: 9729, minFilter: 9987, wrapS: 10497, wrapT: 10497 }],
    images: vistasImg.map((v) => ({ bufferView: v, mimeType: "image/png" })),
    accessors: acessores,
    bufferViews: vistas,
    buffers: [{ byteLength: binTotal.length }],
  };
  if (comAnimacao) g.animations = [gesto];
  return g;
}
function escreveGlb(arquivo, gltf) {
  const j = Buffer.from(JSON.stringify(gltf), "utf8");
  const jp = Buffer.concat([j, Buffer.alloc(alinha(j.length) - j.length, 0x20)]);
  const bp = Buffer.concat([binTotal, Buffer.alloc(alinha(binTotal.length) - binTotal.length, 0)]);
  const cab = Buffer.alloc(12);
  cab.write("glTF", 0, "ascii"); cab.writeUInt32LE(2, 4);
  cab.writeUInt32LE(12 + 8 + jp.length + 8 + bp.length, 8);
  const cj = Buffer.alloc(8); cj.writeUInt32LE(jp.length, 0); cj.write("JSON", 4, "ascii");
  const cb = Buffer.alloc(8); cb.writeUInt32LE(bp.length, 0); cb.write("BIN\0", 4, "ascii");
  const glb = Buffer.concat([cab, cj, jp, cb, bp]);
  writeFileSync(join(SAIDA, arquivo), glb);
  return glb.length;
}

const tam1 = escreveGlb("escrivaninha.glb", montaGltf({ comAnimacao: false }));
const tam2 = escreveGlb("escrivaninha-gaveta.glb", montaGltf({ comAnimacao: true }));
const tris = PECAS.reduce((s, p) => s + p.IDX.length / 3, 0);
console.log("duas saídas, mesma geometria:");
console.log("  escrivaninha.glb        " + (tam1 / 1024).toFixed(0) + " KB   bancada 02, parada");
console.log("  escrivaninha-gaveta.glb " + (tam2 / 1024).toFixed(0) + " KB   bancada 04, com abrir e virar");
console.log("  peças: " + PECAS.length + " · triângulos: " + tris + " · texturas: " + imagens.length);

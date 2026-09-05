/* modelos.js — texturas, materiais e os cinco níveis (código puro, sem DOM).
   Recebe uma fábrica de textura para funcionar tanto no navegador (CanvasTexture)
   quanto em renderização headless (DataTexture) usada nos testes visuais.

   O QUE MUDOU NESTA VERSÃO (a peça parecia plástico vermelho)
   ---------------------------------------------------------------------------
   1. A ESTRIAÇÃO ESTAVA NO EIXO ERRADO. TubeGeometry traz u ao longo do
      comprimento; CylinderGeometry traz v. A mesma textura de bandas servia às
      duas, então na fibra e na miofibrila a faixa transversal saía deitada,
      virando listra longitudinal. O desenho estava certo — de lado.
   2. O MÚSCULO NÃO TINHA FASCÍCULO, TINHA ARAME. Era um casco liso de revolução
      com 30 tubos de raio 0,028 colados por fora. Agora o ventre É o feixe: 41
      fascículos que engrossam no meio e convergem para o tendão, com um miolo
      escuro atrás para que os vãos entre eles leiam como profundidade, e não
      como buraco.
   3. AS BORDAS ERAM DEGRAU. Banda pintada com fillRect tem transição de um
      pixel; tecido não tem. As faixas agora são interpoladas coluna a coluna.
   4. TUDO TINHA A MESMA COR. Cada fascículo, cada fibra e cada miofibrila
      recebe um matiz próprio por cor de vértice — é o que separa uma peça da
      vizinha quando a luz vem de frente.                                     */
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export function criar(canvasTex) {

/* ============================================================ medidas e atalhos */
/* Um sarcômero de 2,4 µm em proporção: Z 0,05 | I ½ 0,375 | A 1,6 (H 0,3 no centro, M 0,04) | I ½ 0,375. */
const SARC = { Z: .05, Ihalf: .375, A: 1.6, H: .3, M: .04, len: 2.4 };
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const rnd = (a, b) => a + Math.random() * (b - a);
const C = h => new THREE.Color(h);

/* ============================================================ texturas em canvas */

/* --- bandas do sarcômero, com transição macia de uma faixa para a seguinte ---
   `eixo` escolhe se a sequência corre no X ou no Y do canvas: tubo quer 'x'
   (u = comprimento); cilindro deitado quer 'y' (v = comprimento).            */
function faixasDoSarcomero(cores) {
  const seq = [
    [SARC.Z, cores.Z], [SARC.Ihalf, cores.I],
    [(SARC.A - SARC.H) / 2, cores.A], [(SARC.H - SARC.M) / 2, cores.H],
    [SARC.M, cores.M],
    [(SARC.H - SARC.M) / 2, cores.H], [(SARC.A - SARC.H) / 2, cores.A],
    [SARC.Ihalf, cores.I],
  ];
  const lim = []; let acc = 0;
  for (const [larg, cor] of seq) { lim.push({ ini: acc, fim: acc + larg, cor: C(cor) }); acc += larg; }
  return lim;
}
const suave = t => t * t * (3 - 2 * t);
function corNaPosicao(lim, s, macio) {
  let i = 0; while (i < lim.length - 1 && s > lim[i].fim) i++;
  const faixa = lim[i];
  const d = Math.min(s - faixa.ini, faixa.fim - s);
  if (d >= macio) return faixa.cor;
  const j = (s - faixa.ini < faixa.fim - s) ? i - 1 : i + 1;
  const vizinha = lim[(j + lim.length) % lim.length];
  return faixa.cor.clone().lerp(vizinha.cor, (1 - suave(d / macio)) * .5);
}
function estriacao(cores, eixo, repeticoes, { grao = .07, res = 1024 } = {}) {
  const w = eixo === 'x' ? res : 96, h = eixo === 'x' ? 96 : res;
  const n = eixo === 'x' ? w : h;
  const lim = faixasDoSarcomero(cores);
  return canvasTex(w, h, (g) => {
    for (let i = 0; i < n; i++) {
      const c = corNaPosicao(lim, (i + .5) / n * SARC.len, .05);
      g.fillStyle = 'rgb(' + Math.round(c.r * 255) + ',' + Math.round(c.g * 255) + ',' + Math.round(c.b * 255) + ')';
      if (eixo === 'x') g.fillRect(i, 0, 1.05, h); else g.fillRect(0, i, w, 1.05);
    }
    // grão do tecido: miofilamento não é parede pintada
    g.globalAlpha = grao;
    for (let i = 0; i < 2600; i++) {
      g.fillStyle = i % 2 ? '#000' : '#fff';
      const x = Math.random() * w, y = Math.random() * h;
      if (eixo === 'x') g.fillRect(x, y, 1.6, 3); else g.fillRect(x, y, 3, 1.6);
    }
    g.globalAlpha = 1;
  }, eixo === 'x' ? { repeatX: repeticoes } : { repeatY: repeticoes });
}

/* --- estriação de longe: só claro-escuro, sem Z, H nem M ---------------------
   Na escala da fibra o sarcômero inteiro cabe em cinco ou seis pixels de tela.
   Desenhar Z, I, A, H e M ali dentro não ensina nada: o mip-map mistura tudo e
   o que sobra é MOIRÉ — a batida entre a frequência da textura e a da tela, que
   aparece como listra diagonal e faz a fibra parecer um pirulito torcido. De
   longe, faixa clara e faixa escura, em cosseno, que é o que o olho veria. */
function estriacaoSuave(claro, escuro, eixo, repeticoes, { res = 512 } = {}) {
  const w = eixo === 'x' ? res : 64, h = eixo === 'x' ? 64 : res;
  const n = eixo === 'x' ? w : h;
  const a = C(claro), b = C(escuro), c = new THREE.Color();
  return canvasTex(w, h, (g) => {
    for (let i = 0; i < n; i++) {
      const t = .5 - .5 * Math.cos((i + .5) / n * Math.PI * 2);
      c.copy(a).lerp(b, Math.pow(t, .85));
      g.fillStyle = 'rgb(' + Math.round(c.r * 255) + ',' + Math.round(c.g * 255) + ',' + Math.round(c.b * 255) + ')';
      if (eixo === 'x') g.fillRect(i, 0, 1.05, h); else g.fillRect(0, i, w, 1.05);
    }
  }, eixo === 'x' ? { repeatX: repeticoes } : { repeatY: repeticoes });
}

/* --- estrias no comprimento: linha de v constante vira risco longitudinal --- */
function estriasLongo(base, claro, escuro, { linhas = 150, res = 512 } = {}) {
  return canvasTex(res, res, (g, w, h) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    for (let i = 0; i < linhas; i++) {
      g.globalAlpha = rnd(.04, .20);
      g.fillStyle = Math.random() < .5 ? claro : escuro;
      g.fillRect(0, Math.random() * h, w, rnd(.8, 3.4));
    }
    g.globalAlpha = 1;
  });
}

/* Quantas vezes a sequência de bandas cabe na peça — e isto NÃO é gosto, é
   proporção. O sarcômero tem 2,4 µm; a fibra tem uns 50 µm de diâmetro, logo a
   estriação dela é vinte vezes mais fina que a peça é grossa. A miofibrila tem
   1 µm, e aí o sarcômero é MAIS COMPRIDO que ela é larga. Estava tudo com o
   mesmo 11: na fibra saía listra de poste de barbeiro, e na miofibrila do nível
   04 as faixas pintadas nem caíam sobre os anéis Z, que estão a cada 2,4. */
const CORES_MIOFIBRILA = { Z: '#2b0609', I: '#eda99c', A: '#8e1f28', H: '#b8434a', M: '#4d0d14' };
const TEX = {
  fibraTubo: estriacaoSuave('#bb6459', '#7d222b', 'x', 30),
  sarcolema: estriacaoSuave('#d18d84', '#8f3038', 'y', 26),
  miofibrila: estriacao(CORES_MIOFIBRILA, 'y', 18),
  /* o nível 04 tem três sarcômeros medidos, e o desenho precisa cair sobre os
     anéis: repetição 3, nem uma a mais */
  miofibrilaLonga: estriacao(CORES_MIOFIBRILA, 'y', 3),

  /* corte transversal da fibra: miofibrila vista de topo é ponto, não faixa */
  corteFibra: canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#8e2d33'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 900; i++) {
      const x = Math.random() * w, y = Math.random() * h, r = rnd(2.6, 5.2);
      g.fillStyle = 'rgba(210,120,110,' + rnd(.35, .8) + ')';
      g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
      g.fillStyle = 'rgba(60,10,14,.5)';
      g.beginPath(); g.arc(x + r * .35, y + r * .35, r * .55, 0, Math.PI * 2); g.fill();
    }
  }, { repeatX: 2, repeatY: 2 }),
  /* cinza de propósito: com mapa colorido E cor de vértice, as duas se
     multiplicam e o vermelho vira marrom escuro. O mapa modula, o vértice tinge. */
  musculo: estriasLongo('#c6bcbc', '#f6efef', '#827272', { linhas: 220 }),
  tendao: estriasLongo('#e6dac2', '#fbf3e2', '#b8a684', { linhas: 260 }),
  osso: estriasLongo('#efe7d3', '#fffaf0', '#cfc3a8', { linhas: 90 }),

  /* fáscia: colágeno cruzado em duas direções — é assim que a bainha se vê */
  fascia: canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = '#fbeee0'; g.fillRect(0, 0, w, h);
    for (const [ang, alfa] of [[.42, .30], [-.42, .24]]) {
      g.save(); g.translate(w / 2, h / 2); g.rotate(ang); g.translate(-w, -h);
      g.strokeStyle = 'rgba(150,105,84,' + alfa + ')';
      for (let i = 0; i < 150; i++) {
        g.lineWidth = rnd(.6, 2.2); g.beginPath();
        const y = Math.random() * h * 3; g.moveTo(0, y); g.lineTo(w * 3, y + rnd(-14, 14)); g.stroke();
      }
      g.restore();
    }
  }, { repeatX: 3, repeatY: 2 }),

  /* relevo do ventre: o sulco entre fascículos corre no comprimento */
  musculoBump: canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = '#808080'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 260; i++) {
      const y = Math.random() * h, esp = rnd(1, 4);
      const grad = g.createLinearGradient(0, y - esp, 0, y + esp);
      grad.addColorStop(0, '#5c5c5c'); grad.addColorStop(.5, '#c0c0c0'); grad.addColorStop(1, '#5c5c5c');
      g.fillStyle = grad; g.globalAlpha = rnd(.25, .8); g.fillRect(0, y - esp, w, esp * 2);
    }
    g.globalAlpha = 1;
  }),

  /* disco Z: a rede de α-actinina, em ziguezague */
  zDisc: canvasTex(256, 256, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.strokeStyle = '#f6ead4'; g.lineWidth = 7; g.lineJoin = 'round';
    const s = 30;
    for (let y = -s; y <= h + s; y += s) for (let x = -s; x <= w + s; x += s) {
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + s / 2, y + s / 2); g.lineTo(x + s, y); g.lineTo(x + s / 2, y - s / 2); g.closePath(); g.stroke();
    }
    g.globalAlpha = .5; g.strokeStyle = '#c9b184'; g.lineWidth = 2;
    for (let y = -s; y <= h + s; y += s) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
    g.globalAlpha = 1;
  }, { repeatX: 3, repeatY: 3 }),
};
TEX.musculoBump.colorSpace = THREE.NoColorSpace;

/* ============================================================ materiais */
const phys = o => new THREE.MeshPhysicalMaterial(Object.assign({ roughness: .45, metalness: 0 }, o));
const M = {
  musculo: phys({ color: 0xffffff, vertexColors: true, map: TEX.musculo, roughness: .40, clearcoat: .45, clearcoatRoughness: .35, sheen: .45, sheenColor: 0xffb59c, bumpMap: TEX.musculoBump, bumpScale: .6 }),
  musculoFundo: phys({ color: 0x4d1013, roughness: .62, clearcoat: .2 }),
  epimisio: phys({ color: 0xf6e6d6, map: TEX.fascia, roughness: .22, transparent: true, opacity: .19, side: THREE.DoubleSide, clearcoat: 1, clearcoatRoughness: .12, depthWrite: false }),
  tendao: phys({ color: 0xe8dcc4, map: TEX.tendao, roughness: .44, sheen: .9, sheenColor: 0xfffaf0, clearcoat: .35 }),
  osso: phys({ color: 0xf0e8d6, map: TEX.osso, roughness: .72, clearcoat: .1 }),
  cartilagem: phys({ color: 0xdfe7e4, roughness: .35, clearcoat: .5 }),

  fibra: phys({ color: 0xffffff, vertexColors: true, map: TEX.fibraTubo, roughness: .5, clearcoat: .2, clearcoatRoughness: .4, sheen: .35, sheenColor: 0xffb0a0 }),
  fibraCorte: phys({ color: 0xd08a86, map: TEX.corteFibra, roughness: .55, side: THREE.DoubleSide }),
  endomisio: phys({ color: 0xf3ddc9, roughness: .5, transparent: true, opacity: .55 }),
  perimisio: phys({ color: 0xfbeee0, map: TEX.fascia, transparent: true, opacity: .13, side: THREE.DoubleSide, roughness: .3, clearcoat: .7, depthWrite: false }),
  capilar: phys({ color: 0xa8121f, roughness: .28, clearcoat: .8 }),

  sarcolema: phys({ color: 0xf0c3b8, map: TEX.sarcolema, transparent: true, opacity: .34, side: THREE.DoubleSide, roughness: .22, clearcoat: 1, clearcoatRoughness: .1, depthWrite: false }),
  bordaCorte: phys({ color: 0xf3cec2, roughness: .4, clearcoat: .5 }),
  nucleo: phys({ color: 0x53307d, roughness: .3, clearcoat: .7, sheen: .4, sheenColor: 0xb79ae0 }),
  mitocondria: phys({ color: 0xd9903a, roughness: .48, clearcoat: .3 }),
  miofibrila: phys({ color: 0xffffff, vertexColors: true, map: TEX.miofibrila, roughness: .40 }),
  miofibrilaCorte: phys({ color: 0xf0dedb, map: TEX.miofibrilaLonga, roughness: .40, side: THREE.DoubleSide }),
  miofibrilaTopo: phys({ color: 0xd08a86, map: TEX.corteFibra, roughness: .55, side: THREE.DoubleSide }),
  sarcoplasma: phys({ color: 0x5b171c, roughness: .68 }),
  zAnel: phys({ color: 0x2b0609, roughness: .55 }),

  actina: phys({ color: 0xe6c356, roughness: .32, clearcoat: .45 }),
  tropomiosina: phys({ color: 0xf3e3a4, roughness: .4 }),
  troponina: phys({ color: 0xd8853c, roughness: .35, clearcoat: .5 }),
  miosina: phys({ color: 0x4f93bd, roughness: .33, clearcoat: .55 }),
  cabeca: phys({ color: 0x336f9e, roughness: .28, clearcoat: .75 }),
  zdisc: phys({ color: 0xd9c49b, map: TEX.zDisc, transparent: true, alphaTest: .35, side: THREE.DoubleSide, roughness: .45 }),
  zaro: phys({ color: 0xd9c49b, roughness: .45, clearcoat: .3 }),
  mlinha: phys({ color: 0xcbb691, transparent: true, opacity: .62, side: THREE.DoubleSide }),
  mponte: phys({ color: 0xcbb691, roughness: .45 }),
  titina: phys({ color: 0x7fc99a, roughness: .38, clearcoat: .35 }),
};

/* ============================================================ utilidades geométricas */
function tintar(geo, cor) {
  const n = geo.attributes.position.count, arr = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { arr[i * 3] = cor.r; arr[i * 3 + 1] = cor.g; arr[i * 3 + 2] = cor.b; }
  geo.setAttribute('color', new THREE.BufferAttribute(arr, 3));
  return geo;
}
/* matiz próprio para cada peça do feixe: é o que faz uma se destacar da outra */
function variar(hex, dh, ds, dl) {
  const c = C(hex), hsl = {}; c.getHSL(hsl);
  return c.setHSL(hsl.h + rnd(-dh, dh), THREE.MathUtils.clamp(hsl.s + rnd(-ds, ds), 0, 1), THREE.MathUtils.clamp(hsl.l + rnd(-dl, dl), 0, 1));
}
/* Tubo de raio variável. TubeGeometry grava u = i/tubularSegments na uv.x, e o
   mesmo u serve a getPointAt — então dá para empurrar cada vértice na direção
   radial pelo perfil desejado sem recalcular quadro nenhum. */
function tuboPerfil(curva, raio, { segsU = 90, segsV = 14 } = {}) {
  const geo = new THREE.TubeGeometry(curva, segsU, 1, segsV, false);
  const pos = geo.attributes.position, uv = geo.attributes.uv;
  const p = new THREE.Vector3(), c = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    const u = uv.getX(i);
    p.fromBufferAttribute(pos, i); curva.getPointAt(u, c);
    p.sub(c).multiplyScalar(Math.max(1e-4, raio(u))).add(c);
    pos.setXYZ(i, p.x, p.y, p.z);
  }
  pos.needsUpdate = true; geo.computeVertexNormals();
  return geo;
}
function curvaDePontos(fn, n = 28) {
  const pts = []; for (let i = 0; i <= n; i++) pts.push(fn(i / n));
  return new THREE.CatmullRomCurve3(pts);
}
function capsula(a, b, r, mat, rad = 18) {
  const d = V().subVectors(b, a), len = d.length();
  const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, Math.max(.001, len - 2 * r), 6, rad), mat);
  m.position.copy(a).add(b).multiplyScalar(.5); m.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize()); return m;
}
function xCil(r1, r2, len, mat, segs = 48, aberto = false, thetaLen = Math.PI * 2) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, len, segs, 1, aberto, 0, thetaLen), mat); m.rotation.z = Math.PI / 2; return m;
}
function disco(r, esp, mat, segs = 48) { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, esp, segs), mat); m.rotation.z = Math.PI / 2; return m; }
function helice(a, b, raio, voltas, r, mat, fase = 0, segs = 120) {
  const d = V().subVectors(b, a), len = d.length(), dir = d.clone().normalize();
  const u = Math.abs(dir.y) < .9 ? V(0, 1, 0) : V(1, 0, 0); const n1 = V().crossVectors(dir, u).normalize(), n2 = V().crossVectors(dir, n1);
  const pts = []; for (let i = 0; i <= segs; i++) { const t = i / segs, ang = fase + t * voltas * Math.PI * 2; pts.push(a.clone().addScaledVector(dir, t * len).addScaledVector(n1, Math.cos(ang) * raio).addScaledVector(n2, Math.sin(ang) * raio)); }
  return new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), segs, r, 8, false), mat);
}
/* revolução em torno do eixo X a partir de um perfil raio(s), s de 0 a 1 */
function revolucaoX(x0, x1, raio, mat, { segs = 40, radiais = 64, achata = 1 } = {}) {
  const pts = [];
  for (let i = 0; i <= segs; i++) { const s = i / segs; pts.push(new THREE.Vector2(Math.max(1e-4, raio(s)), x0 + (x1 - x0) * s)); }
  const geo = new THREE.LatheGeometry(pts, radiais);
  if (achata !== 1) geo.scale(1, 1, achata);
  const m = new THREE.Mesh(geo, mat); m.rotation.z = -Math.PI / 2; return m;
}

/* ============================================================ 01 MÚSCULO
   Um ventre fusiforme não é um casco liso: é o próprio feixe de fascículos.
   Cada fascículo nasce fino no tendão, engrossa no ventre e afina de novo — e é
   a soma deles, não uma superfície de revolução, que dá a silhueta.          */
const MUS = { A: 2.45, Rmax: .84, achata: .80, xTendao: 2.38 };
const perfilVentre = t => Math.pow(Math.max(0, 1 - t * t), .58);

function musculo() {
  const g = new THREE.Group();

  /* miolo escuro: fecha o que se veria pelos vãos entre fascículos */
  g.add(revolucaoX(-MUS.A, MUS.A, s => {
    const t = -1 + 2 * s; return .062 + MUS.Rmax * .80 * perfilVentre(t);
  }, M.musculoFundo, { achata: MUS.achata }));

  /* os fascículos */
  const aneis = [[1.00, 17, .108], [.775, 12, .102], [.525, 8, .098], [.25, 4, .092]];
  const geos = [];
  aneis.forEach(([anel, quantos, base], iAnel) => {
    for (let k = 0; k < quantos; k++) {
      const th = (k + (iAnel % 2) * .5) * (Math.PI * 2 / quantos) + iAnel * .37 + rnd(-.075, .075);
      const torcao = .78 + iAnel * .10 + rnd(-.06, .06);
      const curva = curvaDePontos(u => {
        const t = -1 + 2 * u;
        const rr = .072 + (anel * MUS.Rmax - .072) * perfilVentre(t);
        const a = th + torcao * t;
        return V(t * MUS.A, Math.sin(a) * rr, Math.cos(a) * rr * MUS.achata);
      });
      const jitter = rnd(.80, 1.20);
      const raio = u => { const t = -1 + 2 * u; return base * jitter * (.26 + .74 * Math.pow(Math.max(0, 1 - t * t), .40)); };
      geos.push(tintar(tuboPerfil(curva, raio, { segsU: 72, segsV: 12 }), variar(0x94271f, .014, .13, .10)));
    }
  });
  g.add(new THREE.Mesh(mergeGeometries(geos), M.musculo));

  /* epimísio: a bainha do músculo inteiro, translúcida, com colágeno cruzado */
  g.add(revolucaoX(-MUS.A * 1.01, MUS.A * 1.01, s => {
    const t = -1 + 2 * s; return .075 + MUS.Rmax * 1.045 * perfilVentre(t);
  }, M.epimisio, { achata: MUS.achata }));

  /* tendões: côncavos junto ao ventre, afinando até a inserção e alargando de
     leve onde encostam no osso */
  for (const s of [-1, 1]) {
    g.add(revolucaoX(s * (MUS.xTendao - .40), s * 3.30, u =>
      .145 + .245 * Math.pow(1 - u, 1.6) + .060 * Math.pow(u, 7), M.tendao, { segs: 34, radiais: 40, achata: .72 }));
    const cap = new THREE.Mesh(new THREE.SphereGeometry(.20, 20, 12), M.tendao);
    cap.scale.set(.5, 1, .72); cap.position.x = s * 3.30; g.add(cap);

    /* osso: diáfise curta, epífise arredondada e cartilagem na ponta.
       `foraDoQuadro` diz ao enquadramento para ignorá-los: osso aqui é contexto,
       e deixar que ele mande na distância da câmera encolhia o músculo — que é
       o assunto — a um terço do palco. Prancha de anatomia corta o osso na
       margem justamente por isso. */
    const contexto = [];
    contexto.push(revolucaoX(s * 3.18, s * 4.50, u => .21 + .10 * Math.pow(u, 3), M.osso, { segs: 24, radiais: 32 }));
    const epifise = new THREE.Mesh(new THREE.SphereGeometry(.32, 26, 18), M.osso);
    epifise.scale.set(.85, 1, .92); epifise.position.x = s * 4.51; contexto.push(epifise);
    const cart = new THREE.Mesh(new THREE.SphereGeometry(.325, 26, 18, 0, Math.PI * 2, 0, Math.PI / 2), M.cartilagem);
    cart.scale.set(1, .85, .92); cart.rotation.z = s > 0 ? -Math.PI / 2 : Math.PI / 2; cart.position.x = s * 4.52; contexto.push(cart);
    contexto.forEach(o => { o.userData.foraDoQuadro = true; g.add(o); });
  }

  /* onde a lupa entra: um fascículo superficial, na frente */
  g.userData.foco = V(.30, .52, .60);
  return g;
}

/* ============================================================ 02 FASCÍCULO
   Fibras empacotadas dentro do perimísio, com a extremidade direita cortada: é
   o corte que ensina que o feixe é feito de células separadas.               */
function fasciculo() {
  const g = new THREE.Group();
  const N = 44, Rb = .78, xEsq = -2.62, xDir = 2.08, rF = .108;

  const centros = [];
  for (let i = 0; i < N; i++) { const a = i * 2.399963, r = Rb * Math.sqrt((i + .5) / N); centros.push([Math.cos(a) * r, Math.sin(a) * r]); }

  const geos = [], cortes = [];
  centros.forEach(([y, z]) => {
    const fy = rnd(-.02, .02), fz = rnd(-.02, .02), fase = Math.random() * 6;
    const curva = curvaDePontos(u => V(
      xEsq + (xDir - xEsq) * u,
      y + Math.sin(fase + u * 5.2) * .035 + fy * u,
      z + Math.cos(fase * 1.3 + u * 4.6) * .035 + fz * u), 22);
    // ponta arredondada à esquerda; à direita, o corte é reto
    const raio = u => rF * (u < .05 ? Math.sqrt(Math.max(0, 1 - Math.pow((.05 - u) / .05, 2))) : 1);
    geos.push(tintar(tuboPerfil(curva, raio, { segsU: 56, segsV: 12 }), variar(0xdfcac6, .016, .10, .065)));

    const p = curva.getPointAt(1);
    const cap = new THREE.CircleGeometry(rF, 16); cap.rotateY(Math.PI / 2); cap.translate(p.x, p.y, p.z); cortes.push(cap);
    const anel = new THREE.Mesh(new THREE.TorusGeometry(rF + .006, .009, 6, 20), M.endomisio);
    anel.rotation.y = Math.PI / 2; anel.position.copy(p); g.add(anel);
  });
  g.add(new THREE.Mesh(mergeGeometries(geos), M.fibra));
  g.add(new THREE.Mesh(mergeGeometries(cortes), M.fibraCorte));

  /* perimísio: mais curto que as fibras, para que elas saiam pelo corte */
  const bainha = xCil(.94, .94, 4.05, M.perimisio, 64, true); bainha.position.x = -.62; g.add(bainha);
  const borda = new THREE.Mesh(new THREE.TorusGeometry(.94, .022, 8, 64), M.perimisio);
  borda.rotation.y = Math.PI / 2; borda.position.x = 1.40; g.add(borda);
  const fundo = new THREE.Mesh(new THREE.SphereGeometry(.94, 40, 24, 0, Math.PI * 2, 0, Math.PI / 2), M.perimisio);
  fundo.rotation.z = Math.PI / 2; fundo.scale.y = .55; fundo.position.x = -2.645; g.add(fundo);

  /* rede capilar: longitudinais com travessas — é rede, não fio solto */
  const vasos = [], longit = [];
  for (let k = 0; k < 9; k++) {
    const a = k * .698, r = .42 + .30 * ((k * 7) % 3) / 2;
    const curva = curvaDePontos(u => V(-2.4 + u * 4.2, Math.cos(a + u * 2.6) * r, Math.sin(a + u * 2.6) * r), 12);
    longit.push(curva); vasos.push(tuboPerfil(curva, () => .017, { segsU: 80, segsV: 8 }));
  }
  for (let k = 0; k < 14; k++) {
    const i = k % longit.length, j = (i + 1 + (k % 3)) % longit.length, u = .12 + (k / 14) * .74;
    const a = longit[i].getPointAt(u), b = longit[j].getPointAt(Math.min(.98, u + .05));
    const meio = V().addVectors(a, b).multiplyScalar(.5).multiplyScalar(1.04);
    vasos.push(tuboPerfil(new THREE.CatmullRomCurve3([a, meio, b]), () => .012, { segsU: 24, segsV: 6 }));
  }
  g.add(new THREE.Mesh(mergeGeometries(vasos), M.capilar));

  g.userData.foco = V(1.95, .16, .22);
  return g;
}

/* ============================================================ 03 FIBRA MUSCULAR
   Uma célula. A estriação que se vê por fora do sarcolema é a das miofibrilas
   de dentro — e por isso as bandas delas estão TODAS em registro.            */
function fibra() {
  const g = new THREE.Group(); const R = .76, L = 5.2;

  const N = 37, pos = [];
  for (let i = 0; i < N; i++) { const a = i * 2.399963, r = .58 * Math.sqrt((i + .5) / N); pos.push([Math.cos(a) * r, Math.sin(a) * r]); }

  const mfGeo = [], cortes = [];
  pos.forEach(([y, z]) => {
    // v corre no comprimento depois do rotateZ: é o que deixa a banda transversal
    const geo = new THREE.CylinderGeometry(.072, .072, L + .34, 14, 1, true);
    geo.rotateZ(-Math.PI / 2); geo.translate(.17, y, z);
    mfGeo.push(tintar(geo, variar(0xe9d3cf, .012, .10, .065)));
    const cap = new THREE.CircleGeometry(.072, 14); cap.rotateY(Math.PI / 2); cap.translate(L / 2 + .34, y, z); cortes.push(cap);
  });
  g.add(new THREE.Mesh(mergeGeometries(mfGeo), M.miofibrila));
  g.add(new THREE.Mesh(mergeGeometries(cortes), M.miofibrilaTopo));
  // sarcoplasma entre as miofibrilas, para o corte não ficar vazado
  const preenche = xCil(.60, .60, L + .3, M.sarcoplasma, 48); preenche.position.x = .17; g.add(preenche);

  /* mitocôndrias nos sulcos entre miofibrilas */
  const mitGeo = [];
  for (let i = 0; i < 84; i++) {
    const a = Math.random() * Math.PI * 2, r = .30 + Math.random() * .34;
    const geo = new THREE.CapsuleGeometry(.028, rnd(.06, .14), 4, 10);
    geo.rotateZ(Math.PI / 2); geo.translate(rnd(-2.4, 2.4), Math.cos(a) * r, Math.sin(a) * r); mitGeo.push(geo);
  }
  g.add(new THREE.Mesh(mergeGeometries(mitGeo), M.mitocondria));

  /* núcleos achatados, colados por dentro do sarcolema */
  const nucGeo = [];
  for (let i = 0; i < 11; i++) {
    const a = i * 2.28 + rnd(-.3, .3), x = -2.3 + (i / 10) * 4.6 + rnd(-.15, .15);
    const geo = new THREE.SphereGeometry(.115, 18, 12); geo.scale(2.0, .5, 1.15); geo.rotateX(-a);
    geo.translate(x, Math.cos(a) * (R - .085), Math.sin(a) * (R - .085)); nucGeo.push(geo);
  }
  g.add(new THREE.Mesh(mergeGeometries(nucGeo), M.nucleo));

  /* sarcolema: membrana translúcida e estriada, fechada à esquerda, cortada à direita */
  g.add(xCil(R, R, L, M.sarcolema, 72, true));
  const ponta = new THREE.Mesh(new THREE.SphereGeometry(R, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2), M.sarcolema);
  ponta.rotation.z = Math.PI / 2; ponta.scale.y = .7; ponta.position.x = -L / 2; g.add(ponta);
  const borda = new THREE.Mesh(new THREE.TorusGeometry(R, .020, 8, 72), M.bordaCorte);
  borda.rotation.y = Math.PI / 2; borda.position.x = L / 2; g.add(borda);

  g.userData.foco = V(2.35, .09, .12);
  return g;
}

/* raio do disco Z do nível 05 — o 04 escala o sarcômero por ele, e quando o
   número morava nos dois lugares uma mudança num deles desalinhava o outro */
const RZ_SARC = .43;

/* ============================================================ 04 MIOFIBRILA */
function miofibrila() {
  const g = new THREE.Group(); const R = .60, n = 3, L = n * SARC.len; g.scale.setScalar(.86);
  // metade de trás fechada em toda a extensão; a da frente só nas pontas (corte longitudinal)
  const fundo = xCil(R, R, L, M.miofibrilaCorte, 72, true, Math.PI); fundo.rotation.set(0, 0, Math.PI / 2); fundo.rotateY(Math.PI); g.add(fundo);
  const esq = xCil(R, R, L * .32, M.miofibrilaCorte, 48, true, Math.PI); esq.rotation.set(0, 0, Math.PI / 2); esq.position.x = -L * .34; g.add(esq);
  const dir = esq.clone(); dir.position.x = L * .34; g.add(dir);
  // tampas um fio para fora: sem isso o disco Z do sarcômero da ponta aflora
  // pela tampa e aparece como leque bege espetado na extremidade
  for (const s of [-1, 1]) { const t = disco(R + .012, .02, M.miofibrilaCorte); t.position.x = s * (L / 2 + .03); g.add(t); }
  // discos Z: anel saliente e escuro, que é como aparecem de fora
  for (let i = 0; i <= n; i++) {
    const z = new THREE.Mesh(new THREE.TorusGeometry(R + .008, .024, 8, 64), M.zAnel);
    z.rotation.y = Math.PI / 2; z.position.x = -L / 2 + i * SARC.len; g.add(z);
  }
  /* Dentro, sarcômeros de verdade — um por vão entre anéis. O centro de cada um
     fica no MEIO de dois discos Z, não sobre eles: pôr no lugar do anel deixava
     a banda pintada por fora fora de fase com o filamento visto por dentro, que
     é justamente o que este nível existe para mostrar que é a mesma coisa. */
  const aberto = new THREE.Group(); g.add(aberto);
  const sc = R / RZ_SARC * .96;   // os discos Z quase preenchem o cilindro
  for (let i = 0; i < n; i++) {
    const s = sarcomero({ simples: true }); s.scale.setScalar(sc);
    s.position.x = -L / 2 + (i + .5) * SARC.len; aberto.add(s);
  }
  g.userData.foco = V(0, 0, .2);
  return g;
}

/* ============================================================ 05 SARCÔMERO */
const SCM = { A: 1.6, actina: 1.0, bare: .16, espac: .28 };
function redeHexagonal() {
  const s = SCM.espac, mio = [], act = []; const dirs = [0, 60, 120, 180, 240, 300].map(d => d * Math.PI / 180);
  const cand = [[0, 0]]; dirs.forEach(a => cand.push([Math.cos(a) * s, Math.sin(a) * s]));
  cand.forEach(c => mio.push(c));
  const h = s / Math.sqrt(3);
  mio.forEach(([y, z]) => { for (let k = 0; k < 6; k++) { const a = Math.PI / 6 + k * Math.PI / 3; const p = [y + Math.cos(a) * h, z + Math.sin(a) * h]; if (!act.some(q => Math.hypot(q[0] - p[0], q[1] - p[1]) < .01) && Math.hypot(p[0], p[1]) < s * 1.25) act.push(p); } });
  return { mio, act };
}
function sarcomero({ simples = false } = {}) {
  const g = new THREE.Group(); const { mio, act } = redeHexagonal();
  const L0 = SARC.len; const zL = new THREE.Group(), zR = new THREE.Group(); g.add(zL, zR);
  g.userData = { zL, zR, comprimento: L0, titinas: [] };
  const rZ = RZ_SARC;

  /* discos Z (rede de α-actinina) — cada grupo Z carrega as actinas nele ancoradas */
  for (const [grp, s] of [[zL, -1], [zR, 1]]) {
    grp.add(disco(rZ, .045, M.zdisc, 48));
    const aro = new THREE.Mesh(new THREE.TorusGeometry(rZ, .02, 8, 48), M.zaro); aro.rotation.y = Math.PI / 2; grp.add(aro);
    const troponinas = [];
    act.forEach(([y, z], i) => {
      const a = V(0, y, z), b = V(-s * SCM.actina, y, z);
      if (simples) { grp.add(capsula(a, b, .022, M.actina, 8)); return; }
      grp.add(helice(a, b, .018, 2.6, .0145, M.actina, i * .7, 80));
      grp.add(helice(a, b, .018, 2.6, .0145, M.actina, i * .7 + Math.PI, 80));
      grp.add(helice(a, b, .029, 2.6, .006, M.tropomiosina, i * .7 + Math.PI / 2, 80));
      // troponina: uma conta a cada meia volta da tropomiosina
      for (let k = 0; k < 6; k++) {
        const t = (k + .5) / 6, ang = i * .7 + Math.PI / 2 + t * 2.6 * Math.PI * 2;
        const geo = new THREE.SphereGeometry(.017, 8, 6);
        geo.translate(-s * SCM.actina * t, y + Math.cos(ang) * .029, z + Math.sin(ang) * .029);
        troponinas.push(geo);
      }
    });
    if (troponinas.length) grp.add(new THREE.Mesh(mergeGeometries(troponinas), M.troponina));
    grp.position.x = s * L0 / 2;
  }

  /* miosina: haste, zona nua no centro e cabeças (S1 + braço S2) viradas para o Z */
  const cabecas = [];
  mio.forEach(([y, z], i) => {
    const m = xCil(.042, .042, SCM.A, M.miosina, 16); m.position.set(0, y, z); g.add(m);
    if (!simples) for (const s of [-1, 1]) for (let k = 0; k < 15; k++) {
      const x = s * (SCM.bare / 2 + .05 + k * ((SCM.A - SCM.bare) / 2 - .09) / 14), ang = i * .9 + k * 1.2;
      const radial = V(0, Math.cos(ang), Math.sin(ang));
      const base = V(x, y, z).addScaledVector(radial, .042);
      const cotovelo = V(x + s * .045, y, z).addScaledVector(radial, .105);
      const ponta = V(x + s * .105, y, z).addScaledVector(radial, .135);
      for (const [p1, p2, r] of [[base, cotovelo, .012], [cotovelo, ponta, .017]]) {
        const d = V().subVectors(p2, p1);
        const geo = new THREE.CapsuleGeometry(r, Math.max(.001, d.length() - 2 * r), 3, 7);
        geo.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), d.clone().normalize()));
        geo.translate((p1.x + p2.x) / 2, (p1.y + p2.y) / 2, (p1.z + p2.z) / 2);
        cabecas.push(geo);
      }
      const cab = new THREE.SphereGeometry(.024, 8, 6); cab.scale(1.5, 1, 1);
      cab.translate(ponta.x, ponta.y, ponta.z); cabecas.push(cab);
    }
  });
  if (cabecas.length) g.add(new THREE.Mesh(mergeGeometries(cabecas), M.cabeca));

  /* linha M: disco fino no centro e pontes ligando a miosina do meio às seis de fora */
  g.add(disco(SCM.espac * 1.30, .028, M.mlinha, 32));
  if (!simples) {
    const pontes = [];
    mio.slice(1).forEach(([y, z]) => {
      const d = Math.hypot(y, z);
      const geo = new THREE.CylinderGeometry(.010, .010, d, 6);
      geo.translate(0, d / 2, 0);
      geo.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), V(0, y, z).normalize()));
      pontes.push(geo);
    });
    g.add(new THREE.Mesh(mergeGeometries(pontes), M.mponte));
  }

  /* titina: mola do disco Z até a ponta da miosina, e presa à haste até a linha M */
  if (!simples) mio.forEach(([y, z], i) => {
    for (const s of [-1, 1]) {
      const grp = new THREE.Group(); const molaLen = L0 / 2 - SCM.A / 2;
      const mola = helice(V(0, 0, 0), V(1, 0, 0), .038, 9, .0085, M.titina, i); mola.scale.x = molaLen; grp.add(mola);
      grp.position.set(s * SCM.A / 2, y + .05, z); grp.rotation.y = s > 0 ? 0 : Math.PI; g.add(grp);
      g.userData.titinas.push({ grp, mola, s });
      const presa = xCil(.008, .008, SCM.A / 2, M.titina, 6); presa.position.set(s * SCM.A / 4, y + .05, z); g.add(presa);
    }
  });
  g.userData.foco = V(0, 0, 0);
  return g;
}
/* contração: move os discos Z (com suas actinas) e estica/encolhe as molas de titina */
function aplicarComprimento(s, L) {
  s.userData.comprimento = L; s.userData.zL.position.x = -L / 2; s.userData.zR.position.x = L / 2;
  const molaLen = Math.max(.02, L / 2 - SCM.A / 2); s.userData.titinas.forEach(t => { t.mola.scale.x = molaLen; });
}

return { modelos: [musculo(), fasciculo(), fibra(), miofibrila(), sarcomero()], aplicarComprimento, SARC, SCM, M };
}

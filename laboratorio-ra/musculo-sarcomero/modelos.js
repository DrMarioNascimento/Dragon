/* modelos.js — texturas, materiais e os cinco níveis (código puro, sem DOM).
   Recebe uma fábrica de textura para funcionar tanto no navegador (CanvasTexture)
   quanto em renderização headless (DataTexture) usada nos testes visuais. */
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export function criar(canvasTex) {
/* ------------------------------------------------------------ texturas em canvas */
/* Um sarcômero de 2,4 µm em proporção: Z 0,05 | I ½ 0,375 | A 1,6 (H 0,3 no centro, M 0,04) | I ½ 0,375. */
const SARC = { Z: .05, Ihalf: .375, A: 1.6, H: .3, M: .04, len: 2.4 };
function estriacao(cores, repeat) {
  return canvasTex(1024, 64, (g, w, h) => {
    const u = w / SARC.len; let x = 0;
    const band = (larg, cor) => { g.fillStyle = cor; g.fillRect(x, 0, larg * u + .8, h); x += larg * u; };
    band(SARC.Z, cores.Z); band(SARC.Ihalf, cores.I);
    const aIni = x; band((SARC.A - SARC.H) / 2, cores.A); band((SARC.H - SARC.M) / 2, cores.H); band(SARC.M, cores.M); band((SARC.H - SARC.M) / 2, cores.H); band((SARC.A - SARC.H) / 2, cores.A);
    band(SARC.Ihalf, cores.I);
    // ruído sutil de "grão"
    g.globalAlpha = .08; for (let i = 0; i < 1800; i++) { g.fillStyle = i % 2 ? '#000' : '#fff'; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
    g.globalAlpha = 1; void aIni;
  }, { repeatX: repeat });
}
const TEX = {
  fibra: estriacao({ Z: '#4a0f14', I: '#e08a80', A: '#a3303a', H: '#c04a52', M: '#6c161e' }, 9),
  miofibrila: estriacao({ Z: '#2d070b', I: '#eaa197', A: '#8f1f2a', H: '#b8414a', M: '#4e0e16' }, 5),
  fascia: canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = '#fbe9dc'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(160,110,90,.35)'; g.lineWidth = 1.2;
    for (let i = 0; i < 90; i++) { g.beginPath(); const y = Math.random() * h; g.moveTo(0, y); g.bezierCurveTo(w * .3, y + 40 * (Math.random() - .5), w * .7, y + 40 * (Math.random() - .5), w, y + 20 * (Math.random() - .5)); g.stroke(); }
  }, { repeatX: 3, repeatY: 2 }),
  musculoBump: canvasTex(1024, 512, (g, w, h) => {
    g.fillStyle = '#808080'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 26; i++) { const y = (i + .5) * h / 26; const grad = g.createLinearGradient(0, y - h / 52, 0, y + h / 52); grad.addColorStop(0, '#5a5a5a'); grad.addColorStop(.5, '#b0b0b0'); grad.addColorStop(1, '#5a5a5a'); g.fillStyle = grad; g.fillRect(0, y - h / 52, w, h / 26); }
    g.globalAlpha = .18; for (let i = 0; i < 3000; i++) { g.fillStyle = i % 2 ? '#000' : '#fff'; g.fillRect(Math.random() * w, Math.random() * h, 3, 1); }
  }, { repeatX: 2, repeatY: 1 }),
  zDisc: canvasTex(256, 256, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.strokeStyle = '#f2e4cc'; g.lineWidth = 6;
    const s = 32; for (let y = 0; y <= h; y += s) for (let x = 0; x <= w; x += s) { g.beginPath(); g.moveTo(x, y); g.lineTo(x + s / 2, y + s / 2); g.lineTo(x + s, y); g.lineTo(x + s / 2, y - s / 2); g.closePath(); g.stroke(); }
  }, { repeatX: 3, repeatY: 3 }),
};
TEX.musculoBump.colorSpace = THREE.NoColorSpace; TEX.zDisc.colorSpace = THREE.SRGBColorSpace;

/* ------------------------------------------------------------ materiais */
const phys = o => new THREE.MeshPhysicalMaterial(Object.assign({ roughness: .45, metalness: 0 }, o));
const M = {
  musculo: phys({ color: 0xa8292f, roughness: .38, clearcoat: .55, clearcoatRoughness: .3, sheen: .6, sheenColor: 0xff8a70, bumpMap: TEX.musculoBump, bumpScale: .06 }),
  epimisio: phys({ color: 0xf7e5d6, roughness: .25, transmission: 0, transparent: true, opacity: .18, side: THREE.DoubleSide, clearcoat: 1 }),
  tendao: phys({ color: 0xece0c8, roughness: .6, sheen: .3, sheenColor: 0xffffff }),
  perimisio: phys({ color: 0xfbe9dc, map: TEX.fascia, transparent: true, opacity: .34, side: THREE.DoubleSide, roughness: .35, clearcoat: .6 }),
  fibra: phys({ color: 0xd66a63, map: TEX.fibra, roughness: .42, clearcoat: .3 }),
  fibra2: phys({ color: 0xe88274, map: TEX.fibra, roughness: .42, clearcoat: .3 }),
  capilar: phys({ color: 0xc41a2b, roughness: .3, clearcoat: .8 }),
  sarcolema: phys({ color: 0xf1c7bd, map: TEX.fibra, transparent: true, opacity: .42, side: THREE.DoubleSide, roughness: .3, clearcoat: .9 }),
  nucleo: phys({ color: 0x5b2a86, roughness: .35, clearcoat: .6 }),
  mitocondria: phys({ color: 0xe0993a, roughness: .5 }),
  miofibrila: phys({ color: 0xc8404a, map: TEX.miofibrila, roughness: .4 }),
  miofibrilaCorte: phys({ color: 0xc8404a, map: TEX.miofibrila, roughness: .4, side: THREE.DoubleSide }),
  actina: phys({ color: 0xe8c65a, roughness: .35, clearcoat: .4 }),
  tropomiosina: phys({ color: 0xf2e2a0, roughness: .4 }),
  miosina: phys({ color: 0x5c9fc7, roughness: .35, clearcoat: .5 }),
  cabeca: phys({ color: 0x3f7fb0, roughness: .3, clearcoat: .7 }),
  zdisc: phys({ color: 0xf2e4cc, map: TEX.zDisc, transparent: true, alphaTest: .3, side: THREE.DoubleSide, roughness: .5 }),
  mlinha: phys({ color: 0xc9b58f, transparent: true, opacity: .55, side: THREE.DoubleSide }),
  titina: phys({ color: 0x8dd6a0, roughness: .4, clearcoat: .3 }),
};

/* ------------------------------------------------------------ utilidades geométricas */
const V = (x, y, z) => new THREE.Vector3(x, y, z);
function capsula(a, b, r, mat, rad = 18) {
  const d = V().subVectors(b, a), len = d.length();
  const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, Math.max(.001, len - 2 * r), 6, rad), mat);
  m.position.copy(a).add(b).multiplyScalar(.5); m.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize()); return m;
}
function tuboOndulado(a, b, r, mat, amp = .03, segs = 60, rad = 10) {
  const pts = []; for (let i = 0; i <= 6; i++) { const t = i / 6; pts.push(V().lerpVectors(a, b, t).add(V(0, (Math.random() - .5) * amp, (Math.random() - .5) * amp))); }
  const curva = new THREE.CatmullRomCurve3(pts); const m = new THREE.Mesh(new THREE.TubeGeometry(curva, segs, r, rad, false), mat); m.userData.curva = curva; return m;
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

/* ============================================================ 01 MÚSCULO */
function musculo() {
  const g = new THREE.Group();
  // ventre fusiforme por revolução, com lóbulos (fascículos) e leve achatamento
  const perfil = []; const L = 2.6, R = .92;
  for (let i = 0; i <= 48; i++) { const t = -1 + 2 * i / 48; perfil.push(new THREE.Vector2(.22 + (R - .22) * Math.pow(Math.max(0, 1 - t * t), .5), t * L)); }
  const geo = new THREE.LatheGeometry(perfil, 96); const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), y = p.getY(i); const th = Math.atan2(z, x), r = Math.hypot(x, z); const borda = Math.max(0, 1 - Math.abs(y) / L); const lob = 1 + borda * (.035 * Math.cos(th * 11 + y * .6) + .012 * Math.cos(th * 29)); p.setX(i, x * lob); p.setZ(i, z * lob * .8); }
  geo.computeVertexNormals();
  const ventre = new THREE.Mesh(geo, M.musculo); ventre.rotation.z = Math.PI / 2; g.add(ventre);
  const epi = new THREE.Mesh(geo.clone().scale(1.03, 1.005, 1.03), M.epimisio); epi.rotation.z = Math.PI / 2; g.add(epi);
  // tendões achatados, com origem e inserção
  for (const s of [-1, 1]) {
    const t = new THREE.Mesh(new THREE.CylinderGeometry(.13, .24, 1.3, 32), M.tendao); t.scale.z = .5; t.rotation.z = s * Math.PI / 2; t.position.x = s * 2.85; g.add(t);
    const osso = new THREE.Mesh(new THREE.CapsuleGeometry(.2, .7, 6, 20), phys({ color: 0xf1ead8, roughness: .8 })); osso.position.x = s * 3.6; osso.rotation.z = s * .2; g.add(osso);
  }
  // fascículos superficiais (feixes visíveis sob o epimísio)
  const feixe = phys({ color: 0x8e2027, roughness: .45, clearcoat: .4 });
  const rs = t => (.22 + (R - .22) * Math.pow(Math.max(0, 1 - t * t), .5)) * 1.012;
  for (let i = 0; i < 30; i++) { const ang = i * (Math.PI * 2 / 30) + .1; const pts = []; for (let k = -9; k <= 9; k++) { const t = k / 10; pts.push(V(t * L, Math.sin(ang) * rs(t), Math.cos(ang) * rs(t) * .8)); } g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 90, .028, 8, false), feixe)); }
  g.userData.foco = V(.3, .7, .55);
  return g;
}

/* ============================================================ 02 FASCÍCULO */
function fasciculo() {
  const g = new THREE.Group(); const fibras = new THREE.Group(); g.add(fibras);
  const N = 46, Rb = .82; const centros = [];
  for (let i = 0; i < N; i++) { const a = i * 2.399963, r = Rb * Math.sqrt((i + .5) / N); centros.push([Math.cos(a) * r, Math.sin(a) * r]); }
  centros.forEach(([y, z], i) => { const m = tuboOndulado(V(-2.55 - Math.random() * .25, y, z), V(2.3 + Math.random() * .3, y, z), .105, i % 4 ? M.fibra : M.fibra2, .05, 70, 12); fibras.add(m); });
  // extremidades cortadas (tampas planas nas fibras que saem do perimísio)
  centros.forEach(([y, z]) => { const cap = disco(.105, .01, M.fibra, 12); cap.position.set(2.45, y, z); fibras.add(cap); });
  // perimísio: bainha translúcida mais curta à direita (corte) — exibe as fibras saindo
  const bainha = xCil(.98, .98, 4.3, M.perimisio, 64, true); bainha.position.x = -.35; g.add(bainha);
  const anel = new THREE.Mesh(new THREE.TorusGeometry(.98, .02, 8, 64), M.perimisio); anel.rotation.y = Math.PI / 2; anel.position.x = 1.8; g.add(anel);
  // capilares serpenteando entre as fibras
  for (let k = 0; k < 6; k++) { const a = k * 1.05, r = .55 + .3 * (k % 2); const pts = []; for (let i = 0; i <= 8; i++) { const t = -2.4 + i * .6; pts.push(V(t, Math.cos(a + i * .35) * r, Math.sin(a + i * .35) * r)); } g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 90, .016, 6, false), M.capilar)); }
  g.userData.foco = V(2.3, .25, .3);
  return g;
}

/* ============================================================ 03 FIBRA MUSCULAR */
function fibra() {
  const g = new THREE.Group(); const R = .78, L = 5.2;
  // miofibrilas empacotadas (hexagonal), levemente mais longas que a célula à direita = corte
  const N = 61; const pos = [];
  for (let i = 0; i < N; i++) { const a = i * 2.399963, r = .62 * Math.sqrt((i + .5) / N); pos.push([Math.cos(a) * r, Math.sin(a) * r]); }
  const mfGeo = []; pos.forEach(([y, z]) => { const geo = new THREE.CylinderGeometry(.062, .062, L + .3, 10); geo.rotateZ(Math.PI / 2); geo.translate(.15, y, z); mfGeo.push(geo); });
  g.add(new THREE.Mesh(mergeGeometries(mfGeo), M.miofibrila));
  // mitocôndrias entre miofibrilas, perto da periferia
  const mitGeo = []; for (let i = 0; i < 70; i++) { const a = Math.random() * Math.PI * 2, r = .5 + Math.random() * .16; const geo = new THREE.CapsuleGeometry(.03, .09, 4, 8); geo.rotateZ(Math.PI / 2); geo.translate(-2.3 + Math.random() * 4.6, Math.cos(a) * r, Math.sin(a) * r); mitGeo.push(geo); }
  g.add(new THREE.Mesh(mergeGeometries(mitGeo), M.mitocondria));
  // núcleos periféricos, achatados, logo sob o sarcolema
  const nucGeo = []; for (let i = 0; i < 18; i++) { const a = i * 2.1 + Math.random() * .4, x = -2.4 + (i / 18) * 4.8; const geo = new THREE.SphereGeometry(.13, 16, 12); geo.scale(1.9, .55, 1); geo.rotateX(-a); geo.translate(x, Math.cos(a) * (R - .07), Math.sin(a) * (R - .07)); nucGeo.push(geo); }
  g.add(new THREE.Mesh(mergeGeometries(nucGeo), M.nucleo));
  // sarcolema: membrana translúcida com estriação visível
  const sarc = xCil(R, R, L, M.sarcolema, 64, true); g.add(sarc);
  const tampa = disco(R, .012, M.sarcolema, 64); tampa.position.x = -L / 2; g.add(tampa);
  // corte transversal à direita: anel + miofibrilas aparecendo
  const borda = new THREE.Mesh(new THREE.TorusGeometry(R, .018, 8, 64), phys({ color: 0xf5d6cc, roughness: .4 })); borda.rotation.y = Math.PI / 2; borda.position.x = L / 2; g.add(borda);
  g.userData.foco = V(2.6, .1, .1);
  return g;
}

/* ============================================================ 04 MIOFIBRILA */
function miofibrila() {
  const g = new THREE.Group(); const R = .5, n = 4, L = n * SARC.len; g.scale.setScalar(.72);
  // metade traseira fechada em toda a extensão; metade da frente aberta no trecho central (corte longitudinal)
  const fundo = xCil(R, R, L, M.miofibrilaCorte, 64, true, Math.PI); fundo.rotation.set(0, 0, Math.PI / 2); fundo.rotateY(Math.PI); g.add(fundo);
  const esq = xCil(R, R, L * .32, M.miofibrilaCorte, 64, true, Math.PI); esq.rotation.set(0, 0, Math.PI / 2); esq.position.x = -L * .34; g.add(esq);
  const dir = esq.clone(); dir.position.x = L * .34; g.add(dir);
  for (const s of [-1, 1]) { const t = disco(R, .02, M.miofibrila); t.position.x = s * L / 2; g.add(t); }
  // discos Z visíveis como anéis
  for (let i = 0; i <= n; i++) { const z = new THREE.Mesh(new THREE.TorusGeometry(R + .005, .02, 8, 64), phys({ color: 0x2d070b })); z.rotation.y = Math.PI / 2; z.position.x = -L / 2 + i * SARC.len; g.add(z); }
  // filamentos no trecho aberto: 2 sarcômeros centrais, em miniatura
  const aberto = new THREE.Group(); aberto.position.x = 0; g.add(aberto);
  const sc = R / .5; // os discos Z preenchem o cilindro
  for (let k = -1; k <= 0; k++) { const s = sarcomero({ simples: true }); s.scale.setScalar(sc); s.position.x = (k + .5) * SARC.len; aberto.add(s); }
  g.userData.foco = V(0, 0, .2);
  return g;
}

/* ============================================================ 05 SARCÔMERO */
const SCM = { A: 1.6, actina: 1.0, bare: .16, espac: .28 }; // µm: banda A 1,6; actina 1,0 de cada Z; zona nua da miosina 0,16
function redeHexagonal() {
  // miosinas em rede hexagonal; actinas nos centros dos triângulos (cada miosina com 6 actinas, razão 2:1)
  const s = SCM.espac, mio = [], act = []; const dirs = [0, 60, 120, 180, 240, 300].map(d => d * Math.PI / 180);
  const cand = [[0, 0]]; dirs.forEach(a => cand.push([Math.cos(a) * s, Math.sin(a) * s]));
  cand.forEach(c => mio.push(c));
  const h = s / Math.sqrt(3); mio.forEach(([y, z]) => { for (let k = 0; k < 6; k++) { const a = Math.PI / 6 + k * Math.PI / 3; const p = [y + Math.cos(a) * h, z + Math.sin(a) * h]; if (!act.some(q => Math.hypot(q[0] - p[0], q[1] - p[1]) < .01) && Math.hypot(p[0], p[1]) < s * 1.25) act.push(p); } });
  return { mio, act };
}
function sarcomero({ simples = false } = {}) {
  const g = new THREE.Group(); const { mio, act } = redeHexagonal();
  const L0 = SARC.len; const zL = new THREE.Group(), zR = new THREE.Group(); g.add(zL, zR);
  g.userData = { zL, zR, comprimento: L0, titinas: [] };
  const rZ = .5;
  // discos Z (rede) — o grupo Z carrega as actinas ancoradas nele
  for (const [grp, s] of [[zL, -1], [zR, 1]]) {
    const d = disco(rZ, .04, M.zdisc, 48); grp.add(d);
    const aro = new THREE.Mesh(new THREE.TorusGeometry(rZ, .018, 8, 48), phys({ color: 0xf2e4cc })); aro.rotation.y = Math.PI / 2; grp.add(aro);
    act.forEach(([y, z], i) => {
      const a = V(0, y, z), b = V(-s * SCM.actina, y, z);
      if (simples) { grp.add(capsula(a, b, .022, M.actina, 8)); }
      else { grp.add(helice(a, b, .018, 2.6, .014, M.actina, i * .7, 70)); grp.add(helice(a, b, .018, 2.6, .014, M.actina, i * .7 + Math.PI, 70)); grp.add(helice(a, b, .028, 2.6, .006, M.tropomiosina, i * .7 + Math.PI / 2, 70)); }
    });
    grp.position.x = s * L0 / 2;
  }
  // miosina: haste + cabeças em espiral apontando para os discos Z (polaridade oposta nas duas metades), zona nua no centro
  const cabecas = [];
  mio.forEach(([y, z], i) => {
    const m = xCil(.045, .045, SCM.A, M.miosina, 14); m.position.set(0, y, z); g.add(m);
    if (!simples) for (const s of [-1, 1]) for (let k = 0; k < 16; k++) {
      const x = s * (SCM.bare / 2 + .06 + k * ((SCM.A - SCM.bare) / 2 - .1) / 15), ang = i * .9 + k * 1.2;
      const base = V(x, y + Math.cos(ang) * .045, z + Math.sin(ang) * .045);
      const braco = V(x + s * .05, y + Math.cos(ang) * .12, z + Math.sin(ang) * .12);
      const geo = new THREE.CapsuleGeometry(.014, .06, 3, 6); const q = new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), V().subVectors(braco, base).normalize());
      geo.applyQuaternion(q); geo.translate((base.x + braco.x) / 2, (base.y + braco.y) / 2, (base.z + braco.z) / 2); cabecas.push(geo);
      const cab = new THREE.SphereGeometry(.024, 8, 6); cab.translate(braco.x, braco.y, braco.z); cabecas.push(cab);
    }
  });
  if (cabecas.length) g.add(new THREE.Mesh(mergeGeometries(cabecas), M.cabeca));
  // linha M: disco fino no centro + pontes entre miosinas
  const mDisc = disco(SCM.espac * 1.35, .03, M.mlinha, 32); g.add(mDisc);
  // titina: mola do disco Z até a ponta da miosina (banda I), depois presa à miosina até a linha M
  if (!simples) mio.forEach(([y, z], i) => {
    for (const s of [-1, 1]) {
      const grp = new THREE.Group(); const molaLen = L0 / 2 - SCM.A / 2; // trecho elástico
      const mola = helice(V(0, 0, 0), V(1, 0, 0), .04, 9, .008, M.titina, i); mola.scale.x = molaLen; grp.add(mola); // escala em x = comprimento da mola
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

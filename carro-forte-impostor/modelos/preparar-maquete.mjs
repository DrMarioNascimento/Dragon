// Uso: node preparar-maquete.mjs <glb-do-designer> <pasta-de-saida>  (npm i @gltf-transform/core@4 @gltf-transform/functions@4 @gltf-transform/extensions@4 gl-matrix@3)
// Prepara a maquete da Agência 0688 para o jogo:
//  - base: sem spoilers, sem luzes da noite, peças juntadas por sala+material
//  - itens: arquivos à parte, no MESMO referencial da base
import {NodeIO, getBounds} from '@gltf-transform/core';
import {ALL_EXTENSIONS, KHRLightsPunctual} from '@gltf-transform/extensions';
import {prune, dedup, joinPrimitives, transformPrimitive} from '@gltf-transform/functions';
import {mat4} from 'gl-matrix';

const [,, SRC, OUT] = process.argv;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);

const SPOILERS = ['passagem-de-servico', 'malote-vazio-ML-8842', 'lacre-rompido', 'campos-de-visao', 'luzes-da-noite'];
const ETIQ_FORA = ['etiqueta-12', 'etiqueta-19', 'etiqueta-20', 'etiqueta-21', 'etiqueta-22', 'etiqueta-23', 'etiqueta-24', 'etiqueta-25'];
const ITENS = {
  'item-malote': ['malote-vazio-ML-8842', 'lacre-rompido'],
  'item-passagem': ['passagem-de-servico', 'etiqueta-12'],
  'item-campos': ['campos-de-visao']
};

function under(n, names) { for (let p = n; p; p = p.getParentNode()) if (names.includes(p.getName())) return true; return false; }
function ancestors(n) { const a = []; for (let p = n; p; p = p.getParentNode()) a.push(p); return a; }

function cloneDeep(prim) {
  const c = prim.clone();
  for (const s of c.listSemantics()) c.setAttribute(s, c.getAttribute(s).clone());
  if (c.getIndices()) c.setIndices(c.getIndices().clone());
  for (const t of c.listTargets()) c.removeTarget(t);
  return c;
}

/* units(node) decide quais nós viram "peças tocáveis"; o resto vai para a
   unidade mais próxima acima. */
function juntar(doc, isUnit, nomeRaiz) {
  const root = doc.getRoot(), scene = root.listScenes()[0], buf = root.listBuffers()[0];
  const naCena = new Set(); for (const c of scene.listChildren()) for (const d of descend(c)) naCena.add(d);
  const meshNodes = root.listNodes().filter(n => n.getMesh() && naCena.has(n));
  const grupos = new Map(); // unit -> Map(sig -> prims[])
  for (const n of meshNodes) {
    const unit = ancestors(n).find(isUnit);
    if (!unit) continue;
    const inv = mat4.invert(mat4.create(), unit.getWorldMatrix());
    const M = mat4.multiply(mat4.create(), inv, n.getWorldMatrix());
    for (const p of n.getMesh().listPrimitives()) {
      const c = cloneDeep(p);
      transformPrimitive(c, M);
      if (!c.getIndices()) { // garante índices
        const cnt = c.getAttribute('POSITION').getCount();
        const arr = cnt > 65535 ? new Uint32Array(cnt) : new Uint16Array(cnt);
        for (let i = 0; i < cnt; i++) arr[i] = i;
        c.setIndices(doc.createAccessor().setType('SCALAR').setArray(arr).setBuffer(buf));
      }
      const sig = [c.getMaterial() ? c.getMaterial().getName() + '#' + root.listMaterials().indexOf(c.getMaterial()) : 'none', c.getMode(), c.listSemantics().sort().join(',')].join('|');
      if (!grupos.has(unit)) grupos.set(unit, new Map());
      const g = grupos.get(unit); if (!g.has(sig)) g.set(sig, []); g.get(sig).push(c);
    }
  }
  const raiz = doc.createNode(nomeRaiz);
  for (const [unit, g] of grupos) {
    const u = doc.createNode(unit.getName()).setMatrix(unit.getWorldMatrix());
    const ex = unit.getExtras() || {}; const ex2 = {};
    if (ex.n && ex.n <= 18) { ex2.n = ex.n; ex2.sala = ex.sala; }
    if (/^etiqueta-/.test(unit.getName()) && ex.sala) ex2.sala = ex.sala;
    if (ex.semSombra) ex2.semSombra = true;
    u.setExtras(ex2);
    const mesh = doc.createMesh(unit.getName());
    for (const [, prims] of g) {
      // junta em lotes para não estourar índice de 16 bits sem necessidade
      const j = prims.length > 1 ? joinPrimitives(prims) : prims[0];
      mesh.addPrimitive(j);
    }
    u.setMesh(mesh);
    raiz.addChild(u);
  }
  for (const c of scene.listChildren()) scene.removeChild(c);
  scene.addChild(raiz);
  for (const n of root.listNodes()) if (n !== raiz && !raiz.listChildren().includes(n)) n.dispose();
}

async function base() {
  const doc = await io.read(SRC);
  const root = doc.getRoot();
  // tira spoilers, luzes e etiquetas fora do jogo
  for (const n of root.listNodes()) if (SPOILERS.includes(n.getName()) || ETIQ_FORA.includes(n.getName())) { for (const d of descend(n)) d.dispose(); }
  // parede maciça onde corre o que só o Cap. 4 revela
  const parede = root.listMaterials().find(m => m.getName() === 'parede');
  const macico = doc.createNode('macico');
  const blocos = [[-10.2, -5.2, -6.5, -5.48], [-10.2, -9.48, -5.48, -1.8], [-10.2, -4.5, -1.8, -1.08]];
  const ag = root.listNodes().find(n => n.getName() === 'agencia-0688-maquete');
  for (const [x1, x2, z1, z2] of blocos) macico.addChild(doc.createNode('bloco').setMesh(doc.createMesh().addPrimitive(caixa(doc, x1, x2, 0.42, 4.02, z1, z2, parede))));
  ag.addChild(macico);
  /* peças que mudam de estado no Cap. 4: separadas, com nome neutro */
  for (const n of root.listNodes()) { if (n.getName() === 'rack-fundo-removivel') n.setName('rack-fundo'); if (n.getName() === 'painel-de-madeira') n.setName('painel'); }
  const UNIDADES_FIXAS = ['piso-2', 'telhado', 'macico', 'base-da-maquete', 'vizinhanca', 'agencia', 'etiquetas', 'rack-fundo', 'painel'];
  const isUnit = n => {
    const nm = n.getName(), ex = n.getExtras() || {};
    if (/^etiqueta-\d+$/.test(nm)) return true;
    if (ex.n && !under(n.getParentNode(), ['piso-2', 'telhado'])) return true;
    return UNIDADES_FIXAS.includes(nm);
  };
  juntar(doc, isUnit, 'agencia-0688');
  try { doc.createExtension(KHRLightsPunctual).dispose(); } catch (e) {}
  await doc.transform(prune(), dedup());
  await io.write(OUT + '/agencia-0688-base.glb', doc);
  console.log('base ok', root.listMeshes().reduce((a, m) => a + m.listPrimitives().length, 0), 'primitivas');
}

async function item(nome, alvos) {
  const doc = await io.read(SRC);
  const root = doc.getRoot();
  const keep = new Set();
  for (const n of root.listNodes()) if (alvos.includes(n.getName())) for (const d of descend(n)) keep.add(d);
  for (const n of root.listNodes()) if (n.getMesh() && !keep.has(n)) n.setMesh(null);
  for (const n of root.listNodes()) if (n.getExtension('KHR_lights_punctual')) n.dispose();
  const isUnit = n => alvos.includes(n.getName());
  juntar(doc, isUnit, nome);
  try { doc.createExtension(KHRLightsPunctual).dispose(); } catch (e) {}
  await doc.transform(prune(), dedup());
  await io.write(OUT + '/' + nome + '.glb', doc);
  console.log(nome, 'ok', root.listMeshes().reduce((a, m) => a + m.listPrimitives().length, 0), 'primitivas');
}

function descend(n) { const a = [n]; for (const c of n.listChildren()) a.push(...descend(c)); return a; }

function caixa(doc, x1, x2, y1, y2, z1, z2, mat) {
  const P = [], N = [], I = [];
  const faces = [
    [[x2, y1, z1], [x2, y2, z1], [x2, y2, z2], [x2, y1, z2], [1, 0, 0]],
    [[x1, y1, z2], [x1, y2, z2], [x1, y2, z1], [x1, y1, z1], [-1, 0, 0]],
    [[x1, y2, z1], [x1, y2, z2], [x2, y2, z2], [x2, y2, z1], [0, 1, 0]],
    [[x1, y1, z2], [x1, y1, z1], [x2, y1, z1], [x2, y1, z2], [0, -1, 0]],
    [[x1, y1, z2], [x2, y1, z2], [x2, y2, z2], [x1, y2, z2], [0, 0, 1]],
    [[x2, y1, z1], [x1, y1, z1], [x1, y2, z1], [x2, y2, z1], [0, 0, -1]]];
  for (const f of faces) { const b = P.length / 3; for (let i = 0; i < 4; i++) { P.push(...f[i]); N.push(...f[4]); } I.push(b, b + 1, b + 2, b, b + 2, b + 3); }
  const buf = doc.getRoot().listBuffers()[0];
  const prim = doc.createPrimitive()
    .setAttribute('POSITION', doc.createAccessor().setType('VEC3').setArray(new Float32Array(P)).setBuffer(buf))
    .setAttribute('NORMAL', doc.createAccessor().setType('VEC3').setArray(new Float32Array(N)).setBuffer(buf))
    .setIndices(doc.createAccessor().setType('SCALAR').setArray(new Uint16Array(I)).setBuffer(buf))
    .setMaterial(mat);
  return prim;
}

await base();
for (const [k, v] of Object.entries(ITENS)) await item(k, v);

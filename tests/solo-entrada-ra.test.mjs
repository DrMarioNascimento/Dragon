import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';

const ler = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');

test('checkpoint incompleto do Solo recomeça na Janela do Norte, não na escrivaninha', () => {
  const cloud = ler('solo/estado-solo.js');
  assert.doesNotMatch(cloud, /percursoEtapa==='janela'\?'janela':'escrivaninha'/,
    'o default "qualquer coisa → escrivaninha" voltou: snapshot antigo abre a mesa como 1ª atividade');
  assert.match(cloud, /intro&&!state\.percursoPronto/);
  assert.match(cloud, /state\.percursoEtapa="janela"/);
  assert.match(ler('solo/mesa-solo.js'), /abrirPercurso3D\(\)\{[\s\S]*percursoEtapa='janela'/);
  assert.match(ler('solo/mesa-solo.js'), /MOSAICO-26-a-janela-do-norte\.html\?embed=1/);
});

test('restaurar snapshot antigo em percurso3d não salta a janela', () => {
  const store = new Map();
  store.set('mosaico_solo_costa_cloud', JSON.stringify({
    phase: 'percurso3d', key: 'sete', percursoEtapa: 'escrivaninha', percursoPronto: false
  }));
  let tick;
  const ctx = createContext({
    state: {
      caso: { partidas: { sete: {} } }, phase: 'home', key: 'sete',
      percursoPronto: false, percursoResultado: null, percursoEtapa: 'janela',
      atividades: [], atividadeI: 0, sensorPronto: false, sensorTempos: [],
      i: 0, order: [0, 1, 2, 3], pick: null, seen: [], facts: {}, answers: {},
      scoreFacts: 0, correct: 0, mosaico: [], mosaicoPick: null,
      mercadoEtapa: 0, mercadoEscolhas: [], contraponto: null, pontuacao: null,
      resultadoVista: 'apuracao', apuracaoEtapa: 0
    },
    localStorage: { getItem: (k) => store.get(k) || null, setItem: (k, v) => store.set(k, v) },
    sessionStorage: { removeItem() {}, getItem() { return null; }, setItem() {} },
    document: { addEventListener() {} },
    parAtividades: () => ['salaEscura'],
    render() {},
    console,
    setInterval(fn) { tick = fn; return 1; }
  });
  ctx.window = ctx;
  ctx.addEventListener = () => {};
  runInContext(ler('solo/estado-solo.js'), ctx);
  assert.equal(typeof tick, 'function');
  tick();
  assert.equal(ctx.state.percursoEtapa, 'janela');
  assert.equal(ctx.state.phase, 'percurso3d');
  assert.equal(ctx.state.percursoPronto, false);
});

test('escrivaninha e maquete publicadas não expõem RA de ensaio', () => {
  const html = ler('v1/AC-escrivaninha.html');
  const maquete = ler('v1/AC-maquete.html');
  const percurso = ler('v1/AC-percurso.html');
  const desk = ler('v1/js/ac-investigacao.js');
  const maqueteJs = ler('v1/js/ac-maquete.js');
  for (const [nome, src] of [['escrivaninha', html], ['maquete', maquete], ['percurso', percurso]]) {
    assert.doesNotMatch(src, /ENSAIO EM DUPLA/, nome);
    assert.doesNotMatch(src, /Bônus experimental/, nome);
    assert.doesNotMatch(src, /Colocar em RA/, nome);
    assert.doesNotMatch(src, /Ver em RA/, nome);
    assert.doesNotMatch(src, /Explorar em RA/, nome);
    assert.doesNotMatch(src, /teste=sala3d/, nome);
    assert.doesNotMatch(src, /sem alterar a partida publicada/, nome);
    assert.doesNotMatch(src, /Criar novo ensaio/, nome);
    assert.doesNotMatch(src, /id="ar"/, nome);
    assert.doesNotMatch(src, /id="ar-ios"/, nome);
  }
  assert.doesNotMatch(html, /href="MOSAICO-mesa\.html\?teste=/);
  assert.doesNotMatch(maquete, /pontos de ensaio/);
  assert.doesNotMatch(maqueteJs, /pontos de ensaio/);
  assert.match(desk, /if\(ar\) ar\.hidden=true/);
  assert.match(maqueteJs, /if\(\$\('ar'\)\)\$\('ar'\)\.hidden=true/);
});

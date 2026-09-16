import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';

const ler = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const KEY = 'mosaico_solo_costa_cloud';

function estadoBase() {
  return {
    caso: { partidas: { sete: {} } }, phase: 'home', key: 'sete',
    percursoPronto: false, percursoResultado: null, percursoEtapa: 'janela',
    atividades: [], atividadeI: 0, sensorPronto: false, sensorTempos: [],
    i: 0, order: [0, 1, 2, 3], pick: null, seen: [], facts: {}, answers: {},
    scoreFacts: 0, correct: 0, mosaico: [], mosaicoPick: null,
    mercadoEtapa: 0, mercadoEscolhas: [], contraponto: null, pontuacao: null,
    resultadoVista: 'apuracao', apuracaoEtapa: 0
  };
}

function carregarPonte(store) {
  const listeners = {};
  let tick;
  const ctx = createContext({
    state: estadoBase(),
    localStorage: { getItem: (k) => store.get(k) || null, setItem: (k, v) => store.set(k, v) },
    sessionStorage: { removeItem() {}, getItem() { return null; }, setItem() {} },
    document: { addEventListener() {} },
    parAtividades: () => ['salaEscura'],
    render() {},
    console,
    setInterval(fn) { tick = fn; return 1; }
  });
  ctx.window = ctx;
  ctx.addEventListener = (type, fn) => {
    (listeners[type] || (listeners[type] = [])).push(fn);
  };
  runInContext(ler('solo/estado-solo.js'), ctx);
  return { ctx, tick, listeners };
}

test('checkpoint incompleto do Solo recomeça na Janela do Norte, não na escrivaninha', () => {
  const cloud = ler('solo/estado-solo.js');
  assert.doesNotMatch(cloud, /percursoEtapa==='janela'\?'janela':'escrivaninha'/,
    'o default "qualquer coisa → escrivaninha" voltou: snapshot antigo abre a mesa como 1ª atividade');
  assert.match(cloud, /chegouPelaJanela/);
  assert.match(cloud, /faseOrdenacaoFatos/);
  assert.match(cloud, /state\._partidaNova/);
  assert.match(cloud, /state\.percursoEtapa="janela"/);
  assert.match(cloud, /mosaico-cloud-ready/);
  assert.match(ler('solo/mesa-solo.js'), /abrirPercurso3D\(\)\{[\s\S]*percursoEtapa='janela'/);
  assert.match(ler('solo/mesa-solo.js'), /MOSAICO-26-a-janela-do-norte\.html\?embed=1/);
  assert.doesNotMatch(ler('solo/mesa-solo.js'), /PERCURSO 3D E RA/);
});

test('restaurar snapshot antigo em percurso3d não salta a janela', () => {
  const store = new Map();
  store.set(KEY, JSON.stringify({
    phase: 'percurso3d', key: 'sete', percursoEtapa: 'escrivaninha', percursoPronto: false
  }));
  const { ctx, tick } = carregarPonte(store);
  assert.equal(typeof tick, 'function');
  tick();
  assert.equal(ctx.state.percursoEtapa, 'janela');
  assert.equal(ctx.state.phase, 'percurso3d');
  assert.equal(ctx.state.percursoPronto, false);
});

test('storage vazio do Solo não abre a escrivaninha', () => {
  const { ctx } = carregarPonte(new Map());
  assert.equal(ctx.state.phase, 'home');
  assert.equal(ctx.state.percursoEtapa, 'janela');
  assert.equal(ctx.state.atividades.length, 0);
});

test('snapshot sem percursoEtapa recomeça na janela', () => {
  const store = new Map();
  store.set(KEY, JSON.stringify({ phase: 'percurso3d', key: 'sete', percursoPronto: false }));
  const { ctx } = carregarPonte(store);
  assert.equal(ctx.state.percursoEtapa, 'janela');
  assert.equal(ctx.state.phase, 'percurso3d');
});

test('snapshot na sala sem atividades não cai na escrivaninha', () => {
  const store = new Map();
  store.set(KEY, JSON.stringify({
    phase: 'sensor', key: 'sete', percursoEtapa: 'escrivaninha', percursoPronto: false
  }));
  const { ctx } = carregarPonte(store);
  assert.equal(ctx.state.percursoEtapa, 'janela');
  assert.equal(ctx.state.phase, 'percurso3d');
});

test('Firebase tardio com snapshot incompleto também recomeça na janela', () => {
  const store = new Map();
  const { ctx, listeners } = carregarPonte(store);
  assert.equal(ctx.state.phase, 'home');
  store.set(KEY, JSON.stringify({
    phase: 'percurso3d', key: 'sete', percursoEtapa: 'escrivaninha', percursoPronto: false
  }));
  const handlers = listeners['mosaico-cloud-ready'] || [];
  assert.ok(handlers.length, 'estado-solo deve ouvir mosaico-cloud-ready para o restore do Firebase');
  handlers.forEach((fn) => fn());
  assert.equal(ctx.state.percursoEtapa, 'janela');
  assert.equal(ctx.state.phase, 'percurso3d');
  assert.notEqual(ctx.state.percursoEtapa, 'escrivaninha');
});

test('checkpoint em mosaico/puzzle sem chegada pela Janela recomeça na Janela do Norte', () => {
  for (const phase of ['mosaico', 'puzzle', 'fact', 'mercado']) {
    const store = new Map();
    store.set(KEY, JSON.stringify({
      phase, key: 'sete', percursoPronto: false
    }));
    const { ctx } = carregarPonte(store);
    assert.equal(ctx.state.phase, 'percurso3d', phase);
    assert.equal(ctx.state.percursoEtapa, 'janela', phase);
  }
});

test('percursoPronto do caminho velho (escrivaninha primeiro) não abre a ordenação de fatos', () => {
  const store = new Map();
  store.set(KEY, JSON.stringify({
    phase: 'mosaico', key: 'sete', percursoPronto: true,
    atividades: ['janela', 'salaEscura']
  }));
  const { ctx } = carregarPonte(store);
  assert.equal(ctx.state.phase, 'percurso3d');
  assert.equal(ctx.state.percursoEtapa, 'janela');
  assert.equal(ctx.state.percursoPronto, false,
    'senão a Janela abre já concluída e o botão pula para o puzzle');
});

test('pós-abertura nunca retoma mosaico: mesmo percurso completo recomeça na Janela', () => {
  const store = new Map();
  store.set(KEY, JSON.stringify({
    phase: 'mosaico', key: 'sete', percursoPronto: true,
    percursoEtapa: 'escrivaninha', atividades: ['salaEscura'],
    mosaico: [{ id: 'F01' }]
  }));
  const { ctx } = carregarPonte(store);
  assert.equal(ctx.state.phase, 'percurso3d');
  assert.equal(ctx.state.percursoEtapa, 'janela');
  assert.equal(ctx.state.percursoPronto, false);
});

test('briefing salvo também recomeça na Janela, não no seletor de papéis', () => {
  const store = new Map();
  store.set(KEY, JSON.stringify({
    phase: 'briefing', key: 'sete', percursoPronto: false
  }));
  const { ctx } = carregarPonte(store);
  assert.equal(ctx.state.phase, 'percurso3d');
  assert.equal(ctx.state.percursoEtapa, 'janela');
});

test('Começar / Entrar na casa ignora snapshot da nuvem (não volta à ordenação)', () => {
  const store = new Map();
  store.set(KEY, JSON.stringify({
    phase: 'mosaico', key: 'sete', percursoPronto: true,
    percursoEtapa: 'escrivaninha', atividades: ['salaEscura']
  }));
  const { ctx, listeners } = carregarPonte(store);
  ctx.state._partidaNova = true;
  ctx.state.phase = 'percurso3d';
  ctx.state.percursoEtapa = 'janela';
  ctx.state.percursoPronto = false;
  const handlers = listeners['mosaico-cloud-ready'] || [];
  handlers.forEach((fn) => fn());
  assert.equal(ctx.state.phase, 'percurso3d');
  assert.equal(ctx.state.percursoEtapa, 'janela');
});

test('escrivaninha só retoma depois da sala ter sido aberta', () => {
  const store = new Map();
  store.set(KEY, JSON.stringify({
    phase: 'percurso3d', key: 'sete', percursoEtapa: 'escrivaninha',
    percursoPronto: false, atividades: ['salaEscura']
  }));
  const { ctx } = carregarPonte(store);
  assert.equal(ctx.state.percursoEtapa, 'escrivaninha');
  assert.equal(ctx.state.phase, 'percurso3d');
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
  assert.doesNotMatch(ler('v1/js/ac-percurso.js'), /Este ensaio foi aberto/);
  assert.match(desk, /if\(ar\) ar\.hidden=true/);
  assert.match(maqueteJs, /if\(\$\('ar'\)\)\$\('ar'\)\.hidden=true/);
  const sala = ler('v1/MOSAICO-26-a-sala-as-escuras.html');
  assert.doesNotMatch(sala, /id="b-ra"/);
  assert.doesNotMatch(sala, /id="b-entrar-ra"/);
  assert.doesNotMatch(sala, />Entrar em RA</);
  assert.doesNotMatch(sala, />Alternar visual</);
});

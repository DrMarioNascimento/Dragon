import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';
import { resolve } from 'node:path';
import { createServer } from '../ferramentas/ac-cooperacao.mjs';

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

test('Quick Look iOS: usdz real, só imagem no <a rel=ar>, MIME certo, iframe não baixa', async () => {
  const html = ler('v1/AC-escrivaninha.html');
  const desk = ler('v1/js/ac-investigacao.js');
  const helper = ler('v1/AC-ar-ios.html');
  const css = ler('v1/css/ac-janelas.css');
  const coop = ler('ferramentas/ac-cooperacao.mjs');
  assert.match(html, /id="ar-ios"[^>]*rel="ar"/);
  assert.match(html, /href="assets\/ac\/escrivaninha\.usdz"/);
  assert.match(html, /id="ar-ios"[^>]*>\s*<img /);
  assert.doesNotMatch(html, /id="ar-ios"[^>]*>Ver em RA</);
  assert.doesNotMatch(html, /\sdownload=/);
  assert.match(css, /#ar-ios>img/);
  assert.match(desk, /AC-ar-ios\.html/);
  assert.match(desk, /window\.top===window/);
  assert.match(helper, /rel="ar"/);
  assert.match(helper, /escrivaninha\.usdz/);
  assert.match(helper, /<img /);
  assert.match(coop, /\.usdz':'model\/vnd\.usdz\+zip'/);
  assert.equal(existsSync(new URL('../v1/assets/ac/escrivaninha.usdz', import.meta.url)), true);
  assert.equal(existsSync(new URL('../v1/assets/ac/escrivaninha-ar.png', import.meta.url)), true);

  const server = createServer(resolve('.'));
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const base = 'http://127.0.0.1:' + server.address().port;
  try {
    const r = await fetch(base + '/v1/assets/ac/escrivaninha.usdz', { method: 'HEAD' });
    assert.equal(r.status, 200);
    assert.match(r.headers.get('content-type') || '', /model\/vnd\.usdz\+zip/);
    const page = await fetch(base + '/v1/AC-ar-ios.html');
    assert.equal(page.status, 200);
  } finally {
    server.closeAllConnections();
    await new Promise((r) => server.close(r));
  }
});

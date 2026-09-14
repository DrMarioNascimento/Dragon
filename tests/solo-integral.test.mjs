import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const js=readFileSync(new URL('../solo/mesa-solo.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../solo/index.html',import.meta.url),'utf8');
const cloud=readFileSync(new URL('../solo/estado-solo.js',import.meta.url),'utf8');

test('Solo Casa preserva as etapas da experiência da Mesa',()=>{
  for(const fase of ['briefing','percurso3d','sensor','mosaico','mercado','relations','decision','result'])
    assert.ok(js.includes("'"+fase+"'"),fase);
  for(const tarefa of ['MOSAICO-26-a-janela-do-norte.html','MOSAICO-26-vidro-embacado.html','MOSAICO-26-a-sala-as-escuras.html'])
    assert.ok(js.includes(tarefa),tarefa);
  assert.match(js,/disabled.*sensorPronto|sensorPronto.*disabled/s);
  assert.match(js,/MERCADO DE PISTAS · AÇÃO 3 DE 3/);
  for(const categoria of ['Encenação','Jogador contra Jogador','Jogador com Jogador — Fragmentos','Mercado de pistas','Jogador contra o caso'])
    assert.ok(js.includes(categoria),categoria);
  assert.match(js,/APURAÇÃO FINAL/);
  assert.match(js,/PÓDIO · RESULTADO FINAL/);
  assert.match(js,/setTimeout/);
});

test('checkpoint e carimbo incluem o Solo integral',()=>{
  for(const campo of ['atividades','atividadeI','sensorPronto','sensorTempos','mosaico','mercadoEtapa','mercadoEscolhas','pontuacao','resultadoVista','apuracaoEtapa'])
    assert.ok(cloud.includes(campo),campo);
  assert.match(html,/solo-auto\.js\?v=20260914-reconstrucao-individual1/);
  assert.match(html,/solo-cloud-state\.js\?v=20260914-reconstrucao-individual1/);
});

test('percurso solo mantém 3D, RA, escrivaninha, vela, maquete e três chaves',()=>{
  const coop=readFileSync(new URL('../v1/js/ac-cooperacao.js',import.meta.url),'utf8');
  const desk=readFileSync(new URL('../v1/js/ac-investigacao.js',import.meta.url),'utf8');
  const maquete=readFileSync(new URL('../v1/js/ac-maquete.js',import.meta.url),'utf8');
  assert.match(js,/AC-escrivaninha\.html\?demo=solo/);
  assert.match(js,/xr-spatial-tracking/);
  for(const acao of ['posicionar','encaixar','descobrir','registrar','iniciar_maquete','maquete_orientar','maquete_examinar','maquete_mover','maquete_encaixar'])
    assert.ok(coop.includes(acao),acao);
  assert.match(desk,/MODO SOLO · PERCURSO COMPLETO/);
  assert.match(maquete,/ac-solo-completo/);
});

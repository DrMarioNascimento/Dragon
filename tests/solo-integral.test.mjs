import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const js=readFileSync(new URL('../solo/solo-auto.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../solo/index.html',import.meta.url),'utf8');
const cloud=readFileSync(new URL('../solo/solo-cloud-state.js',import.meta.url),'utf8');

test('Solo Casa preserva as etapas da experiência da Mesa',()=>{
  for(const fase of ['briefing','sensor','mosaico','cooperacao','mercado','relations','decision','result'])
    assert.ok(js.includes("'"+fase+"'"),fase);
  for(const tarefa of ['MOSAICO-26-a-janela-do-norte.html','MOSAICO-26-vidro-embacado.html','MOSAICO-26-a-sala-as-escuras.html'])
    assert.ok(js.includes(tarefa),tarefa);
  assert.match(js,/disabled.*sensorPronto|sensorPronto.*disabled/s);
  assert.match(js,/MERCADO DE PISTAS · AÇÃO 3 DE 3/);
});

test('checkpoint e carimbo incluem o Solo integral',()=>{
  for(const campo of ['atividades','atividadeI','sensorPronto','mosaico','mercadoEtapa','mercadoEscolhas','contraponto'])
    assert.ok(cloud.includes(campo),campo);
  assert.match(html,/solo-auto\.js\?v=20260914-solo-integral/);
  assert.match(html,/solo-cloud-state\.js\?v=20260914-solo-integral/);
});

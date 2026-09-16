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
  for(const categoria of ['Percurso individual','Investigações cronometradas','Mosaico e revisão crítica','Mercado de pistas','Decisão contra o caso'])
    assert.ok(js.includes(categoria),categoria);
  assert.match(js,/APURAÇÃO FINAL/);
  assert.match(js,/PÓDIO · RESULTADO FINAL/);
  assert.match(js,/setTimeout/);
  assert.match(js,/return \['salaEscura'\]/,
    'a etapa sensorial fixa do Solo deve ser A Sala às Escuras');
  assert.match(js,/1 \/ 4 · Chegada pela estrada/);
  assert.match(js,/2 \/ 4 · /);
  assert.match(js,/3 \/ 4 · Sob outra luz/);
  assert.match(js,/if\(ev\.data\.mosaico==='tarefa-ok'&&state\.percursoEtapa==='janela'\)[\s\S]*abrirAtividades\(\)/);
  assert.match(js,/if\(state\.percursoEtapa==='janela'\)\{state\.percursoEtapa='escrivaninha'/);
});

test('checkpoint e carimbo incluem o Solo integral',()=>{
  for(const campo of ['percursoEtapa','atividades','atividadeI','sensorPronto','sensorTempos','mosaico','mercadoEtapa','mercadoEscolhas','pontuacao','resultadoVista','apuracaoEtapa'])
    assert.ok(cloud.includes(campo),campo);
  assert.match(html,/mesa-solo\.js\?v=20260915-solo-flow2/);
  assert.match(html,/estado-solo\.js\?v=20260915-solo-flow2/);
});

test('percurso solo mantém 3D, RA, escrivaninha e maquete com três chaves',()=>{
  const coop=readFileSync(new URL('../v1/js/ac-cooperacao.js',import.meta.url),'utf8');
  const desk=readFileSync(new URL('../v1/js/ac-investigacao.js',import.meta.url),'utf8');
  const escrivaninha=readFileSync(new URL('../v1/AC-escrivaninha.html',import.meta.url),'utf8');
  const maquete=readFileSync(new URL('../v1/js/ac-maquete.js',import.meta.url),'utf8');
  assert.match(js,/MOSAICO-26-a-janela-do-norte\.html\?embed=1/);
  assert.match(js,/AC-escrivaninha\.html\?demo=solo/);
  assert.match(js,/xr-spatial-tracking/);
  for(const acao of ['posicionar','encaixar','descobrir','registrar','iniciar_maquete','maquete_orientar','maquete_examinar','maquete_mover','maquete_encaixar'])
    assert.ok(coop.includes(acao),acao);
  assert.match(desk,/MODO SOLO · PERCURSO COMPLETO/);
  assert.match(desk,/Procurar bilhete sob as gavetas/);
  assert.match(desk,/Ler e guardar bilhete/);
  assert.match(desk,/iniciar_maquete/);
  assert.match(desk,/location\.replace\('AC-maquete\.html'/);
  assert.match(maquete,/ac-solo-maquete-completa/);
  for(const cta of ['Ler orientação da chave','Encontrar chave','Confirmar encaixe da chave'])
    assert.ok(maquete.includes(cta),cta);
  assert.match(coop,/targetLabel/);
  assert.match(coop,/chave-exterior','chave-terreo','passagem-sob-despensa/);
  assert.match(escrivaninha, /id="ar-ios"/,
    'o controle Quick Look exigido por ac-investigacao deve existir para a inicialização não abortar');
});

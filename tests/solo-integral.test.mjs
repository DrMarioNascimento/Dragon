import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const js=readFileSync(new URL('../solo/mesa-solo.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../solo/index.html',import.meta.url),'utf8');
const cloud=readFileSync(new URL('../solo/estado-solo.js',import.meta.url),'utf8');

test('Solo Casa preserva as etapas da experiência da Mesa',()=>{
  for(const fase of ['marco','percurso3d','sensor','papeis','mosaico','mercado','map','decision','result'])
    assert.ok(js.includes("'"+fase+"'"),fase);
  /* O que só existia no Solo saiu (Mario, 18/09/2026): o quebra-cabeça de
     quatro peças numeradas, as dez perguntas de fato e as Relações. */
  for(const fora of ["'puzzle'","'fact'","'relations'",'function puzzle(','function fact(','function relations(','Toque em duas peças para trocar'])
    assert.ok(!js.includes(fora),'voltou ao Solo: '+fora);
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
  const startFn=js.slice(js.indexOf('function start()'),js.indexOf('function abrirAnalise()'));
  assert.doesNotMatch(startFn,/htmlAndaime|mostrarSeletor|phase='mosaico'/,
    'o seletor Guiada (ordem nos fatos) não pode nascer no Começar após a abertura');
  /* Começar → Encenação (tela-marco) → Votação (tela-marco) → Janela. */
  assert.match(startFn,/abrirMarco\('encenacao'\)/);
  assert.match(js,/encenacao:\{[^}]*depois:\(\)=>abrirMarco\('votacao'\)\}/);
  assert.match(js,/votacao:\{[^}]*depois:\(\)=>abrirPercurso3D\(\)\}/);
  assert.match(js,/Neste momento seria /);
  assert.match(js,/function abrirAnalise\(\)[\s\S]*mostrarSeletor/);
  assert.match(js,/abrirPercurso3D\(\)\{[\s\S]*state\._partidaNova=true/);
  assert.match(js,/fasesComHipoteses=\['map','decision'\]/);
  assert.match(js,/if\(state\.phase==='home'\)[\s\S]*state\.phase='marco';\s*state\.marco='encenacao'/);
  /* A sequência do meio segue a da Mesa: maquete → papéis → (seletor) →
     Mosaico → Voto de cooperação (tela-marco) → Mercado. */
  assert.match(js,/onclick="abrirPapeis\(\)"/);
  assert.match(js,/AC-papeis\.html\?demo=solo/);
  assert.match(js,/ev\.data\.mosaico!=='ac-papeis-completo'/);
  assert.match(js,/function abrirAnalise\(\)\{\s*function go\(\)\{prepararMosaico\(\);state\.phase='mosaico'/);
  assert.match(js,/abrirMarco\(\\'cooperacao\\'\)/);
  assert.match(js,/cooperacao:\{[^}]*depois:\(\)=>\{state\.phase='mercado'/);
});

test('checkpoint e carimbo incluem o Solo integral',()=>{
  for(const campo of ['percursoEtapa','atividades','atividadeI','sensorPronto','sensorTempos','mosaico','mercadoEtapa','mercadoEscolhas','pontuacao','resultadoVista','apuracaoEtapa'])
    assert.ok(cloud.includes(campo),campo);
  assert.match(html,/mesa-solo\.js\?v=20260918-papeis/);
  assert.match(html,/estado-solo\.js\?v=20260918-papeis/);
});

test('percurso solo mantém 3D, RA, escrivaninha e maquete com três chaves',()=>{
  const coop=readFileSync(new URL('../v1/js/ac-cooperacao.js',import.meta.url),'utf8');
  const desk=readFileSync(new URL('../v1/js/ac-investigacao.js',import.meta.url),'utf8');
  const escrivaninha=readFileSync(new URL('../v1/AC-escrivaninha.html',import.meta.url),'utf8');
  const maquete=readFileSync(new URL('../v1/js/ac-maquete.js',import.meta.url),'utf8');
  assert.match(js,/MOSAICO-26-a-janela-do-norte\.html\?embed=1/);
  assert.match(js,/AC-escrivaninha\.html\?demo=solo/);
  assert.match(js,/xr-spatial-tracking/);
  for(const acao of ['posicionar','encaixar','descobrir','registrar','iniciar_maquete','maquete_mover','maquete_encaixar'])
    assert.ok(coop.includes(acao),acao);
  /* O Solo não tem motor próprio: o toque vai ao MESMO motor da Mesa, pelo
     lado que ainda procura aquele ponto. */
  assert.match(coop,/M\.papelDoToqueSolo\(/);
  assert.match(coop,/M\.actMaquette/);
  assert.match(coop,/M\.maquetteViewSolo\(/);
  /* A vela apaga e reacende no Solo como na Mesa. */
  assert.match(coop,/type==='reacender'/);
  assert.match(desk,/MODO SOLO · PERCURSO COMPLETO/);
  assert.match(desk,/Procurar bilhete sob as gavetas/);
  assert.match(desk,/Ler e guardar bilhete/);
  assert.match(desk,/iniciar_maquete/);
  assert.match(desk,/location\.replace\('AC-maquete\.html'/);
  assert.match(maquete,/ac-solo-maquete-completa/);
  /* O recado de conclusão sai quando a descoberta FECHA — pelo botão também,
     porque em segundo plano o evento close pode não chegar (volta 3). Antes,
     o Solo tirava a maquete da tela antes de a descoberta ser lida. */
  assert.match(maquete,/on\(\$\('guardar'\), 'click', avisarSoloDaConclusao\)/);
  assert.doesNotMatch(maquete,/showModal\(\); \} catch \(e\) \{\}\s*if \(params\.get\('demo'\) === 'solo'\)/);
  /* O Solo ARRASTA, como na Mesa, e tenta arrastar a fixa, como na Mesa: as
     duas pegas. Não existe botão que encaixe sozinho. */
  assert.ok(!maquete.includes('solo-action'),'o botão de atalho do Solo voltou');
  assert.match(maquete,/\$\('key-grip'\)\.hidden = !podeMoverChave\(\)/);
  assert.match(maquete,/\$\('lock-grip'\)\.hidden = !\(podeExplorar\(\) && temLadoDaFechadura\(\) && ambosAcharam\(\)\)/);
  /* As três evidências continuam sendo as mesmas do recibo; quem as define é
     o motor, e o Solo não pode ter uma segunda lista. */
  const motor=readFileSync(new URL('../v1/js/ac-maquete-state.mjs',import.meta.url),'utf8');
  for(const id of ['chave-exterior','chave-dos-quartos','passagem-sob-despensa'])
    assert.ok(motor.includes(id),id);
  assert.ok(!coop.includes('passagem-sob-despensa'),'o Solo não pode listar as evidências por conta própria');
  assert.doesNotMatch(escrivaninha, /id="ar"|id="ar-ios"|Colocar em RA|Ver em RA|teste=sala3d/);
});

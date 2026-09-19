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
  for(const categoria of ['A Janela do Norte','A Sala às Escuras','A escrivaninha e a vela','As três chaves','Os papéis da passagem','A noite em ordem','Mercado de pistas','Decisão contra o caso'])
    assert.ok(js.includes(categoria),categoria);
  /* Tempo total, duas dicas e pontos (ac-ritmo.js): cada tarefa do Solo tem
     prazo, e esgotar zera só aquela tarefa. */
  assert.match(html,/ac-ritmo\.js/);
  for(const q of ['mosaico','mercado','decision'])assert.ok(js.includes("relogioSolo('"+q+"')"),'sem relógio: '+q);
  assert.match(js,/RITMO\.nivelDaDica\(/);
  assert.match(js,/state\.pontosSolo\.mosaico=0/,'mosaico esgotado não pontua');
  assert.match(js,/A etapa travou\? Seguir sem os pontos dela/,'toda etapa com iframe tem saída de socorro');
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
  assert.match(html,/mesa-solo\.js\?v=20260919-ra/);
  assert.match(html,/estado-solo\.js\?v=20260919-ra/);
});

test('percurso solo mantém 3D, RA, escrivaninha e maquete com três chaves',()=>{
  const coop=readFileSync(new URL('../v1/js/ac-cooperacao.js',import.meta.url),'utf8');
  const desk=readFileSync(new URL('../v1/js/ac-investigacao.js',import.meta.url),'utf8');
  const escrivaninha=readFileSync(new URL('../v1/AC-escrivaninha.html',import.meta.url),'utf8');
  const maquete=readFileSync(new URL('../v1/js/ac-maquete.js',import.meta.url),'utf8');
  assert.match(js,/MOSAICO-26-a-janela-do-norte\.html\?embed=1/);
  assert.match(js,/AC-escrivaninha\.html\?demo=solo/);
  assert.match(js,/xr-spatial-tracking/);
  for(const acao of ['posicionar','encaixar','descobrir','registrar','iniciar_maquete','maquete_examinar'])
    assert.ok(coop.includes(acao),acao);
  /* O Solo não tem motor próprio: roda o MESMO ac-core.mjs da Mesa numa sala
     local, com o PARCEIRO AUTOMÁTICO na outra metade (19/09/2026). */
  assert.match(coop,/ac-core\.mjs/);
  assert.match(coop,/core\.apply\(room,/);
  assert.match(coop,/M\.papelDoSolo\(/);
  /* A vela apaga e o parceiro risca o fósforo. */
  assert.match(coop,/type:'reacender'/);
  assert.match(desk,/SOLO · COM PARCEIRO/);
  assert.doesNotMatch(desk,/Procurar bilhete sob as gavetas/,'o atalho que achava a etiqueta sem procurar voltou');
  assert.match(desk,/iniciar_maquete/);
  assert.match(desk,/location\.replace\('AC-maquete\.html'/);
  assert.match(maquete,/ac-solo-maquete-completa/);
  assert.match(maquete,/on\(\$\('guardar'\), 'click', avisarSoloDaConclusao\)/);
  assert.doesNotMatch(maquete,/showModal\(\); \} catch \(e\) \{\}\s*if \(params\.get\('demo'\) === 'solo'\)/);
  /* O Solo ARRASTA a chave, como na Mesa. Não existe botão que encaixe sozinho. */
  assert.ok(!maquete.includes('solo-action'),'o botão de atalho do Solo voltou');
  assert.match(maquete,/\$\('key-grip'\)\.hidden = !podeMoverChave\(\)/);
  assert.match(maquete,/function guiaDoParceiro\(/,'o parceiro guia a chave pela voz');
  /* As três evidências continuam sendo as mesmas do recibo; quem as define é
     o motor, e o Solo não pode ter uma segunda lista. */
  const motor=readFileSync(new URL('../v1/js/ac-maquete-state.mjs',import.meta.url),'utf8');
  for(const id of ['chave-exterior','chave-dos-quartos','passagem-sob-despensa'])
    assert.ok(motor.includes(id),id);
  assert.ok(!coop.includes('passagem-sob-despensa'),'o Solo não pode listar as evidências por conta própria');
  /* A RA da escrivaninha voltou em 18/09/2026; o atalho de ensaio, não. */
  assert.doesNotMatch(escrivaninha, /teste=sala3d/);
  assert.match(escrivaninha, /id="ra-entrar"/);
});

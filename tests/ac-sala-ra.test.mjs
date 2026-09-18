import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const html=readFileSync(new URL('../v1/MOSAICO-26-a-sala-as-escuras.html',import.meta.url),'utf8');
test('scripts da entrada RA continuam sintaticamente válidos',()=>{
  for(const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g))new vm.Script(match[1]);
});
test('mira RA ignora paredes ocultas, exige lanterna e respeita a pista atual',()=>{
  const pot={visible:true},wall={visible:false},mesh={parent:pot,visible:true};
  const object={id:'vaso',visto:false,oculto:false};let hits=[{object:wall},{object:mesh}];
  const context=vm.createContext({raPose:{position:{},direction:{}},luzOn:true,OBJETOS:[object],alvo:()=>object,
    MosaicoRA:{salaGroup:{},objetos3D:{vaso:pot}},THREE:{Raycaster:class{intersectObject(){return hits;}}}});
  const source=html.slice(html.indexOf('function alinhamentoRA(){'),html.indexOf('async function entrarRA(){'));
  vm.runInContext(source,context);
  assert.equal(context.alinhamentoRA().ok,true);
  context.luzOn=false;assert.equal(context.alinhamentoRA().ok,false);
  context.luzOn=true;object.oculto=true;assert.equal(context.alinhamentoRA().obj,null);
  object.oculto=false;context.alvo=()=>({id:'espelho'});assert.equal(context.alinhamentoRA().dentro,true);assert.equal(context.alinhamentoRA().ok,false);
  hits=[{object:{visible:true}},{object:mesh}];assert.equal(context.alinhamentoRA().obj,null,'objeto atrás de obstáculo visível não é descoberto');
});
test('recusa de RA não inicia a partida',async()=>{
  const nodes={'b-entrar-ra':{disabled:false,hidden:false},'ra-disponibilidade':{textContent:''},'b-entrar':{textContent:'Entrar na sala'}};let started=0;
  const context=vm.createContext({raBusy:false,navigator:{xr:{requestSession:async()=>{throw Error('NotAllowedError');}}},document:{getElementById:id=>nodes[id]},MosaicoRA:{ativo:false},alternarModo3DRA:()=>started++,entrarModoDedo:()=>started++});
  const start=html.indexOf('async function entrarRA(){'),end=html.indexOf('var entrarRaBtn=',start);
  assert.ok(start>0&&end>start,'não achei entrarRA');
  vm.runInContext(html.slice(start,end),context);await context.entrarRA();
  assert.equal(started,0);assert.equal(nodes['b-entrar-ra'].disabled,false);
  /* A recusa se vê: a porta da RA sai e o botão que sobra diz o que houve. */
  assert.equal(nodes['b-entrar-ra'].hidden,true);assert.match(nodes['b-entrar'].textContent,/A câmera não abriu/);
  assert.match(nodes['ra-disponibilidade'].textContent,/jogar sem RA/);
});
/* A RA da Sala voltou em 18/09/2026 (Mario: "volta o RA na escrivaninha e na
   sala"), sem os rótulos de ensaio que a tinham tirado em 16/09: nada de
   "Alternar visual" nem "Prefiro jogar sem RA". O botão de entrar em RA só
   aparece no aparelho que tem RA — desabilitado na frente de quem não tem era
   um botão morto —, e a saída da RA só aparece durante ela. */
test('a Sala oferece RA só a quem tem, e sem rótulos de ensaio',()=>{
  assert.match(html,/<button class="go" id="b-entrar-ra" type="button" hidden>Entrar em RA<\/button>/);
  assert.match(html,/<button id="b-ra" type="button" hidden>Sair da RA<\/button>/);
  assert.match(html,/>Entrar na sala</,'quem não tem RA entra direto');
  assert.doesNotMatch(html,/>Alternar visual</);
  assert.doesNotMatch(html,/Prefiro jogar sem RA/);
  assert.match(html,/button\.hidden=!\(!!navigator\.xr&&await navigator\.xr\.isSessionSupported\('immersive-ar'\)\);/);
  assert.match(html,/if\(bRa\)bRa\.hidden=false;/,'sem o Sair da RA não há como voltar ao 3D');
  assert.match(html,/if\(bRa\)bRa\.hidden=true;/);
});
test('verificação de RA mostra o botão só quando o aparelho tem',async()=>{
  const meio=html.indexOf("var button=document.getElementById('b-entrar-ra');\n  if(!button)return;");
  const start=html.lastIndexOf('(async function(){',meio),end=html.indexOf('})();',meio)+4;
  assert.ok(meio>0&&start>0,'não achei a verificação');
  for(const tem of [true,false]){
    const nodes={'b-entrar-ra':{hidden:true}};
    const context=vm.createContext({navigator:{xr:{isSessionSupported:async()=>tem}},document:{getElementById:id=>nodes[id]}});
    await vm.runInContext(html.slice(start,end),context);
    assert.equal(nodes['b-entrar-ra'].hidden,!tem);
  }
  /* Sem RA no navegador: o botão continua escondido. */
  const nodes={'b-entrar-ra':{hidden:true}};
  await vm.runInContext(html.slice(start,end),vm.createContext({navigator:{},document:{getElementById:id=>nodes[id]}}));
  assert.equal(nodes['b-entrar-ra'].hidden,true);
});

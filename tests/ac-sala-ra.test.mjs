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
  const nodes={'b-entrar-ra':{disabled:false},'ra-disponibilidade':{textContent:''}};let started=0;
  const context=vm.createContext({raBusy:false,navigator:{xr:{requestSession:async()=>{throw Error('NotAllowedError');}}},document:{getElementById:id=>nodes[id]},MosaicoRA:{ativo:false},alternarModo3DRA:()=>started++,entrarModoDedo:()=>started++});
  const start=html.indexOf('async function entrarRA(){'),end=html.indexOf('var entrarRaBtn=',start);
  assert.ok(start>0&&end>start,'não achei entrarRA');
  vm.runInContext(html.slice(start,end),context);await context.entrarRA();
  assert.equal(started,0);assert.equal(nodes['b-entrar-ra'].disabled,false);assert.match(nodes['ra-disponibilidade'].textContent,/jogar sem RA/);
});
test('a Sala publicada não expõe Entrar em RA nem Alternar visual',()=>{
  assert.doesNotMatch(html,/id="b-entrar-ra"/);
  assert.doesNotMatch(html,/id="b-ra"/);
  assert.doesNotMatch(html,/>Entrar em RA</);
  assert.doesNotMatch(html,/>Alternar visual</);
  assert.doesNotMatch(html,/Prefiro jogar sem RA/);
  assert.match(html,/>Entrar na sala</);
});

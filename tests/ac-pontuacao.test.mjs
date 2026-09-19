import test from 'node:test';
import assert from 'node:assert/strict';
import '../v1/js/ac-pontuacao.js';
import {createRoom,apply,snapshot} from '../ferramentas/ac-cooperacao.mjs';
const P=globalThis.ACPontuacao;
/* Recibos versão 2 (19/09/2026): um por integrante, com o que ELE ganhou.
   A apuração soma e nunca trava a Mesa. */
const run='M-salaEscura-1';
const recibo=(jogador,extra={})=>({version:2,kind:'individual',sala:'s1',runId:run,jogador,salaEscura:9,vela:26,chaves:21,papeis:12,...extra});
test('dupla recebe a vela e as chaves iguais, e a sala e os papéis de cada um, sem duplicar reconexões',()=>{
 const points=P.apurar([recibo('ana'),recibo('ana'),recibo('bia',{salaEscura:4,papeis:5})]);
 assert.deepEqual(points,{ana:{salaEscura:9,vela:26,chaves:21,papeis:12},bia:{salaEscura:4,vela:26,chaves:21,papeis:5}});
 const first=P.aplicar([{id:'ana',nome:'Ana',componentes:{tempo:5},total:5}],points);
 assert.equal(first[0].total,5+9+26+21+12);assert.deepEqual(P.aplicar(first,points),first);
});
test('a apuração nunca trava: recibo estranho não conta, número fora da faixa é contido',()=>{
 assert.deepEqual(P.apurar([]),{});
 assert.deepEqual(P.apurar([{...recibo('ana'),version:1}]),{},'recibo antigo não conta');
 assert.deepEqual(P.apurar([recibo('ana',{chaves:99,vela:-5,salaEscura:'x'})]).ana,{salaEscura:0,vela:0,chaves:24,papeis:12});
 assert.doesNotThrow(()=>P.apurar([null,{},recibo('bia')]));
});
test('o trio inteiro recebe: cada integrante tem o seu recibo',()=>{
 const pts=P.apurar(['ana','bia','caio'].map(id=>recibo(id)));
 for(const id of ['ana','bia','caio'])assert.deepEqual(pts[id],{salaEscura:9,vela:26,chaves:21,papeis:12});
});
test('carregar lê a rodada aberta pela Mesa mesmo sem ninguém ter concluído, e os pontos do parceiro automático',async()=>{
 const pedidos=[];
 globalThis.ACFetch=async url=>{pedidos.push(url);return {ok:true,json:async()=>[recibo('ana',{salaEscura:3,vela:0,chaves:8,papeis:0})]};};
 try{
  const pts=await P.carregar([{jogadorId:'ana',tarefa:'constelacao'}],true,[run]);
  assert.equal(pedidos.length,1);assert.match(pedidos[0],/individual/);
  assert.deepEqual(pts.ana,{salaEscura:3,vela:0,chaves:8,papeis:0});
  const solo=await P.carregar([{jogadorId:'zé',runId:'X-salaEscura-9',pontosAC:{salaEscura:9,vela:20,chaves:19,papeis:10}}],true,[]);
  assert.deepEqual(solo['zé'],{salaEscura:9,vela:20,chaves:19,papeis:10});
 }finally{delete globalThis.ACFetch;}
});
test('pausa nao consome bonus da vela nem reatribui papel a outro jogador',()=>{
 const r=createRoom(0);r.percurso={runId:'r',ready:['luz','conhecimento'],paused:[]};
 apply(r,'luz',{type:'percurso_identificar',jogador:'ana'},0);
 assert.equal(apply(r,'luz',{type:'percurso_identificar',jogador:'bia'},0),false);
 assert.equal(apply(r,'conhecimento',{type:'percurso_identificar',jogador:'ana'},0),false);
 apply(r,'luz',{type:'iniciar'},1000);
 apply(r,'luz',{type:'percurso_controle',acao:'pausar'},6000);
 assert.equal(snapshot(r,100000).bonus,30);
 apply(r,'luz',{type:'percurso_controle',acao:'retomar'},106000);
 assert.equal(snapshot(r,110000).elapsed,9);
 assert.equal(snapshot(r,110000).bonus,29,'a vela perde 1 a cada 8 s — e só do tempo jogado');
});

test('sala individual valida conclusao, nao duplica e nao transfere pontos ao colega',()=>{
 const room=createRoom();room.percurso={runId:'r',ready:[],paused:[]};
 assert.equal(apply(room,'luz',{type:'sala_concluida',objetos:99,total:9,tempoMs:100}),false);
 assert.equal(apply(room,'luz',{type:'sala_concluida',objetos:9,total:9,tempoMs:15000}),true);
 assert.equal(apply(room,'luz',{type:'sala_concluida',objetos:9,total:9,tempoMs:1}),false);
 assert.deepEqual(room.percurso.salaIndividual,{luz:{pontos:9,tempoMs:15000}});
 /* O prazo encerrou a sala do colega com 4 de 9: ele segue com os 4, em vez
    de ficar preso na sala (o motor recusava tudo que não fosse 9). */
 assert.equal(apply(room,'conhecimento',{type:'sala_concluida',objetos:4,total:9,tempoMs:50000}),true);
 assert.deepEqual(room.percurso.salaIndividual.conhecimento,{pontos:4,tempoMs:50000});
 assert.equal(room.percurso.ready.length,2,'os dois estão prontos: o percurso anda');
 /* A escrivaninha começa a contar quando os dois saem da sala. */
 assert.ok(Number.isFinite(room.startedAt),'o relógio da escrivaninha começa quando a dupla sai da sala');
});

test('avanço parcial preserva pontos individuais: a sala conta mesmo sem o resto do percurso',()=>{
 const room=createRoom();room.percurso={runId:run,ready:[],paused:[],players:{luz:'ana',conhecimento:'bia'}};
 assert.equal(apply(room,'luz',{type:'sala_progresso',objetos:4,total:9}),true);
 assert.equal(apply(room,'luz',{type:'sala_progresso',objetos:2,total:9}),true);
 assert.equal(room.percurso.salaIndividual.luz.pontos,4);
 assert.equal(apply(room,'conhecimento',{type:'sala_progresso',objetos:7,total:9}),true);
 apply(room,'luz',{type:'sala_encerrar'});
 assert.equal(apply(room,'luz',{type:'sala_progresso',objetos:5,total:9}),false);
});

test('o tempo da escrivaninha: esgotado, a etiqueta aparece e a vela não pontua — o resto segue',async()=>{
 const {earnedStages,PRAZO_ESCRIVANINHA_MS}=await import('../v1/js/ac-core.mjs');
 const r=createRoom(0);r.percurso={runId:run,ready:[],paused:[],players:{luz:'ana',conhecimento:'bia'}};
 apply(r,'luz',{type:'sala_concluida',objetos:9,total:9,tempoMs:9000},1000);
 apply(r,'conhecimento',{type:'sala_concluida',objetos:6,total:9,tempoMs:9000},2000);
 assert.equal(r.startedAt,2000);
 assert.equal(apply(r,'luz',{type:'escrivaninha_prazo'},2000+PRAZO_ESCRIVANINHA_MS-1),false);
 const antes=snapshot(r,2000+100000,'luz');assert.equal(antes.dica.nivel,1,'aos 100 s a primeira dica chegou');
 assert.equal(snapshot(r,2000+160000,'conhecimento').dica.nivel,2);
 assert.equal(apply(r,'conhecimento',{type:'escrivaninha_prazo'},2000+PRAZO_ESCRIVANINHA_MS),true);
 assert.equal(r.stage,'registrado');assert.equal(earnedStages(r).vela,0);
 assert.equal(apply(r,'luz',{type:'iniciar_maquete'},2000+PRAZO_ESCRIVANINHA_MS+10),true,'quem tinha a vela também leva a pista até a maquete');
});

test('servidor so entrega premio da vela depois de registrar a descoberta',async()=>{
 const {earnedStages}=await import('../ferramentas/ac-cooperacao.mjs');
 const r=createRoom(0);r.startedAt=1000;r.finishedAt=11000;r.stage='encontrado';
 assert.equal(earnedStages(r).vela,0);
 r.stage='registrado';assert.equal(earnedStages(r).vela,29);
 r.maquete={score:7,evidence:['chave-exterior']};assert.equal(earnedStages(r).chaves,7);
});

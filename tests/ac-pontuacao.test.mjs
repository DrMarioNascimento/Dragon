import test from 'node:test';
import assert from 'node:assert/strict';
import '../v1/js/ac-pontuacao.js';
import {createRoom,apply,snapshot} from '../ferramentas/ac-cooperacao.mjs';
const P=globalThis.ACPontuacao;
const receipt={version:1,sala:'s1',runId:'M-salaEscura-1',players:{luz:'ana',conhecimento:'bia'},vela:26,chaves:21,evidence:['chave-exterior','chave-dos-quartos','passagem-sob-despensa']};
const task=id=>({jogadorId:id,runId:receipt.runId,status:'concluida'});
test('dupla recebe valores iguais, sem multiplicar reconexoes e recalculos',()=>{
 const points=P.apurar([task('ana'),task('ana'),task('bia')],[receipt]);
 assert.deepEqual(points,{ana:{vela:26,chaves:21},bia:{vela:26,chaves:21}});
 const first=P.aplicar([{id:'ana',nome:'Ana',componentes:{tempo:5},total:5}],points);
 assert.equal(first[0].total,52);assert.deepEqual(P.aplicar(first,points),first);
});
test('apuracao rejeita resultado ausente, duplicado, adulterado e de outra rodada',()=>{
 for(const rows of [[],[receipt,receipt],[{...receipt,chaves:25}],[{...receipt,runId:'outra'}],[{...receipt,evidence:[]}]] )assert.throws(()=>P.apurar([task('ana')],rows));
 assert.deepEqual(P.apurar([{...task('ana'),status:'pendente'}],[]),{});
});

test('apoio do trio recebe o premio integral no placar individual',()=>{
 const r={...receipt,players:{...receipt.players,apoio:'caio'}};
 assert.deepEqual(P.apurar([task('ana'),task('bia'),task('caio')],[r]),{ana:{vela:26,chaves:21},bia:{vela:26,chaves:21},caio:{vela:26,chaves:21}});
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
 assert.equal(snapshot(r,110000).bonus,30);
});

test('sala individual valida conclusao, nao duplica e nao transfere pontos ao colega',()=>{
 const room=createRoom();room.percurso={runId:'r',ready:[],paused:[]};
 assert.equal(apply(room,'luz',{type:'sala_concluida',objetos:99,total:9,tempoMs:100}),false);
 assert.equal(apply(room,'luz',{type:'sala_concluida',objetos:9,total:9,tempoMs:15000}),true);
 assert.equal(apply(room,'luz',{type:'sala_concluida',objetos:9,total:9,tempoMs:1}),false);
 assert.deepEqual(room.percurso.salaIndividual,{luz:{pontos:9,tempoMs:15000}});
 const r={...receipt,salaIndividual:{luz:{pontos:9,tempoMs:15000},conhecimento:{pontos:9,tempoMs:25000}}};
 const points=P.apurar([task('ana'),task('bia')],[r]);
 assert.equal(points.ana.salaEscura,9);assert.equal(points.bia.salaEscura,9);
 const p=P.aplicar([{id:'ana',nome:'Ana',componentes:{tempo:5}}],points);
 assert.equal(p[0].total,61);assert.deepEqual(P.aplicar(p,points),p);
 assert.throws(()=>P.apurar([task('bia')],[{...r,salaIndividual:{luz:{pontos:9}}}]));
});

test('avanço parcial preserva pontos individuais e encerra sem premio cooperativo',()=>{
 const room=createRoom();room.percurso={runId:receipt.runId,ready:[],paused:[],players:receipt.players};
 assert.equal(apply(room,'luz',{type:'sala_progresso',objetos:4,total:9}),true);
 assert.equal(apply(room,'luz',{type:'sala_progresso',objetos:2,total:9}),true);
 assert.equal(room.percurso.salaIndividual.luz.pontos,4);
 assert.equal(apply(room,'conhecimento',{type:'sala_progresso',objetos:7,total:9}),true);
 apply(room,'luz',{type:'sala_encerrar'});
 assert.equal(apply(room,'luz',{type:'sala_progresso',objetos:5,total:9}),false);
 const r={...receipt,kind:'individual',salaIndividual:room.percurso.salaIndividual};
 const tasks=['ana','bia'].map(id=>({...task(id),status:'expirada'}));
 assert.deepEqual(P.apurar([...tasks,tasks[0]],[r]),{ana:{vela:0,chaves:0,salaEscura:4},bia:{vela:0,chaves:0,salaEscura:7}});
 assert.throws(()=>P.apurar(tasks,[r,r]));
 const bad={...r,salaIndividual:{luz:{pontos:12}}};assert.throws(()=>P.apurar(tasks,[bad]));
});

test('etapas ja conquistadas sobrevivem a prazo encerrado e premiam os tres',()=>{
 const partial={kind:'individual',runId:receipt.runId,players:{...receipt.players,apoio:'caio'},salaIndividual:{luz:{pontos:9},conhecimento:{pontos:9},apoio:{pontos:9}},etapas:{velaConcluida:true,vela:24,chaves:13,evidence:['chave-exterior','chave-dos-quartos']}};
 const tasks=['ana','bia','caio'].map(id=>({...task(id),status:'expirada'}));
 const points=P.apurar([...tasks,tasks[0]],[partial]);
 for(const id of ['ana','bia','caio'])assert.deepEqual(points[id],{vela:24,chaves:13,salaEscura:9});
 const deskOnly={...partial,etapas:{velaConcluida:true,vela:24,chaves:0,evidence:[]}};
 assert.equal(P.apurar(tasks,[deskOnly]).ana.chaves,0);
 for(const etapas of [{...partial.etapas,chaves:17},{...partial.etapas,velaConcluida:false},{...partial.etapas,evidence:['passagem-sob-despensa'] }])assert.throws(()=>P.apurar(tasks,[{...partial,etapas}]));
});

test('servidor so entrega premio da vela depois de registrar a descoberta',async()=>{
 const {earnedStages}=await import('../ferramentas/ac-cooperacao.mjs');
 const r=createRoom(0);r.startedAt=1000;r.finishedAt=11000;r.stage='encontrado';
 assert.equal(earnedStages(r).vela,0);
 r.stage='registrado';assert.equal(earnedStages(r).vela,29);
 r.maquete={score:7,evidence:['chave-exterior']};assert.equal(earnedStages(r).chaves,7);
});

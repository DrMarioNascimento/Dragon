import test from 'node:test';
import assert from 'node:assert/strict';
import {distribuirFragmentos} from '../ferramentas/ac-fragmentos.mjs';
import {createServer,createRoom,apply,FECHADURAS} from '../ferramentas/ac-cooperacao.mjs';
import {CAPITULOS} from '../ferramentas/ac-maquete-state.mjs';
import {roomRecord,saveRooms,loadRooms} from '../ferramentas/ac-room-store.mjs';
import {mkdtempSync,unlinkSync,rmdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {resolve} from 'node:path';
const roster=n=>Array.from({length:n},(_,i)=>({id:'j'+i,nome:'Jogador '+i}));
test('2 a 12 jogadores: cada um pertence a um Fragmento, com duplas e no maximo um trio',()=>{
 for(let n=2;n<=12;n++){
  const list=roster(n),groups=distribuirFragmentos(list,'rodada-1');
  assert.equal(groups.flatMap(g=>g.membros).length,n);
  assert.equal(new Set(groups.flatMap(g=>g.membros.map(m=>m.id))).size,n);
  assert.ok(groups.every(g=>[2,3].includes(g.membros.length)&&g.cor&&g.simbolo));
  assert.equal(groups.filter(g=>g.membros.length===3).length,n%2);
  assert.deepEqual(distribuirFragmentos([...list].reverse(),'rodada-1'),groups);
 }
 assert.notDeepEqual(distribuirFragmentos(roster(8),'rodada-1'),distribuirFragmentos(roster(8),'rodada-2'));
 assert.throws(()=>distribuirFragmentos(roster(1),'r'));
});
test('entrada automatica reutiliza sala e papel; lista da atividade nao muda depois de fixada',async()=>{
 const server=createServer(resolve('.'));await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 const join=(jogador,list=roster(3))=>fetch(base+'/api/ac/fragmentos/entrar',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({run:'atividade-1',roster:list,jogador})});
 try{
  const entries=await Promise.all(roster(3).map(async p=>await(await join(p.id)).json()));
  assert.equal(new Set(entries.map(e=>e.sala)).size,1);assert.deepEqual(new Set(entries.map(e=>e.papel)),new Set(['luz','conhecimento','apoio']));
  assert.deepEqual(await(await join('j0')).json(),entries[0]);
  assert.equal((await join('j0',roster(4))).status,409);
  assert.equal((await join('intruso')).status,403);
  for(const e of entries){assert.ok(e.chave);assert.equal(e.tokens,undefined);}
 }finally{server.closeAllConnections();await new Promise(r=>server.close(r));}
});
test('trio exige tres conclusoes da sala e apoio participa da leitura da maquete',()=>{
 const r=createRoom();r.tokens.apoio='a'.repeat(36);r.percurso={runId:'r',ready:[],paused:[],fragmento:{membros:[{papel:'luz'},{papel:'conhecimento'},{papel:'apoio'}]}};
 apply(r,'luz',{type:'sala_concluida'});apply(r,'conhecimento',{type:'sala_concluida'});
 assert.equal(apply(r,'luz',{type:'posicionar'}),false);
 apply(r,'apoio',{type:'sala_concluida'});assert.equal(apply(r,'luz',{type:'posicionar'}),true);
 r.stage='registrado';apply(r,'conhecimento',{type:'iniciar_maquete'});
 for(const role of ['luz','conhecimento','apoio'])r.peers.set(role,{role});
 assert.equal(apply(r,'apoio',{type:'maquete_orientar'}),true);
 assert.equal(apply(r,'apoio',{type:'maquete_examinar',object:CAPITULOS[0].esconderijo}),false);
 apply(r,'luz',{type:'maquete_examinar',object:CAPITULOS[0].esconderijo});apply(r,'luz',{type:'maquete_mover',tip:FECHADURAS[0]});
 assert.equal(apply(r,'luz',{type:'maquete_encaixar'}),true);
 const saved=roomRecord(r);assert.equal(saved.tokens.apoio,r.tokens.apoio);assert.equal(saved.percurso.ready.length,3);
 const dir=mkdtempSync(join(tmpdir(),'ac-trio-')),file=join(dir,'state.json');
 try{saveRooms(file,new Map([[r.id,r]]));const restored=loadRooms(file).get(r.id);assert.equal(restored.tokens.apoio,r.tokens.apoio);assert.equal(restored.percurso.fragmento.membros.length,3);assert.deepEqual(restored.percurso.ready,['luz','conhecimento','apoio']);}finally{unlinkSync(file);rmdirSync(dir);}
});

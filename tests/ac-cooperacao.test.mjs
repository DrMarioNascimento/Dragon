import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createRoom, apply, snapshot, bonus, createServer, KEY_SOCKET } from '../ferramentas/ac-cooperacao.mjs';
import { resolve } from 'node:path';

test('papeis assimetricos nao podem pular a acao do colega',()=>{
  const r=createRoom(0);assert.equal(apply(r,'conhecimento',{type:'encaixar'},1),false);
  assert.equal(apply(r,'conhecimento',{type:'descobrir'},1),false);
  assert.equal(apply(r,'luz',{type:'posicionar'},1000),true);
  assert.equal(apply(r,'luz',{type:'encaixar'},2000),true);
  assert.equal(apply(r,'luz',{type:'descobrir'},3000),false);
  assert.equal(apply(r,'conhecimento',{type:'descobrir'},3000),false,'sem feixe nao ha descoberta');
  assert.equal(apply(r,'luz',{type:'feixe',origin:[0,0,1],target:[0,0,0]},3000),true);
  assert.equal(apply(r,'conhecimento',{type:'descobrir'},3000),false,'luz desconectada nao revela');
  r.peers.set('luz',{role:'luz'});
  assert.equal(apply(r,'conhecimento',{type:'descobrir'},5000),false,'feixe antigo nao revela');
  assert.equal(apply(r,'conhecimento',{type:'descobrir'},3500),true);
  assert.equal(apply(r,'conhecimento',{type:'registrar'},3600),true);
  assert.equal(apply(r,'conhecimento',{type:'registrar'},3700),false);
  assert.equal(apply(r,'conhecimento',{type:'iniciar_maquete'},3800),true,'a pista registrada libera a maquete');
  const maquete=r.maquete;
  assert.equal(apply(r,'conhecimento',{type:'iniciar_maquete'},3900),false,'repetir a transição não reinicia o progresso');
  assert.equal(r.maquete,maquete);
});
test('tempo comeca na primeira acao, nao reinicia e congela na descoberta',()=>{
  const r=createRoom(0);assert.equal(snapshot(r,50000).elapsed,0);
  apply(r,'luz',{type:'iniciar'},1000);assert.equal(apply(r,'luz',{type:'iniciar'},10000),false);
  apply(r,'luz',{type:'posicionar'},11000);assert.equal(snapshot(r,11000).bonus,29);
  apply(r,'luz',{type:'encaixar'},12000);r.peers.set('l',{role:'luz'});
  apply(r,'luz',{type:'feixe',origin:[0,0,1],target:[0,0,0]},21000);
  apply(r,'conhecimento',{type:'descobrir'},22000);assert.equal(snapshot(r,999000).elapsed,21);
  assert.equal(snapshot(r,999000).bonus,28);assert.equal(bonus(99999),0);
});
test('feixe rejeita dados invalidos e papel errado',()=>{
  const r=createRoom();r.stage='iluminar';
  for(const origin of [null,[1,2],[NaN,1,2],[0,0,Infinity],[31,0,0]])assert.equal(apply(r,'luz',{type:'feixe',origin,target:[0,0,0]}),false);
  assert.equal(apply(r,'conhecimento',{type:'feixe',origin:[1,2,3],target:[0,0,0]}),false);
});
test('HTTP autentica convites e SSE transmite estados e reconexao',async()=>{
  const server=createServer(resolve('.'));await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const base='http://127.0.0.1:'+server.address().port;
  const controllers=[];
  try{
    const created=await fetch(base+'/api/ac/rooms',{method:'POST'});assert.equal(created.status,201);const room=await created.json();
    const query=role=>new URLSearchParams({sala:room.id,papel:role,chave:room.tokens[role]});
    assert.equal((await fetch(base+'/api/ac/events?sala='+room.id)).status,403);
    const connect=async role=>{const controller=new AbortController();controllers.push(controller);const response=await fetch(base+'/api/ac/events?'+query(role),{signal:controller.signal});const reader=response.body.getReader();let buffer='';return {controller,async next(stage){for(let n=0;n<20;n++){while(buffer.includes('\n\n')){const at=buffer.indexOf('\n\n'),line=buffer.slice(0,at);buffer=buffer.slice(at+2);const s=JSON.parse(line.slice(6));if(!stage||s.stage===stage)return s;}const {value,done}=await reader.read();if(done)throw Error('SSE fechado');buffer+=new TextDecoder().decode(value);}throw Error('Sem estado esperado');}};};
    const light=await connect('luz'),knowledge=await connect('conhecimento');await light.next();await knowledge.next();
    const send=async(role,type)=>fetch(base+'/api/ac/action?'+query(role),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type})});
    assert.equal((await send('conhecimento','posicionar')).status,409);
    assert.equal((await send('luz','posicionar')).status,200);assert.equal((await knowledge.next('castical')).stage,'castical');
    knowledge.controller.abort();const reconnected=await connect('conhecimento');assert.equal((await reconnected.next()).stage,'castical');
    assert.equal((await fetch(base+'/api/ac/rooms',{method:'POST',headers:{Origin:'https://invalido.test'}})).status,403);
    assert.equal((await fetch(base+'/.git/config')).status,403);
  }finally{controllers.forEach(c=>c.abort());server.closeAllConnections();await new Promise(r=>server.close(r));}
});


test('maquete HTTP: tres chaves, troca de papeis e reconexao sem perder pontos', {timeout:10000},async()=>{
  const server=createServer(resolve('.'));await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const base='http://127.0.0.1:'+server.address().port,controllers=[];
  try{
    const room=await (await fetch(base+'/api/ac/rooms?atividade=maquete',{method:'POST'})).json();
    const query=role=>new URLSearchParams({sala:room.id,papel:role,chave:room.tokens[role]});
    async function connect(role){
      const controller=new AbortController();controllers.push(controller);
      const response=await fetch(base+'/api/ac/events?'+query(role),{signal:controller.signal}),reader=response.body.getReader();let buffer='';
      return {controller,async next(match=()=>true){
        for(;;){const at=buffer.indexOf('\n\n');if(at>=0){const event=JSON.parse(buffer.slice(6,at));buffer=buffer.slice(at+2);if(match(event))return event;continue;}
          const chunk=await reader.read();if(chunk.done)throw Error('SSE encerrado antes do estado esperado');buffer+=new TextDecoder().decode(chunk.value);
        }
      }};
    }
    const send=async(role,type,extra={})=>(await fetch(base+'/api/ac/action?'+query(role),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type,...extra})})).status;
    let light=await connect('luz'),knowledge=await connect('conhecimento');
    await light.next(s=>s.online.length===2);await knowledge.next(s=>s.online.length===2);
    for(const [level,object] of ['rosa','relogio','armario-oeste'].entries()){
      const explorer=level===1?'conhecimento':'luz',guide=level===1?'luz':'conhecimento';
      assert.equal(await send(explorer,'maquete_orientar'),409);
      assert.equal(await send(guide,'maquete_orientar'),200);
      const l=await light.next(s=>s.maquete.level===level&&s.maquete.ready),k=await knowledge.next(s=>s.maquete.level===level&&s.maquete.ready);
      assert.equal((explorer==='luz'?l:k).maquete.clue,null);assert.ok((guide==='luz'?l:k).maquete.clue);
      assert.equal(await send(guide,'maquete_examinar',{object}),409);
      assert.equal(await send(explorer,'maquete_examinar',{object}),200);
      await light.next(s=>s.maquete.level===level&&s.maquete.key);
      if(level===0){
        knowledge.controller.abort();await light.next(s=>!s.online.includes('conhecimento'));
        assert.equal(await send('luz','maquete_encaixar'),409);
        knowledge=await connect('conhecimento');const restored=await knowledge.next(s=>s.online.length===2);
        assert.equal(restored.maquete.key,true);assert.equal(restored.maquete.score,0);assert.equal(restored.maquete.ready,true);
      }
      assert.equal(await send(explorer,'maquete_encaixar'),409,'sem posicao transmitida nao encaixa');
      assert.equal(await send(explorer,'maquete_mover',{tip:KEY_SOCKET}),200);
      assert.equal(await send(explorer,'maquete_encaixar'),200);
      assert.equal(await send(explorer,'maquete_encaixar'),409);
      const advanced=await light.next(s=>s.maquete.level===level+1);assert.equal(advanced.maquete.score,(level+1)*8);
    }
    light.controller.abort();light=await connect('luz');const final=await light.next();
    assert.equal(final.maquete.complete,true);assert.equal(final.maquete.score,24);assert.equal(final.maquete.evidence.length,3);
    assert.equal(await send('conhecimento','maquete_orientar'),409);
  }finally{controllers.forEach(c=>c.abort());server.closeAllConnections();await new Promise(r=>server.close(r));}
});


test('checkpoint conserva chaves e pontos mas exige reconectar a dupla',async()=>{
 const {mkdtempSync,readFileSync,writeFileSync,unlinkSync,rmdirSync}=await import('node:fs');const {tmpdir}=await import('node:os');const {join}=await import('node:path');
 const {saveRooms,loadRooms}=await import('../ferramentas/ac-room-store.mjs');const dir=mkdtempSync(join(tmpdir(),'ac-checkpoint-')),file=join(dir,'salas.json');
 try{
  const room=createRoom();room.stage='registrado';apply(room,'conhecimento',{type:'iniciar_maquete'});room.peers.set('a',{role:'luz'});room.peers.set('b',{role:'conhecimento'});
  apply(room,'conhecimento',{type:'maquete_orientar'});apply(room,'luz',{type:'maquete_examinar',object:'rosa'});apply(room,'luz',{type:'maquete_mover',tip:KEY_SOCKET});apply(room,'luz',{type:'maquete_encaixar'});
  apply(room,'luz',{type:'maquete_orientar'});apply(room,'conhecimento',{type:'maquete_examinar',object:'relogio'});
  room.beam={origin:[0,0,1],target:[0,0,0],at:Date.now()};saveRooms(file,new Map([[room.id,room]]));
  const restored=loadRooms(file).get(room.id);assert.equal(restored.maquete.level,1);assert.equal(restored.maquete.score,8);assert.equal(restored.maquete.key,true);assert.deepEqual(restored.tokens,room.tokens);assert.equal(restored.peers.size,0);assert.equal(restored.beam,null);
  assert.equal(apply(restored,'conhecimento',{type:'maquete_encaixar'}),false);
  restored.peers.set('a',{role:'luz'});restored.peers.set('b',{role:'conhecimento'});apply(restored,'conhecimento',{type:'maquete_mover',tip:KEY_SOCKET});assert.equal(apply(restored,'conhecimento',{type:'maquete_encaixar'}),true);assert.equal(restored.maquete.score,16);
  writeFileSync(file,'arquivo interrompido');assert.throws(()=>loadRooms(file),/ilegivel/);assert.equal(readFileSync(file,'utf8'),'arquivo interrompido');
 }finally{unlinkSync(file);rmdirSync(dir);}
});

test('HTTP restaura o mesmo convite apos reiniciar e bloqueia acesso ao arquivo', {timeout:10000},async()=>{
 const {mkdtempSync,unlinkSync,rmdirSync}=await import('node:fs');const {tmpdir}=await import('node:os');const {join}=await import('node:path');
 const dir=mkdtempSync(join(tmpdir(),'ac-restart-')),stateFile=join(dir,'salas.json');let server=null,controller=null;
 async function start(){server=createServer(resolve('.'),{stateFile});await new Promise(r=>server.listen(0,'127.0.0.1',r));return 'http://127.0.0.1:'+server.address().port;}
 async function stop(){controller?.abort();server.closeAllConnections();await new Promise(r=>server.close(r));server=null;}
 try{
  let base=await start();const room=await(await fetch(base+'/api/ac/rooms',{method:'POST'})).json();const query=new URLSearchParams({sala:room.id,papel:'luz',chave:room.tokens.luz});
  assert.equal((await fetch(base+'/api/ac/action?'+query,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type:'posicionar'})})).status,200);
  await stop();base=await start();controller=new AbortController();const response=await fetch(base+'/api/ac/events?'+query,{signal:controller.signal});assert.equal(response.status,200);
  const first=await response.body.getReader().read(),state=JSON.parse(new TextDecoder().decode(first.value).trim().slice(6));assert.equal(state.stage,'castical');assert.deepEqual(state.online,['luz']);
  assert.equal((await fetch(base+'/.ac-ensaio/salas.json')).status,403);
 }finally{if(server)await stop();unlinkSync(stateFile);rmdirSync(dir);}
});


test('entrada raiz redireciona preservando convite e carrega recursos relativos',async()=>{
 const server=createServer(resolve('.'));await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 try{
  const response=await fetch(base+'/?sala=ensaio&papel=luz&chave=teste',{redirect:'manual'});assert.equal(response.status,302);assert.equal(response.headers.get('location'),'/v1/AC-escrivaninha.html?sala=ensaio&papel=luz&chave=teste');
  const page=await fetch(base+'/');assert.equal(new URL(page.url).pathname,'/v1/AC-escrivaninha.html');const html=await page.text();
  const resources=[...html.matchAll(/(?:src|href)="([^"#]+\.(?:css|js)(?:\?[^"#]*)?)"/g)].map(m=>m[1]);assert.ok(resources.length>=3);
  for(const resource of resources){const asset=await fetch(new URL(resource,page.url));assert.equal(asset.status,200,resource);assert.match(asset.headers.get('content-type'),/text\/(css|javascript)/);}
 }finally{server.closeAllConnections();await new Promise(r=>server.close(r));}
});


test('fechadura colaborativa exige ponta recente e transmite posicao apenas ao orientador',()=>{
 const r=createRoom();r.stage='registrado';apply(r,'conhecimento',{type:'iniciar_maquete'});r.peers.set('a',{role:'luz'});r.peers.set('b',{role:'conhecimento'});
 apply(r,'conhecimento',{type:'maquete_orientar'},1000);apply(r,'luz',{type:'maquete_examinar',object:'rosa'},1000);
 assert.equal(apply(r,'conhecimento',{type:'maquete_mover',tip:KEY_SOCKET},1001),false);
 assert.equal(apply(r,'luz',{type:'maquete_mover',tip:[NaN,0,0]},1001),false);
 assert.equal(apply(r,'luz',{type:'maquete_mover',tip:[0,0,0]},1001),true);
 assert.equal(apply(r,'luz',{type:'maquete_encaixar'},1002),false);
 apply(r,'luz',{type:'maquete_mover',tip:KEY_SOCKET},1003);
 assert.equal(snapshot(r,1004,'luz').keyMotion,null);assert.deepEqual(snapshot(r,1004,'conhecimento').keyMotion.tip,KEY_SOCKET);
 assert.equal(snapshot(r,3000,'conhecimento').keyMotion,null);assert.equal(apply(r,'luz',{type:'maquete_encaixar'},3000),false);
 apply(r,'luz',{type:'maquete_mover',tip:KEY_SOCKET},3001);assert.equal(apply(r,'luz',{type:'maquete_encaixar'},3002),true);assert.equal(r.keyMotion,null);
});

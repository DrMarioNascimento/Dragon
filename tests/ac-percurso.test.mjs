import test from 'node:test';
import assert from 'node:assert/strict';
import {createRoom,apply,snapshot,createServer,FECHADURAS} from '../ferramentas/ac-cooperacao.mjs';
import {CAPITULOS} from '../ferramentas/ac-maquete-state.mjs';
import {roomRecord} from '../ferramentas/ac-room-store.mjs';
import {resolve} from 'node:path';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

test('percurso da Mesa segue sala escura, escrivaninha e maquete depois da Janela do Norte',()=>{
 const src=readFileSync('v1/js/ac-percurso.js','utf8');
 const html=readFileSync('v1/AC-percurso.html','utf8');
 const atividades=readFileSync('v1/js/atividades-casa-da-costa.js','utf8');
 assert.match(html,/ac-percurso\.js\?v=/);
 assert.match(atividades,/PAR_CANONICO = \{ inclinacao: "janela", constelacao: "salaEscura" \}/);
 assert.doesNotMatch(atividades,/\bn % opcoes\.length\b/);
 assert.match(src,/sala:'MOSAICO-26-a-sala-as-escuras\.html'/);
 assert.match(src,/mesa:'AC-escrivaninha\.html'/);
 assert.match(src,/maquete:'AC-maquete\.html'/);
 assert.match(src,/showScene\(!p\.ready\.includes\(credentials\.papel\)\?'sala':s\.maquete\?'maquete':'mesa'\)/);
 assert.doesNotMatch(src,/janela:'MOSAICO-26-a-janela-do-norte\.html'/);
 assert.ok(src.indexOf("sala:'1 / 3 · A sala às escuras'") < src.indexOf("mesa:'2 / 3 · Sob outra luz'"));
 assert.ok(src.indexOf("mesa:'2 / 3 · Sob outra luz'") < src.indexOf("maquete:'3 / 3 · O lar em miniatura'"));
});

test('prazo de doze minutos vale somente para percurso novo e segue o documento da mesa',()=>{
 const c={STATE:{doc:{atividades:{inclinacao:'janela',constelacao:'salaEscura'},percursoAC:1,percursoLimiteSegundos:720}},CASO:{configuracao:{limitesSegundos:{inclinacao:150,constelacao:180}},tarefas:{}}};c.window=c;
 vm.runInNewContext(readFileSync('v1/js/atividades-casa-da-costa.js','utf8'),c);
 assert.equal(c.limiteTarefaSensorMs('constelacao'),720000);
 assert.equal(c.limiteTarefaSensorMs('inclinacao'),150000);
 c.STATE.doc.percursoLimiteSegundos=900;assert.equal(c.limiteTarefaSensorMs('constelacao'),900000);
 c.STATE.doc.percursoLimiteSegundos=-1;assert.equal(c.limiteTarefaSensorMs('constelacao'),720000);
 delete c.STATE.doc.percursoAC;assert.equal(c.limiteTarefaSensorMs('constelacao'),720000);
 assert.equal(c.STATE.doc.percursoAC,1);
});

test('navegador encaminha etapas e devolve apenas conclusao final da rodada correta',async()=>{
 const listeners={},sent=[],actions=[],nodes=new Map(),store=new Map();let view={percurso:{runId:'r1',ready:[],paused:[]},maquete:null};
 const child={postMessage(){}};const parent={postMessage(data){sent.push(data);}};
 const node=id=>{if(!nodes.has(id))nodes.set(id,{hidden:true,textContent:'',contentWindow:child,showModal(){},close(){},removeAttribute(){}});return nodes.get(id);};
 const context={URL,URLSearchParams,Date,JSON,Math,crypto:{randomUUID:()=> 'test'},location:{search:'?run=r1&sala=abc&papel=luz&chave=secret',href:'http://localhost/v1/AC-percurso.html',origin:'http://localhost'},history:{replaceState(){}},parent,
 document:{getElementById:node},sessionStorage:{setItem:(k,v)=>store.set(k,v),getItem:k=>store.get(k)},
 EventSource:class{constructor(){context.stream=this;}close(){}},
 fetch:async(url,options)=>{if(url.startsWith('/api/ac/action'))actions.push(JSON.parse(options.body));return {ok:true,json:async()=>view};},
 addEventListener:(type,handler)=>listeners[type]=handler};context.window=context;
 vm.runInNewContext(readFileSync('v1/js/ac-percurso.js','utf8'),context);
 const flush=()=>new Promise(r=>setImmediate(r));await flush();
 assert.match(node('scene').src,/MOSAICO-26-a-sala-as-escuras/);
 const message=(source,runId)=>listeners.message({origin:'http://localhost',source,data:{mosaico:'tarefa-ok',runId,tempoMs:1200}});
 message({},'r1');message(child,'r2');await flush();assert.equal(actions.filter(a=>a.type==='sala_concluida').length,0);
 message(child,'r1');await flush();assert.equal(actions.filter(a=>a.type==='sala_concluida').length,1);assert.equal(sent.length,0);
 view={...view,percurso:{...view.percurso,ready:['luz','conhecimento']}};context.stream.onmessage({data:JSON.stringify(view)});assert.match(node('scene').src,/AC-escrivaninha/);
 view={...view,maquete:{complete:false}};context.stream.onmessage({data:JSON.stringify(view)});assert.match(node('scene').src,/AC-maquete/);
 node('finish').onclick();await flush();assert.equal(sent.length,0);
 view={...view,maquete:{complete:true}};context.stream.onmessage({data:JSON.stringify(view)});assert.equal(node('summary').hidden,false);
 node('finish').onclick();await flush();node('finish').onclick();await flush();
 assert.equal(sent.length,1);assert.equal(sent[0].mosaico,'tarefa-ok');assert.equal(sent[0].runId,'r1');
});

test('percurso exige duas salas concluidas, respeita pausa e preserva registro em retomada',()=>{
 const r=createRoom();r.percurso={runId:'rodada-1',ready:[],paused:[]};
 assert.equal(apply(r,'luz',{type:'posicionar'}),false);
 assert.equal(apply(r,'luz',{type:'sala_concluida'}),true);
 assert.equal(apply(r,'luz',{type:'sala_concluida'}),false);
 assert.equal(apply(r,'luz',{type:'posicionar'}),false);
 apply(r,'conhecimento',{type:'percurso_controle',acao:'pausar'});
 assert.equal(apply(r,'conhecimento',{type:'sala_concluida'}),false);
 apply(r,'luz',{type:'percurso_controle',acao:'retomar'});
 assert.equal(apply(r,'conhecimento',{type:'sala_concluida'}),false,'colega nao retoma a pausa alheia');
 apply(r,'conhecimento',{type:'percurso_controle',acao:'retomar'});
 apply(r,'conhecimento',{type:'sala_concluida'});
 const restored={...roomRecord(r),peers:new Map([['a',{role:'luz'}],['b',{role:'conhecimento'}]])};
 assert.deepEqual(restored.percurso.ready,['luz','conhecimento']);
 assert.equal(apply(restored,'luz',{type:'posicionar'}),true);
 apply(restored,'luz',{type:'encaixar'});
 apply(restored,'luz',{type:'feixe',origin:[0,0,1],target:[0,0,0]});
 apply(restored,'conhecimento',{type:'descobrir'});
 assert.equal(apply(restored,'conhecimento',{type:'iniciar_maquete'}),false);
 apply(restored,'conhecimento',{type:'registrar'});
 apply(restored,'conhecimento',{type:'iniciar_maquete'});
 for(const [i,object]of CAPITULOS.map((c)=>c.esconderijo).entries()){
   const explorer=i===1?'conhecimento':'luz',guide=explorer==='luz'?'conhecimento':'luz';
   apply(restored,guide,{type:'maquete_orientar'});
   apply(restored,explorer,{type:'maquete_examinar',object});
   apply(restored,explorer,{type:'maquete_mover',tip:FECHADURAS[i]});
   assert.equal(apply(restored,explorer,{type:'maquete_encaixar'}),true);
 }
 assert.equal(snapshot(restored).maquete.complete,true);
 assert.equal(restored.maquete.score,24);
 assert.equal(apply(restored,'luz',{type:'maquete_encaixar'}),false);
 assert.equal(restored.maquete.score,24);
});

test('HTTP vincula convite a rodada, protege consulta e serve apenas JSON canonico',async()=>{
 const server=createServer(resolve('.'));await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base='http://127.0.0.1:'+server.address().port;
 try{
   const room=await(await fetch(base+'/api/ac/rooms?run=mesa-123',{method:'POST'})).json();
   const query=new URLSearchParams({sala:room.id,papel:'conhecimento',chave:room.tokens.conhecimento});
   const state=await(await fetch(base+'/api/ac/state?'+query)).json();
   assert.equal(state.percurso.runId,'mesa-123');assert.equal(state.maquete,null);
   query.set('chave','errada');assert.equal((await fetch(base+'/api/ac/state?'+query)).status,403);
   assert.equal((await fetch(base+'/v1/casos/casa-da-costa.json')).status,200);
   assert.equal((await fetch(base+'/package.json')).status,403);
   assert.equal((await fetch(base+'/.ac-ensaio/salas.json')).status,403);
 }finally{server.closeAllConnections();await new Promise(r=>server.close(r));}
});

test('fila restaura descoberta apos falha e confirma resposta perdida sem reenviar',async()=>{
 const store=new Map(),handlers={},nodes=new Map(),actions=[];let fail=true,accepted=0;
 const child={postMessage(){}},parent={postMessage(){}};
 const node=id=>{if(!nodes.has(id))nodes.set(id,{hidden:true,contentWindow:child,removeAttribute(){}});return nodes.get(id);};
 const view=()=>({percurso:{runId:'r',ready:[],paused:[],salaIndividual:{luz:{pontos:accepted}}},maquete:null});
 const c={URL,URLSearchParams,Date,JSON,Math,crypto:{randomUUID:()=> 'x'},location:{search:'?run=r&sala=s&papel=luz&chave=k',href:'http://localhost/v1/AC-percurso.html',origin:'http://localhost'},history:{replaceState(){}},parent,document:{getElementById:node},sessionStorage:{getItem:k=>store.get(k),setItem:(k,v)=>store.set(k,v)},EventSource:class{close(){}},setTimeout:()=>1,clearTimeout(){},addEventListener:(n,h)=>handlers[n]=h,
 fetch:async(url,opts)=>{if(url.startsWith('/api/ac/action')){const e=JSON.parse(opts.body);if(e.type==='sala_progresso'){actions.push(e);accepted=e.objetos;if(fail)throw Error('resposta perdida');}}return {ok:true,json:async()=>view()};}};c.window=c;
 vm.runInNewContext(readFileSync('v1/js/ac-percurso.js','utf8'),c);
 const flush=()=>new Promise(r=>setImmediate(r));await flush();
 handlers.message({source:child,origin:'http://localhost',data:{runId:'r',mosaico:'ac-sala-progresso',objetos:4,total:9}});await flush();
 assert.equal(actions.length,1);assert.equal(node('sync-status').hidden,false);
 assert.equal(JSON.parse(store.get('ac:percurso:r:visitante:pending'))[0].objetos,4);
 fail=false;vm.runInNewContext(readFileSync('v1/js/ac-percurso.js','utf8'),c);await flush();
 assert.equal(actions.length,1,'servidor ja confirmou: nao repetir descoberta');
 assert.deepEqual(JSON.parse(store.get('ac:percurso:r:visitante:pending')),[]);
 assert.equal(node('sync-status').hidden,true);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {groupPlan,replay,receipts} from '../v1/js/ac-replay.mjs';
const fragmento=groupPlan([{id:'a',nome:'Ana'},{id:'b',nome:'Bia'},{id:'c',nome:'Caio'}],'r')[0];
const group={id:'g',runId:'r',fragmento,players:Object.fromEntries(fragmento.membros.map(m=>[m.papel,m.id])),endsAt:1000000};
test('replay converge em tres clientes com eventos fora de ordem e preserva premios',()=>{
 let at=1000;const events=[];const add=(role,event)=>events.push({id:String(events.length).padStart(3,'0'),uid:group.players[role],role,event,at:at+=1000});
 for(const role of Object.keys(group.players))add(role,{type:'sala_concluida',objetos:9,total:9,tempoMs:1000});
 add('luz',{type:'posicionar'});add('luz',{type:'encaixar'});add('luz',{type:'feixe',origin:[0,0,1],target:[0,0,0]});add('conhecimento',{type:'descobrir'});add('conhecimento',{type:'registrar'});add('conhecimento',{type:'iniciar_maquete'});
 for(const [i,object] of ['rosa','relogio','armario-oeste'].entries()){
   const explorer=i===1?'conhecimento':'luz',guide=i===1?'luz':'conhecimento';
   add(guide,{type:'maquete_orientar'});add(explorer,{type:'maquete_examinar',object});add(explorer,{type:'maquete_mover',tip:[.48,-.13,.888]});add(explorer,{type:'maquete_encaixar'});
 }
 const result=receipts(group,events);assert.equal(result[1].chaves,24);assert.equal(Object.keys(result[1].salaIndividual).length,3);
 assert.deepEqual(receipts(group,[...events].reverse()),result);
 assert.deepEqual(receipts(group,[...events,{id:'fake',uid:'fora',role:'luz',event:{type:'sala_progresso',objetos:9,total:9},at:999}]),result);
 assert.equal(replay(group,events).maquete.level,3);
});

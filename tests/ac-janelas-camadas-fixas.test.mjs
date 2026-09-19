import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
/* 19/09/2026: a regra genérica das janelas ([data-ac-priority]:not(#…)) tem
   especificidade de três IDs e tornava position:relative as camadas de tela
   inteira. O Arquivo (#pistas), invisível, ocupava ~400 px no topo da Mesa e
   o quadro da tarefa sensorial ficava com 2 px de altura. */
const css=readFileSync(new URL('../v1/css/ac-janelas.css',import.meta.url),'utf8');
test('camadas de tela inteira decoradas pelas janelas continuam fixas',()=>{
 const regra=css.match(/([^{}]*)\{position:fixed!important\}/);
 assert.ok(regra,'existe a regra que devolve position:fixed');
 for(const sel of ['#pistas','#portao','#master','#mestre','#dragonRoomGate','.partida-pausada'])
  assert.ok(regra[1].includes(sel+'[data-ac-priority]'),sel+' continua fixo');
 assert.ok(css.indexOf(regra[0])>css.indexOf('[data-ac-priority]:not(#intro)'),'vem depois da regra genérica');
});

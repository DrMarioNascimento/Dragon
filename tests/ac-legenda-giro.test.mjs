import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import '../v1/js/ac-legenda-giro.js';
const G=globalThis.ACGiro;
/* 19/09/2026: da sala de espera em diante, um ícone por vez; nunca na
   apuração nem no pódio. Mesma lista na Mesa e no Solo. */
test('o giro mostra um ícone por vez, pelo relógio, e cobre ícones, sinais e siglas',()=>{
 const ics=G.ITENS.map(i=>i[0]);
 for(const ic of ['⏳','💡','🤝','🔎','🧭','🧩','❔','🗂️','☑️','🏆','⚠️','📖','⌄','✕','JxJ','JcJ','J','JxC'])assert.ok(ics.includes(ic),ic);
 assert.equal(G.indice(0),0);
 assert.equal(G.indice(G.PASSO_MS*3+10),3,'mesmo índice em qualquer redesenho do mesmo instante');
 assert.equal(G.indice(G.PASSO_MS*G.ITENS.length),0,'volta ao começo');
});
test('a Mesa põe o giro da sala de espera em diante, e não no resultado nem na vez de quem encena',()=>{
 const mesa=readFileSync(new URL('../v1/MOSAICO-mesa.html',import.meta.url),'utf8');
 const telas=mesa.match(/TELAS_COM_GIRO=\{([^}]*)\}/)[1];
 for(const t of ['esperando','encenacao','votacao','mosaico','cooperacao','mercado','deducao'])assert.match(telas,new RegExp('\\b'+t+':1'));
 for(const t of ['resultado','encerrada','inicio','entrar'])assert.doesNotMatch(telas,new RegExp('\\b'+t+':'));
 assert.match(mesa,/function giroNaTela[\s\S]*<iframe[\s\S]*encenacaoPassiva/);
 assert.match(mesa,/js\/ac-legenda-giro\.js/);
});
test('o Solo põe o giro em toda etapa menos no resultado (apuração e pódio)',()=>{
 const solo=readFileSync(new URL('../solo/mesa-solo.js',import.meta.url),'utf8');
 assert.match(solo,/state\.phase!=='result'&&window\.ACGiro\)h\+=ACGiro\.html\(\)/);
 assert.match(readFileSync(new URL('../solo/index.html',import.meta.url),'utf8'),/ac-legenda-giro\.js/);
});

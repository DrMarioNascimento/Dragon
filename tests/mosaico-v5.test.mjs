/* Testes do motor de pontuação V5. */
import { readFileSync } from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";
const fonte=readFileSync(new URL("../v1/js/mosaico-v5.js",import.meta.url),"utf8"),janela={};new Function("window",fonte)(janela);const V5=janela.MosaicoV5;
test("o módulo se publica com a API esperada",()=>{for(const nome of ["tamanhosNucleos","distribuirNucleos","pontosTempo","pontosQualidade","pontosMoedas","pontosConfiabilidade","pontosEconomia","dividirVoto","calcular"])assert.equal(typeof V5[nome],"function",`faltou ${nome}`)});
test("toda mesa de 1 a 12 forma Fragmentos que somam o total de pessoas",()=>{for(let n=1;n<=12;n++){const t=V5.tamanhosNucleos(n);assert.ok(t.length>0);assert.equal(t.reduce((a,b)=>a+b,0),n)}});
test("de 4 pessoas em diante nenhum Fragmento fica sozinho",()=>{for(let n=4;n<=12;n++)for(const t of V5.tamanhosNucleos(n))assert.ok(t>=2)});
test("mesas de 1 a 3 formam um único Fragmento compartilhado",()=>{assert.deepEqual(V5.tamanhosNucleos(1),[1]);assert.deepEqual(V5.tamanhosNucleos(2),[2]);assert.deepEqual(V5.tamanhosNucleos(3),[3])});
test("acima de 12 pessoas a distribuição é recusada",()=>{assert.throws(()=>V5.distribuirNucleos(Array.from({length:13},(_,i)=>({id:'j'+i,entrouMs:i}))),/1 a 12/)});
test("a distribuição respeita ordem de chegada",()=>{const s=V5.distribuirNucleos([{id:'c',entrouMs:300},{id:'a',entrouMs:100},{id:'e',entrouMs:500},{id:'b',entrouMs:200},{id:'d',entrouMs:400}]);assert.deepEqual(s.map(x=>x.id),['a','b','c','d','e']);assert.deepEqual(s.map(x=>x.nucleo),[1,1,1,2,2])});
test("quem erra a principal não pontua no Tempo",()=>{const p=V5.pontosTempo([{id:'a',suspeitoCorreto:false,submetidoMs:10},{id:'b',suspeitoCorreto:true,submetidoMs:20}]);assert.equal(p.a,0);assert.equal(p.b,29)});
test("envios dentro de três segundos dividem a faixa",()=>{const p=V5.pontosTempo([{id:'a',suspeitoCorreto:true,submetidoMs:0},{id:'b',suspeitoCorreto:true,submetidoMs:1000},{id:'c',suspeitoCorreto:true,submetidoMs:10000}]);assert.equal(p.a,27);assert.equal(p.b,27);assert.equal(p.c,23)});
test("a partir do sétimo a faixa de Tempo estabiliza",()=>{const p=V5.pontosTempo(Array.from({length:8},(_,i)=>({id:'j'+i,suspeitoCorreto:true,submetidoMs:i*60000})));assert.equal(p.j6,11);assert.equal(p.j7,11)});
test("Qualidade é proporcional ao teto 13",()=>{assert.equal(V5.pontosQualidade(4,false),0);assert.equal(V5.pontosQualidade(0,true),0);assert.equal(V5.pontosQualidade(1,true),3);assert.equal(V5.pontosQualidade(2,true),7);assert.equal(V5.pontosQualidade(3,true),10);assert.equal(V5.pontosQualidade(4,true),13)});
test("Qualidade respeita quantidade variável de secundários",()=>{assert.equal(V5.pontosQualidade(1,true,3),4);assert.equal(V5.pontosQualidade(2,true,3),9);assert.equal(V5.pontosQualidade(3,true,3),13)});
test("Qualidade não passa do teto",()=>{assert.equal(V5.pontosQualidade(9,true),13);assert.equal(V5.pontosQualidade(-3,true),0)});
test("moedas guardadas seguem escala",()=>{for(const [m,p] of [[9,8],[12,8],[7,7],[5,5],[3,3],[1,1],[0,0],[-4,0]])assert.equal(V5.pontosMoedas(m),p)});
test("Confiabilidade reage à qualidade e preço",()=>{assert.equal(V5.pontosConfiabilidade([{vendedorId:'a',status:'comprada',qualidade:'boa',faixaPreco:'baixo'}],'a'),3);assert.equal(V5.pontosConfiabilidade([{vendedorId:'a',status:'comprada',qualidade:'ruim',faixaPreco:'alto'}],'a'),-3)});
test("Confiabilidade fica entre -7 e 7",()=>{const m=(q,f)=>Array.from({length:10},()=>({vendedorId:'a',status:'comprada',qualidade:q,faixaPreco:f}));assert.equal(V5.pontosConfiabilidade(m('boa','baixo'),'a'),7);assert.equal(V5.pontosConfiabilidade(m('ruim','alto'),'a'),-7)});
test("Confiabilidade negativa bloqueia gasto",()=>{const e=V5.pontosEconomia({id:'a',moedas:9},{suspeitoCorreto:true,usouPistaAdquirida:true},[{vendedorId:'a',status:'comprada',qualidade:'ruim',faixaPreco:'alto'}]);assert.equal(e.gasto,0)});
test("Economia permanece entre 0 e 20",()=>{const e=V5.pontosEconomia({id:'a',moedas:99},{suspeitoCorreto:true,usouPistaAdquirida:true},Array.from({length:5},()=>({vendedorId:'a',status:'comprada',qualidade:'boa',faixaPreco:'baixo'})));assert.ok(e.total<=20&&e.total>=0)});
test("auto-voto não conta",()=>{const p=V5.dividirVoto([{de:'a',para:'a'}],['a','b'],5);assert.deepEqual(p,{a:0,b:0})});
test("empate divide prêmio em inteiros",()=>{const p=V5.dividirVoto([{de:'c',para:'a'},{de:'d',para:'b'}],['a','b','c','d'],5);assert.equal(p.a,2);assert.equal(p.b,2)});
test("sem voto ninguém leva prêmio",()=>assert.deepEqual(V5.dividirVoto([],['a','b'],10),{a:0,b:0}));
test("total é soma dos componentes e cabe em 100",()=>{const p=V5.calcular({jogadores:[{id:'a',nome:'Ana',moedas:9},{id:'b',nome:'Bia',moedas:0}],deducoes:[{id:'a',suspeitoCorreto:true,camposCorretos:4,submetidoMs:0,usouPistaAdquirida:false},{id:'b',suspeitoCorreto:false,camposCorretos:0,submetidoMs:5000}],negociacoes:[],coopColetiva:{a:20,b:4},coopIndividual:{a:10,b:0},performance:{a:5,b:0}});for(const l of p){assert.equal(l.total,Object.values(l.componentes).reduce((a,b)=>a+b,0));assert.ok(l.total<=100);assert.ok(Number.isInteger(l.total))}assert.equal(p[0].id,'a')});
test("Cooperação não passa de 28",()=>{const [l]=V5.calcular({jogadores:[{id:'a',nome:'Ana',moedas:0}],deducoes:[],negociacoes:[],coopColetiva:{a:20},coopIndividual:{a:30},performance:{}});assert.equal(l.componentes.cooperacao,28)});

/* ── Rodadas sensoriais (02/09/2026) ─────────────────────────────────────
   Passaram a valer 5, tirados de Tempo (3) e Cooperação (2). São poucos de
   propósito: o pagamento real da atividade é o lote de fragmentos, que já
   alimenta Tempo e Qualidade. Se alguém aumentar este teto sem tirar de
   outro lugar, o placar deixa de caber em 100 — e é isso que o último teste
   desta seção guarda. */
test("o piso existe: concluir devagar ainda pontua",()=>{assert.equal(V5.pontosSensorial([170000,175000]),2)});
test("rápido nas duas leva o teto",()=>{assert.equal(V5.pontosSensorial([40000,50000]),5)});
test("rápido em uma só não leva o bônus",()=>{assert.equal(V5.pontosSensorial([40000,170000]),3)});
test("quem não fez atividade nenhuma leva zero",()=>{assert.equal(V5.pontosSensorial([]),0);assert.equal(V5.pontosSensorial(),0);assert.equal(V5.pontosSensorial([0,-5,NaN]),0)});
test("o sensorial nunca passa de 5, nem com atividades demais",()=>{assert.equal(V5.pontosSensorial([40000,40000,40000,40000,40000]),5)});
test("os patamares saem da configuração do caso, não do código",()=>{
  const cfg={sensorial:{rapidoMs:10000,minimoMs:0}};
  assert.equal(V5.pontosSensorial([40000,50000],cfg),2,"com patamar apertado, 40 s deixa de ser rápido");
  assert.equal(V5.pontosSensorial([5000,6000],cfg),5);
});
test("mesa sem registro de tempo continua somando",()=>{
  const [l]=V5.calcular({jogadores:[{id:'a',nome:'Ana',moedas:0}],deducoes:[],negociacoes:[],performance:{}});
  assert.equal(l.componentes.sensorial,0);
  assert.equal(l.total,Object.values(l.componentes).reduce((a,b)=>a+b,0));
});
test("os seis componentes no teto somam exatamente 100",()=>{
  const [l]=V5.calcular({
    jogadores:[{id:'a',nome:'Ana',moedas:9}],
    deducoes:[{id:'a',suspeitoCorreto:true,camposCorretos:4,submetidoMs:0,usouPistaAdquirida:true}],
    /* Economia só encosta em 20 com confiabilidade do mercado: 8 de moedas
       guardadas mais 5 de gasto acertando, mais 7 de vender pista boa barato.
       Sem vender nada o componente para em 13. */
    negociacoes:Array.from({length:3},(_,i)=>({vendedorId:"a",status:"comprada",qualidade:"boa",faixaPreco:"baixo",pistaId:"p"+i})),
    coopColetiva:{a:20},coopIndividual:{a:20},
    performance:{a:5},sensorial:{a:[40000,50000]}
  });
  assert.deepEqual({...l.componentes},{tempo:29,qualidade:13,cooperacao:28,economia:20,sensorial:5,performance:5});
  assert.equal(l.total,100,"o placar deixou de caber em 100");
});

/* Duração abaixo do piso físico é relógio adulterado, não desempenho: a
   Janela sozinha exige sete permanências de 1,5 s. Sem este piso, mentir um
   número pequeno era o caminho mais barato para o teto do componente. */
test("duração impossível é descartada, não premiada",()=>{
  assert.equal(V5.pontosSensorial([10,10]),0,"dois milissegundos não são uma execução");
  assert.equal(V5.pontosSensorial([40000,10]),2,"a atividade honesta conta; a impossível some");
});

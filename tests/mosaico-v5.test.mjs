/* Testes do motor de pontuação V5.
   O módulo é um IIFE de navegador que escreve em `window`. Aqui ele recebe
   um objeto qualquer no lugar do window e devolve a mesma API — sem
   navegador, sem dependência, sem alterar uma linha do arquivo original. */

import { readFileSync } from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

const fonte = readFileSync(new URL("../v1/js/mosaico-v5.js", import.meta.url), "utf8");
const janela = {};
new Function("window", fonte)(janela);
const V5 = janela.MosaicoV5;

test("o módulo se publica com a API esperada", () => {
  for (const nome of ["tamanhosNucleos", "distribuirNucleos", "pontosTempo",
                      "pontosQualidade", "pontosMoedas", "pontosConfiabilidade",
                      "pontosEconomia", "dividirVoto", "calcular"]) {
    assert.equal(typeof V5[nome], "function", `faltou ${nome}`);
  }
});

/* ---------- formação dos Fragmentos ---------- */

test("toda mesa de 1 a 12 forma Fragmentos que somam o total de pessoas", () => {
  for (let n = 1; n <= 12; n += 1) {
    const tamanhos = V5.tamanhosNucleos(n);
    assert.ok(tamanhos.length > 0, `${n} pessoas ficaram sem Fragmento`);
    assert.equal(tamanhos.reduce((a, b) => a + b, 0), n,
      `${n} pessoas: os tamanhos ${tamanhos} não somam ${n}`);
  }
});

test("de 4 pessoas em diante nenhum Fragmento fica sozinho", () => {
  for (let n = 4; n <= 12; n += 1) {
    for (const tam of V5.tamanhosNucleos(n)) {
      assert.ok(tam >= 2, `${n} pessoas geraram um Fragmento de ${tam}`);
    }
  }
});

test("mesas de 1 a 3 formam um único Fragmento compartilhado", () => {
  assert.deepEqual(V5.tamanhosNucleos(1), [1]);
  assert.deepEqual(V5.tamanhosNucleos(2), [2]);
  assert.deepEqual(V5.tamanhosNucleos(3), [3]);
});

test("acima de 12 pessoas a distribuição é recusada, não silenciada", () => {
  const treze = Array.from({ length: 13 }, (_, i) => ({ id: "j" + i, entrouMs: i }));
  assert.throws(() => V5.distribuirNucleos(treze), /1 a 12/);
});

test("a distribuição respeita a ordem de chegada e não perde ninguém", () => {
  const jogadores = [
    { id: "c", entrouMs: 300 }, { id: "a", entrouMs: 100 },
    { id: "e", entrouMs: 500 }, { id: "b", entrouMs: 200 },
    { id: "d", entrouMs: 400 }
  ];
  const saida = V5.distribuirNucleos(jogadores);
  assert.equal(saida.length, 5);
  assert.deepEqual(saida.map(x => x.id), ["a", "b", "c", "d", "e"]);
  assert.deepEqual(saida.map(x => x.nucleo), [1, 1, 1, 2, 2]);
});

/* ---------- Tempo de Resolução (32) ---------- */

test("quem erra o suspeito não pontua no Tempo", () => {
  const pontos = V5.pontosTempo([
    { id: "a", suspeitoCorreto: false, submetidoMs: 10 },
    { id: "b", suspeitoCorreto: true,  submetidoMs: 20 }
  ]);
  assert.equal(pontos.a, 0);
  assert.equal(pontos.b, 32);
});

test("envios dentro de três segundos dividem a faixa entre si", () => {
  const pontos = V5.pontosTempo([
    { id: "a", suspeitoCorreto: true, submetidoMs: 0 },
    { id: "b", suspeitoCorreto: true, submetidoMs: 1000 },
    { id: "c", suspeitoCorreto: true, submetidoMs: 10000 }
  ]);
  /* a e b empatam: (32+29)/2 = 30 inteiro; c fica com a terceira faixa */
  assert.equal(pontos.a, 30);
  assert.equal(pontos.b, 30);
  assert.equal(pontos.c, 26);
});

test("a partir do sétimo colocado a faixa de Tempo se estabiliza", () => {
  const deducoes = Array.from({ length: 8 }, (_, i) => (
    { id: "j" + i, suspeitoCorreto: true, submetidoMs: i * 60000 }
  ));
  const pontos = V5.pontosTempo(deducoes);
  assert.deepEqual([0, 1, 2, 3, 4, 5].map(i => pontos["j" + i]), [32, 29, 26, 23, 20, 17]);
  assert.equal(pontos.j6, 14);
  assert.equal(pontos.j7, 14);
});

/* ---------- Qualidade da Resolução (13) ---------- */

test("a Qualidade só existe se o suspeito estiver certo", () => {
  assert.equal(V5.pontosQualidade(4, false), 0);
  assert.equal(V5.pontosQualidade(0, true), 0);
  assert.equal(V5.pontosQualidade(1, true), 3);
  assert.equal(V5.pontosQualidade(2, true), 6);
  assert.equal(V5.pontosQualidade(3, true), 10);
  assert.equal(V5.pontosQualidade(4, true), 13);
});

test("a Qualidade não passa do teto mesmo com entrada fora de faixa", () => {
  assert.equal(V5.pontosQualidade(9, true), 13);
  assert.equal(V5.pontosQualidade(-3, true), 0);
});

/* ---------- Economia e Risco (20) ---------- */

test("as moedas guardadas seguem a escala publicada", () => {
  assert.equal(V5.pontosMoedas(9), 8);
  assert.equal(V5.pontosMoedas(12), 8);
  assert.equal(V5.pontosMoedas(7), 7);
  assert.equal(V5.pontosMoedas(5), 5);
  assert.equal(V5.pontosMoedas(3), 3);
  assert.equal(V5.pontosMoedas(1), 1);
  assert.equal(V5.pontosMoedas(0), 0);
  assert.equal(V5.pontosMoedas(-4), 0);
});

test("vender pista boa barato fortalece a Confiabilidade; vender ruim caro derruba", () => {
  const boaBarata  = [{ vendedorId: "a", status: "comprada", qualidade: "boa",  faixaPreco: "baixo" }];
  const ruimCara   = [{ vendedorId: "a", status: "comprada", qualidade: "ruim", faixaPreco: "alto"  }];
  assert.equal(V5.pontosConfiabilidade(boaBarata, "a"), 3);
  assert.equal(V5.pontosConfiabilidade(ruimCara,  "a"), -3);
});

test("a Confiabilidade ignora ofertas não compradas e as de outras pessoas", () => {
  const negociacoes = [
    { vendedorId: "a", status: "aberta",   qualidade: "boa", faixaPreco: "baixo" },
    { vendedorId: "b", status: "comprada", qualidade: "boa", faixaPreco: "baixo" }
  ];
  assert.equal(V5.pontosConfiabilidade(negociacoes, "a"), 0);
});

test("a Confiabilidade fica presa entre -7 e 7", () => {
  const muitas = (q, f) => Array.from({ length: 10 }, () => (
    { vendedorId: "a", status: "comprada", qualidade: q, faixaPreco: f }
  ));
  assert.equal(V5.pontosConfiabilidade(muitas("boa", "baixo"), "a"), 7);
  assert.equal(V5.pontosConfiabilidade(muitas("ruim", "alto"), "a"), -7);
});

test("Confiabilidade negativa bloqueia a Qualidade do Gasto", () => {
  const ruimCara = [{ vendedorId: "a", status: "comprada", qualidade: "ruim", faixaPreco: "alto" }];
  const e = V5.pontosEconomia(
    { id: "a", moedas: 9 },
    { suspeitoCorreto: true, usouPistaAdquirida: true },
    ruimCara
  );
  assert.equal(e.confiabilidade, -3);
  assert.equal(e.gasto, 0, "o gasto deveria ter sido bloqueado");
});

test("a Economia nunca passa de 20 nem fica negativa", () => {
  const otimo = V5.pontosEconomia(
    { id: "a", moedas: 99 },
    { suspeitoCorreto: true, usouPistaAdquirida: true },
    Array.from({ length: 5 }, () => (
      { vendedorId: "a", status: "comprada", qualidade: "boa", faixaPreco: "baixo" }))
  );
  assert.ok(otimo.total <= 20, `passou do teto: ${otimo.total}`);
  const pessimo = V5.pontosEconomia(
    { id: "a", moedas: 0 },
    { suspeitoCorreto: false },
    Array.from({ length: 5 }, () => (
      { vendedorId: "a", status: "comprada", qualidade: "ruim", faixaPreco: "alto" }))
  );
  assert.ok(pessimo.total >= 0, `ficou negativo: ${pessimo.total}`);
});

/* ---------- votos ---------- */

test("o voto em si mesmo não conta", () => {
  const pontos = V5.dividirVoto([{ de: "a", para: "a" }], ["a", "b"], 5);
  assert.equal(pontos.a, 0);
  assert.equal(pontos.b, 0);
});

test("empate divide o prêmio em inteiros", () => {
  const pontos = V5.dividirVoto(
    [{ de: "c", para: "a" }, { de: "d", para: "b" }],
    ["a", "b", "c", "d"], 5);
  assert.equal(pontos.a, 2);
  assert.equal(pontos.b, 2);
  assert.equal(pontos.c, 0);
});

test("sem nenhum voto ninguém leva o prêmio", () => {
  const pontos = V5.dividirVoto([], ["a", "b"], 10);
  assert.deepEqual(pontos, { a: 0, b: 0 });
});

/* ---------- escore final ---------- */

test("o total é a soma dos componentes e cabe em 100", () => {
  const placar = V5.calcular({
    jogadores: [{ id: "a", nome: "Ana", moedas: 9 }, { id: "b", nome: "Bia", moedas: 0 }],
    deducoes: [
      { id: "a", suspeitoCorreto: true, camposCorretos: 4, submetidoMs: 0, usouPistaAdquirida: false },
      { id: "b", suspeitoCorreto: false, camposCorretos: 0, submetidoMs: 5000 }
    ],
    negociacoes: [],
    coopColetiva:   { a: 20, b: 4 },
    coopIndividual: { a: 10, b: 0 },
    performance:    { a: 5,  b: 0 }
  });
  for (const linha of placar) {
    const soma = Object.values(linha.componentes).reduce((x, y) => x + y, 0);
    assert.equal(linha.total, soma, `${linha.nome}: total diverge dos componentes`);
    assert.ok(linha.total <= 100, `${linha.nome} passou de 100: ${linha.total}`);
    assert.ok(Number.isInteger(linha.total), `${linha.nome} recebeu pontuação fracionária`);
  }
  assert.equal(placar[0].id, "a", "o placar deveria vir ordenado do maior para o menor");
});

test("a Cooperação não passa de 30 mesmo com coletiva e individual cheias", () => {
  const [linha] = V5.calcular({
    jogadores: [{ id: "a", nome: "Ana", moedas: 0 }],
    deducoes: [], negociacoes: [],
    coopColetiva: { a: 20 }, coopIndividual: { a: 30 }, performance: {}
  });
  assert.equal(linha.componentes.cooperacao, 30);
});

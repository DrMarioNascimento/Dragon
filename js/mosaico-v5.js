(function (global) {
  "use strict";

  const V5 = {};
  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
  const inteiro = n => Math.trunc(Number(n) || 0);

  V5.CONFIG_PADRAO = Object.freeze({
    moedasIniciais: 9,
    precos: { baixo: 1, justo: 3, alto: 5 },
    pesos: { tempo: 32, qualidade: 13, cooperacao: 30, economia: 20, performance: 5 }
  });

  V5.tamanhosNucleos = function (quantidade) {
    const mapa = {
      2: [2], 3: [3], 4: [2, 2], 5: [3, 2], 6: [3, 3],
      7: [3, 2, 2], 8: [3, 3, 2], 9: [3, 3, 3],
      10: [3, 3, 2, 2], 11: [3, 3, 3, 2], 12: [3, 3, 3, 3]
    };
    return (mapa[quantidade] || []).slice();
  };

  V5.distribuirNucleos = function (jogadores) {
    const ordenados = jogadores.slice().sort((a, b) => (a.entrouMs || 0) - (b.entrouMs || 0));
    const tamanhos = V5.tamanhosNucleos(ordenados.length);
    if (!tamanhos.length) throw new Error("A versão atual admite de 2 a 12 jogadores.");
    const saida = [];
    let cursor = 0;
    tamanhos.forEach((tam, indice) => {
      for (let i = 0; i < tam; i += 1) saida.push({ id: ordenados[cursor++].id, nucleo: indice + 1 });
    });
    return saida;
  };

  V5.pontosTempo = function (deducoes) {
    const escala = [32, 29, 26, 23, 20, 17];
    const corretas = deducoes.filter(d => d.suspeitoCorreto).sort((a, b) => a.submetidoMs - b.submetidoMs);
    const pontos = {};
    let inicio = 0;
    while (inicio < corretas.length) {
      let fim = inicio;
      while (fim + 1 < corretas.length && corretas[fim + 1].submetidoMs - corretas[inicio].submetidoMs <= 3000) fim += 1;
      let soma = 0;
      for (let pos = inicio; pos <= fim; pos += 1) soma += escala[pos] == null ? 14 : escala[pos];
      const dividido = Math.floor(soma / (fim - inicio + 1));
      for (let k = inicio; k <= fim; k += 1) pontos[corretas[k].id] = dividido;
      inicio = fim + 1;
    }
    deducoes.forEach(d => { if (pontos[d.id] == null) pontos[d.id] = 0; });
    return pontos;
  };

  V5.pontosQualidade = function (camposCorretos, suspeitoCorreto) {
    if (!suspeitoCorreto) return 0;
    return [0, 3, 6, 10, 13][clamp(inteiro(camposCorretos), 0, 4)];
  };

  V5.pontosMoedas = function (moedas) {
    moedas = Math.max(0, inteiro(moedas));
    if (moedas >= 9) return 8;
    if (moedas >= 7) return 7;
    if (moedas >= 5) return 5;
    if (moedas >= 3) return 3;
    if (moedas >= 1) return 1;
    return 0;
  };

  V5.pontosConfiabilidade = function (negociacoes, jogadorId) {
    const matriz = {
      boa: { baixo: 3, justo: 2, alto: 1 },
      mediana: { baixo: 1, justo: 0, alto: -2 },
      ruim: { baixo: 0, justo: -2, alto: -3 }
    };
    const soma = negociacoes.reduce((total, n) => {
      if (n.vendedorId !== jogadorId || n.status !== "comprada") return total;
      return total + ((matriz[n.qualidade] && matriz[n.qualidade][n.faixaPreco]) || 0);
    }, 0);
    return clamp(soma, -7, 7);
  };

  V5.pontosEconomia = function (jogador, deducao, negociacoes) {
    const moedas = V5.pontosMoedas(jogador.moedas);
    const confiabilidade = V5.pontosConfiabilidade(negociacoes, jogador.id);
    let gasto = deducao && deducao.suspeitoCorreto ? (deducao.usouPistaAdquirida ? 5 : 2) : 0;
    if (confiabilidade < 0) gasto = 0;
    return { moedas, gasto, confiabilidade, total: clamp(moedas + gasto + confiabilidade, 0, 20) };
  };

  V5.dividirVoto = function (votos, elegiveis, teto) {
    const contagem = {};
    elegiveis.forEach(id => { contagem[id] = 0; });
    votos.forEach(v => { if (v.de !== v.para && contagem[v.para] != null) contagem[v.para] += 1; });
    const maior = Math.max(0, ...Object.values(contagem));
    const vencedores = maior ? Object.keys(contagem).filter(id => contagem[id] === maior) : [];
    const premio = vencedores.length ? Math.floor(teto / vencedores.length) : 0;
    const pontos = {};
    elegiveis.forEach(id => { pontos[id] = vencedores.includes(id) ? premio : 0; });
    return pontos;
  };

  V5.calcular = function (entrada) {
    const jogadores = entrada.jogadores || [];
    const deducoes = entrada.deducoes || [];
    const negociacoes = entrada.negociacoes || [];
    const porId = Object.fromEntries(deducoes.map(d => [d.id, d]));
    const tempo = V5.pontosTempo(deducoes);
    const coopColetiva = entrada.coopColetiva || {};
    const coopIndividual = entrada.coopIndividual || {};
    const performance = entrada.performance || {};
    return jogadores.map(j => {
      const d = porId[j.id] || { suspeitoCorreto: false, camposCorretos: 0 };
      const economia = V5.pontosEconomia(j, d, negociacoes);
      const componentes = {
        tempo: tempo[j.id] || 0,
        qualidade: V5.pontosQualidade(d.camposCorretos, d.suspeitoCorreto),
        cooperacao: clamp((coopColetiva[j.id] || 0) + (coopIndividual[j.id] || 0), 0, 30),
        economia: economia.total,
        performance: clamp(performance[j.id] || 0, 0, 5)
      };
      return { id: j.id, nome: j.nome, componentes, economia,
        total: Object.values(componentes).reduce((a, b) => a + b, 0) };
    }).sort((a, b) => b.total - a.total || a.nome.localeCompare(b.nome));
  };

  global.MosaicoV5 = V5;
})(window);

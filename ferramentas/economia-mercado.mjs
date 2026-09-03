#!/usr/bin/env node
/* MOSAICO — BANCADA DA ECONOMIA DO MERCADO
 * ============================================================================
 *
 * Responde "a regra fecha?" sem navegador, sem Firebase e sem ninguém jogando.
 *
 *   node ferramentas/economia-mercado.mjs
 *   node ferramentas/economia-mercado.mjs --moedas 9 --nova 5 --acoes 4
 *   node ferramentas/economia-mercado.mjs --mao 1 --mesas 500
 *
 * ---------------------------------------------------------------------------
 * NÃO É UMA SIMULAÇÃO DOS NÚMEROS. É O JOGO.
 *
 * `mercado-casa-da-costa.js` e `banco-casa-da-costa.js` são carregados daqui
 * byte por byte, os mesmos arquivos que o telefone baixa. Falsas são só as
 * bordas: o Firestore vira um objeto em memória com os mesmos quatro métodos
 * que a camada usa, e o DOM vira o mínimo para ela injetar o <style> dela.
 *
 * A diferença importa. Um modelo escrito à parte — "12 moedas, nova custa 4,
 * logo..." — testaria o ENTENDIMENTO das regras, e erraria junto com quem o
 * escreveu. Este arnês testa as regras como estão implementadas, e a prova é
 * que ele recusa atalho: chamar `mercadoLevar()` direto mede zero, porque a
 * função real volta na primeira linha se não houver painel aberto. Comprar é
 * abrir o painel e só então levar — o mesmo caminho do dedo.
 *
 * E desde que o mercado passou a ser MEDIADO PELO MESTRE, o arnês também é:
 * o jogador cria o pedido em `acoes`, e a cada volta o "jogador 0" assume o
 * papel de Mestre e roda `processarAcoesMestre()`. Quem valida moeda, teto e
 * balaio é a autoridade, aqui como no jogo.
 *
 * O QUE ELE NÃO FAZ: tela, dedo, gente. Ele não sabe se é bom, se 480 s
 * parecem longos, se o botão cai onde o polegar está. Número se mede aqui;
 * feel se joga. E ele NÃO valida as regras do Firestore: para isso é
 * `npm run test:regras`, que precisa do emulador.
 *
 * ---------------------------------------------------------------------------
 * O QUE ELE ACHOU (02/09/2026)
 *
 * O MONTE NÃO CRESCE COM A MESA. O dossiê cresce — 13, 18, 24, 30 fragmentos
 * conforme o número de jogadores — mas o que sobra para vender fica entre 2 e
 * 7, porque exclui o que está nas mãos e as mãos crescem junto. E não cai de
 * forma suave: oscila, porque o dossiê salta em degraus enquanto as mãos
 * crescem de um em um. A mesa de 8 é a pior de todas, com monte 2.
 *
 * Com três fragmentos por pessoa (`--mao 3`) o mercado abre VAZIO a partir de
 * seis jogadores. Nenhum playtest de três pessoas mostraria isso: na mesa de
 * 3 está tudo bem.
 * ==========================================================================*/
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import vm from "node:vm";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const ler = (p) => readFileSync(join(RAIZ, p), "utf8");

const CASO_BASE = JSON.parse(ler("v1/casos/casa-da-costa.json"));
const BANCO = ler("v1/js/banco-casa-da-costa.js");
const MERCADO = ler("v1/js/mercado-casa-da-costa.js");

/* ── argumentos ───────────────────────────────────────────────────────── */
const arg = (nome, padrao) => {
  const i = process.argv.indexOf("--" + nome);
  return i > 0 && process.argv[i + 1] ? Number(process.argv[i + 1]) : padrao;
};
const OPC = {
  moedas: arg("moedas", null),
  nova: arg("nova", null),
  repassada: arg("repassada", null),
  acoes: arg("acoes", null),
  mao: arg("mao", 2),      /* fragmentos por pessoa ao abrir o mercado */
  mesas: arg("mesas", 150),
};

/* ── uma mesa ─────────────────────────────────────────────────────────── */
function abrirMesa(nJog, semente) {
  let s = semente >>> 0;
  const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);

  const caso = JSON.parse(JSON.stringify(CASO_BASE));
  if (OPC.moedas) caso.configuracao.moedasIniciais = OPC.moedas;
  if (OPC.nova) caso.mercado.precos.nova = OPC.nova;
  if (OPC.repassada) caso.mercado.precos.repassada = OPC.repassada;
  if (OPC.acoes) caso.mercado.acoesPorPessoa = OPC.acoes;

  const sala = { balaio: [], fase: "mercado", partidaId: "sete", codigo: "T" };
  const jogadores = Array.from({ length: nJog }, (_, i) => ({
    id: "j" + i, moedas: caso.configuracao.moedasIniciais, acoesMercado: 0, pistas: [],
  }));

  /* o DOM existe só para a camada injetar o <style> dela e seguir */
  const doc = {
    createElement: () => ({ set textContent(v) {}, appendChild() {} }),
    head: { appendChild() {} }, body: { appendChild() {} },
    getElementById: () => null, querySelector: () => null,
    querySelectorAll: () => [], addEventListener() {},
  };
  const ctx = {
    console, Math, JSON, setTimeout, Date, document: doc, CASO: caso,
    STATE: {
      eu: null, doc: sala, mesa: { codigo: "T", fb: true }, jogadores,
      mercadoPainel: null, v5: { tarefas: [], acoes: [] }, publicas: [],
    },
    avisa() {}, render() {},
    /* a Mesa fornece estas três; sem meuJogador() o mercado lê zero moeda e
       recusa toda compra em silêncio */
    meuJogador() { return jogadores.find((j) => j.id === (ctx.STATE.eu || {}).id) || null; },
    minhasPistas() { return (ctx.meuJogador() || {}).pistas || []; },
    esperarFB: async () => ({
      async atualizarJogador(_c, id, d) { Object.assign(jogadores.find((j) => j.id === id) || {}, d); },
      async atualizarMesa(_c, d) { Object.assign(sala, d); },
      async acrescentarPista(_c, id, p) {
        const j = jogadores.find((x) => x.id === id);
        if (j) j.pistas = (j.pistas || []).concat([p]);
      },
      /* o pedido do jogador vira documento em `acoes`, como no Firestore */
      async gravarServidor(_c, col, id, d) {
        if (col !== 'acoes') return;
        const lista = ctx.STATE.v5.acoes;
        const i = lista.findIndex((x) => x.id === id);
        const doc = Object.assign({ id, criadaEm: Date.now() + lista.length }, d);
        if (i < 0) lista.push(doc); else Object.assign(lista[i], d);
      },
      async gravar(_c, col, id, d) {
        if (col !== 'acoes') return;
        const a = ctx.STATE.v5.acoes.find((x) => x.id === id);
        if (a) Object.assign(a, d);
      },
    }),
    /* o Mestre é o jogador 0; é ele quem aplica os pedidos */
    souMestreDaMesa() { return (ctx.STATE.eu || {}).id === 'j0'; },
    MosaicoV5: { calcular: () => ({}) },
  };
  ctx.window = ctx; ctx.globalThis = ctx;
  vm.createContext(ctx);
  vm.runInContext(BANCO, ctx);     /* o monte sai do dossiê, que sai do banco */
  vm.runInContext(MERCADO, ctx);

  const abertos = ctx.MosaicoBancoCasa.abertos();
  jogadores.forEach((j, i) => {
    j.pistas = Array.from({ length: OPC.mao }, (_, k) => {
      const c = abertos[(i * OPC.mao + k) % abertos.length];
      return { id: "lote-" + c, frag: c, txt: "x", hora: "—", adquirida: false };
    });
  });

  const monteInicial = ctx.MosaicoMercadoCasa.monte().length;

  return (async () => {
    const teto = caso.mercado.acoesPorPessoa;
    for (let volta = 0; volta < teto; volta++) {
      for (const j of jogadores) {
        ctx.STATE.eu = { id: j.id, codigo: "T" };
        const P = caso.mercado.precos;
        const balaioUtil = (sala.balaio || []).filter((x) => x.dono !== j.id);
        let acao = null;
        if (balaioUtil.length && j.moedas >= P.repassada && rnd() < 0.6) acao = "balaio";
        else if (j.moedas >= P.nova) acao = "nova";
        else if ((j.pistas || []).length > 1) acao = "consignar";
        if (!acao) continue;
        try {
          if (acao === "consignar") {
            const minha = (j.pistas || []).find((p) => p.frag);
            if (minha) await ctx.mercadoConfirmaConsignar(minha.frag);
          } else {
            /* pelo caminho real: abre o painel, escolhe, leva */
            if (acao === "balaio") await ctx.mercadoComprarRepassada();
            else await ctx.mercadoComprarNova();
            const p = ctx.STATE.mercadoPainel;
            const alvo = p && (p.opcoes || []).find((c) => !(j.pistas || []).some((x) => x.frag === c));
            if (alvo) await ctx.mercadoLevar(alvo);
            else ctx.STATE.mercadoPainel = null;
          }
        } catch (e) { ctx.STATE.mercadoPainel = null; }
      }
      /* o Mestre aplica o que foi pedido nesta volta */
      const antes = ctx.STATE.eu;
      ctx.STATE.eu = { id: 'j0', codigo: 'T' };
      try { await ctx.processarAcoesMestre(); } catch (e) { /* medido abaixo */ }
      ctx.STATE.eu = antes;
    }
    return { jogadores, sala, monteInicial, dossie: abertos.length };
  })();
}

/* ── varredura ────────────────────────────────────────────────────────── */
const P = CASO_BASE.mercado.precos;
console.log(
  "\nMOEDAS " + (OPC.moedas ?? CASO_BASE.configuracao.moedasIniciais) +
  " · NOVA " + (OPC.nova ?? P.nova) +
  " · REPASSADA " + (OPC.repassada ?? P.repassada) +
  " · AÇÕES " + (OPC.acoes ?? CASO_BASE.mercado.acoesPorPessoa) +
  " · MÃO " + OPC.mao + " · " + OPC.mesas + " mesas por tamanho\n",
);
console.log("  mesa  dossiê  monte   moeda ao fim  sem troco  nada comprou  ações usadas  balaio parado");
for (const n of [3, 4, 6, 8, 10, 12]) {
  let moeda = 0, secos = 0, nada = 0, acoes = 0, sobra = 0, monte = 0, doss = 0, N = 0, T = 0;
  for (let r = 0; r < OPC.mesas; r++) {
    const m = await abrirMesa(n, r * 7919 + n);
    N++; T += n; monte += m.monteInicial; doss += m.dossie;
    m.jogadores.forEach((j) => {
      moeda += j.moedas; acoes += j.acoesMercado || 0;
      if (j.moedas < (OPC.repassada ?? P.repassada)) secos++;
      if (!(j.pistas || []).some((p) => p.adquirida)) nada++;
    });
    sobra += (m.sala.balaio || []).length;
  }
  const pc = (x) => ((x / T) * 100).toFixed(0) + "%";
  console.log(
    "  " + String(n).padStart(4) + (doss / N).toFixed(0).padStart(8) +
    (monte / N).toFixed(1).padStart(7) + (moeda / T).toFixed(1).padStart(15) +
    pc(secos).padStart(11) + pc(nada).padStart(14) +
    (acoes / T).toFixed(2).padStart(14) + (sobra / N).toFixed(1).padStart(15),
  );
}
console.log(
  "\n  monte = fragmentos que o mercado tem para vender quando a fase abre.\n" +
  "  Ele exclui o que está nas mãos E o que está no balaio, então cresce com o\n" +
  "  dossiê e encolhe com a mesa. É a coluna que explica 'nada comprou'.\n",
);

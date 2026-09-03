#!/usr/bin/env node
/* MOSAICO — BANCADA DA MIRA COM A MÃO TREMENDO
 * ============================================================================
 *
 *   node ferramentas/mira-sensorial.mjs
 *   node ferramentas/mira-sensorial.mjs --tentativas 4000
 *   node ferramentas/mira-sensorial.mjs --tremor 14,16,18,20,22
 *
 * Prepara o playtest da Sala às Escuras e do Vidro Embaçado: diz o que esperar
 * ANTES de pegar o telefone, para o teste com aparelho de verdade confirmar ou
 * desmentir um número em vez de produzir uma impressão.
 *
 * ---------------------------------------------------------------------------
 * AS DUAS PERGUNTAS
 *
 * Elas não são a mesma, e a medição dos módulos em 03/09/2026 mostrou por quê.
 *
 * 1. VIDRO — ACUMULAR CONTRA ZERAR.  Não é questão de plataforma.
 *    A Mesa usa `holdStart=null`: um único quadro fora da faixa apaga os
 *    1500 ms inteiros. A Noite acumula e ESCOA. Tremor de mão é o estado
 *    normal de quem segura um telefone, então a pergunta é quanto o zerar
 *    custa — e se ele custa a partida ou só um susto.
 *
 * 2. SALA — QUANTO O PERFIL DE PLATAFORMA VALIA.  A Noite dá ao iPhone folga
 *    1,5x (1,9x com bússola instável), hold de 850 ms contra 1400 e dreno de
 *    0,28 contra 0,55. A Mesa não dá nada disso a ninguém. Tirar os perfis
 *    igualaria as duas — mas endurecendo o iPhone, e ninguém mediu quanto.
 *
 * ---------------------------------------------------------------------------
 * O QUE ESTA BANCADA NÃO É
 *
 * Ela não sabe quanto a mão de uma pessoa treme. Esse número vem do playtest.
 * O que ela faz é varrer uma FAIXA de tremores e dizer, para cada um, o que
 * cada regra entrega. Se as regras só se separam num tremor que ninguém tem,
 * a diferença é teórica; se já se separam no tremor de quem está sentado,
 * é decisão de jogo.
 *
 * Também não é o jogo: não há bússola, canvas, nem objeto atrás do quadro.
 * É o laço de permanência, isolado, com as constantes REAIS.
 *
 * ---------------------------------------------------------------------------
 * FIDELIDADE
 *
 * As constantes são lidas dos quatro arquivos de origem a cada execução — não
 * há número de jogo copiado aqui dentro. As linhas de laço que a bancada
 * reproduz estão transcritas uma a uma em CONTRATO abaixo, e a bancada CONFERE
 * que todas ainda existem na fonte antes de rodar. Se alguém mudar a regra,
 * isto para com o nome do arquivo e a linha que sumiu, em vez de continuar
 * respondendo com confiança sobre um jogo que não existe mais. (Conferido:
 * trocando uma linha do CONTRATO por outra inventada, a bancada sai com 1.)
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const ler = (p) => readFileSync(join(RAIZ, p), "utf8");

const FONTES = {
  vidroMesa: "v1/MOSAICO-26-vidro-embacado.html",
  vidroNoite: "mosaico-web/public/modulos/vidro-embacado.html",
  salaMesa: "v1/MOSAICO-26-a-sala-as-escuras.html",
  salaNoite: "mosaico-web/public/modulos/sala-as-escuras.html",
};
const SRC = Object.fromEntries(
  Object.entries(FONTES).map(([k, p]) => [k, ler(p)]),
);

/* ── CONTRATO ──────────────────────────────────────────────────────────────
   Cada linha aqui é copiada da fonte e conferida contra ela. O laço que a
   bancada roda mais abaixo é a tradução destas linhas e de mais nada. */
const CONTRATO = [
  ["vidroMesa", "var dentro = dB<=TOL_B && dG<=TOL_G"],
  ["vidroMesa", "if(holdStart===null) holdStart=agora;"],
  ["vidroMesa", "if(el>=HOLD_MS) revela();"],
  ["vidroMesa", "holdStart=null;"],
  ["vidroNoite", "if(dentro) acerto=Math.min(1,acerto+dt/(IPHONE?2.2:2.5));"],
  ["vidroNoite", "else acerto=Math.max(0,acerto-dt/1.15);"],
  ["salaMesa", "holdAcc=Math.min(CFG.HOLD_MS, holdAcc+dt*1000);"],
  ["salaMesa", "holdAcc=Math.max(0,holdAcc-dt*1000*CFG.DRENO);"],
  ["salaMesa", "var m = holdAcc>0 ? CFG.SOLTA : 1;"],
  ["salaNoite", "holdAcc=Math.min(holdAlvo(), holdAcc+dt*1000);"],
  ["salaNoite", "holdAcc=Math.max(0,holdAcc-dt*1000*drenoMao());"],
];
const quebrados = CONTRATO.filter(([k, t]) => !SRC[k].includes(t));
if (quebrados.length) {
  console.error("A regra mudou na fonte e esta bancada ficou para trás:\n");
  for (const [k, t] of quebrados) console.error(`  ${FONTES[k]}\n    ${t}\n`);
  console.error("Releia o laço no arquivo e atualize CONTRATO antes de confiar em qualquer número daqui.");
  process.exit(1);
}

/* ── CONSTANTES, LIDAS DA FONTE ────────────────────────────────────────── */
function num(chave, re, rotulo) {
  const m = SRC[chave].match(re);
  if (!m) throw new Error(`não achei ${rotulo} em ${FONTES[chave]}`);
  return parseFloat(m[1]);
}
const K = {
  vidro: {
    TOL_B: num("vidroMesa", /var TOL_B *= *([0-9.]+)/, "TOL_B"),
    TOL_G: num("vidroMesa", /TOL_B *= *[0-9.]+, *TOL_G *= *([0-9.]+)/, "TOL_G"),
    HOLD_MS: num("vidroMesa", /var HOLD_MS *= *([0-9.]+)/, "HOLD_MS"),
    TOL_B_IOS: num("vidroNoite", /IPHONE\)\{ *TOL_B *= *([0-9.]+)/, "TOL_B iOS"),
    TOL_G_IOS: num("vidroNoite", /TOL_B *= *[0-9.]+; *TOL_G *= *([0-9.]+); *\}/, "TOL_G iOS"),
    ENCHE_ANDROID: num("vidroNoite", /dt\/\(IPHONE\?[0-9.]+:([0-9.]+)\)/, "enche Android"),
    ENCHE_IOS: num("vidroNoite", /dt\/\(IPHONE\?([0-9.]+):/, "enche iOS"),
    ESCOA: num("vidroNoite", /acerto-dt\/([0-9.]+)/, "escoa"),
  },
  sala: {
    HOLD_MS: num("salaMesa", /HOLD_MS: *([0-9.]+)/, "HOLD_MS"),
    DRENO: num("salaMesa", /DRENO: *([0-9.]+)/, "DRENO"),
    SOLTA: num("salaMesa", /SOLTA: *([0-9.]+)/, "SOLTA"),
    TOL_ROLL: num("salaMesa", /TOL_ROLL: *([0-9.]+)/, "TOL_ROLL"),
    HOLD_IOS: num("salaNoite", /holdAlvo\(\)\{ *return IPHONE\?([0-9.]+)/, "hold iOS"),
    DRENO_IOS: num("salaNoite", /drenoMao\(\)\{ *return IPHONE\?([0-9.]+)/, "dreno iOS"),
    FOLGA_IOS: num("salaNoite", /IPHONE\?\(iOSInstavel\?[0-9.]+:([0-9.]+)\)/, "folga iOS"),
    FOLGA_IOS_RUIM: num("salaNoite", /IPHONE\?\(iOSInstavel\?([0-9.]+):/, "folga iOS instável"),
    /* piso da tolerância de um objeto pequeno — o caso difícil */
    TOL_AZ: num("salaMesa", /az: clamp\(meia\*0\.75\+6\.0, *([0-9.]+)/, "tol az"),
    TOL_EL: num("salaMesa", /el: clamp\(meiaV\*0\.75\+5\.5, *([0-9.]+)/, "tol el"),
  },
};

/* ── A MÃO ─────────────────────────────────────────────────────────────────
   Dois eixos independentes. Cada um é um passeio aleatório com puxão de volta
   ao alvo (Ornstein-Uhlenbeck): é o que produz tremor com correlação no tempo,
   ao contrário de ruído branco, que se cancela sozinho e faz qualquer regra
   parecer boa. `tremor` é o desvio padrão em GRAUS do erro em regime.
   TAU é a memória do tremor: 0,35 s é lento o bastante para tirar o alvo da
   faixa por vários quadros seguidos, que é justamente o caso que separa
   acumular de zerar. */
const TAU = 0.35;
function mao(tremor, rng) {
  let x = 0, y = 0;
  const raiz = tremor * Math.sqrt(2 / TAU);
  return (dt) => {
    x += (-x / TAU) * dt + raiz * gauss(rng) * Math.sqrt(dt);
    y += (-y / TAU) * dt + raiz * gauss(rng) * Math.sqrt(dt);
    return [x, y];
  };
}
function gauss(rng) {
  let u = 0, v = 0;
  while (!u) u = rng();
  while (!v) v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
function semente(s) {
  let h = s >>> 0;
  return () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0) >>> 8) / 16777216;
}

const DT = 1 / 60;
const LIMITE_S = 30; /* desistência: 30 s mirando um fragmento é abandono */

/* ── VIDRO ─────────────────────────────────────────────────────────────────
   `zera` reproduz a Mesa (holdStart=null); `acumula` reproduce A Noite. */
function vidro({ tolB, tolG, regra, encheS, escoaS, holdMs }, tremor, rng) {
  const passo = mao(tremor, rng);
  let holdStart = null, acerto = 0, t = 0, zeradas = 0;
  while (t < LIMITE_S) {
    const [dB, dG] = passo(DT).map(Math.abs);
    const dentro = dB <= tolB && dG <= tolG;
    if (regra === "zera") {
      if (dentro) {
        if (holdStart === null) holdStart = t;
        if ((t - holdStart) * 1000 >= holdMs) return { ok: true, t, zeradas };
      } else {
        if (holdStart !== null) zeradas++;
        holdStart = null;
      }
    } else {
      if (dentro) acerto = Math.min(1, acerto + DT / encheS);
      else acerto = Math.max(0, acerto - DT / escoaS);
      if (acerto >= 1) return { ok: true, t, zeradas };
    }
    t += DT;
  }
  return { ok: false, t: LIMITE_S, zeradas };
}

/* ── SALA ──────────────────────────────────────────────────────────────────
   Acumula nas duas cópias; o que muda é folga, alvo do hold e dreno. A
   histerese SOLTA alarga a janela depois de engatar, e isso importa: é ela
   que decide se um tremor grande derruba ou só arranha. */
function sala({ folga, holdMs, dreno }, tremor, rng) {
  const passo = mao(tremor, rng);
  const baseAz = K.sala.TOL_AZ * folga, baseEl = K.sala.TOL_EL * folga;
  let holdAcc = 0, t = 0;
  while (t < LIMITE_S) {
    const [dAz, dEl] = passo(DT).map(Math.abs);
    const m = holdAcc > 0 ? K.sala.SOLTA : 1;
    const dentro = dAz <= baseAz * m && dEl <= baseEl * m;
    if (dentro) {
      holdAcc = Math.min(holdMs, holdAcc + DT * 1000);
      if (holdAcc >= holdMs) return { ok: true, t };
    } else {
      holdAcc = Math.max(0, holdAcc - DT * 1000 * dreno);
    }
    t += DT;
  }
  return { ok: false, t: LIMITE_S };
}

/* ── EXECUÇÃO ──────────────────────────────────────────────────────────── */
const arg = (nome, padrao) => {
  const i = process.argv.indexOf("--" + nome);
  return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : padrao;
};
const N = parseInt(arg("tentativas", "3000"), 10);
/* A faixa padrão foi escolhida DEPOIS de rodar, e a primeira estava errada:
   abaixo de 12° todas as regras entregam 100% e a bancada não diz nada. O que
   separa as regras mora entre 12° e 36° — que é justamente onde o projeto põe
   o magnetômetro, "erra de 5 a 20°". Abaixo disso a discussão é teórica. */
const TREMORES = arg("tremor", "6,12,18,26,36").split(",").map(Number);

function roda(fn, cfg, tremor) {
  const rng = semente(0x5eed ^ Math.round(tremor * 1000));
  const ts = [];
  let ok = 0, zeradas = 0;
  for (let i = 0; i < N; i++) {
    const r = fn(cfg, tremor, rng);
    if (r.ok) { ok++; ts.push(r.t); }
    zeradas += r.zeradas || 0;
  }
  ts.sort((a, b) => a - b);
  return {
    taxa: ok / N,
    mediana: ts.length ? ts[Math.floor(ts.length / 2)] : null,
    zeradas: zeradas / N,
  };
}

function tabela(titulo, colunas, linhas) {
  console.log("\n" + titulo);
  console.log("  tremor │ " + colunas.map((c) => c.padStart(22)).join(" │ "));
  console.log("  ───────┼─" + colunas.map(() => "─".repeat(22)).join("─┼─"));
  for (const [tremor, celulas] of linhas) {
    console.log(
      `  ${(tremor + "°").padStart(6)} │ ` +
        celulas.map((c) => c.padStart(22)).join(" │ "),
    );
  }
}
const pct = (r) =>
  r.taxa === 0 ? "nunca" : `${(r.taxa * 100).toFixed(0)}% em ${r.mediana.toFixed(1)}s`;

console.log("MOSAICO · bancada da mira");
console.log(`${N} tentativas por célula · desistência em ${LIMITE_S}s · 60 fps`);
console.log(`constantes lidas da fonte · tremor = desvio padrão do erro, em graus`);

const vMesa = { tolB: K.vidro.TOL_B, tolG: K.vidro.TOL_G, regra: "zera", holdMs: K.vidro.HOLD_MS };
const vAndroid = { tolB: K.vidro.TOL_B, tolG: K.vidro.TOL_G, regra: "acumula", encheS: K.vidro.ENCHE_ANDROID, escoaS: K.vidro.ESCOA };
const vIos = { tolB: K.vidro.TOL_B_IOS, tolG: K.vidro.TOL_G_IOS, regra: "acumula", encheS: K.vidro.ENCHE_IOS, escoaS: K.vidro.ESCOA };

tabela(
  `VIDRO EMBAÇADO — tolerância ${K.vidro.TOL_B}/${K.vidro.TOL_G}°, hold ${K.vidro.HOLD_MS}ms`,
  ["Mesa (zera)", "Noite Android", "Noite iPhone"],
  TREMORES.map((t) => [t, [pct(roda(vidro, vMesa, t)), pct(roda(vidro, vAndroid, t)), pct(roda(vidro, vIos, t))]]),
);
console.log("\n  quantas vezes a Mesa apaga o progresso, por tentativa:");
console.log(
  "   " + TREMORES.map((t) => `${t}°: ${roda(vidro, vMesa, t).zeradas.toFixed(1)}`).join("  ·  "),
);

const sMesa = { folga: 1, holdMs: K.sala.HOLD_MS, dreno: K.sala.DRENO };
const sIos = { folga: K.sala.FOLGA_IOS, holdMs: K.sala.HOLD_IOS, dreno: K.sala.DRENO_IOS };
const sIosRuim = { folga: K.sala.FOLGA_IOS_RUIM, holdMs: K.sala.HOLD_IOS, dreno: K.sala.DRENO_IOS };

tabela(
  `SALA ÀS ESCURAS — tolerância ${K.sala.TOL_AZ}/${K.sala.TOL_EL}° (objeto pequeno), hold ${K.sala.HOLD_MS}ms, histerese ${K.sala.SOLTA}x`,
  ["Mesa / Noite Android", "Noite iPhone", "Noite iPhone instável"],
  TREMORES.map((t) => [t, [pct(roda(sala, sMesa, t)), pct(roda(sala, sIos, t)), pct(roda(sala, sIosRuim, t))]]),
);

console.log(`
COMO LER

  "tremor" é o desvio padrão, em graus, do erro que o jogador NÃO consegue
  corrigir — o que a agulha faz mais rápido do que a mão reage. Não é o quanto
  a pessoa balança: é o quanto a LEITURA balança. Um erro constante não entra
  aqui porque ele se cancela sozinho: quem mira centraliza a própria leitura,
  e é a própria leitura que o jogo testa.

  O PLAYTEST RESPONDE UMA COISA SÓ: em qual coluna a mão de verdade cai, no
  iPhone e no Android. Com isso, as linhas abaixo dizem o resto.

  SALA — a coluna "Mesa / Noite Android" é o que sobra se os perfis por
  plataforma saírem. A distância dela até "Noite iPhone" é o que se perde ao
  removê-los.

  VIDRO — "Mesa (zera)" contra "Noite Android" isola UMA variável: mesma
  tolerância, mesmo tempo, só a regra de acúmulo muda. O que separa as duas é
  a linha de baixo, quantas vezes o progresso é apagado.
`);

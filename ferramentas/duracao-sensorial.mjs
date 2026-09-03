#!/usr/bin/env node
/* MOSAICO — BANCADA DA DURAÇÃO QUE VIRA PONTO
 * ============================================================================
 *
 *   node ferramentas/duracao-sensorial.mjs
 *   node ferramentas/duracao-sensorial.mjs --jogadores 8 --mesas 400
 *
 * Roda o `V5.pontosSensorial` REAL de v1/js/mosaico-v5.js. Não reimplementa a
 * regra: se ela mudar, esta bancada muda junto.
 *
 * ---------------------------------------------------------------------------
 * A PERGUNTA
 *
 * Mario decidiu em 02/09/2026 que a duração da atividade paga em ponto na
 * tabela geral — 5 dos 100. O limiar de "rápido" ficou em 75 s, e esse número
 * é CHUTE: ninguém mediu quanto uma pessoa leva de verdade na Janela do Norte
 * ou na Sala às Escuras.
 *
 * Esta bancada não sabe quanto as pessoas levam — isso só o playtest diz. O
 * que ela responde é o que vem antes: PARA CADA limiar possível e para cada
 * ritmo de mesa que se imagine, os 5 pontos SEPARAM as pessoas ou dão a mesma
 * nota para todo mundo? Um critério que premia todos, ou nenhum, não é
 * critério — é enfeite que ocupa 5 pontos do placar.
 *
 * ---------------------------------------------------------------------------
 * A REGRA, COMO ESTÁ IMPLEMENTADA
 *
 *   +1 por atividade concluída (piso: aparelho lento não sai de mãos vazias)
 *   +1 a mais por atividade dentro do limiar
 *   +1 de bônus se forem 2 ou mais e TODAS dentro do limiar
 *   duração abaixo de minimoMs (9 s) é descartada como relógio adulterado
 *
 * Com as DUAS atividades que a Casa da Costa dá por partida, os resultados
 * possíveis são 0, 1, 2, 3 e 5 — o 4 não existe. Duas rápidas dão 2+2 e o
 * bônus leva direto a 5. É um degrau, não um erro, mas quem for calibrar
 * precisa saber que a escala pula.
 * ==========================================================================*/
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import vm from "node:vm";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const CASO = JSON.parse(readFileSync(join(RAIZ, "v1/casos/casa-da-costa.json"), "utf8"));
const V5SRC = readFileSync(join(RAIZ, "v1/js/mosaico-v5.js"), "utf8");

const arg = (n, p) => { const i = process.argv.indexOf("--" + n); return i > 0 && process.argv[i + 1] ? Number(process.argv[i + 1]) : p; };
const NJOG = arg("jogadores", 6);
const MESAS = arg("mesas", 300);

/* o motor real, com um DOM que só absorve a cascata de <script> dele */
const doc = {
  createElement: () => ({ set src(v) {}, set textContent(v) {}, dataset: {}, appendChild() {} }),
  head: { appendChild() {} }, body: { appendChild() {} },
  getElementById: () => null, querySelector: () => null, querySelectorAll: () => [],
  addEventListener() {},
};
const ctx = { console, Math, JSON, setTimeout, Date, document: doc, location: { search: "" } };
ctx.window = ctx; ctx.globalThis = ctx;
vm.createContext(ctx);
vm.runInContext(V5SRC, ctx);
const V5 = ctx.MosaicoV5;
if (!V5 || !V5.pontosSensorial) throw new Error("MosaicoV5.pontosSensorial não carregou");

/* ── ritmos de mesa que se pode imaginar ──────────────────────────────── */
/* mediana em segundos e dispersão: gente é desigual, e é justamente a
   desigualdade que um critério precisa conseguir ler */
const RITMOS = [
  { rot: "mesa rápida   (mediana 35 s)", mediana: 35, espalha: 0.45 },
  { rot: "mesa média    (mediana 60 s)", mediana: 60, espalha: 0.5 },
  { rot: "mesa devagar  (mediana 95 s)", mediana: 95, espalha: 0.55 },
  { rot: "muito desigual(mediana 60 s)", mediana: 60, espalha: 1.1 },
];
const LIMIARES = [30, 45, 60, 75, 90, 120, 150];

function rng(s) { let x = s >>> 0; return () => ((x = (x * 1664525 + 1013904223) >>> 0) / 4294967296); }
/* log-normal simples: cauda longa à direita, como tempo humano de verdade */
function duracao(r, mediana, espalha) {
  const u = Math.max(1e-9, r()), v = Math.max(1e-9, r());
  const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  return Math.max(9000, Math.round(mediana * 1000 * Math.exp(z * espalha)));
}

console.log("\nO limiar separa a mesa, ou dá a mesma nota para todos?");
console.log(NJOG + " jogadores · " + MESAS + " mesas · duas atividades por partida\n");

for (const ritmo of RITMOS) {
  console.log("  " + ritmo.rot);
  console.log("    limiar   0     1     2     3     5    │ notas distintas   no teto   no piso");
  for (const lim of LIMIARES) {
    const cfg = { sensorial: { rapidoMs: lim * 1000, minimoMs: CASO.configuracao.sensorial.minimoMs, primeiros: 3 } };
    const hist = { 0: 0, 1: 0, 2: 0, 3: 0, 5: 0 };
    let distintasSoma = 0, T = 0;
    for (let m = 0; m < MESAS; m++) {
      const r = rng(m * 7919 + lim);
      const daMesa = new Set();
      for (let j = 0; j < NJOG; j++) {
        const tempos = [duracao(r, ritmo.mediana, ritmo.espalha), duracao(r, ritmo.mediana, ritmo.espalha)];
        const p = V5.pontosSensorial(tempos, cfg);
        hist[p] = (hist[p] || 0) + 1; daMesa.add(p); T++;
      }
      distintasSoma += daMesa.size;
    }
    const pc = (x) => ((x / T) * 100).toFixed(0) + "%";
    console.log(
      "    " + String(lim + "s").padStart(5) +
      pc(hist[0]).padStart(6) + pc(hist[1]).padStart(6) + pc(hist[2]).padStart(6) +
      pc(hist[3]).padStart(6) + pc(hist[5]).padStart(6) +
      "   │" + (distintasSoma / MESAS).toFixed(2).padStart(12) +
      pc(hist[5]).padStart(11) + pc(hist[2]).padStart(10),
    );
  }
  console.log("");
}
console.log(
  "  notas distintas = quantas notas diferentes convivem na MESMA mesa (de 1 a 4).\n" +
  "  Perto de 1, os 5 pontos não separam ninguém e viram enfeite. Perto de 3,\n" +
  "  a duração está de fato ordenando a mesa.\n" +
  "  'no piso' é quem concluiu as duas e não pegou o limiar em nenhuma.\n",
);

/* ── E se o limiar não fosse um número fixo? ───────────────────────────────
   A varredura acima mostra que o limiar que melhor separa é sempre o que cai
   perto da MEDIANA daquela mesa. Um número fixo só acerta quando adivinha o
   ritmo do grupo: 75 s numa mesa que resolve em 35 s dá nota máxima a 92% —
   e cinco pontos que todos ganham não ordenam nada.

   Então: e se o limiar fosse a mediana da própria mesa? Ele se calibra
   sozinho, e a pergunta "quanto tempo as pessoas levam?" deixa de precisar de
   resposta antes do jogo existir. */
console.log("  SE O LIMIAR FOSSE A MEDIANA DA PRÓPRIA MESA\n");
console.log("    ritmo da mesa                 2     3     5    │ notas distintas");
for (const ritmo of RITMOS) {
  const hist = { 2: 0, 3: 0, 5: 0 };
  let distintasSoma = 0, T = 0;
  for (let m = 0; m < MESAS; m++) {
    const r = rng(m * 7919 + 31);
    const tempos = Array.from({ length: NJOG }, () => [
      duracao(r, ritmo.mediana, ritmo.espalha),
      duracao(r, ritmo.mediana, ritmo.espalha),
    ]);
    const todos = tempos.flat().slice().sort((a, b) => a - b);
    const mediana = todos[Math.floor(todos.length / 2)];
    const cfg = { sensorial: { rapidoMs: mediana, minimoMs: CASO.configuracao.sensorial.minimoMs, primeiros: 3 } };
    const daMesa = new Set();
    tempos.forEach((t) => { const p = V5.pontosSensorial(t, cfg); hist[p] = (hist[p] || 0) + 1; daMesa.add(p); T++; });
    distintasSoma += daMesa.size;
  }
  const pc = (x) => ((x / T) * 100).toFixed(0) + "%";
  console.log("    " + ritmo.rot.padEnd(26) + pc(hist[2]).padStart(6) + pc(hist[3]).padStart(6) +
    pc(hist[5]).padStart(6) + "   │" + (distintasSoma / MESAS).toFixed(2).padStart(12));
}
console.log(
  "\n  O limiar relativo entrega a MESMA separação em qualquer ritmo, porque ele\n" +
  "  se calibra na mesa. O fixo só acerta quando adivinha o grupo.\n",
);

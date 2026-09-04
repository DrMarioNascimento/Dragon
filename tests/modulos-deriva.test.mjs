/* Os módulos sensoriais existem em DUAS linhagens, e elas derivam.
 *
 * `v1/MOSAICO-26-*.html` serve A Mesa; `mosaico-web/public/modulos/*.html`
 * serve A Noite. Deveriam ser o mesmo jogo com integrações diferentes, e há
 * meses são o mesmo jogo com integrações diferentes MAIS o que cada lado
 * consertou sozinho.
 *
 * O preço já foi cobrado três vezes só em 03/09/2026: o cânone antigo
 * sobreviveu meses num lado, o tratamento de iPhone da bússola existia só n'A
 * Noite, e a decisão de abrir a tolerância existia só na Mesa. Cada um desses
 * foi encontrado por acaso, olhando outra coisa.
 *
 * ESTE TESTE NÃO CONSERTA A DERIVA. Ele impede que ela cresça, e transforma
 * "as duas cópias divergiram de novo" de descoberta acidental em falha de
 * suíte. É uma catraca: os tetos abaixo só podem DESCER.
 *
 * Ao convergir um pedaço, rode e baixe o número. Ao ver o teto subir, saiba
 * que alguém consertou um lado só — e o outro lado é onde o bug ainda mora.
 *
 * O QUE FALTA PARA UNIFICAR DE VERDADE, e por que não foi feito de uma vez:
 *
 *  1. A Noite desfez a extração do `tarefa-sensor.js`: `alvoMsg`, `envia` e
 *     `formatarTempo` voltaram copiadas em cada módulo. Devolver a extração é
 *     o maior pedaço isolado da deriva.
 *  2. Mas o `tarefa-sensor.js` auto-carrega `js/sensor-casa-da-costa-v2.js`
 *     por caminho RELATIVO AO DOCUMENTO. De `v2/modulos/` isso vira
 *     `/Dragon/v2/modulos/js/…` e dá 404 em silêncio — o cânone não chega e o
 *     módulo conta a história antiga. Compartilhar o arquivo exige resolver
 *     esse caminho antes.
 *  3. E estes módulos são canvas mais sensores de orientação: não rodam de
 *     cabeça para baixo numa suíte. Convergir às cegas, com playtest marcado,
 *     troca um problema conhecido por um desconhecido.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");

/* Teto medido em 03/09/2026, depois da convergência da bússola. SÓ DESCE. */
const TETO = {
  "janela-do-norte": 541,
  "sala-as-escuras": 377,
  "vidro-embacado": 414,
};
const PARES = {
  "janela-do-norte": "v1/MOSAICO-26-a-janela-do-norte.html",
  "sala-as-escuras": "v1/MOSAICO-26-a-sala-as-escuras.html",
  "vidro-embacado": "v1/MOSAICO-26-vidro-embacado.html",
};

/* Conta linhas que diferem, sem depender do `diff` do sistema: a suíte roda em
   Windows e em CI, e um dos dois não tem. */
function derivaDe(nome) {
  const a = readFileSync(join(RAIZ, PARES[nome]), "utf8").split(/\r?\n/);
  const b = readFileSync(join(RAIZ, `mosaico-web/public/modulos/${nome}.html`), "utf8").split(/\r?\n/);
  /* Distância de edição por linhas, em janela: comparar conjunto a conjunto
     erraria para menos quando um bloco só mudou de lugar. */
  const setA = new Map(), setB = new Map();
  for (const l of a) setA.set(l, (setA.get(l) || 0) + 1);
  for (const l of b) setB.set(l, (setB.get(l) || 0) + 1);
  let só = 0;
  for (const [l, n] of setA) só += Math.max(0, n - (setB.get(l) || 0));
  for (const [l, n] of setB) só += Math.max(0, n - (setA.get(l) || 0));
  return só;
}

for (const nome of Object.keys(TETO)) {
  test(`a deriva de ${nome} não cresce`, () => {
    const d = derivaDe(nome);
    assert.ok(
      d <= TETO[nome],
      `${nome}: ${d} linhas divergem, e o teto é ${TETO[nome]}. ` +
        `Alguém consertou UM lado só — o outro é onde o defeito ainda mora. ` +
        `Se a divergência for deliberada, suba o teto com o motivo escrito no commit.`,
    );
  });
}

/* A catraca vale nos dois sentidos: teto muito acima da deriva real deixa de
   proteger, porque cabe uma regressão inteira dentro da folga. */
test("os tetos acompanham a deriva real", () => {
  for (const nome of Object.keys(TETO)) {
    const d = derivaDe(nome);
    assert.ok(
      TETO[nome] - d <= 40,
      `${nome}: a deriva caiu para ${d} e o teto ficou em ${TETO[nome]}. ` +
        `Baixe o teto — folga grande é catraca solta.`,
    );
  }
});

/* O que a convergência precisa devolver, e que hoje mede o tamanho do buraco:
   A Mesa importa a engenharia de sensores; A Noite tem cópia de tudo. */
test("a extração do tarefa-sensor.js continua desfeita só de um lado", () => {
  const mesa = readFileSync(join(RAIZ, "v1/MOSAICO-26-vidro-embacado.html"), "utf8");
  const noite = readFileSync(join(RAIZ, "mosaico-web/public/modulos/vidro-embacado.html"), "utf8");
  const usaModulo = (s) => s.includes("TarefaSensor");
  assert.ok(usaModulo(mesa), "A Mesa parou de usar o tarefa-sensor.js — se foi de propósito, este teste perdeu o sentido");
  /* Quando A Noite voltar a usá-lo, esta asserção falha DE PROPÓSITO: é o
     aviso de que a unificação andou e este teste precisa ser reescrito. */
  assert.ok(
    !usaModulo(noite),
    "A Noite voltou a usar o tarefa-sensor.js: a extração foi restaurada, e este teste deve virar o inverso — exigir que os dois usem.",
  );
});

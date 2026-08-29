/* A máquina de fases da noite, e quem tem direito de empurrá-la.
 *
 * Estes testes existem por dois bugs concretos que a suíte anterior não tinha
 * como pegar, porque ela não olhava para a v2 de forma nenhuma:
 *
 *  · a fase "cor" não mostrava botão de seguir. A moldura achava que sim, a
 *    barra achava que não, e as duas regras estavam escritas em lugares
 *    diferentes com critérios diferentes;
 *  · o direito de avançar era só de quem abriu a mesa, então o telefone dessa
 *    pessoa dormindo parava a noite inteira.
 *
 * Um teste de string não pega nenhum dos dois. Estes exercitam a decisão. */

import test from "node:test";
import assert from "node:assert/strict";
import {
  FASES_SENSOR,
  FASE_S,
  V3_PHASES,
  fasesDaNoite,
  nextPhase,
  podeSeguir,
} from "../src/lib/mosaico/v3.ts";

const FORMATOS = ["curta", "cheia"];
const LANTERNAS = ["janela", "salaescura"];

/* ---------------------------------------------------------------- percurso */

test("toda noite caminha de sala até resultado, sem laço", () => {
  for (const formato of FORMATOS) {
    for (const lanterna of LANTERNAS) {
      const vistas = new Set();
      let fase = "sala";
      for (let i = 0; i < 40; i += 1) {
        assert.ok(!vistas.has(fase), `${formato}/${lanterna}: repetiu ${fase}`);
        vistas.add(fase);
        const proxima = nextPhase(fase, formato, lanterna);
        if (proxima === null) break;
        fase = proxima;
      }
      assert.equal(fase, "resultado", `${formato}/${lanterna} não chegou ao fim`);
    }
  }
});

test("a noite curta escolhe uma lanterna e não visita a outra", () => {
  for (const lanterna of LANTERNAS) {
    const lista = fasesDaNoite("curta", lanterna);
    assert.ok(lista.includes(lanterna));
    const outra = lanterna === "janela" ? "salaescura" : "janela";
    assert.ok(!lista.includes(outra));
    assert.ok(!lista.includes("vidro"), "o vidro não é fase da noite curta");
  }
});

test("uma fase fora do roteiro devolve null em vez de um destino errado", () => {
  /* Na noite curta o "vidro" não existe. Se nextPhase inventasse um destino,
     a mesa iria para uma fase que ninguém renderiza. */
  assert.equal(nextPhase("vidro", "curta", "janela"), null);
  assert.equal(nextPhase("resultado", "cheia", "janela"), null);
  assert.equal(nextPhase("fase-que-nao-existe", "cheia", "janela"), null);
});

test("toda fase alcançável tem relógio ou tem botão", () => {
  /* Uma fase sem relógio e sem botão é um fim de linha: a mesa entra e não
     sai. Foi exatamente o que aconteceu com "cor" antes do podeSeguir. */
  for (const formato of FORMATOS) {
    for (const lanterna of LANTERNAS) {
      for (const fase of fasesDaNoite(formato, lanterna)) {
        if (fase === "sala" || fase === "resultado") continue;
        const temRelogio = typeof FASE_S[fase] === "number";
        const temBotao = podeSeguir({
          fase,
          isMaster: true,
          lanternDone: true,
          algumFragmento: true,
          faseVencida: false,
        });
        assert.ok(
          temRelogio || temBotao,
          `${formato}/${lanterna}: a fase "${fase}" não tem saída`,
        );
      }
    }
  }
});

/* ------------------------------------------------------------- quem empurra */

const base = {
  isMaster: false,
  lanternDone: false,
  algumFragmento: false,
  faseVencida: false,
};

test("com o relógio vencido, qualquer telefone empurra a mesa", () => {
  /* A rede de segurança. Sem ela a noite morre com o telefone de quem abriu. */
  for (const fase of V3_PHASES) {
    if (fase === "sala" || fase === "resultado") continue;
    assert.ok(
      podeSeguir({ ...base, fase, faseVencida: true }),
      `a fase "${fase}" não tem resgate`,
    );
  }
});

test("antes do tempo, só quem conduz a mesa segue", () => {
  for (const fase of V3_PHASES) {
    assert.equal(
      podeSeguir({ ...base, fase, lanternDone: true, algumFragmento: true }),
      false,
      `a fase "${fase}" deixou um convidado seguir antes do tempo`,
    );
  }
});

test("a fase cor mostra o botão assim que alguém confirma o Fragmento", () => {
  /* O bug: a moldura contava com o botão, a barra recusava, e a fase só
     passava pelo relógio — que morre junto com a aba de quem conduz. */
  const cor = { ...base, fase: "cor", isMaster: true };
  assert.equal(podeSeguir({ ...cor, algumFragmento: false }), false);
  assert.equal(podeSeguir({ ...cor, algumFragmento: true }), true);
});

test("a lanterna só libera o botão depois da tarefa feita", () => {
  for (const fase of ["janela", "vidro", "salaescura", "palimpsesto", "espelho", "planta"]) {
    const c = { ...base, fase, isMaster: true };
    assert.equal(podeSeguir({ ...c, lanternDone: false }), false, fase);
    assert.equal(podeSeguir({ ...c, lanternDone: true }), true, fase);
  }
});

test("sala e resultado nunca mostram o botão, nem com o relógio vencido", () => {
  for (const fase of ["sala", "resultado"]) {
    assert.equal(
      podeSeguir({ ...base, fase, isMaster: true, faseVencida: true }),
      false,
      fase,
    );
  }
});

test("a encenação não ganha uma barra por cima dos próprios botões", () => {
  assert.equal(
    podeSeguir({ ...base, fase: "encenacao", isMaster: true }),
    false,
  );
  /* mas o resgate continua valendo, senão o ator sumir trava a mesa */
  assert.equal(
    podeSeguir({ ...base, fase: "encenacao", faseVencida: true }),
    true,
  );
});

/* ------------------------------------------------------------------ cenário */

test("só as tarefas com módulo pedem semente à mesa", () => {
  /* Palimpsesto, espelho e planta são gestos entre telefones: não têm cenário
     para fixar. As três com iframe têm, e é o que impede metade do grupo de
     cair num mundo diferente quando a rodada de 30 min vira no meio da fase. */
  assert.deepEqual([...FASES_SENSOR].sort(), ["janela", "salaescura", "vidro"]);
});

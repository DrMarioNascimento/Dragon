/* Matriz de segurança do FIREBASE-SECURITY.md, executada em vez de conferida
   à mão. Roda contra o emulador configurado em firebase.json:

       npm run test:regras

   Cobre com prioridade o que mudou em `ownPlayerUpdate` (o Arquivo cresce
   no máximo uma pista por escrita e a mesma escrita não encosta nas moedas)
   e a retirada de `concluidoMs` do Fragmento. */

import { readFileSync } from "node:fs";
import test, { before, after, beforeEach } from "node:test";
import {
  initializeTestEnvironment, assertSucceeds, assertFails
} from "@firebase/rules-unit-testing";
import {
  doc, getDoc, setDoc, updateDoc
} from "firebase/firestore";

const SALA = "MESA01";
const MESTRE = "uid-mestre";
const ANA = "uid-ana";
const BIA = "uid-bia";

let env;

before(async () => {
  env = await initializeTestEnvironment({
    projectId: "mosaico-game-teste",
    firestore: {
      rules: readFileSync(new URL("../firestore.rules", import.meta.url), "utf8"),
      host: "127.0.0.1",
      port: 8180
    }
  });
});

after(async () => { if (env) await env.cleanup(); });

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async ctx => {
    const db = ctx.firestore();
    await setDoc(doc(db, "mosaico", SALA), {
      ativa: true, fase: "sala", vez: 0, modo: "com-telao",
      ritmo: "automatico", mestreUid: MESTRE, criadaEmMs: Date.now()
    });
    await setDoc(doc(db, "mosaico", SALA, "jogadores", ANA), {
      nome: "Ana", personagem: "herdeiro", forma: "f", pronto: false,
      entrouMs: 1, votos: 0, moedas: 9, total: 0,
      pistas: [{ id: "priv-herdeiro", hora: "21:08", txt: "…", adquirida: false }],
      nucleo: 1
    });
    await setDoc(doc(db, "mosaico", SALA, "jogadores", BIA), {
      nome: "Bia", personagem: "morador", forma: "f", pronto: false,
      entrouMs: 2, votos: 0, moedas: 9, total: 0, pistas: [], nucleo: 1
    });
    await setDoc(doc(db, "mosaico", SALA, "nucleos", "1"), {
      numero: 1, portadorId: ANA, rascunho: {}
    });
  });
});

const como = uid => env.authenticatedContext(uid).firestore();
const jogadora = (db, id) => doc(db, "mosaico", SALA, "jogadores", id);
const PISTA_NOVA = { id: "tarefa-inclinacao", hora: "21:26", txt: "…", adquirida: false, origem: "tarefa" };
const OUTRA_PISTA = { id: "priv-morador", hora: "21:13", txt: "…", adquirida: false };

/* ---------- Arquivo do próprio jogador ---------- */

test("acrescentar uma pista ao próprio Arquivo é aceito", async () => {
  const db = como(ANA);
  const atual = (await getDoc(jogadora(db, ANA))).data().pistas;
  await assertSucceeds(updateDoc(jogadora(db, ANA), {
    pistas: [...atual, PISTA_NOVA], atualizadoEmMs: Date.now()
  }));
});

test("acrescentar duas pistas de uma vez é negado", async () => {
  const db = como(ANA);
  const atual = (await getDoc(jogadora(db, ANA))).data().pistas;
  await assertFails(updateDoc(jogadora(db, ANA), {
    pistas: [...atual, PISTA_NOVA, OUTRA_PISTA], atualizadoEmMs: Date.now()
  }));
});

test("acrescentar pista e mexer nas moedas na mesma escrita é negado", async () => {
  const db = como(ANA);
  const atual = (await getDoc(jogadora(db, ANA))).data().pistas;
  await assertFails(updateDoc(jogadora(db, ANA), {
    pistas: [...atual, PISTA_NOVA], moedas: 99, atualizadoEmMs: Date.now()
  }));
});

test("declarar-se pronto é aceito", async () => {
  await assertSucceeds(updateDoc(jogadora(como(ANA), ANA), {
    pronto: true, atualizadoEmMs: Date.now()
  }));
});

test("escrever o próprio total é negado", async () => {
  await assertFails(updateDoc(jogadora(como(ANA), ANA), { total: 100 }));
});

test("alterar o Arquivo de outra pessoa é negado", async () => {
  await assertFails(updateDoc(jogadora(como(ANA), BIA), {
    pistas: [PISTA_NOVA], atualizadoEmMs: Date.now()
  }));
});

/* ---------- sala ---------- */

test("participante não muda a fase da sala", async () => {
  await assertFails(updateDoc(doc(como(ANA), "mosaico", SALA), { fase: "resultado" }));
});

test("o mestre muda a fase da sala", async () => {
  await assertSucceeds(updateDoc(doc(como(MESTRE), "mosaico", SALA), { fase: "votacao" }));
});

test("nem o mestre transfere a própria condição de mestre", async () => {
  await assertFails(updateDoc(doc(como(MESTRE), "mosaico", SALA), { mestreUid: ANA }));
});

/* ---------- Fragmento ---------- */

test("o Portador grava o rascunho do próprio Fragmento", async () => {
  await assertSucceeds(updateDoc(doc(como(ANA), "mosaico", SALA, "nucleos", "1"), {
    rascunho: { 0: "pub-2103" }, rascunhoMs: Date.now()
  }));
});

test("integrante comum não grava o rascunho do Fragmento", async () => {
  await assertFails(updateDoc(doc(como(BIA), "mosaico", SALA, "nucleos", "1"), {
    rascunho: { 0: "pub-2103" }, rascunhoMs: Date.now()
  }));
});

test("concluidoMs não pode mais ser escrito por ninguém", async () => {
  /* O campo saiu do hasOnly porque nunca foi gravado pelo jogo e servia de
     porta para forjar o desempate de tempo do Mosaico. */
  await assertFails(updateDoc(doc(como(ANA), "mosaico", SALA, "nucleos", "1"), {
    concluidoMs: 1
  }));
});

/* ---------- votos ---------- */

test("votar em si mesmo é negado", async () => {
  await assertFails(setDoc(doc(como(ANA), "mosaico", SALA, "votos", ANA), {
    de: ANA, para: ANA, ms: Date.now()
  }));
});

test("votar em outra pessoa é aceito, e o voto não pode ser trocado depois", async () => {
  const db = como(ANA);
  await assertSucceeds(setDoc(doc(db, "mosaico", SALA, "votos", ANA), {
    de: ANA, para: BIA, ms: Date.now()
  }));
  await assertFails(setDoc(doc(db, "mosaico", SALA, "votos", ANA), {
    de: ANA, para: MESTRE, ms: Date.now()
  }));
});

test("ninguém lê o voto de outra pessoa", async () => {
  await env.withSecurityRulesDisabled(async ctx => {
    await setDoc(doc(ctx.firestore(), "mosaico", SALA, "votos", BIA), {
      de: BIA, para: ANA, ms: Date.now()
    });
  });
  await assertFails(getDoc(doc(como(ANA), "mosaico", SALA, "votos", BIA)));
});

/* ---------- sala encerrada ---------- */

test("sala encerrada não aceita mais escrita de participante", async () => {
  await env.withSecurityRulesDisabled(async ctx => {
    await updateDoc(doc(ctx.firestore(), "mosaico", SALA), { ativa: false });
  });
  await assertFails(updateDoc(jogadora(como(ANA), ANA), {
    pronto: true, atualizadoEmMs: Date.now()
  }));
});

/* ---------- noite v3 ---------- */

test("o mestre avança para palimpsesto, espelho e planta", async () => {
  await assertSucceeds(updateDoc(doc(como(MESTRE), "mosaico", SALA), {
    fase: "palimpsesto", v3: true
  }));
});

test("fase desconhecida é recusada mesmo ao mestre", async () => {
  await assertFails(updateDoc(doc(como(MESTRE), "mosaico", SALA), {
    fase: "hacker"
  }));
});

test("o segundo ator passa a vez na encenação", async () => {
  const agora = Date.now();
  await env.withSecurityRulesDisabled(async ctx => {
    await updateDoc(doc(ctx.firestore(), "mosaico", SALA), {
      fase: "encenacao",
      vez: 0,
      ordem: [ANA, BIA],
      faseAteMs: agora + 60_000,
      ativa: true,
    });
  });
  await assertSucceeds(updateDoc(doc(como(ANA), "mosaico", SALA), {
    vez: 1,
    faseAteMs: agora + 90_000,
  }));
});

test("quem não é o ator da vez não passa a apresentação", async () => {
  const agora = Date.now();
  await env.withSecurityRulesDisabled(async ctx => {
    await updateDoc(doc(ctx.firestore(), "mosaico", SALA), {
      fase: "encenacao",
      vez: 0,
      ordem: [ANA, BIA],
      faseAteMs: agora + 60_000,
      ativa: true,
    });
  });
  await assertFails(updateDoc(doc(como(BIA), "mosaico", SALA), {
    vez: 1,
    faseAteMs: agora + 90_000,
  }));
});

test("convidado não põe vez no resgate de fase enquanto ainda há ator", async () => {
  const agora = Date.now();
  await env.withSecurityRulesDisabled(async ctx => {
    await updateDoc(doc(ctx.firestore(), "mosaico", SALA), {
      fase: "encenacao",
      vez: 0,
      ordem: [ANA, BIA],
      faseAteMs: agora - 1_000,
      ativa: true,
    });
  });
  await assertFails(updateDoc(doc(como(BIA), "mosaico", SALA), {
    fase: "votacao",
    faseAteMs: agora + 45_000,
  }));
});

test("tarefa da Sala às Escuras é aceita no próprio UID", async () => {
  await assertSucceeds(setDoc(
    doc(como(ANA), "mosaico", SALA, "tarefas", ANA + "_sala"),
    { tarefa: "sala", jogadorId: ANA, runId: "r1", concluidoEm: Date.now() }
  ));
});

test("tarefa inventada é recusada", async () => {
  await assertFails(setDoc(
    doc(como(ANA), "mosaico", SALA, "tarefas", ANA + "_hack"),
    { tarefa: "hack", jogadorId: ANA, runId: "r1", concluidoEm: Date.now() }
  ));
});

test("em mesa v3 qualquer integrante do Fragmento grava a carta", async () => {
  await env.withSecurityRulesDisabled(async ctx => {
    await updateDoc(doc(ctx.firestore(), "mosaico", SALA), { v3: true });
  });
  await assertSucceeds(updateDoc(doc(como(BIA), "mosaico", SALA, "nucleos", "1"), {
    rascunho: { 0: "c03" }, rascunhoMs: Date.now()
  }));
});

test("dedução própria é aceita uma vez; outro jogador não lê", async () => {
  const db = como(ANA);
  await assertSucceeds(setDoc(doc(db, "mosaico", SALA, "deducoes", ANA), {
    id: ANA,
    suspeito: "elias",
    motivo: "m-heranca",
    acao: "a-disjuntor",
    prova: "pr-marcas",
    lacuna: "g-agua-porta",
    pistasUsadas: [],
    submetidoEm: Date.now()
  }));
  await assertFails(getDoc(doc(como(BIA), "mosaico", SALA, "deducoes", ANA)));
});

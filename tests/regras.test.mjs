/* Matriz de segurança do FIREBASE-SECURITY.md, executada em vez de conferida
   à mão. Roda contra o emulador configurado em firebase.json:

       npm run test:regras

   Precisa de JAVA e do emulador do Firestore. Em 03/09/2026 esta máquina
   não tinha nenhum dos dois, e por isso o teste vivia falhando na suíte por
   dependência ausente — o que escondia que ele existia e valia. Instalados:
   Microsoft OpenJDK 17 (winget) e firebase-tools como devDependency.
   Se der "Could not spawn java", abra um terminal NOVO: o PATH permanente
   está certo, o que fica velho é a sessão aberta antes da instalação.

   Cobre com prioridade o que mudou em `ownPlayerUpdate` (o Arquivo cresce
   no máximo uma pista por escrita e a mesma escrita não encosta nas moedas)
   e a retirada de `concluidoMs` do Fragmento. */

import { readFileSync } from "node:fs";
import {CAPITULOS,FECHADURAS} from '../ferramentas/ac-maquete-state.mjs';
import test, { before, after, beforeEach } from "node:test";
import {
  initializeTestEnvironment, assertSucceeds, assertFails
} from "@firebase/rules-unit-testing";
import {
  doc, getDoc, setDoc, updateDoc, serverTimestamp, collection, getDocs, query, where
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

test("o Portador fecha o Fragmento com concluidoEm timestamp", async () => {
  const db = como(ANA);
  await assertSucceeds(updateDoc(doc(db, "mosaico", SALA, "nucleos", "1"), {
    rascunho: { 0: "pub-2103", _enviadoMs: Date.now() },
    rascunhoMs: Date.now(),
    concluidoEm: new Date()
  }));
});

test("integrante comum não fecha o Fragmento com concluidoEm", async () => {
  await assertFails(updateDoc(doc(como(BIA), "mosaico", SALA, "nucleos", "1"), {
    rascunho: { 0: "x" }, rascunhoMs: Date.now(), concluidoEm: new Date()
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

/* ── A fila de atividades d'A Noite (03/09/2026) ─────────────────────────
   A fila era localStorage: cada telefone tinha a sua, e "Concluída pela
   mesa" queria dizer "concluída neste aparelho". Agora ela mora no
   documento da sala, e o caminho tem duas metades que as regras precisam
   sustentar: cada pessoa carimba em "tarefas" a atividade que terminou, e
   SÓ o Mestre escreve "modsFeitos" no documento da sala. Se a segunda
   metade afrouxar, duas pessoas terminando ao mesmo tempo escrevem por
   cima uma da outra. */

test("as quatro atividades d'A Noite são nomes que a regra conhece", async () => {
  /* janela, sala, vidro e escuro são os ids de MODULOS em noite-auto.js.
     "escuro" — O Mapa do Escuro — não estava na lista até hoje: o carimbo
     daquela atividade seria negado, e a fila travaria nela. */
  for (const atividade of ["janela", "sala", "vidro", "escuro"]) {
    await assertSucceeds(setDoc(
      doc(como(ANA), "mosaico", SALA, "tarefas", ANA + "_" + atividade),
      { tarefa: atividade, jogadorId: ANA, concluidoEm: Date.now() }
    ));
  }
});

test("quem não é Mestre não vira a fila de atividades", async () => {
  await assertFails(updateDoc(doc(como(ANA), "mosaico", SALA), {
    modsFeitos: ["janela"], atualizadoEmMs: Date.now(),
  }));
});

test("o Mestre vira a fila de atividades", async () => {
  await assertSucceeds(updateDoc(doc(como(MESTRE), "mosaico", SALA), {
    modsFeitos: ["janela"], atualizadoEmMs: Date.now(),
  }));
});

test("tarefa inventada é recusada", async () => {
  await assertFails(setDoc(
    doc(como(ANA), "mosaico", SALA, "tarefas", ANA + "_hack"),
    { tarefa: "hack", jogadorId: ANA, runId: "r1", concluidoEm: Date.now() }
  ));
});

test('AC grava pronto e conclusao de constelacao somente no proprio jogador', async()=>{
  const ref=doc(como(ANA),'mosaico',SALA,'tarefas',ANA+'_constelacao');
  await assertSucceeds(setDoc(ref,{tarefa:'constelacao',jogadorId:ANA,runId:'AC-salaEscura-123',prontoEm:Date.now()}));
  await assertSucceeds(updateDoc(ref,{concluidoEm:Date.now()}));
  await assertFails(setDoc(doc(como(BIA),'mosaico',SALA,'tarefas',ANA+'_constelacao'),{tarefa:'constelacao',jogadorId:ANA,concluidoEm:Date.now()}));
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

/* ---------- O mercado: por que ele teve de virar pedido ----------
   Em 02/09/2026 o mercado gravava direto do aparelho de quem comprava. Os
   testes abaixo mostram, contra o emulador, por que aquilo nunca chegaria ao
   servidor — e por que o caminho novo chega. */

test("o jogador NÃO debita a própria moeda: era assim que o mercado gravava", async () => {
  /* {moedas, acoesMercado} é exatamente a escrita que mercadoLevar fazia.
     hasOnly reprova a escrita inteira porque nenhuma das duas chaves está em
     allowlist de ownPlayerUpdate (sem moedas). */
  await assertFails(updateDoc(jogadora(como(ANA), ANA), {
    moedas: 5, acoesMercado: 1
  }));
});

test("nem sequer levando a pista junto, que é a chave permitida", async () => {
  const db = como(ANA);
  const atual = (await getDoc(jogadora(db, ANA))).data().pistas;
  await assertFails(updateDoc(jogadora(db, ANA), {
    pistas: [...atual, PISTA_NOVA], moedas: 5, acoesMercado: 1
  }));
});

test("o jogador não mexe no balaio: ele mora no documento da sala", async () => {
  await assertFails(updateDoc(doc(como(ANA), "mosaico", SALA), {
    balaio: [{ frag: "F09", dono: ANA }]
  }));
});

test("o pedido em acoes é aceito quando o jogadorId é o próprio", async () => {
  await assertSucceeds(setDoc(doc(como(ANA), "mosaico", SALA, "acoes", ANA + "-mkt-1"), {
    tipo: "mercadoComprar", jogadorId: ANA, frag: "F09", origem: "nova"
  }));
});

test("e recusado quando o pedido diz ser de outra pessoa", async () => {
  await assertFails(setDoc(doc(como(ANA), "mosaico", SALA, "acoes", "forjado"), {
    tipo: "mercadoComprar", jogadorId: BIA, frag: "F09", origem: "nova"
  }));
});

test("o Mestre debita a moeda de quem pediu, e é ele que aplica", async () => {
  await assertSucceeds(updateDoc(jogadora(como(MESTRE), ANA), {
    moedas: 5, acoesMercado: 1
  }));
});

test("o Mestre move o balaio e credita o consignante", async () => {
  const db = como(MESTRE);
  await assertSucceeds(updateDoc(doc(db, "mosaico", SALA), {
    balaio: [{ frag: "F09", dono: BIA }]
  }));
  await assertSucceeds(updateDoc(jogadora(db, BIA), { moedas: 11 }));
});


/* ---------- ownPlayerUpdate expandido (Casa + papel/camada + HPC) ---------- */

test("convidado registra voto de envio do Fragmento", async () => {
  await assertSucceeds(updateDoc(jogadora(como(ANA), ANA), {
    pedidoEnvioFragmento: true, votoEnvioSim: true, votoEnvioMs: Date.now(), atualizadoEmMs: Date.now()
  }));
});

test("convidado grava papel cognitivo e camada", async () => {
  await assertSucceeds(updateDoc(jogadora(como(ANA), ANA), {
    papelCognitivo: "arquivista",
    camadaAcessibilidade: "assistida",
    aliasNarrativo: "Guardião do arquivo",
    atualizadoEmMs: Date.now()
  }));
});

test("convidado grava resumo hpcScaffold (mapa), não moedas", async () => {
  await assertSucceeds(updateDoc(jogadora(como(ANA), ANA), {
    hpcScaffold: {
      compare: { A: "H8", B: "H10", C: "H1" },
      compareFilled: 3,
      favorLines: 1,
      againstLines: 1,
      unexaminedCount: 0,
      socraticAnswered: 0,
      organizedComparison: true
    },
    atualizadoEmMs: Date.now()
  }));
  await assertFails(updateDoc(jogadora(como(ANA), ANA), {
    hpcScaffold: { compareFilled: 1 }, moedas: 99, atualizadoEmMs: Date.now()
  }));
});

test("convidado não escreve campo inventado no próprio doc", async () => {
  await assertFails(updateDoc(jogadora(como(ANA), ANA), {
    nucleo: 99, atualizadoEmMs: Date.now()
  }));
});

/* ── O TELÃO ─────────────────────────────────────────────────────────────
   Ele não é jogador e não é Mestre: entra anônimo na sala e só mostra. Até
   04/09/2026 carimbava a presença no DOCUMENTO da sala (`opening.status`,
   `opening.displaySeenMs`), onde `allow update` exige master() — e por isso
   toda batida voltava negada, calada, desde agosto. O Mestre nunca via telão
   vivo e a abertura caía sempre no celular dele.

   O que estas quatro asserções guardam é o par: o telão PODE escrever o
   próprio documento, e NÃO pode escrever o da sala nem o de outro aparelho. */
const TELAO = "uid-telao";
const OUTRO_TELAO = "uid-telao-2";

test("o telão anônimo grava a própria presença na sala", async () => {
  await assertSucceeds(setDoc(doc(como(TELAO), "mosaico", SALA, "telao", TELAO), {
    vistoEmMs: Date.now(), status: "ready"
  }));
});

test("mas não a de outro telão", async () => {
  await assertFails(setDoc(doc(como(TELAO), "mosaico", SALA, "telao", OUTRO_TELAO), {
    vistoEmMs: Date.now(), status: "ready"
  }));
});

/* Sem `vistoEmMs` a presença não tem idade, e "há um telão agora" vira
   "houve um telão algum dia": um telão aberto ontem sequestraria a abertura. */
test("presença sem a hora da batida é recusada", async () => {
  await assertFails(setDoc(doc(como(TELAO), "mosaico", SALA, "telao", TELAO), {
    status: "ready"
  }));
});

test("e o telão continua sem poder escrever no documento da sala", async () => {
  await assertFails(updateDoc(doc(como(TELAO), "mosaico", SALA), {
    "opening.command": "start", "opening.token": Date.now()
  }));
});

test("o Mestre lê o que o telão anunciou, e é ele quem manda tocar", async () => {
  await env.withSecurityRulesDisabled(async ctx => {
    await setDoc(doc(ctx.firestore(), "mosaico", SALA, "telao", TELAO), {
      vistoEmMs: Date.now(), status: "ready"
    });
  });
  await assertSucceeds(getDoc(doc(como(MESTRE), "mosaico", SALA, "telao", TELAO)));
  await assertSucceeds(updateDoc(doc(como(MESTRE), "mosaico", SALA), {
    "opening.command": "start", "opening.token": Date.now()
  }));
});


test('AC grupos do mestre, eventos do proprio papel e imutabilidade',async()=>{
 const master=env.authenticatedContext(MESTRE).firestore(),a=env.authenticatedContext(ANA).firestore(),b=env.authenticatedContext(BIA).firestore(),stranger=env.authenticatedContext('fora').firestore();
 const path=['mosaico',SALA,'acGrupos','g1'];
 const group={id:'g1',runId:'run1',phase:'inclinacao',master:MESTRE,players:{luz:ANA,conhecimento:BIA},fragmento:{membros:[]},endsAt:Date.now()+600000,createdAt:serverTimestamp()};
 await assertFails(setDoc(doc(a,...path),group));await assertSucceeds(setDoc(doc(master,...path),group));
 await assertFails(updateDoc(doc(master,...path),{players:{luz:BIA,conhecimento:ANA}}));
 await assertSucceeds(updateDoc(doc(master,'mosaico',SALA),{fase:'inclinacao',acElencoAtividade:{runId:'run1'}}));
 const event={uid:ANA,role:'luz',event:{type:'sala_progresso',objetos:4,total:9},at:serverTimestamp()};
 await assertSucceeds(setDoc(doc(a,...path,'eventos','e1'),event));
 await assertFails(setDoc(doc(b,...path,'eventos','e2'),event));
 await assertFails(setDoc(doc(a,...path,'eventos','e1'),event));
 await assertFails(setDoc(doc(a,...path,'eventos','e3'),{...event,event:{type:'registrar'}}));
 await assertFails(setDoc(doc(a,...path,'eventos','e4'),{...event,event:{type:'sala_progresso',objetos:99,total:9}}));
 await assertFails(setDoc(doc(a,...path,'eventos','e5'),{...event,event:{type:'sala_progresso',pontos:99}}));
 await assertFails(getDoc(doc(stranger,...path)));
 await assertSucceeds(getDocs(query(collection(a,'mosaico',SALA,'acGrupos'),where('runId','==','run1'))));
 await assertSucceeds(getDocs(collection(master,...path,'eventos')));
 await assertSucceeds(setDoc(doc(a,...path,'presenca',ANA),{uid:ANA,role:'luz',at:serverTimestamp()}));
 await assertFails(setDoc(doc(b,...path,'presenca',ANA),{uid:ANA,role:'luz',at:serverTimestamp()}));
 await updateDoc(doc(master,'mosaico',SALA),{fase:'mosaico'});
 await assertFails(setDoc(doc(a,...path,'eventos','e6'),event));
});

test('AC Firestore: trio percorre nove objetos, vela e tres chaves com resultados convergentes',async()=>{
 const {receipts}=await import('../v1/js/ac-replay.mjs');
 const master=env.authenticatedContext(MESTRE).firestore(),users={luz:ANA,conhecimento:BIA,apoio:'uid-caio'};
 await env.withSecurityRulesDisabled(ctx=>setDoc(doc(ctx.firestore(),'mosaico',SALA,'jogadores',users.apoio),{nome:'Caio'}));
 const clients=Object.fromEntries(Object.entries(users).map(([role,uid])=>[role,env.authenticatedContext(uid).firestore()]));
 const path=['mosaico',SALA,'acGrupos','trio'];
 const g={id:'trio',runId:'run-trio',phase:'inclinacao',master:MESTRE,players:users,fragmento:{membros:Object.entries(users).map(([papel,id])=>({papel,id,nome:id}))},endsAt:Date.now()+600000,createdAt:serverTimestamp()};
 await setDoc(doc(master,...path),g);await updateDoc(doc(master,'mosaico',SALA),{fase:'inclinacao',acElencoAtividade:{runId:'run-trio'}});
 let i=0;const send=async(role,event)=>assertSucceeds(setDoc(doc(clients[role],...path,'eventos',String(++i).padStart(3,'0')),{uid:users[role],role,event,at:serverTimestamp()}));
 for(const role of Object.keys(users)){await send(role,{type:'sala_progresso',objetos:4,total:9});await send(role,{type:'sala_concluida',objetos:9,total:9,tempoMs:1000});}
 await send('luz',{type:'posicionar'});await send('luz',{type:'encaixar'});
 /* O fósforo é de quem não pôs a vela: a regra recusa o "reacender" da luz. */
 await assertFails(setDoc(doc(clients.luz,...path,'eventos','reacender-luz'),{uid:users.luz,role:'luz',event:{type:'reacender'},at:serverTimestamp()}));
 await assertFails(setDoc(doc(clients.luz,...path,'eventos','orientar-antigo'),{uid:users.luz,role:'luz',event:{type:'maquete_orientar'},at:serverTimestamp()}));
 await send('luz',{type:'feixe',origin:[0,0,1],target:[0,0,0]});await send('conhecimento',{type:'descobrir'});await send('conhecimento',{type:'registrar'});await send('conhecimento',{type:'iniciar_maquete'});
 for(const [level,object] of CAPITULOS.map((c)=>c.esconderijo).entries()){
  const explorer=level===1?'conhecimento':'luz',guide=level===1?'luz':'conhecimento';
  await send(explorer,{type:'maquete_examinar',object});await send(guide,{type:'maquete_examinar',object:CAPITULOS[level].fechadura});await send(explorer,{type:'maquete_mover',tip:FECHADURAS[level]});await send(explorer,{type:'maquete_encaixar'});
 }
 const results=[];for(const db of Object.values(clients)){const s=await getDocs(collection(db,...path,'eventos'));results.push(receipts(g,s.docs.map(d=>({...d.data(),id:d.id,at:d.data().at.toMillis()}))));}
 const assert=(await import('node:assert/strict')).default;
 assert.deepEqual(results[0],results[1]);assert.deepEqual(results[1],results[2]);assert.equal(results[0][1].chaves,24);assert.equal(results[0][1].salaIndividual.apoio.pontos,9);
});


test('AC adaptador Firebase executa entrada e progresso sem API Node',async()=>{
 const fs=await import('node:fs'),url=await import('node:url');
 const dir=new URL('../.ac-ensaio/',import.meta.url);fs.mkdirSync(dir,{recursive:true});
 const source=fs.readFileSync(new URL('../v1/js/ac-firestore.mjs',import.meta.url),'utf8').replace('https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js','firebase/firestore').replace("'./ac-replay.mjs'",JSON.stringify(new URL('../v1/js/ac-replay.mjs',import.meta.url).href));
 const file=new URL('adapter-test.mjs',dir);fs.writeFileSync(file,source);
 const master=env.authenticatedContext(MESTRE).firestore(),a=env.authenticatedContext(ANA).firestore();
 const previousWindow=globalThis.window,previousLocation=globalThis.location;
 const select=(db,uid)=>{globalThis.window={DragonSala:{db,root:'mosaico',codigo:SALA,auth:{currentUser:{uid}}}};};
 globalThis.location={href:'http://localhost/v1/AC-percurso.html'};
 try{
  const m=await import(file.href+'?v='+Date.now());select(master,MESTRE);
  await m.prepare(SALA,'adapter-run',[{id:ANA,nome:'Ana'},{id:BIA,nome:'Bia'}],'inclinacao',600000);
  await updateDoc(doc(master,'mosaico',SALA),{fase:'inclinacao',acElencoAtividade:{runId:'adapter-run'}});
  select(a,ANA);const entry=await m.request('/api/ac/fragmentos/entrar',{body:JSON.stringify({run:'adapter-run',jogador:'forjado'})});
  const assert=(await import('node:assert/strict')).default;assert.equal(entry.ok,true);const c=await entry.json();assert.ok(c.sala);
  const q=new URLSearchParams({sala:c.sala,papel:c.papel,chave:c.chave});
  const sent=await m.request('/api/ac/action?'+q,{body:JSON.stringify({type:'sala_progresso',objetos:5,total:9})});assert.equal(sent.status,200);
  const state=await(await m.request('/api/ac/state?'+q)).json();assert.equal(state.percurso.salaIndividual[c.papel].pontos,5);
  const wrong=new URLSearchParams(q);wrong.set('papel',c.papel==='luz'?'conhecimento':'luz');assert.equal((await m.request('/api/ac/state?'+wrong)).status,403);
  select(master,MESTRE);const rows=await(await m.request('/api/ac/individual?run=adapter-run')).json();assert.equal(rows[0].salaIndividual[c.papel].pontos,5);
 }finally{globalThis.window=previousWindow;globalThis.location=previousLocation;}
});

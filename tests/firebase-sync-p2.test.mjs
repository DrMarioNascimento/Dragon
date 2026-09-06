/* P2 Firebase sync — raízes canônicas, aliases legados, partidaId vs partida.pergunta.
 * Conservador: documenta aliases em rules; clientes só usam mosaico/noite.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const ler = (p) =>
  readFileSync(new URL(`../${p}`, import.meta.url), "utf8").replace(/\r\n/g, "\n");

const RULES = ler("firestore.rules");
const ROOM = ler("firebase-room.js");
const CELULAR = ler("carro-forte/celular.html");
const NOITE_INDEX = ler("carro-forte/noite/index.html");
const PAUTA = ler("carro-forte/pauta-da-mesa.js");
const PONTE = ler("carro-forte/celular-para-noite.js");
const CASA = ler("v1/MOSAICO-mesa.html");
const TELAO = ler("telao.html");
const SOLO = ler("solo/index.html");
const SEC = ler("FIREBASE-SECURITY.md");
const ISO = ler("FIREBASE-ISOLAMENTO.md");
const NOITE_DOC = ler("FIREBASE-NOITE.md");

test("known() mantém raízes canônicas e aliases legados documentados", () => {
  assert.match(
    RULES,
    /function known\(v\) \{ return v in \['mosaico','noite','carroforte','carroforte-noite'\]; \}/,
  );
  assert.match(RULES, /aliases legados|legado/, "comentário dos aliases sumiu");
  assert.match(
    RULES,
    /function validPartida\(id\) \{ return id in \['sete','cinco','apagao','nome','corpo','perceber'\]; \}/,
  );
  assert.match(RULES, /partida\.pergunta|Casa \(raiz partidaId\)/, "escopo de validPartida sem comentário");
});

test("clientes canônicos não usam raízes carroforte / carroforte-noite", () => {
  /* data-root / root: / RAIZ / colecao / COLECAO / doc(db, '…') */
  const fontes = [
    ["firebase-room.js", ROOM],
    ["carro-forte/celular.html", CELULAR],
    ["carro-forte/noite/index.html", NOITE_INDEX],
    ["carro-forte/pauta-da-mesa.js", PAUTA],
    ["carro-forte/celular-para-noite.js", PONTE],
    ["v1/MOSAICO-mesa.html", CASA],
    ["telao.html", TELAO],
  ];
  for (const [nome, src] of fontes) {
    assert.ok(
      !/data-root=["']carroforte/.test(src),
      `${nome} aponta data-root para alias legado`,
    );
    assert.ok(
      !/root:\s*['"]carroforte/.test(src),
      `${nome} seta root legado no dataset`,
    );
    assert.ok(
      !/colecao:\s*['"]carroforte/.test(src),
      `${nome} usa colecao carroforte no telão/cliente`,
    );
    assert.ok(
      !/COLECAO\s*=\s*['"]carroforte/.test(src),
      `${nome} define COLECAO legado`,
    );
    assert.ok(
      !/doc\(db,\s*['"]carroforte/.test(src),
      `${nome} escreve em coleção-raiz legado`,
    );
  }
});

test("Carro Celular / Noite / Casa usam mosaico e noite como pretendido", () => {
  assert.match(CELULAR, /data-project="noite"/);
  assert.match(CELULAR, /data-root="mosaico"/);
  assert.match(NOITE_INDEX, /project:'noite'|project:"noite"/);
  assert.match(NOITE_INDEX, /root:'noite'|root:"noite"/);
  assert.match(PAUTA, /projectId:\s*'mosaico-noite'/);
  assert.match(PAUTA, /COLECAO\s*=\s*'mosaico'/);
  assert.match(PONTE, /projectId:\s*'mosaico-noite'/);
  assert.match(PONTE, /doc\(db,\s*'noite'/);
  assert.match(PONTE, /doc\(db,\s*'mosaico'/);
  assert.match(CASA, /projectId:\s*"mosaico-game"/);
  assert.match(CASA, /const RAIZ = "mosaico"/);
  assert.match(SOLO, /data-project="mesa"/, "Solo Casa deve usar alias mesa → mosaico-game");
  assert.match(TELAO, /'casa-da-costa':\{fb:FB_MESA,colecao:'mosaico'/);
  assert.match(TELAO, /'carro-forte':\{fb:FB_NOITE,colecao:'mosaico'/);
  assert.match(TELAO, /'carro-forte-noite':\{fb:FB_NOITE,colecao:'noite'/);
});

test("Carro grava pergunta aninhada; não escreve partidaId na raiz da sala", () => {
  assert.match(PAUTA, /'partida\.pergunta'\s*:/, "pauta perdeu partida.pergunta");
  assert.match(PONTE, /'partida\.pergunta'\s*:/, "ponte perdeu seed de partida.pergunta");
  assert.match(PONTE, /partida:\s*partidaBase|partida:\s*\{/, "ponte deve semear mapa partida");
  /* Clientes Carro + firebase-room não usam o campo raiz partidaId (só Casa). */
  for (const [nome, src] of [
    ["pauta-da-mesa.js", PAUTA],
    ["celular-para-noite.js", PONTE],
    ["firebase-room.js", ROOM],
  ]) {
    assert.ok(!/\bpartidaId\b/.test(src), `${nome} passou a mencionar partidaId na raiz`);
  }
  const rotacao = ler("v1/js/rotacao-partidas-casa.js");
  assert.match(rotacao, /atualizarMesa\([^)]*partidaId/, "Casa perdeu gravação de partidaId");
});

test("docs Firebase concordam no mapeamento caso→projeto e Solo Casa", () => {
  assert.match(SEC, /mosaico-game/);
  assert.match(SEC, /mosaico-noite/);
  assert.match(SEC, /casa-da-costa-solo.*mosaico-game|Solo.*mosaico-game/s);
  assert.ok(!/\*\*Modo Solo\*\*.*mosaico-noite/s.test(SEC), "SECURITY voltou Solo→mosaico-noite");
  assert.match(SEC, /aliases legados|carroforte/);
  assert.match(ISO, /Casa da Costa.*mosaico-game/s);
  assert.match(ISO, /Carro-Forte.*mosaico-noite|Manhã do Carro-Forte.*mosaico-noite/s);
  assert.match(NOITE_DOC, /Solo Casa:.*mosaico-game/);
  assert.match(NOITE_DOC, /Carro-Forte \/ Celular: `mosaico\/\{codigo}` em `mosaico-noite`/);
  assert.ok(
    !/Mesa\/Noite share|compartilham.*mesmo projeto Firebase|Mesa e A Noite.*mesmo projeto/i.test(
      SEC + ISO + NOITE_DOC,
    ),
    "docs ainda sugerem Mesa/Noite no mesmo projeto",
  );
});

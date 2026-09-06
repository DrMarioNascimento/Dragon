/* A Casa da Costa publica publicState para o telão compartilhado.
 * =========================================================================
 *
 * Depois da unificação MOSAICO (PR #6), `telao.html?jogo=casa-da-costa` já
 * apontava para mosaico-game / coleção mosaico — mas ninguém escrevia
 * `publicState`. O telão ficava no cartão de espera para sempre. Este arquivo
 * guarda o contrato: quem escreve, o que sobe, e o que NÃO sobe.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const ler = (p) =>
  readFileSync(new URL(`../${p}`, import.meta.url), "utf8").replace(/\r\n/g, "\n");

const semComentarios = (s) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");

const PUB = ler("v1/js/telao-publica.js");
const V5 = ler("v1/js/mosaico-v5.js");
const MESA = ler("v1/MOSAICO-mesa.html");
const TELAO = ler("telao.html");
const LANDING = ler("casa-da-costa/index.html");
const HUB = ler("index.html");
const REGRAS = ler("firestore.rules");

test("o telão conhece a chave casa-da-costa no projeto certo", () => {
  assert.match(
    TELAO,
    /'casa-da-costa':\{fb:FB_MESA,colecao:'mosaico'/,
    "casa-da-costa saiu da tabela JOGOS ou apontou para o Firebase errado",
  );
  assert.match(TELAO, /projectId:'mosaico-game'/, "FB_MESA deixou de ser mosaico-game");
});

test("a Casa carrega quem publica para o telão", () => {
  assert.match(
    V5,
    /telao-publica\.js\?v=/,
    "mosaico-v5.js deixou de carregar telao-publica.js na cascata da Casa",
  );
  assert.match(PUB, /MosaicoTelaoPublica/, "a API pública do publisher sumiu");
});

test("só o Mestre grava, pelo mesmo MosaicoFB da sala", () => {
  const codigo = semComentarios(PUB);
  assert.match(codigo, /souMestreDaMesa/, "o publisher não confere se é o Mestre");
  assert.match(codigo, /atualizarMesa/, "o publisher não reaproveita MosaicoFB.atualizarMesa");
  assert.ok(
    !/initializeApp|signInAnonymously/.test(codigo),
    "voltou um app Firebase paralelo — outro uid, e as regras negam a gravação",
  );
});

test("o schema publicado é o que o telao.html já sabe desenhar", () => {
  for (const campo of [
    "publicState.questionTitle",
    "publicState.questionText",
    "publicState.perguntaId",
    "publicState.fields",
    "publicState.resposta",
    "partida.fase",
  ]) {
    assert.match(PUB, new RegExp(campo.replace(".", "\\.")), `falta publicar ${campo}`);
  }
  assert.match(TELAO, /pub\?\.questionText/, "o telão deixou de exigir questionText para sair da espera");
  assert.match(TELAO, /pub\.fields/, "o telão deixou de desenhar fields");
  assert.match(TELAO, /agoraHtml\(room\?\.partida\?\.fase/, "o telão deixou de ler partida.fase");
});

test("não sobe placar de um aparelho vestido de mesa", () => {
  const codigo = semComentarios(PUB);
  assert.ok(!/'A mesa'/.test(codigo), "voltou o placar de uma linha só chamado 'A mesa'");
  /* placar parcial em publicState.placar é o defeito do Carro; aqui zeramos e
     o pódio mora em partida.fecho, com totais já coletivos. */
  assert.match(PUB, /["']publicState\.placar["']\s*:\s*\[\]/, "publicState.placar deixou de nascer vazio");
  assert.match(PUB, /partida\.fecho/, "o pódio final não sobe em partida.fecho");
});

test("o relógio publicado é o da mesa (dadosAutomacao), não um timer local", () => {
  assert.match(PUB, /dadosAutomacao/, "o publisher não lê o prazo coletivo da mesa");
  assert.match(PUB, /fimMs/, "partida.fase sobe sem fimMs para o relógio do telão");
  assert.ok(
    !/setInterval\([^,]+,\s*1000\)/.test(semComentarios(PUB)) || /setInterval\(sincronizar,\s*1500\)/.test(PUB),
    "há um cronômetro de aparelho sendo tratado como fato da sala",
  );
});

test("a Mesa e o hub apontam o telão compartilhado", () => {
  assert.match(MESA, /function linkDoTelao\(/, "sumiu o helper do endereço do telão");
  assert.match(MESA, /jogo","casa-da-costa"/, "o link do telão perdeu a chave do jogo");
  /* Bloco "abra o telão" saiu do painel Sala — entrada é pelo hub. */
  assert.match(HUB, /telao\.html\?jogo=casa-da-costa/, "hub Telão da Casa");
  assert.match(LANDING, /MOSAICO-mesa\.html/, "pasta do caso redireciona ao Celular");
  assert.match(MESA, /#dragonSalaBtn\{display:none/, "Sala flutuante some; fica a do topo");
});

test("o hub da Casa aponta o telão para a chave certa", () => {
  assert.match(
    HUB,
    /telao\.html\?jogo=casa-da-costa/,
    "a porta Telão da Casa no hub deixou de apontar para o telão compartilhado",
  );
});

test("as regras já deixam o Mestre gravar publicState no doc da sala", () => {
  /* Nested maps não pedem match próprio: o update do documento exige master().
     Se alguém restringir affectedKeys no update da sala, este teste precisa
     mudar junto — e o deploy das regras volta a ser obrigatório. */
  assert.match(
    REGRAS,
    /allow update: if \(master\(versao,roomId\)/,
    "a regra de update da sala deixou de autorizar o Mestre — publicState pararia de gravar",
  );
  assert.match(REGRAS, /match \/telao\/\{id\}/, "a presença do telão perdeu o match próprio");
});

test("montar() devolve o patch esperado a partir de um STATE mínimo", () => {
  const fake = {
    STATE: {
      mesa: { codigo: "ABC123" },
      doc: { fase: "inclinacao", partidaId: "sete", inclinacaoAbertaMs: 1_000 },
      jogadores: [{ nome: "Ana", total: 12 }, { nome: "Bia", total: 20 }],
    },
    CASO: {
      perguntaPadrao: "sete",
      partidas: {
        sete: {
          titulo: "Sete",
          natureza: "QUANTO",
          pergunta: "Quantas estavam dentro?",
          revelacao: "Estavam sete.",
          campos: [{ id: "n", rotulo: "Contagem", resposta: "7" }],
        },
      },
    },
    dadosAutomacao: () => ({ fase: "inclinacao", inicio: 1_000, limite: 180_000 }),
    nomeRodada: (f) => (f === "inclinacao" ? "A Janela do Norte" : f),
    souMestreDaMesa: () => true,
    document: { readyState: "complete", addEventListener() {}, querySelector() { return null; } },
    setTimeout() {},
    setInterval() { return 1; },
    clearInterval() {},
    console,
  };
  const runner = new Function(
    "window",
    PUB.replace(
      'typeof window !== "undefined" ? window : globalThis',
      "window",
    ) + "\nreturn window.MosaicoTelaoPublica;",
  );
  const api = runner(fake);
  assert.ok(api && typeof api.montar === "function", "MosaicoTelaoPublica.montar sumiu");

  const patch = api.montar();
  assert.ok(patch, "montar() devolveu null com STATE válido");
  assert.equal(patch["publicState.questionText"], "Quantas estavam dentro?");
  assert.match(patch["publicState.questionTitle"], /Sete/);
  assert.equal(patch["publicState.perguntaId"], "sete");
  assert.equal(patch["publicState.resposta"], "");
  assert.equal(patch["partida.fase"].nome, "inclinacao");
  assert.equal(patch["partida.fase"].fimMs, 181_000);
  assert.equal(patch["publicState.fields"][0].label, "Contagem");
  assert.equal(patch["publicState.fields"][0].closed, false);

  fake.STATE.doc.fase = "resultado";
  const fim = api.montar();
  assert.equal(fim["publicState.resposta"], "Estavam sete.");
  assert.equal(fim["publicState.fields"][0].closed, true);
  assert.equal(fim["partida.fecho"].fase, "podio");
  assert.equal(fim["partida.fecho"].placar[0].nome, "Bia");
});

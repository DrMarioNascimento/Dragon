/* Guarda: partida sequencial + pontuação após unificação (Celular · Telão · Solo).
 * =========================================================================
 * PR #6 rewireou o Carro-Forte para mosaico-noite, mas a pauta da Mesa Celular
 * ficou apontando para mosaico-game / dragon-mesa. Sem este teste, a regressão
 * volta calada: sala num projeto, placar/fecho no outro.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";

const ler = (p) =>
  readFileSync(new URL(`../${p}`, import.meta.url), "utf8").replace(/\r\n/g, "\n");

const PAUTA = ler("carro-forte/pauta-da-mesa.js");
const CELULAR = ler("carro-forte/celular.html");
const CASA = ler("v1/MOSAICO-mesa.html");
const LANDING_CASA = ler("casa-da-costa/index.html");
const LANDING_CARRO = ler("carro-forte/index.html");
const TELAO = ler("telao.html");
const REDIRECT_MESA = ler("carro-forte-mesa/index.html");
const REDIRECT_NOITE = ler("carro-forte-noite/index.html");
const ROOT_MESA = ler("MOSAICO-mesa.html");

test("a pauta do Carro-Forte Celular fala com mosaico-noite, não com mosaico-game", () => {
  assert.match(PAUTA, /projectId:\s*'mosaico-noite'/, "CFG da pauta não é mosaico-noite");
  assert.match(PAUTA, /dragon-noite/, "a pauta não reaproveita o app dragon-noite");
  assert.ok(
    !/projectId:\s*'mosaico-game'/.test(PAUTA),
    "a pauta voltou a apontar para mosaico-game — placar e fecho saem do projeto da sala",
  );
  assert.ok(
    !/dragon-mesa/.test(PAUTA),
    "a pauta voltou a procurar dragon-mesa — cria app paralelo no Firebase errado",
  );
});

test("o celular do Carro-Forte carrega firebase-room no projeto noite", () => {
  assert.match(CELULAR, /data-project="noite"/, "celular.html perdeu data-project=noite");
  assert.match(CELULAR, /data-root="mosaico"/, "celular.html perdeu a coleção mosaico");
  assert.match(CELULAR, /data-telao="\.\.\/telao\.html\?jogo=carro-forte"/);
});

test("finalizarPartida aplica o placar no STATE local antes da fase resultado", () => {
  const trecho = CASA.slice(CASA.indexOf("async function finalizarPartida"));
  const calc = trecho.indexOf("MosaicoV5.calcular(");
  const local = trecho.indexOf("j.total=l.total");
  const fase = trecho.indexOf("fase:'resultado'");
  assert.ok(calc > 0 && local > calc, "o placar local não é aplicado depois do cálculo");
  assert.ok(fase > local, "a fase resultado sobe antes dos totais locais — telão anuncia zero");
  assert.match(trecho, /codigoSala/, "finalizarPartida voltou a depender só de STATE.mesa.codigo");
});

test("landings e redirects chegam a fluxos que existem", () => {
  assert.match(LANDING_CASA, /\.\.\/v1\/MOSAICO-mesa\.html/);
  assert.match(LANDING_CASA, /telao\.html\?jogo=casa-da-costa/);
  assert.match(LANDING_CASA, /\.\.\/solo\//);
  assert.match(LANDING_CARRO, /celular\.html/);
  assert.match(LANDING_CARRO, /telao\.html\?jogo=carro-forte/);
  assert.match(LANDING_CARRO, /celular\.html\?soloLab=1/);
  assert.match(REDIRECT_MESA, /carro-forte\/celular\.html/);
  assert.match(REDIRECT_NOITE, /carro-forte\/noite\//);
  assert.match(ROOT_MESA, /v1\/MOSAICO-mesa\.html/);
  assert.ok(existsSync(new URL("../carro-forte/celular.html", import.meta.url)));
  assert.ok(existsSync(new URL("../carro-forte/noite/index.html", import.meta.url)));
  assert.ok(existsSync(new URL("../v1/MOSAICO-mesa.html", import.meta.url)));
  assert.ok(existsSync(new URL("../solo/index.html", import.meta.url)));
});

test("o telão isola Casa em mosaico-game e Carro em mosaico-noite", () => {
  assert.match(TELAO, /'casa-da-costa':\{fb:FB_MESA,colecao:'mosaico'/);
  assert.match(TELAO, /'carro-forte':\{fb:FB_NOITE,colecao:'mosaico'/);
  assert.match(TELAO, /'carro-forte-noite':\{fb:FB_NOITE,colecao:'noite'/);
});

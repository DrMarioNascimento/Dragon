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
const CASA_V2 = ler("v1/js/casa-da-costa-v2.js");
const MOSAICO_V5 = ler("v1/js/mosaico-v5.js");
const PAUTA_CF = ler("carro-forte/pauta-da-mesa.js");
const GAME_CF = ler("carro-forte/game.js");
const LANDING_CASA = ler("casa-da-costa/index.html");
const LANDING_CARRO = ler("carro-forte/index.html");
const HUB = ler("index.html");
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
  assert.ok(fase > local, "a fase resultado sobe antes dos totais locais — telão anuncia zeros");
  assert.match(trecho, /codigoSala/, "finalizarPartida voltou a depender só de STATE.mesa.codigo");
});

test("o override v2 de finalizarPartida também aplica totais locais antes do resultado", () => {
  const trecho = CASA_V2.slice(CASA_V2.indexOf("global.finalizarPartida"));
  const calc = trecho.indexOf("MosaicoV5.calcular(");
  const local = trecho.indexOf("j.total=l.total");
  const fase = trecho.indexOf("fase:'resultado'");
  assert.ok(calc > 0, "casa-da-costa-v2.js perdeu MosaicoV5.calcular em finalizarPartida");
  assert.ok(local > calc, "o override v2 publica sem aplicar j.total — telão/pódio zerados no 1º paint");
  assert.ok(fase > local, "o override v2 sobe fase resultado antes dos totais locais");
  assert.match(trecho, /codigoSala/, "o override v2 voltou a depender só de STATE.mesa.codigo");
  assert.match(
    MOSAICO_V5,
    /casa-da-costa-v2\.js\?v=20260906-fecho-local/,
    "mosaico-v5.js não carrega o v2 com o carimbo do fecho local",
  );
});

test("o rodízio do Carro-Forte sobe para o documento da sala em multiplayer", () => {
  assert.match(PAUTA_CF, /partida\.rodizio/, "a pauta não grava partida.rodizio na sala");
  assert.match(PAUTA_CF, /marcarFechadaSala/, "a pauta não expõe marcarFechadaSala");
  assert.match(PAUTA_CF, /avancar/, "escolher não aceita o avançador de saco compartilhado");
  assert.match(
    PAUTA_CF,
    /congelada|!novaRodada/,
    "mestre redesenha mesmo com pergunta já congelada na sala",
  );
  assert.ok(
    !/O RODÍZIO NÃO SOBE JUNTO/.test(PAUTA_CF),
    "o comentário ainda diz que o rodízio não sobe — o contrato mudou",
  );
  assert.match(GAME_CF, /function avancarRodizio/, "game.js perdeu avancarRodizio");
  assert.match(
    GAME_CF,
    /escolher\(local,anterior\|\|null,meu,avancarRodizio\)/,
    "abrirPauta não passa avancarRodizio para a pauta",
  );
  assert.match(GAME_CF, /marcarFechadaSala/, "marcarFechada não delega à sala em multiplayer");
  assert.match(
    GAME_CF,
    /MosaicoPauta\?\.rodizio/,
    "fechadas() não lê o rodízio canônico da sala",
  );
  /* Solo/offline ainda pode usar localStorage — multiplayer não pode ser a
     única fonte do saco no aparelho do Mestre na hora do sorteio. */
  const escolher = PAUTA_CF.slice(PAUTA_CF.indexOf("async function escolher"));
  const mestreBlock = escolher.slice(0, escolher.indexOf("/* Convidado"));
  assert.match(mestreBlock, /partida\.rodizio/, "mestre não persiste o saco no doc da sala");
  assert.ok(
    /getDoc/.test(mestreBlock),
    "mestre sorteia sem ler a sala antes — recarga redesenharia a pergunta",
  );
});

test("landings e redirects chegam a fluxos que existem", () => {
  assert.match(LANDING_CASA, /\.\.\/v1\/MOSAICO-mesa\.html/);
  assert.equal(/data-mode-ctas/.test(LANDING_CASA), false);
  assert.match(LANDING_CARRO, /celular\.html/);
  assert.equal(/data-mode-ctas/.test(LANDING_CARRO), false);
  assert.match(HUB, /telao\.html\?jogo=casa-da-costa/);
  assert.match(HUB, /telao\.html\?jogo=carro-forte/);
  assert.match(HUB, /href="solo\/"/);
  assert.match(HUB, /celular\.html\?soloLab=1/);
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

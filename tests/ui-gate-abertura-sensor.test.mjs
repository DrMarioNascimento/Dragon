/**
 * Gate Celular Abrir|Entrar, abertura Solo/Mestre/Telão, sensor soft deadline.
 */
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const ler = (p) => readFileSync(join(root, p), "utf8").replace(/\r\n/g, "\n");

const ROOM = ler("firebase-room.js");
const PAUTA = ler("carro-forte/pauta-da-mesa.js");
const MESA = ler("v1/MOSAICO-mesa.html");
const TS = ler("v1/js/tarefa-sensor.js");
const JANELA = ler("v1/MOSAICO-26-a-janela-do-norte.html");
const ATIV = ler("carro-forte/atividade.js");
const TELAO = ler("telao.html");
const PADRAO = ler("PADRAO-SALA-MULTIPLAYER.md");
const CEL = ler("carro-forte/celular.html");
const GAME = ler("carro-forte/game.js");
const OPEN = ler("carro-forte/opening-flow.js");
const HUB = ler("index.html");
const SOLO_CASA = ler("solo/index.html");

describe("abertura · roteamento", () => {
  it("Carro: convidado espera; Mestre toca local ou aciona telão", () => {
    assert.match(PAUTA, /async function abertura\(/);
    assert.match(PAUTA, /if \(!souMestre\(\)\)/);
    assert.match(PAUTA, /usouTelao = await telaoVivo/);
    assert.match(PAUTA, /opening\.command.*start|opening\.command': 'start'/);
  });

  it("Casa: com telão vivo manda opening.command; sem telão toca no Mestre", () => {
    const fn = MESA.slice(MESA.indexOf("function sincronizarAudioAbertura"), MESA.indexOf("function vozDaFase"));
    assert.match(fn, /DragonSala\.telaoPronto/);
    assert.match(fn, /opening\.command/);
    assert.match(fn, /tocarAberturaComAmbiente/);
  });

  it("Telão Casa tem áudio da abertura", () => {
    assert.match(TELAO, /casa-da-costa[\s\S]*A-Casa-da-Costa-Abertura\.mp3/);
  });
});

describe("abertura · Carro Celular / Solo / Telão wiring", () => {
  it("Celular carrega opening-flow antes de game.js e chama abertura no boot", () => {
    const iOpen = CEL.indexOf("carregar('opening-flow.js");
    const iGame = CEL.indexOf("carregar('game.js");
    assert.ok(iOpen > 0 && iGame > iOpen, "celular.html perdeu opening-flow.js antes de game.js");
    assert.match(CEL, /carregar\('opening-flow\.js\?v=/);
    assert.match(GAME, /function pedirAbertura\(/);
    assert.match(GAME, /pedirAbertura\(\);/);
    assert.match(GAME, /quandoAbertura\(\(\)=>abrirPauta\(\)\)/);
    assert.match(GAME, /MosaicoPauta\?\.abertura/);
  });

  it("Solo ?soloLab=1 libera ensaio local (sem Google) e toca neste aparelho", () => {
    assert.match(HUB, /celular\.html\?soloLab=1/);
    assert.match(ROOM, /async function iniciarEnsaioLocal\(/);
    assert.match(ROOM, /if\(querEnsaio\)return iniciarEnsaioLocal\(\)/);
    assert.match(PAUTA, /if \(!code\) \{ tocarAqui\(entrar\); return; \}/);
    assert.match(PAUTA, /MosaicoOpening\?\.show/);
    assert.match(OPEN, /#mosaicoPrep|#mosaicoOpening/);
    assert.match(OPEN, /mosaico-opening-finished/);
    assert.match(OPEN, /window\.MosaicoOpening\s*=/);
  });

  it("Telão carro-forte tem arte + áudio e consome opening.command", () => {
    assert.match(TELAO, /const ARTE_CF=\{/);
    assert.match(TELAO, /abertura:'carro-forte\/noite\/AberturaTel/);
    assert.match(TELAO, /audio:'carro-forte\/noite\/Amanha-do-carroforte\.mp3/);
    assert.match(TELAO, /'carro-forte':\{fb:FB_NOITE,colecao:'mosaico'[\s\S]*?\.\.\.ARTE_CF\}/);
    assert.match(TELAO, /async function startOpening/);
    assert.match(TELAO, /if\(o\.command==='start'&&token&&token!==lastToken\)/);
    assert.match(TELAO, /id="opening"/);
    assert.match(TELAO, /id="openingAudio"/);
  });

  it("arquivos da abertura do Carro existem no disco", () => {
    const noite = join(root, "carro-forte", "noite");
    const nomes = readdirSync(noite);
    assert.ok(nomes.includes("AberturaCelular.jpg"), "faltou AberturaCelular.jpg");
    assert.ok(nomes.some((n) => /^AberturaTel/.test(n) && n.endsWith(".jpg")), "faltou AberturaTelão.jpg");
    assert.ok(nomes.includes("Amanha-do-carroforte.mp3"), "faltou Amanha-do-carroforte.mp3");
    assert.ok(existsSync(join(root, "carro-forte", "opening-flow.js")));
  });

  it("opening-flow resolve mídia a partir do script, não do documento", () => {
    assert.match(OPEN, /document\.currentScript/);
    assert.match(OPEN, /noite\/AberturaCelular\.jpg/);
    assert.match(OPEN, /noite\/Amanha-do-carroforte\.mp3/);
    assert.match(OPEN, /z-index:100060/);
  });

  it("Casa Solo e Casa Mesa não perderam a própria abertura", () => {
    assert.match(SOLO_CASA, /abertura-casa\.js/);
    assert.match(SOLO_CASA, /MosaicoAberturaCasa\.mostrar/);
    const fn = MESA.slice(MESA.indexOf("function sincronizarAudioAbertura"), MESA.indexOf("function vozDaFase"));
    assert.match(fn, /tocarAberturaComAmbiente/);
    assert.match(ler("abertura-casa.js"), /function mostrar\(/);
  });
});

describe("sensor · finger + soft deadline", () => {
  it("tarefa-sensor expõe prazoSuave 50s", () => {
    assert.match(TS, /SOFT_DEADLINE_MS\s*=\s*50000/);
    assert.match(TS, /prazoSuave\s*=\s*function/);
  });

  it("tarefa-sensor: avisoAntesModoDedo (3s) + gate OK+countdown", async () => {
    assert.match(TS, /AVISO_MODO_DEDO_SEG\s*=\s*3/);
    assert.match(TS, /avisoAntesModoDedo\s*=\s*function/);
    assert.match(TS, /modoDedoPodeLiberar\s*=\s*function/);
    assert.match(TS, /Seu telefone não tem ou não funciona o giroscópio/);
    assert.match(TS, /liberado para deslize por dedo/);
    const { createContext, runInContext } = await import("node:vm");
    const ctx = createContext({
      setTimeout,
      clearTimeout,
      setInterval,
      clearInterval,
      URL,
      location: { href: "http://localhost/" },
      document: {
        currentScript: null,
        querySelector: () => null,
        createElement: () => ({ dataset: {}, style: {}, setAttribute() {}, addEventListener() {}, appendChild() {} }),
        body: { appendChild() {} },
        head: { appendChild() {} },
      },
    });
    ctx.window = ctx;
    ctx.globalThis = ctx;
    runInContext(TS + "; this.__TS = TarefaSensor;", ctx);
    const api = ctx.__TS;
    assert.equal(api.AVISO_MODO_DEDO_SEG, 3);
    assert.equal(
      api.AVISO_MODO_DEDO_TIT,
      "Seu telefone não tem ou não funciona o giroscópio."
    );
    assert.equal(
      api.avisoModoDedoTexto(3),
      "Após 3 segundos ele será liberado para deslize por dedo. Aguarde."
    );
    assert.equal(api.modoDedoPodeLiberar({ countdownOk: false, usuarioOk: true }), false);
    assert.equal(api.modoDedoPodeLiberar({ countdownOk: true, usuarioOk: false }), false);
    assert.equal(api.modoDedoPodeLiberar({ countdownOk: true, usuarioOk: true }), true);
  });

  it("Janela do Norte Casa: finger mode + prazo suave; CTA Casa-correto", () => {
    assert.match(JANELA, /entrarModoDedo/);
    assert.match(JANELA, /cairNoModoDedo/);
    assert.match(JANELA, /avisoAntesModoDedo/);
    assert.match(JANELA, /armarPrazoSuave/);
    assert.match(JANELA, /Apontar a janela/);
    assert.equal(/Descer do carro/i.test(JANELA), false);
  });

  it("tarefa-sensor: modal de elenco exige OK antes da Janela", async () => {
    assert.match(TS, /avisoElencoAntesJanela\s*=\s*function/);
    assert.match(TS, /elencoPodeLiberar\s*=\s*function/);
    assert.match(TS, /Os personagens do jogo são:/);
    assert.match(TS, /O seu personagem é:/);
    assert.match(TS, /ELENCO_CASA_CANONICO/);
    assert.match(TS, /injetarProfundidade1mais1/);
    assert.match(TS, /pf-card/);
    assert.match(TS, /pf-inset/);
    assert.match(TS, /pf-btn-gold/);
    assert.equal(/#ff9a4d/.test(TS), false);
    const { createContext, runInContext } = await import("node:vm");
    const ctx = createContext({
      setTimeout,
      clearTimeout,
      setInterval,
      clearInterval,
      URL,
      location: { href: "http://localhost/" },
      document: {
        currentScript: null,
        querySelector: () => null,
        createElement: () => ({ dataset: {}, style: {}, setAttribute() {}, addEventListener() {}, appendChild() {} }),
        body: { appendChild() {} },
        head: { appendChild() {} },
      },
    });
    ctx.window = ctx;
    ctx.globalThis = ctx;
    runInContext(TS + "; this.__TS = TarefaSensor;", ctx);
    const api = ctx.__TS;
    assert.equal(api.elencoPodeLiberar({ usuarioOk: false }), false);
    assert.equal(api.elencoPodeLiberar({ usuarioOk: true }), true);
    assert.equal(api.ELENCO_TIT, "Os personagens do jogo são:");
    assert.equal(api.ELENCO_SEU_TIT, "O seu personagem é:");
    const casa = JSON.parse(ler("v1/casos/casa-da-costa.json"));
    const host = (v) => JSON.parse(JSON.stringify(v));
    assert.deepEqual(
      host(api.ELENCO_CASA_CANONICO.map((p) => p.id)),
      casa.elenco.map((p) => p.id)
    );
    assert.deepEqual(
      host(api.ELENCO_CASA_CANONICO.map((p) => p.av)),
      casa.elenco.map((p) => p.av)
    );
    const resolvido = api.resolverElenco({
      elenco: casa.elenco,
      eu: { personagem: "jornalista", forma: "f" },
    });
    assert.equal(resolvido.meu.id, "jornalista");
    assert.equal(resolvido.meu.nome, "A Jornalista");
    assert.equal(resolvido.personagens.length, 6);
    let liberou = false;
    api.avisoElencoAntesJanela({
      elenco: [],
      caso: "carro-forte",
      aoLiberar: () => { liberou = true; },
    });
    assert.equal(liberou, true, "sem elenco conhecido não inventa nomes nem bloqueia");
  });

  it("Janela Casa: OK do elenco é obrigatório para começar", () => {
    assert.match(JANELA, /avisoElencoAntesJanela/);
    assert.match(JANELA, /elencoJanelaPodeComecar/);
    assert.match(JANELA, /if\s*\(\s*!elencoJanelaPodeComecar\(\)\s*\)\s*return/);
    assert.match(JANELA, /caso:\s*["']casa-da-costa["']/);
  });

  it("Casa sensor: overlayPausa é cartão 1+1, não scrim plano", () => {
    for (const path of [
      "v1/MOSAICO-26-vidro-embacado.html",
      "v1/MOSAICO-26-a-sala-as-escuras.html",
      "v1/MOSAICO-26-a-janela-do-norte.html",
    ]) {
      const src = ler(path);
      assert.match(src, /className="pf-pausa"/, path);
      assert.match(src, /pf-pausa-card/, path);
      assert.match(src, /pf-pausa-msg/, path);
      assert.equal(/background:rgba\(0,0,0,\.86\);color:#cfc6b6/.test(src), false, path);
    }
  });

  it("Vidro e Sala Casa: cairNoModoDedo antes do dedo", () => {
    const VIDRO = ler("v1/MOSAICO-26-vidro-embacado.html");
    const SALA = ler("v1/MOSAICO-26-a-sala-as-escuras.html");
    for (const src of [VIDRO, SALA, JANELA]) {
      assert.match(src, /function cairNoModoDedo/);
      assert.match(src, /avisoAntesModoDedo/);
      assert.match(src, /aoNegar:\s*function\(\)\{\s*cairNoModoDedo/);
    }
  });

  it("Carro atividade: soft 50s sem fimMs da mesa", () => {
    assert.match(ATIV, /SOFT_MS\s*=\s*50000/);
    assert.match(ATIV, /sem-precisao/);
    assert.match(ATIV, /if \(!fimMs\) setTimeout/);
  });
});

describe("PADRAO · nota Celular gate + abertura", () => {
  it("documenta Abrir|Entrar only e roteamento abertura", () => {
    assert.match(PADRAO, /NÃO repete a escolha de modo/);
    assert.match(PADRAO, /Solo.*neste aparelho/s);
    assert.match(PADRAO, /Multiplayer sem telão/);
    assert.match(PADRAO, /Multiplayer com telão/);
  });

  it("firebase-room não tem passoTelao", () => {
    const criar = ROOM.slice(ROOM.indexOf("async function criarSalaBase"), ROOM.indexOf("const TELAO_VIVO_MS"));
    assert.equal(/function passoTelao/.test(ROOM), false);
    assert.equal(/passoTelao\(\)/.test(criar), false);
    assert.match(criar, /formEntrar\('',true\)/);
  });
});

/* Modo (Celular · Telão · Solo) + papel cognitivo + camada de acessibilidade.
 * =========================================================================
 * Só o hub pergunta Celular · Telão · Solo. /casa-da-costa/ e /carro-forte/
 * redirecionam ao gate Celular. Celular / Solo têm seletor; Telão NÃO.
 */
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { describe, it } from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import vm from "node:vm";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const ler = (p) => readFileSync(join(root, p), "utf8").replace(/\r\n/g, "\n");

const CASA = ler("casa-da-costa/index.html");
const CARRO = ler("jogos/a-manha-do-carro-forte/a-mesa/index.html");
const HUB = ler("index.html");
const TELAO = ler("telao.html");
const MESA = ler("jogos/casa-da-costa/a-mesa/MOSAICO-mesa.html");
const CEL = ler("jogos/a-manha-do-carro-forte/a-mesa/celular.html");
const ROOM = ler("firebase-room.js");
const MPC = ler("papel-camada.js");
const SOLO = ler("jogos/casa-da-costa/solo/index.html");
const SOLO_JS = ler("jogos/casa-da-costa/solo/mesa-solo.js");
const GAME = ler("jogos/a-manha-do-carro-forte/a-mesa/game.js");
const DOC = ler("documentos/MOSAICO-ACESSIBILIDADE-PAPEIS.md");
const README = ler("README.md");

describe("hub · histórias e versões", () => {
  it("apresenta cinco jogos sem o bloco Solo", () => {
    assert.equal((HUB.match(/<article class="game(?: external-game)?"/g)||[]).length, 5);
    assert.match(HUB, />A Mesa</);
    assert.match(HUB, />O Impostor</);
    assert.doesNotMatch(HUB, />Solo<|Ensaiar neste aparelho|lab-ra/);
  });
  it("abre as entradas organizadas por história e versão", () => {
    /* 14/10/2026: a Casa da Costa mudou para o endereço próprio. */
    assert.ok(HUB.includes('href="https://casa-da-costa.dragongames.dev.br/a-mesa/"'));
    assert.ok(HUB.includes('href="https://casa-da-costa.dragongames.dev.br/o-impostor/"'));
    assert.ok(HUB.includes('href="https://carro-forte.dragongames.dev.br/a-mesa/"'));
    assert.ok(HUB.includes('href="https://carro-forte.dragongames.dev.br/o-impostor/"'));
    assert.ok(HUB.includes('href="historias/o-eco-do-amanha/o-impostor/"'));
    const vestchip=HUB.split('<h3>O Eco do Amanhã</h3>')[1].split('</article>')[0];
    assert.doesNotMatch(vestchip, /A Mesa|Acesso em verificação/);
    assert.match(vestchip, />O Impostor</);
  });
  it("o telão permanece acessível dentro de A Mesa", () => {
    /* 14/10/2026: a entrada do Carro-Forte encaminha ao endereço novo, que tem o próprio telão. */
    assert.ok(ler("historias/a-manha-do-carro-forte/a-mesa/index.html").includes("https://carro-forte.dragongames.dev.br/a-mesa/"));
    /* 14/10/2026: a entrada da Casa encaminha ao endereço novo, que tem o próprio telão. */
    assert.ok(ler("historias/casa-da-costa/a-mesa/index.html").includes("https://casa-da-costa.dragongames.dev.br/a-mesa/"));
    assert.match(TELAO, /telaoSalaInput/);
    assert.match(TELAO, /Digite o código da sala/);
    assert.ok(!/mpc-papel|papelCognitivo|MosaicoPapelCamada/.test(TELAO));
  });
});

describe("pasta do caso · redirect ao Celular, sem três portas", () => {
  it("Casa /casa-da-costa/ redireciona ao gate Celular", () => {
    assert.match(CASA, /location\.replace\(["']\.\.\/jogos\/casa-da-costa\/a-mesa\/MOSAICO-mesa\.html/);
    assert.match(CASA, /http-equiv="refresh"/);
    assert.match(CASA, /href="\.\.\/jogos\/casa-da-costa\/a-mesa\/MOSAICO-mesa\.html"/);
    assert.equal(/data-mode-ctas/.test(CASA), false);
    assert.equal(/Tr[eê]s portas/.test(CASA), false);
  });

  it("Carro /carro-forte/ redireciona ao gate Celular", () => {
    assert.match(CARRO, /location\.replace\(["']celular\.html/);
    assert.match(CARRO, /http-equiv="refresh"/);
    assert.match(CARRO, /href="celular\.html"/);
    assert.equal(/data-mode-ctas/.test(CARRO), false);
    assert.equal(/Tr[eê]s portas/.test(CARRO), false);
  });
});

describe("módulo papel-camada", () => {
  it("existe na raiz e expõe a API", () => {
    assert.equal(existsSync(join(root, "papel-camada.js")), true);
    assert.equal(existsSync(join(root, "jogos/casa-da-costa/a-mesa/css/profundidade-1mais1.css")), true);
    const sandbox = { window: {}, globalThis: {} };
    sandbox.window = sandbox;
    sandbox.globalThis = sandbox;
    vm.runInNewContext(MPC, sandbox);
    const api = sandbox.MosaicoPapelCamada || sandbox.window.MosaicoPapelCamada;
    assert.ok(api);
    assert.equal(api.PAPEIS.length, 5);
    assert.equal(api.CAMADAS.length, 3);
    assert.equal(api.aliasNarrativo("casa-da-costa", "investigador"), "Investigador de campo");
    assert.equal(api.aliasNarrativo("carro-forte", "cronista"), "Analista temporal");
    assert.match(api.htmlSeletor("casa-da-costa"), /data-mpc-papel="arquivista"/);
    assert.match(api.htmlSeletor("casa-da-costa"), /data-mpc-camada="guiada"/);
    const seletor = api.htmlSeletor("casa-da-costa");
    assert.match(seletor, /mpc-grade mpc-papeis/);
    assert.match(seletor, /mpc-grade mpc-camadas/);
    assert.match(seletor, /Papel Cognitivo/);
    assert.match(seletor, /Camada de Assistência/);
    assert.match(seletor, /Investigador de campo/);
    assert.match(seletor, /Junte pistas e monte uma teoria/);
    assert.match(seletor, /Contestador/);
    assert.match(seletor, /Ataque a teoria que está ganhando/);
    assert.match(seletor, /Custódio dos registros/);
    assert.match(seletor, /Separe fato, achismo e dúvida/);
    assert.match(seletor, /Reconstrutor da sequência/);
    assert.match(seletor, /Coloque os fatos na ordem certa/);
    assert.match(seletor, /Coordenador da investigação/);
    assert.match(seletor, /Escolha a versão e feche o caso/);
    assert.equal(/Instiga[cç][aã]o/.test(seletor), false);
    assert.match(seletor, /Modo Veterano/);
    assert.match(seletor, /Você resolve sozinho/);
    assert.match(seletor, /Modo Organizado/);
    assert.match(seletor, /O jogo te ajuda a arrumar as ideias/);
    assert.match(seletor, /Modo Acompanhado/);
    assert.match(seletor, /O jogo te ajuda com os próximos passos/);
    assert.equal(api.PAPEIS.find((p) => p.id === "decisor").subtitulo, "Coordenador da investigação");
    assert.match(MPC, /mpc-grade\{/);
    assert.equal(/grid-template-columns:repeat\(3/.test(MPC), false);
    assert.match(api.htmlAndaime("casa-da-costa", { papel: "arquivista", camada: "assistida" }), /FATOS|Fatos/i);
    assert.match(api.htmlAndaime("casa-da-costa", { papel: "investigador", camada: "guiada" }), /Mestre socrático/);
    assert.equal(api.htmlAndaime("casa-da-costa", { papel: "investigador", camada: "livre" }), "");
    assert.match(seletor, /mpc-grade-inset pf-inset/);
    assert.match(seletor, /mpc-grade mpc-papeis pf-card/);
    assert.match(seletor, /class="mpc-celula mpc-papel pf-cell/);
    assert.match(MPC, /--pf-navy/);
    assert.match(MPC, /injetarProfundidade1mais1/);
    assert.match(MPC, /\.pf-card\{/);
    assert.match(MPC, /\.pf-inset\{/);
    assert.match(MPC, /pf-btn-gold/);
  });
});

describe("celular / solo · seletor presente", () => {
  it("Casa Celular (mesa) carrega o módulo e o seletor na entrada", () => {
    assert.match(MESA, /papel-camada\.js/);
    assert.match(MESA, /htmlSeletor\('casa-da-costa'/);
    assert.match(MESA, /papelCognitivo/);
    assert.match(MESA, /camadaAcessibilidade/);
  });

  it("Carro Celular carrega o módulo e o lobby grava papel/camada", () => {
    assert.match(CEL, /papel-camada\.js/);
    assert.match(ROOM, /htmlSeletor/);
    assert.match(ROOM, /papelCognitivo:escolha\.papel/);
    assert.match(ROOM, /camadaAcessibilidade:escolha\.camada/);
    assert.match(ROOM, /mostrarSeletor/);
  });

  it("Solo Casa abre o seletor depois do percurso 3D, não após a abertura", () => {
    assert.match(SOLO, /papel-camada\.js/);
    assert.match(SOLO_JS, /mostrarSeletor/);
    assert.match(SOLO_JS, /chipHtml/);
    const startFn = SOLO_JS.slice(SOLO_JS.indexOf("function start()"), SOLO_JS.indexOf("function abrirAnalise()"));
    assert.doesNotMatch(startFn, /mostrarSeletor/,
      "o seletor Guiada/Cronista não pode ser a primeira tela depois da abertura");
    assert.match(SOLO_JS, /function abrirAnalise\(\)[\s\S]*mostrarSeletor/);
  });

  it("chrome in-game tem chip / andaime (Carro)", () => {
    assert.match(CEL, /mpcChipHost/);
    assert.match(GAME, /aplicarEmJogo/);
  });
});

describe("profundidade 1+1 · tokens compartilhados", () => {
  it("folha de tokens e injetores falam a mesma língua", () => {
    const pf = ler("jogos/casa-da-costa/a-mesa/css/profundidade-1mais1.css");
    const room = ler("firebase-room.js");
    const ts = ler("jogos/casa-da-costa/a-mesa/js/tarefa-sensor.js");
    assert.match(pf, /--pf-navy/);
    assert.match(pf, /\.pf-card\{/);
    assert.match(pf, /\.pf-inset\{/);
    assert.match(pf, /border-left:4px solid #6aa8ca/);
    assert.match(pf, /\.pf-btn-gold\{/);
    assert.match(pf, /\.waiting-card/);
    assert.match(pf, /\.modal-card/);
    assert.match(pf, /\.pf-pausa/);
    assert.match(room, /pf-card/);
    assert.match(room, /rgba\(127,212,255/);
    assert.match(room, /#060d14/);
    assert.match(ts, /mosaico-pf-1mais1/);
    assert.match(ler("jogos/casa-da-costa/a-mesa/MOSAICO-mesa.html"), /profundidade-1mais1\.css/);
  });

  it("toda porta de produção carrega a língua 1+1", () => {
    const portas = [
      ["Casa Celular", "jogos/casa-da-costa/a-mesa/MOSAICO-mesa.html", /profundidade-1mais1\.css/],
      ["Casa Telão", "telao.html", /profundidade-1mais1\.css/],
      ["Casa Solo", "jogos/casa-da-costa/solo/index.html", /profundidade-1mais1\.css/],
      ["Carro Celular/Solo", "jogos/a-manha-do-carro-forte/a-mesa/celular.html", /profundidade-1mais1\.css/],
      ["Carro Noite", "jogos/a-manha-do-carro-forte/a-noite/index.html", /profundidade-1mais1\.css/],
      ["Vidro Casa", "jogos/casa-da-costa/a-mesa/MOSAICO-26-vidro-embacado.html", /profundidade-1mais1\.css/],
      ["Sala Casa", "jogos/casa-da-costa/a-mesa/MOSAICO-26-a-sala-as-escuras.html", /profundidade-1mais1\.css/],
      ["Janela Casa", "jogos/casa-da-costa/a-mesa/MOSAICO-26-a-janela-do-norte.html", /profundidade-1mais1\.css/],
    ];
    for (const [nome, path, re] of portas) {
      assert.match(ler(path), re, nome);
    }
    assert.match(ler("telao.html"), /waiting-card pf-card/);
    assert.match(ler("telao.html"), /openbox pf-card/);
    assert.match(ler("telao.html"), /fecho-card pf-card/);
    assert.match(ler("jogos/a-manha-do-carro-forte/a-noite/index.html"), /modal-card depth-card pf-card/);
    assert.match(ler("jogos/a-manha-do-carro-forte/a-noite/index.html"), /drawer-card depth-card pf-card/);
    assert.match(ler("jogos/a-manha-do-carro-forte/a-mesa/celular.html"), /drawer-card depth-card pf-card/);
    assert.match(ler("jogos/casa-da-costa/solo/index.html"), /mesa-solo\.css\?v=20261004-janelas/);
    assert.match(ler("abertura-casa.js"), /cartao pf-card/);
    assert.match(ler("abertura-casa.js"), /cartao-inset pf-inset/);
  });
});

describe("telão · sem papel/camada", () => {
  it("entrada do telão no firebase-room só pede código", () => {
    assert.match(ROOM, /function formTelao/);
    const trecho = ROOM.slice(ROOM.indexOf("function formTelao"), ROOM.indexOf("function renderMasterGate"));
    assert.ok(!/htmlSeletor|mpc-papel|papelCognitivo/.test(trecho));
  });
});

describe("docs", () => {
  it("aponta onde a UI vive", () => {
    const pointer =
      /papel-camada\.js/.test(DOC) ||
      /papel-camada\.js/.test(README) ||
      /Modo · Papel · Camada/.test(DOC) ||
      /Modo · Papel · Camada/.test(README);
    assert.ok(pointer, "README ou MOSAICO-ACESSIBILIDADE-PAPEIS.md deve apontar para a UI");
  });
});

describe("sync Firestore · papel/camada + HPC", () => {
  it("DragonSala.patchMe existe e salvar espelha papel/camada quando há sala", () => {
    assert.match(ROOM, /patchMe/, "DragonSala.patchMe sumiu");
    assert.match(ROOM, /PATCH_ME_KEYS|papelCognitivo/, "allowlist client do patchMe");
    assert.match(MPC, /DragonSala\.patchMe|MosaicoFB\.atualizarJogador/, "salvar não sincroniza FS");
    assert.match(MPC, /aliasNarrativo/, "sync deve incluir alias narrativo");
  });
});

/**
 * Padronização UI Mestre vs Jogador — gate, lobby, Sala, telão.
 * Fonte normativa: PADRAO-SALA-MULTIPLAYER.md
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const ler = (p) => readFileSync(join(root, p), "utf8").replace(/\r\n/g, "\n");

const ROOM = ler("firebase-room.js");
const CASA = ler("v1/MOSAICO-mesa.html");
const CEL = ler("carro-forte/celular.html");
const NOITE = ler("carro-forte/noite/index.html");
const HUB = ler("index.html");
const PADRAO = ler("PADRAO-SALA-MULTIPLAYER.md");
const MPC = ler("papel-camada.js");
const LAND_CASA = ler("casa-da-costa/index.html");
const LAND_CARRO = ler("carro-forte/index.html");

function stripComments(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[\n\r])\s*\/\/[^\n\r]*/g, "$1");
}

function gateButtonOrder(src, labels) {
  const plain = stripComments(src);
  let pos = -1;
  for (const label of labels) {
    const i = plain.indexOf(label, pos + 1);
    assert.ok(i > pos, `faltou ou fora de ordem: ${label}`);
    pos = i;
  }
}

function menuFn(src) {
  const i = src.indexOf("function menu(");
  const j = src.indexOf("function formTelao(", i);
  return src.slice(i, j > 0 ? j : i + 1200);
}

describe("gate Celular · firebase-room (Abrir | Entrar only)", () => {
  it("menu do Celular: Abrir → Entrar; sem Ensaiar/Telão no gate", () => {
    const menu = menuFn(ROOM);
    gateButtonOrder(menu, ["Abrir uma mesa", "Entrar em uma mesa"]);
    const plain = stripComments(menu);
    assert.equal(/Ensaiar neste aparelho/.test(plain), false);
    assert.equal(/Entrar como telão/.test(plain), false);
    assert.equal(/id="drSolo"/.test(menu), false);
    assert.equal(/id="drTelao"/.test(menu), false);
  });

  it("Abrir mesa sem Com/Sem telão", () => {
    const master = ROOM.slice(ROOM.indexOf("function renderMasterGate"), ROOM.indexOf("async function autorizado"));
    const plain = stripComments(master);
    assert.equal(/Com telão/.test(plain), false);
    assert.equal(/data-mode="com-telao"/.test(plain), false);
    assert.match(master, /Como as rodadas devem avançar/);
  });

  it("Abrir com Google no caminho do Mestre", () => {
    assert.match(ROOM, /Abrir com Google/);
  });

  it("lobby: Iniciar partida só no caminho Mestre; convidado aguarda", () => {
    assert.match(ROOM, /id="drStart">Iniciar partida</);
    assert.match(ROOM, /Aguardando o Mestre iniciar a partida/);
    assert.equal(/Começar o jogo/.test(ROOM), false);
  });

  it("Entrar (após nome/papel) e badges Mestre/Jogador", () => {
    assert.match(ROOM, /id="drEnter">Entrar</);
    assert.match(ROOM, /p\.mestre\?'Mestre':'Jogador'/);
  });

  it("painel Sala Title Case; formTelao existe para deep-link / landing", () => {
    assert.match(ROOM, /b\.textContent='Sala'/);
    assert.match(ROOM, /function formTelao\(/);
    const formTelao = ROOM.slice(ROOM.indexOf("function formTelao"), ROOM.indexOf("function renderMasterGate"));
    assert.equal(/mpc-|papelCognitivo|htmlSeletor|drForma/.test(formTelao), false);
  });

  it("Sala panel: Código/QR → Participantes → Controle → Encerrar (sem bloco Telão)", () => {
    const panel = ROOM.slice(ROOM.indexOf("function atualizarSalaPersistente"), ROOM.indexOf("async function encerrarSala"));
    gateButtonOrder(panel, [
      "Código e QR",
      "Participantes",
      "Controle partida",
      "Encerrar sala",
    ]);
    assert.equal(/summary>📺 Telão</.test(stripComments(panel)), false);
  });
});

describe("gate canônico · Casa Celular", () => {
  it("Casa usa o gate compartilhado firebase-room", () => {
    assert.match(CASA, /firebase-room\.js/);
    assert.match(CASA, /data-project="mesa"/);
    assert.match(CASA, /casa-firebase-room-bridge/);
  });

  it("Iniciar partida / guest aguarda; motor Casa guarda encenacao", () => {
    assert.match(ROOM, /id="drStart">Iniciar partida</);
    assert.match(ROOM, /Aguardando o Mestre iniciar a partida/);
    assert.match(CASA, /fase:"encenacao"/);
  });

  it("Sala panel Casa: Código/QR → Participantes → Controle → Encerrar (sem Telão)", () => {
    const painel = CASA.slice(CASA.indexOf("var painel=STATE.menuMestreAberto"), CASA.indexOf("return '<button class=\"btn-menu-mestre"));
    gateButtonOrder(painel, [
      "C&oacute;digo e QR",
      "Participantes",
      "secaoControle",
      "Encerrar sala",
    ]);
    assert.equal(/Tel&atilde;o/.test(painel), false);
    assert.match(CASA, /summary>Controle partida</);
  });

  it("forma Tanto faz usa código n (legado ? aceito na leitura)", () => {
    assert.match(CASA, /escolherForma\(\\'n\\'\)/);
    assert.match(CASA, /forma==="n"\|\|STATE\.forma==="\?"/);
  });

  it("rodada: subtítulo sob título; sem caixa dinamica-nivel", () => {
    assert.match(CASA, /rodada-sub/);
    assert.match(CASA, /function cabecalhoRodada/);
    const cab = CASA.slice(CASA.indexOf("function cabecalhoRodada"), CASA.indexOf("function cabecalhoRodada") + 600);
    assert.equal(/dinamica-nivel/.test(cab), false);
  });

  it("DESCER DO CARRO não aparece na Janela do Norte da Casa", () => {
    const janela = ler("v1/MOSAICO-26-a-janela-do-norte.html");
    assert.equal(/Descer do carro/i.test(janela), false);
    assert.match(janela, /Apontar a janela/);
  });
});

describe("HUD / hub · Sala Title Case e landings", () => {
  it("Carro Celular e Noite usam rótulo Sala (não SALA)", () => {
    assert.match(CEL, />Sala</);
    assert.equal(/>SALA</.test(CEL), false);
    assert.match(NOITE, />Sala</);
    assert.equal(/>SALA</.test(NOITE), false);
  });

  it("hub alinha Solo a Ensaiar neste aparelho", () => {
    assert.match(HUB, /Ensaiar neste aparelho/);
    assert.equal(/Ensaiar sozinho/.test(HUB), false);
  });

  it("landings documentam Celular gate Abrir|Entrar e Telão display-only", () => {
    assert.match(LAND_CASA, /Abrir \| Entrar/);
    assert.match(LAND_CARRO, /Abrir \| Entrar/);
    assert.match(LAND_CASA, /Display only/i);
    assert.match(LAND_CARRO, /Display only/i);
  });

  it("PADRAO documenta gate Celular Abrir|Entrar e abertura Solo/Mestre/Telão", () => {
    assert.match(PADRAO, /Iniciar partida/);
    assert.match(PADRAO, /Abrir uma mesa/);
    assert.match(PADRAO, /gate dentro do \*\*Celular\*\*/);
    assert.match(PADRAO, /Multiplayer com telão/);
    assert.match(PADRAO, /casa-firebase-room-bridge/);
    assert.equal(/gap estrutural/i.test(PADRAO), false);
  });

  it("chip pode mostrar sessão Mestre/Jogador sem substituir papel cognitivo", () => {
    assert.match(MPC, /mpc-sessao/);
    assert.match(MPC, /opts\.sessao|opts && opts\.sessao/);
  });
});

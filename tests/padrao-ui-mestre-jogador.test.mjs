/**
 * Padronização UI Mestre vs Jogador — gate, lobby, Sala, telão.
 * Fonte normativa: PADRAO-SALA-MULTIPLAYER.md + audit proposal.
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

describe("gate canônico · firebase-room (Carro / Noite / Casa)", () => {
  it("ordem Abrir → Entrar → Ensaiar → Telão", () => {
    gateButtonOrder(ROOM, [
      "Abrir uma mesa",
      "Entrar em uma mesa",
      "Ensaiar neste aparelho",
      "Entrar como telão",
    ]);
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

  it("painel Sala Title Case; telão sem seletor de papel", () => {
    assert.match(ROOM, /b\.textContent='Sala'/);
    assert.match(ROOM, /function formTelao\(/);
    const formTelao = ROOM.slice(ROOM.indexOf("function formTelao"), ROOM.indexOf("function renderMasterGate"));
    assert.equal(/mpc-|papelCognitivo|htmlSeletor|drForma/.test(formTelao), false);
  });

  it("Sala panel: Código/QR → Telão → Participantes → Controle partida → Encerrar", () => {
    const panel = ROOM.slice(ROOM.indexOf("function atualizarSalaPersistente"), ROOM.indexOf("async function encerrarSala"));
    gateButtonOrder(panel, [
      "Código e QR",
      "Telão",
      "Participantes",
      "Controle partida",
      "Encerrar sala",
    ]);
  });
});

describe("gate canônico · Casa Celular", () => {
  it("Casa usa o gate compartilhado firebase-room (não o telaInicio dual)", () => {
    assert.match(CASA, /firebase-room\.js/);
    assert.match(CASA, /data-project="mesa"/);
    assert.match(CASA, /casa-firebase-room-bridge/);
  });

  it("rótulos canônicos vêm do firebase-room (Abrir / Entrar / Ensaiar / Telão)", () => {
    gateButtonOrder(ROOM, [
      "Abrir uma mesa",
      "Entrar em uma mesa",
      "Ensaiar neste aparelho",
      "Entrar como telão",
    ]);
  });

  it("Iniciar partida / guest aguarda no firebase-room; motor Casa guarda encenacao", () => {
    assert.match(ROOM, /id="drStart">Iniciar partida</);
    assert.match(ROOM, /Aguardando o Mestre iniciar a partida/);
    assert.match(CASA, /fase:"encenacao"/);
  });

  it("Sala panel do motor Casa mantém ordem canônica (controles de fase)", () => {
    const painel = CASA.slice(CASA.indexOf("var painel=STATE.menuMestreAberto"), CASA.indexOf("return '<button class=\"btn-menu-mestre"));
    gateButtonOrder(painel, [
      "C&oacute;digo e QR",
      "Tel&atilde;o",
      "Participantes",
      "secaoControle",
      "Encerrar sala",
    ]);
    assert.match(CASA, /summary>Controle partida</);
  });

  it("forma Tanto faz usa código n (legado ? aceito na leitura)", () => {
    assert.match(CASA, /escolherForma\(\\'n\\'\)/);
    assert.match(CASA, /forma==="n"\|\|STATE\.forma==="\?"/);
  });
});

describe("HUD / hub · Sala Title Case e Ensaiar", () => {
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

  it("PADRAO documenta Iniciar partida e gate unificado", () => {
    assert.match(PADRAO, /Iniciar partida/);
    assert.match(PADRAO, /Ensaiar neste aparelho/);
    assert.match(PADRAO, /casa-firebase-room-bridge/);
    assert.equal(/gap estrutural/i.test(PADRAO), false);
  });

  it("chip pode mostrar sessão Mestre/Jogador sem substituir papel cognitivo", () => {
    assert.match(MPC, /mpc-sessao/);
    assert.match(MPC, /opts\.sessao|opts && opts\.sessao/);
  });
});

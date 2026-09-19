/**
 * Sala às Escuras no Solo: a abertura não pode prender o jogador.
 *
 * Medido em 16/09/2026 no iframe embed a 390×700 (iPhone com a barra do
 * Solo): `ac-janelas.css` pintava #intro como janela de identidade (84px
 * de cabeçalho, símbolo vazio, fundo de cartão), a nota canônica e o
 * pf-card empilhavam acima de «Entrar na sala», e não havia × / Esc /
 * toque no fundo. O HUD `.busca-caixa[data-ac-priority]` ainda cobria a
 * cena 3D e comia os toques da lanterna.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const ler = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8").replace(/\r\n/g, "\n");
const SALA = ler("v1/MOSAICO-26-a-sala-as-escuras.html");
const CSS = ler("v1/css/ac-janelas.css");
const JS = ler("v1/js/ac-janelas.js");
const SOLO = ler("solo/mesa-solo.js");

describe("Solo · Sala às Escuras jogável", () => {
  it("a intro tem corpo rolável e CTA âncora", () => {
    assert.match(SALA, /id="intro-corpo"/);
    assert.match(SALA, /id="b-entrar"[^>]*>Entrar na sala/);
    assert.ok(
      SALA.indexOf('id="intro-corpo"') < SALA.indexOf('id="b-entrar"'),
      "o CTA precisa ficar fora de #intro-corpo para não descer com os cartões"
    );
    assert.match(CSS, /#intro-corpo\{[^}]*overflow-y:auto/);
    assert.match(CSS, /body #intro:has\(#intro-corpo\)\{[^}]*overflow:hidden/);
  });

  it("a intro se dispensa por fundo ou Esc via o mesmo Entrar na sala — sem ×", () => {
    /* A sala é uma das quatro telas d'A Casa: nenhuma janela tem × próprio
       (17/09/2026). O CTA fica fora da rolagem, e fundo e Esc disparam ele. */
    assert.doesNotMatch(SALA, /class="close"/);
    assert.match(SALA, /<html[^>]*data-ac-casa/);
    assert.match(JS, /function dispararEntradaDaIntro\(/);
    assert.match(JS, /function portaDaIntro\(/);
    assert.match(JS, /ev\.key==='Escape'&&dispararEntradaDaIntro/);
    assert.match(JS, /ev\.target\.id==='intro'/);
    assert.match(SALA, /ACJanelas\.entrarAtividade/);
  });

  it("o chrome de identidade não se aplica à intro nem ao HUD da sala", () => {
    assert.match(CSS, /:not\(#intro\):not\(#oito\):not\(#falha\):not\(\.busca-caixa\)/);
    assert.doesNotMatch(SALA, /data-ac-priority="1" class="busca-caixa"/);
    assert.doesNotMatch(SALA, /data-ac-priority="2" class="busca-caixa"/);
    assert.match(SALA, /\.busca-caixa\{[^}]*pointer-events:none/);
  });

  it("não regressa RA de ensaio nem a ordem Janela → Sala", () => {
    /* A RA voltou (18/09/2026), mas sem o rótulo de ensaio. */
    assert.doesNotMatch(SALA, />Alternar visual</);
    assert.doesNotMatch(SALA, /Prefiro jogar sem RA/);
    assert.match(SOLO, /1 \/ 4 · Chegada pela estrada/);
    assert.match(SOLO, /2 \/ 4 · /);
    assert.match(SOLO, /MOSAICO-26-a-janela-do-norte\.html\?embed=1/);
    assert.match(SOLO, /MOSAICO-26-a-sala-as-escuras\.html\?embed=1&v=20260919-ra/);
    assert.ok(
      SOLO.indexOf("MOSAICO-26-a-janela-do-norte.html") <
        SOLO.indexOf("MOSAICO-26-a-sala-as-escuras.html"),
      "a Janela do Norte tem de continuar antes da Sala no Solo"
    );
  });
});

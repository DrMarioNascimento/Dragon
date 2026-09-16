/**
 * Nenhuma janela que cobre a tela pode existir sem saída.
 *
 * Em 15/09/2026 o Mario cobrou a regra depois de jogar no iPhone. A varredura
 * daquele dia, medindo no navegador a 375×812, achou duas janelas que cobriam
 * tudo e não fechavam:
 *
 *   · Solo — a etapa 3D/sensorial em tela cheia (`.solo-imersivo`). O botão de
 *     continuar nasce desabilitado e fica ATRÁS da janela. Quem travasse no
 *     meio do percurso só saía recarregando, e recarregar perde a partida.
 *   · A Mesa — `.voto-envio-fundo` no estado “Você já votou Sim. Aguardando o
 *     grupo…”: `position:fixed; inset:0; z-index:80`, sem botão nenhum e sem
 *     fechar por toque no fundo. Se um colega do Fragmento não votasse, o
 *     jogador ficava trancado fora do tabuleiro, do Caso e do Arquivo.
 *
 * As duas saídas precisam ser BARATAS: nenhuma delas pode desfazer o que já
 * foi feito. A do Solo não passa por render() (senão o iframe recarrega); a da
 * Mesa não mexe no voto.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const ler = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8").replace(/\r\n/g, "\n");
const SOLO_JS = ler("solo/mesa-solo.js");
const SOLO_CSS = ler("solo/mesa-solo.css");
const MESA = ler("v1/MOSAICO-mesa.html");

/** Corpo de uma função nomeada, do `function nome(` até a linha `}` na coluna 0. */
function corpoDaFuncao(src, nome) {
  const i = src.indexOf(`function ${nome}(`);
  assert.ok(i >= 0, `não achei function ${nome}(`);
  const fim = src.indexOf("\n}", i);
  assert.ok(fim > i, `function ${nome} não fecha na coluna 0`);
  return src.slice(i, fim + 2);
}

describe("Solo · a etapa em tela cheia tem saída", () => {
  const imersivo = corpoDaFuncao(SOLO_JS, "imersivo");
  const alternar = corpoDaFuncao(SOLO_JS, "alternarTelaCheia");

  it("a barra da etapa carrega o botão de sair", () => {
    assert.match(imersivo, /solo-imersivo-sair/,
      "a janela de tela cheia do Solo voltou a não ter botão de saída. " +
      "O botão de continuar fica ATRÁS dela e nasce desabilitado: sem esta " +
      "saída, quem travar na etapa só sai recarregando a página.");
    assert.match(imersivo, /onclick="alternarTelaCheia/,
      "o botão existe mas não está ligado em alternarTelaCheia.");
  });

  it("sair não passa por render() — senão o iframe recarrega", () => {
    assert.equal(/\brender\(\)/.test(alternar), false,
      "alternarTelaCheia voltou a chamar render(). render() reescreve o " +
      "innerHTML de #app, o iframe da etapa recarrega do zero e o jogador " +
      "perde o que já fez lá dentro — a saída passa a custar a etapa.");
    assert.match(alternar, /classList\.toggle\('encolhido'\)/,
      "a alternância deixou de ser só uma troca de classe no elemento vivo.");
  });

  it("encolhida, a página volta a rolar", () => {
    assert.match(SOLO_CSS, /html:has\(\.solo-imersivo:not\(\.encolhido\)\)/,
      "a trava de rolagem (`overflow:hidden`) voltou a valer para " +
      "`.solo-imersivo` em qualquer estado. Encolhida a janela fica DENTRO " +
      "da página, e sem rolagem o jogador não alcança o botão de continuar.");
  });

  it("o cabeçalho do Solo não nasce debaixo da pílula de conta", () => {
    assert.match(SOLO_CSS, /\.top\{padding-top:var\(--solo-conta/,
      "o cabeçalho do Solo deixou de reservar a faixa da pílula de conta " +
      "(#mosaico-account, position:fixed, z-index 99990). Medido a 375px, " +
      "ela cobria a badge do caso e a metade de cima dos chips.");
    assert.match(SOLO_JS, /--solo-conta/,
      "ninguém mede mais a altura da pílula; ela cresce com e-mail longo.");
    assert.equal(/offsetParent!==null/.test(corpoDaFuncao(SOLO_JS, "medirPilulaDaConta")), false,
      "a medição voltou a usar offsetParent, que é SEMPRE null num elemento " +
      "position:fixed — a reserva fica em 0px e a pílula volta a cobrir.");
  });
});

describe("A Mesa · a janela de envio do Fragmento tem saída", () => {
  const modal = corpoDaFuncao(MESA, "htmlVotoEnvioModal");

  it("quem já votou Sim consegue voltar para a mesa", () => {
    assert.match(modal, /Você já votou Sim[\s\S]{0,400}?minimizarVotoEnvio/,
      "o estado “Você já votou Sim. Aguardando o grupo…” voltou a ser uma " +
      "janela de tela cheia (z-index 80) sem botão e sem fechar no fundo. " +
      "Enquanto um colega do Fragmento não votar, o jogador fica trancado " +
      "fora do tabuleiro, do Caso e do Arquivo.");
  });

  it("encolhida, sobra um aviso que reabre a janela", () => {
    assert.match(modal, /voto-envio-aviso/, "o aviso que substitui a janela sumiu.");
    assert.match(modal, /onclick="reabrirVotoEnvio\(\)"/,
      "o aviso não reabre a janela: o jogador perde o acesso ao envio.");
    assert.match(MESA, /\.voto-envio-aviso\{[^}]*position:fixed/,
      "o aviso perdeu a âncora fixa e some junto com a rolagem da tela.");
    assert.match(MESA, /function minimizarVotoEnvio\(\)/);
    assert.match(MESA, /function reabrirVotoEnvio\(\)/);
  });

  it("encolher não mexe no voto", () => {
    const fn = corpoDaFuncao(MESA, "minimizarVotoEnvio");
    assert.equal(/votoEnvioSim|votarEnvioFragmento|pedidoEnvioFragmento/.test(fn), false,
      "minimizarVotoEnvio passou a tocar no voto. A saída tem que ser " +
      "gratuita: o voto continua Sim, só a janela sai da frente.");
  });

  it("se alguém recusar, a janela volta inteira mesmo encolhida", () => {
    assert.match(modal, /STATE\.votoEnvioMinimizado===v\.rodada/,
      "o encolhimento deixou de ser preso à rodada do voto: ele vaza para a " +
      "rodada seguinte e esconde um pedido novo.");
    assert.match(modal, /!recusa[\s\S]{0,80}votoEnvioMinimizado/,
      "o encolhimento deixou de checar `recusa`. Quando alguém vota Não, o " +
      "grupo PRECISA ver a janela inteira com o “Entendi”.");
  });
});

describe("Sala às Escuras · a intro no Solo tem saída e CTA visível", () => {
  const SALA = ler("v1/MOSAICO-26-a-sala-as-escuras.html");
  const SOLO = ler("solo/mesa-solo.js");
  const JANELAS_JS = ler("v1/js/ac-janelas.js");

  it("o botão Entrar na sala fica fora da rolagem, com × na intro", () => {
    assert.match(SALA, /id="intro-corpo"/,
      "os cartões da abertura voltaram a empilhar acima de «Entrar na sala».\n" +
      "No iframe do Solo a 390×700 o CTA sumia e não havia × nem Esc.");
    const intro = SALA.slice(SALA.indexOf('id="intro"'), SALA.indexOf('id="oito"'));
    const corpo = intro.indexOf('id="intro-corpo"');
    const cta = intro.indexOf('id="b-entrar"');
    const fecha = intro.indexOf('class="close"');
    assert.ok(corpo > 0 && cta > corpo, "Entrar na sala tem de ficar DEPOIS de #intro-corpo");
    assert.ok(fecha > 0 && fecha < cta, "o × tem de existir na intro, antes do CTA");
    assert.match(intro, /data-close/);
  });

  it("fechar a intro dispara a entrada (não só esconde o cartão)", () => {
    assert.match(SALA, /ACJanelas\.entrarAtividade/);
    assert.match(JANELAS_JS, /dispararEntradaDaIntro/);
    assert.match(JANELAS_JS, /go\.click\(\)/);
  });

  it("o HUD da sala não é janela de identidade nem intercepta a lanterna", () => {
    assert.match(SALA, /class="busca-caixa"/);
    assert.equal(/data-ac-priority="1" class="busca-caixa"/.test(SALA), false);
    assert.equal(/data-ac-priority="2" class="busca-caixa"/.test(SALA), false);
    assert.match(SALA, /\.busca-caixa\{[^}]*pointer-events:none/);
  });

  it("o Solo continua abrindo a sala no iframe 2/4, depois da Janela do Norte", () => {
    assert.match(SOLO, /percursoEtapa==='janela'/);
    assert.match(SOLO, /salaEscura:\{titulo:'A Sala às Escuras'/);
    assert.match(SOLO, /MOSAICO-26-a-sala-as-escuras\.html\?embed=1&v=20260916-sala-cta/);
    assert.doesNotMatch(SOLO, /id="b-entrar-ra"/);
    assert.doesNotMatch(SOLO, /PERCURSO 3D E RA/);
  });
});

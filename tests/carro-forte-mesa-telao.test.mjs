/* A Mesa do Carro-Forte: quem opera a mesa, e quem encerra a atividade.
 * =========================================================================
 *
 * Quatro defeitos relatados por Mario em 04/09/2026, jogando de verdade:
 *
 *   1. "Com telão" era uma promessa sem porta. O endereço da tela grande só
 *      aparecia dentro do painel do Mestre, DEPOIS que a partida começava, e
 *      o telão nunca conseguia se anunciar — ele carimbava a presença no
 *      documento da sala, onde só o Mestre pode escrever.
 *   2. Ritmo, duração e número de investigadores apareciam em TODOS os
 *      aparelhos. Quem define a mesa é o Mestre.
 *   3. Havia um botão de pular a atividade, ao lado do de abrir. Quem encerra
 *      é o relógio da mesa, e quem abre é o Mestre ou o sistema.
 *   4. Depois de encostar nesse botão não havia volta: a página dizia "volte
 *      para a Mesa" e ficava sem nada clicável.
 *
 * Cada asserção abaixo falha na versão anterior ao conserto. O que se guarda
 * aqui não é o desenho da tela — é a regra: o jogador não encerra o que é da
 * mesa, e nenhuma tela do MOSAICO pode ser um beco sem saída.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/* Os arquivos do repositório não concordam sobre o fim de linha — uns são
   CRLF, outros LF. Uma expressão com \n dentro reprovaria conforme o arquivo,
   não conforme o código, então o \r sai na leitura. */
const ler = (p) =>
  readFileSync(new URL(`../${p}`, import.meta.url), "utf8").replace(/\r\n/g, "\n");

const GAME = ler("carro-forte/game.js");
const ATIVIDADE = ler("carro-forte/atividade.js");
const PAUTA = ler("carro-forte/pauta-da-mesa.js");
const MESA_HTML = ler("carro-forte/index.html");
const ESTILO = ler("carro-forte/styles.css");
const SALA = ler("firebase-room.js");
const TELAO = ler("telao.html");
const NOITE = ler("carro-forte-noite/telao-publica.js");
const REGRAS = ler("firestore.rules");
const PAGINAS = ["sala-as-escuras", "vidro-embacado", "janela-do-norte"];

/* ── 3. Ninguém pula uma atividade que é da mesa ───────────────────────── */

/* Sem tirar os comentários, a asserção reprova pelo comentário que EXPLICA o
   defeito removido — e a única saída seria apagar a explicação, que é o que
   menos se quer perder. */
const semComentarios = (s) => s.replace(/\/\*[\s\S]*?\*\//g, "");

test("a Mesa não oferece mais pular a atividade", () => {
  const codigo = semComentarios(GAME);
  assert.ok(!/mark-sensor/.test(codigo), "o botão de pular voltou ao cartão da atividade");
  assert.ok(
    !/Pular[^\n]*perde/.test(codigo),
    "o rótulo 'Pular · perde N' voltou — encerrar a atividade não é escolha do jogador",
  );
});

test("a atividade não tem mais um concluir sempre liberado", () => {
  assert.ok(
    !/Concluir com/.test(ATIVIDADE),
    "voltou o botão que encerrava a atividade a qualquer instante",
  );
  for (const p of PAGINAS) {
    const html = ler(`carro-forte/${p}.html`);
    assert.match(
      html,
      /<button id="finish"[^>]*\shidden>/,
      `${p}.html: o #finish nasce visível de novo — era ele, encostado sem querer, que perdia a atividade`,
    );
  }
});

test("quem encerra a atividade é o relógio, nos dois lados", () => {
  assert.match(GAME, /function encerrarPorTempo\(/, "a Mesa não encerra a atividade por tempo");
  assert.match(
    GAME,
    /Date\.now\(\)>=state\.prazo/,
    "a Mesa não compara o relógio com o prazo da atividade",
  );
  assert.match(ATIVIDADE, /Date\.now\(\) >= fimMs/, "a página da atividade não encerra por tempo");
});

test("o prazo desce da mesa para a atividade pelo endereço", () => {
  assert.match(GAME, /&fim=\$\{state\.prazo\|\|0\}/, "a Mesa não passa o instante do fim na URL");
  assert.match(ATIVIDADE, /par\.get\('fim'/, "a atividade não lê o instante do fim");
});

/* Se a colheita só viajasse no aviso de conclusão, uma atividade encerrada
   pelo relógio chegaria vazia à Mesa mesmo com três de quatro alcançados. */
test("cada fragmento alcançado sobe na hora, não só no fim", () => {
  assert.match(ATIVIDADE, /tipo: 'sensor-fragmento'/, "a atividade não avisa fragmento a fragmento");
  assert.match(GAME, /dado\.tipo==='sensor-fragmento'/, "a Mesa não recebe fragmento avulso");
});

/* ── 4. Nenhuma tela é um beco sem saída ───────────────────────────────── */

test("a atividade encerrada devolve a pessoa para a Mesa", () => {
  assert.match(ATIVIDADE, /Voltar à Mesa/, "sumiu a saída da atividade encerrada");
  assert.match(ATIVIDADE, /window\.close\(\)/, "a página não tenta se fechar");
  assert.match(
    ATIVIDADE,
    /não deixa a página se fechar sozinha/,
    "sem a instrução escrita, o navegador que recusa fechar deixa a pessoa presa — que foi o defeito relatado",
  );
});

/* window.open é o que dá à página o direito de se fechar; com <a target=
   "_blank"> a aba fica órfã e a Mesa também não consegue encerrá-la. */
test("a Mesa abre a atividade por script, não por âncora", () => {
  assert.match(GAME, /window\.open\(url,'mosaico-atividade'\)/, "a atividade voltou a abrir por âncora");
  assert.ok(
    !/sensor-actions a/.test(MESA_HTML),
    "voltou o remendo que transformava a âncora da atividade em _blank",
  );
});

/* ── 2. As opções são do Mestre ─────────────────────────────────────────── */

test("os campos da mesa somem para quem entra pelo QR", () => {
  assert.match(MESA_HTML, /id="mesaOptions"/, "o bloco dos campos do Mestre não existe");
  assert.match(GAME, /souMestreDaSala\(\)\)return;\n \$\('mesaOptions'\)\.hidden=true/, "o convidado continua vendo os campos");
  /* display:contents é de folha de autor e vence o [hidden] do navegador: sem
     o par explícito, esconder o bloco não esconde nada. */
  assert.match(
    ESTILO,
    /\.mestre-fields\[hidden\]\{display:none\}/,
    "sem esta regra o bloco continua aparecendo para o convidado, mesmo com hidden",
  );
});

test("a decisão do Mestre desce pela sala junto com a pergunta", () => {
  assert.match(PAUTA, /'partida\.opcoes': combinado/, "as opções da mesa não sobem para a sala");
  /* O telão viaja junto com elas: é ele que decide se o fecho é da tela grande
     ou de cada celular, e dois aparelhos com respostas diferentes fariam
     metade da mesa olhar para cima enquanto a outra metade narra no colo. */
  assert.match(PAUTA, /telao: usouTelao/, "a sala não diz se esta partida tem telão");
  assert.match(GAME, /function aplicarOpcoes\(/, "o aparelho não aplica as opções que recebeu");
});

/* ── 3b. Quem abre a atividade é o Mestre ou o sistema ─────────────────── */

test("o jogador nunca abre a atividade por conta própria", () => {
  assert.match(GAME, /function proximaAtividade\(/, "não há quem decida abrir a próxima");
  assert.match(GAME, /if\(ritmoConduzido\(\)\)return;/, "no ritmo conduzido o sistema abre sozinho");
  assert.match(GAME, /if\(!souMestreDaSala\(\)\)return;/, "o convidado abre a atividade por conta própria");
});

test("no ritmo conduzido o botão do Mestre pisca", () => {
  assert.match(GAME, /function atualizarAcaoMestre\(/, "a Mesa não declara a ação do Mestre");
  assert.match(GAME, /data-dragon-sala-espelho/, "o SALA do cabeçalho não espelha o alerta");
  assert.match(SALA, /window\.DragonSala=\{/, "o ponto de extensão da ação do Mestre sumiu");
  assert.match(SALA, /acao-necessaria/, "o painel da Sala não tem mais o estado de alerta");
  assert.match(
    SALA,
    /@media\(prefers-reduced-motion:reduce\)\{#dragonSalaBtn\.acao-necessaria/,
    "a piscada não respeita quem pediu menos movimento",
  );
});

test("o prazo da atividade é o mesmo para a mesa inteira", () => {
  assert.match(PAUTA, /'partida\.atividade': \{ sensor/, "a atividade aberta não sobe para a sala");
  assert.match(PAUTA, /function ouvirAtividade|async function ouvirAtividade/, "ninguém escuta a atividade da sala");
  assert.match(GAME, /ligarSincroniaAtividade\(\)/, "a Mesa não liga a sincronia da atividade");
});

/* ── 1. O telão: porta de entrada e identificação ───────────────────────── */

test("há como entrar como telão sem caçar o endereço", () => {
  assert.match(SALA, /id="drTelao"/, "o menu não oferece entrar como telão");
  assert.match(SALA, /function formTelao\(/, "não há tela para o telão informar o código");
  assert.match(SALA, /function passoTelao\(/, "o Mestre não é levado a abrir a tela grande");
  assert.match(
    SALA,
    /if\(modo==='com-telao'&&TELAO\)passoTelao\(\);/,
    "escolher 'com telão' volta a cair direto no formulário de nome",
  );
});

/* A presença morava em `opening.status` do documento da SALA, e o `allow
   update` de lá exige master(): o telão é anônimo, então toda batida voltava
   negada — em silêncio — e o Mestre nunca via telão nenhum. */
test("o telão se anuncia onde as regras deixam ele escrever", () => {
  assert.match(REGRAS, /match \/telao\/\{id\}/, "não há lugar para o telão gravar a própria presença");
  assert.match(
    REGRAS,
    /allow create, update: if signedIn\(\) && active\(versao,roomId\) && id == request\.auth\.uid/,
    "a regra do telão deixa um aparelho escrever o documento de outro",
  );
  assert.match(TELAO, /'telao',eu\)/, "o telão não escreve no próprio documento");
  assert.ok(
    !/updateDoc\(roomRef/.test(TELAO),
    "o telão voltou a gravar no documento da sala, onde a regra nega — e negava calado",
  );
  assert.match(SALA, /function telaoPronto\(\)/, "o Mestre não sabe reconhecer um telão vivo");
});

test("a abertura toca num aparelho só", () => {
  assert.match(PAUTA, /async function abertura\(/, "a Mesa não decide onde a abertura toca");
  assert.match(PAUTA, /'opening\.command': 'start'/, "a Mesa não aciona o telão");
  assert.match(GAME, /MosaicoPauta\?\.abertura/, "o botão de começar não passa mais pela decisão");
  assert.ok(
    !/window\.addEventListener\('mosaico-opening-finished',\(\)=>\{if\(aberturaPedida\)/.test(GAME),
    "o ouvinte global voltou — com ele e o de dentro da abertura, a pauta era sorteada duas vezes",
  );
});

/* O primeiro quadro de um onSnapshot traz o que já estava gravado: um telão
   que terminou a abertura de ontem ainda diz 'finished'. Sem conferir o token,
   a abertura de hoje acabava antes do primeiro segundo. */
test("a resposta do telão é conferida contra o token da abertura", () => {
  for (const [nome, fonte] of [["a Mesa", PAUTA], ["A Noite", NOITE]]) {
    assert.match(
      fonte,
      /Number\(o\.finishedToken\) === token/,
      `${nome} aceita 'finished' de qualquer abertura, inclusive a da rodada passada`,
    );
  }
});

test("o telão vivo é medido pela batida recente, não por ter existido um dia", () => {
  for (const [nome, fonte] of [["a Mesa", PAUTA], ["A Noite", NOITE], ["a sala", SALA]]) {
    assert.match(
      fonte,
      /vistoEmMs/,
      `${nome} não olha a idade da presença do telão — um telão de ontem sequestra a abertura de hoje`,
    );
  }
});

/* ── O FECHO: O QUE É PRIVADO CONTINUA PRIVADO ────────────────────────────
 *
 * Regra do Mario, 04/09/2026, em três partes:
 *   · o placar parcial não aparece para ninguém, nem para o Mestre, porque ele
 *     também é jogador;
 *   · com telão, a revelação e o pódio são sempre e só da tela grande;
 *   · o que é privado é sempre privado.
 *
 * O defeito que motivou tudo: o telão anunciava `{nome:'A mesa', pontos:…}` —
 * a nota do aparelho do Mestre vestida de coletiva. Numa sala de seis, seis
 * pessoas liam como se fosse o resultado da mesa.
 */

test("a nota de cada um sobe pelo relé, que é o que a regra permite", () => {
  assert.match(PAUTA, /tipo: 'placar'/, "ninguém entrega nota nenhuma");
  assert.match(
    PAUTA,
    /jogadorId: uid/,
    "o pedido não se identifica — a regra de acoes exige jogadorId == request.auth.uid e recusaria",
  );
  assert.match(PAUTA, /atendido: true/, "o Mestre não carimba a nota arquivada, e ela entraria duas vezes");
});

test("nenhum placar parcial sai, nem para o Mestre", () => {
  /* O fecho só começa sozinho com a mesa inteira dentro. A saída para quem
     abandonou a sala é um botão do Mestre, e ele anuncia QUANTOS faltam —
     contagem não é placar parcial, ponto de ninguém aparece ali. */
  assert.match(
    GAME,
    /if\(total&&entregues>=total\)return iniciarFecho\(\);/,
    "o fecho começa antes de a mesa inteira entregar — e aí existe placar parcial",
  );
  assert.match(
    GAME,
    /rotulo:`Fechar a mesa com \$\{entregues\} de \$\{total\|\|entregues\}`/,
    "sumiu a saída do Mestre — quem sai da sala sem entregar trava a mesa para sempre",
  );
  assert.ok(
    !/pontos.*\$\{/.test(GAME.match(/function conduzirFecho\([\s\S]*?\n\}/)?.[0] || ""),
    "o aviso ao Mestre passou a mostrar pontos de alguém antes do pódio",
  );
  assert.ok(
    !/'A mesa'/.test(semComentarios(PAUTA)),
    "voltou o placar de uma linha só, com a nota de um aparelho chamada de 'A mesa'",
  );
  assert.ok(
    !/publicState\.placar/.test(semComentarios(PAUTA)) ||
      /'publicState\.placar': \[\]/.test(PAUTA),
    "a Mesa voltou a publicar placar em publicState — o pódio agora mora no fecho",
  );
});

/* O passo "hipóteses que caem" se calcula a partir do dossiê de quem lê: cada
   pessoa tem o seu. Na tela grande ele seria coletivo e não é. */
test("o passo que depende do dossiê de cada um não sobe para o telão", () => {
  assert.match(GAME, /function passosDaRevelacao\(incluirCaidas\)/, "os passos não foram separados");
  assert.match(
    GAME,
    /return incluirCaidas\?steps:steps\.filter\(x=>x\.k!=='HIPÓTESES QUE CAEM'\)/,
    "o filtro sumiu — o dossiê de um aparelho iria para a tela grande",
  );
  assert.match(
    GAME,
    /state\.passos=passosDaRevelacao\(false\)/,
    "o Mestre publica a revelação com o passo privado dentro",
  );
  assert.match(GAME, /passosDaRevelacao\(true\)/, "o celular perdeu o passo que é dele");
});

test("com telão o celular não repete a revelação nem o pódio", () => {
  assert.match(GAME, /function esperarTelao\(/, "não há tela de espera para quem joga com telão");
  assert.match(GAME, /Olhe para a tela grande/, "o celular não manda olhar para cima");
  assert.match(
    GAME,
    /const temPodio=!state\.telao&&state\.placar\.length>1;/,
    "o pódio voltou a aparecer no celular mesmo com telão",
  );
});

/* Sem telão a revelação continua sendo de cada um, no ritmo de cada um — é o
   que sempre foi, e o fecho não pode ter tomado isso. */
test("sem telão a revelação continua em todos os jogadores", () => {
  assert.match(
    GAME,
    /if\(state\.telao\)esperarTelao\(\);else renderReveal\(\);/,
    "sem telão o aparelho deixou de fazer a própria revelação",
  );
  assert.match(
    GAME,
    /if\(!state\.telao\)\{if\(state\.screen==='score'\)renderScore\(\);return\}/,
    "sem telão o aparelho passou a obedecer as fases da tela grande",
  );
});

/* A tela grande desenha o fecho — e só o fecho. Roda a função de verdade,
   arrancada do telao.html, contra um pódio inventado. */
test("o telão desenha o pódio, e nada que seja de uma pessoa só", () => {
  const corpo = TELAO.match(/function renderFecho\(f,pub\)\{[\s\S]*?\n  \}/);
  assert.ok(corpo, "renderFecho sumiu do telão");
  const alvo = { className: "", innerHTML: "" };
  const esc = (s) => String(s ?? "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
  const renderFecho = new Function("root", "esc", `${corpo[0]}; return renderFecho;`)(alvo, esc);

  renderFecho(
    { fase: "podio", placar: [{ nome: "Ana", pontos: 81 }, { nome: "Bia", pontos: 52 }] },
    { resposta: "Não houve roubo naquela manhã." },
  );
  assert.match(alvo.innerHTML, /Ana/, "o pódio não desenha quem ficou em primeiro");
  assert.match(alvo.innerHTML, /81/, "o pódio não desenha os pontos");
  assert.match(alvo.innerHTML, /Não houve roubo/, "a resolução não sobe com o pódio");

  /* Um nome é escrito por quem entra na sala: se ele passar cru, quem digitar
     uma tag escreve na tela grande da mesa inteira. */
  alvo.innerHTML = "";
  renderFecho({ fase: "podio", placar: [{ nome: "<img src=x onerror=alert(1)>", pontos: 9 }] }, {});
  assert.ok(!/<img/.test(alvo.innerHTML), "o nome do jogador entra cru na tela grande");

  alvo.innerHTML = "";
  renderFecho({ fase: "revelacao", passo: 0, passos: [{ k: "O QUE PARECIA", h: "h", p: "p" }] }, {});
  assert.match(alvo.innerHTML, /O QUE PARECIA/, "a revelação não desenha o passo");
  assert.match(alvo.innerHTML, /1 de 1/, "a revelação não diz onde está");
});

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
import { readFileSync, existsSync } from "node:fs";

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
  assert.match(PAUTA, /'partida\.atividade': \{\s*\n\s*sensor, rotulo/, "a atividade aberta não sobe para a sala");
  assert.match(PAUTA, /async function ouvirPartida/, "ninguém escuta a partida da sala");
  assert.match(GAME, /ligarSala\(\)/, "a Mesa não liga a sincronia da sala");
  /* Eram três onSnapshot no MESMO documento — atividade, fase e fecho —, cada
     um com o próprio cancelamento para alguém esquecer de chamar. */
  assert.equal(
    (PAUTA.match(/fs\.onSnapshot\(fs\.doc\(db, COLECAO, code\)/g) || []).length,
    1,
    "voltou a haver mais de um ouvinte no documento da sala",
  );
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
  /* Sem telão o Mestre nem publica revelação: vai direto ao pódio. A própria
     existência de uma revelação em fases é o sinal de que há tela grande — e é
     por isso que o convidado acerta mesmo se a TV foi ligada no meio da
     partida, depois de `state.telao` já ter sido decidido na abertura. */
  assert.match(
    GAME,
    /const naTelaGrande=f\.fase==='revelacao'\|\|\(state\.telao&&f\.fase==='podio'\);/,
    "o aparelho voltou a decidir sozinho onde o fecho acontece",
  );
  assert.match(
    GAME,
    /if\(f\.fase==='podio'\)\{if\(state\.screen==='score'\)renderScore\(\);return\}/,
    "sem telão o pódio deixou de chegar ao relatório do celular",
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

/* ── TUDO TEM TEMPO ───────────────────────────────────────────────────────
 * Regra do Mario, 04/09/2026: "precisa terminar, tudo tem tempo; perdeu o
 * tempo, segue; não está, perdeu". Antes só as atividades tinham relógio, e a
 * mesa podia ficar meia hora num terço do dossiê esperando alguém tocar.
 */

test("toda fase da partida tem prazo, e ele mora num lugar só", () => {
  assert.match(GAME, /const FASE_SEG=\{/, "não há tabela de tempos das fases");
  for (const fase of ["briefing", "evidence", "hypothesis", "mosaic", "final"])
    assert.match(GAME, new RegExp(`\n ${fase}:\{pressure:`), `a fase ${fase} ficou sem prazo`);
  /* SENSORES não entra: ela dura o que a fila das atividades durar, e cada
     atividade já tem o seu relógio. */
  assert.ok(!/\n sensory:\{pressure:/.test(GAME), "SENSORES ganhou um prazo que briga com o das atividades");
  assert.match(GAME, /function venceuFase\(/, "nada acontece quando o prazo vence");
});

test("o prazo da fase é da mesa, não do aparelho", () => {
  assert.match(PAUTA, /'partida\.fase': \{\s*\n\s*nome, rotulo/, "a fase aberta não sobe para a sala");
  assert.match(GAME, /function abrirFase\(nome\)/, "ninguém abre fase");
  assert.match(
    GAME,
    /if\(salaCodigo\(\)&&souMestreDaSala\(\)\)window\.MosaicoPauta\?\.abrirFase\?\.\(nome,fim,state\.game,/,
    "o convidado voltou a publicar a própria fase, e a mesa desanda",
  );
  /* O telão serve todas as mesas e não conhece as fases de nenhuma: o rótulo
     viaja com a fase, senão a tela grande escreveria 'evidence' em inglês. */
  assert.match(PAUTA, /rotulo: rotulo \|\| nome/, "a fase sobe sem rótulo para a tela grande");
  assert.match(TELAO, /function agoraHtml\(f,at\)/, "a tela grande não desenha a fase nem o que falta dela");
});

/* Quem chegou tarde não é salvo por isso. */
test("o que não foi feito quando o sino toca fica por fazer", () => {
  assert.match(GAME, /function entregarDecisao\(/, "a decisão não se entrega sozinha");
  assert.match(
    GAME,
    /if\(nome==='final'\)\{entregarDecisao\(\);return\}/,
    "o fim do tempo da DECISÃO não entrega o que estiver preenchido",
  );
  /* O alerta travava quem não tinha escolhido hipótese — com relógio, travar a
     saída é prender a pessoa numa tela até o sino. */
  assert.ok(
    !/Comprometa-se com uma hipótese provisória/.test(GAME),
    "voltou o alerta que impede seguir sem hipótese",
  );
});

/* O botão "abrir o segundo terço" era do jogador: quem tocasse primeiro
   passava mais tempo com as pistas de fechamento na mão. */
test("os terços do dossiê abrem pelo relógio, não por quem toca primeiro", () => {
  assert.match(GAME, /function tercoPorTempo\(\)/, "os terços voltaram a depender de um toque");
  assert.match(GAME, /\$\('nextWave'\)\.hidden=true;/, "o botão de abrir terço voltou a aparecer");
});

/* Virar a página no próprio aparelho deixaria duas pessoas em telas
   diferentes discutindo coisas diferentes. */
test("quem vira a página é a mesa, e o convidado vê por quê", () => {
  assert.match(GAME, /const AVANCOS=\['startGame','toEvidence','toHypothesis','toFinal'\]/, "os botões de avanço não foram recolhidos");
  assert.match(GAME, /if\(!meu\)b\.hidden=true;/, "o convidado continua com os botões de avançar");
  assert.match(MESA_HTML, /id="esperaDaMesa"/, "sumiu o aviso que explica ao convidado por que não há botão");
});

/* Fechar por tempo passou a marcar a atividade como concluída — e a conta
   antiga dava a nota cheia a quem não encostou em nenhuma. */
test("o ponto sensorial mede o que foi alcançado, não quantas atividades acabaram", () => {
  assert.ok(
    !/sensorDone\.size\/g\.activities\.length/.test(GAME),
    "voltou a conta que dá 10 de 10 para quem não descobriu nada",
  );
  assert.match(
    GAME,
    /const sensorial=doSensor\?Math\.round\(state\.colhidos\.size\/doSensor\*10\):0;/,
    "o ponto sensorial deixou de medir a colheita",
  );
});

/* A resolução era publicada dentro de renderScore(), que só roda quando o
   fecho chega em 'detalhe' — DEPOIS do pódio. O telão desenhava o pódio com o
   título vazio: um <h1> em branco na tela grande, na frente da mesa inteira,
   exatamente no instante em que todos estão olhando para lá. */
test("a resolução chega ao telão antes do pódio, não depois", () => {
  const fecho = GAME.match(/function iniciarFecho\(\)\{[\s\S]*?\n\}/)?.[0] || "";
  assert.match(fecho, /publicarFim\(PARTIDAS\[state\.game\]\)/, "a resolução não sobe quando o fecho começa");
  const score = GAME.match(/function renderScore\(\)\{[\s\S]*?\n\}/)?.[0] || "";
  assert.ok(
    !/publicarFim/.test(score),
    "a resolução voltou a subir só no relatório, tarde demais para o pódio",
  );
});

/* Descoberto na PRIMEIRA sala de verdade, 05/09/2026 (sala 2WYTQE), e por
   nenhum outro caminho: os dois onSnapshot do telão rodavam no fim do módulo,
   antes de connect() — ou seja, antes de existir conta. Toda regra desta sala
   começa por signedIn(), então as duas assinaturas nasciam com
   permission-denied e não tentam de novo: a tela grande ficava para sempre no
   cartão de espera, sem pergunta, sem fase e sem pódio.

   Em sala falsa isso é invisível, porque ali tudo é negado do mesmo jeito. */
test("o telão só assina a sala depois de ter conta", () => {
  /* A ordem no arquivo não diz nada — a assinatura mora numa função declarada
     acima de connect(). O que se mede é onde ela pode ser DISPARADA: toda
     assinatura tem de estar dentro de ouvirASala(), e ouvirASala() só é
     chamada depois do await do login. */
  const corpo = TELAO.match(/function ouvirASala\(\)\{[\s\S]*?\n  \}/);
  assert.ok(corpo, "a assinatura da sala saiu de dentro de ouvirASala()");
  assert.match(corpo[0], /onSnapshot\(roomRef/, "a sala deixou de ser assinada em ouvirASala");
  assert.match(corpo[0], /onSnapshot\(collection/, "os jogadores deixaram de ser assinados em ouvirASala");
  const mod = TELAO.slice(TELAO.indexOf('<script type="module">'));
  const fora = mod.replace(corpo[0], "");
  assert.ok(
    !/onSnapshot\(/.test(fora),
    "voltou a haver assinatura solta no módulo, fora do login — ela nasce negada e nunca se recupera",
  );
});

/* Uma regra que não foi publicada não pode apagar a tela grande: sem a
   presença o telão perde a abertura, não a partida. */
test("sem a regra do telão publicada, a tela grande ainda mostra a partida", () => {
  const connect = TELAO.match(/async function connect\(\)\{[\s\S]*?\n  \}/)?.[0] || "";
  const assina = connect.indexOf("ouvirASala()");
  const presenca = connect.indexOf("await bater()");
  assert.ok(assina > 0 && presenca > 0, "connect perdeu a assinatura ou o registro");
  assert.ok(assina < presenca, "a leitura da sala voltou a depender de o registro ser aceito");
});

/* 05/09/2026: a regra do telão entrou no ar e a TV continuou dizendo que não
   tinha entrado. O registro era tentado UMA vez, no carregamento, e a batida
   de coração só começava se essa vez desse certo — quem abriu a tela grande
   antes do deploy ficava com a mensagem de erro para sempre. */
test("o telão tenta se registrar de novo, não uma vez só", () => {
  assert.match(TELAO, /function bater\(\)/, "não há tentativa repetida de registro");
  assert.match(
    TELAO,
    /heartbeat=setInterval\(bater,5000\)/,
    "a batida voltou a ser só um carimbo de hora, e não uma nova tentativa",
  );
  const connect = TELAO.match(/async function connect\(\)\{[\s\S]*?\n  \}/)?.[0] || "";
  assert.match(connect, /await bater\(\);\n    beat\(\);/, "a batida deixou de começar quando a primeira tentativa falha");
  /* Se beat() ficar dentro do try da primeira tentativa, um erro momentâneo
     volta a virar tela morta. */
  assert.ok(!/catch[\s\S]{0,200}beat\(\)/.test(connect), "a batida voltou a depender do sucesso da primeira tentativa");
});

/* O gesto do áudio não se repete: se ele aconteceu, o aparelho está armado
   mesmo que avisar a sala tenha falhado naquele instante. */
test("o áudio armado não se perde porque o registro falhou", () => {
  const clique = TELAO.match(/readyBtn\.onclick=async\(\)=>\{[\s\S]*?\n  \};/)?.[0] || "";
  assert.match(clique, /armed=true/, "o clique deixou de armar o áudio");
  assert.ok(!/armed=false/.test(clique), "o telão volta a desarmar o áudio quando a sala recusa o registro");
});

/* Sala H4S5M9, 05/09/2026. Havia DUAS telas na sala: a TV, com o áudio armado,
   e uma segunda aberta só para conferir. O Mestre mandou a abertura; a TV
   começou a narrar; a segunda respondeu 'audio-not-armed' com o MESMO token, e
   o Mestre leu isso como "o telão acabou". A abertura foi dada por concluída
   25 s depois do começo e o jogo abriu a primeira atividade por cima da
   apresentação — que foi exatamente o que Mario viu.

   Duas travas, porque uma só não basta: a tela que não pode tocar cala, e o
   Mestre não desiste enquanto alguém estiver tocando. */
test("telão sem áudio armado não responde à abertura", () => {
  const inicio = TELAO.match(/async function startOpening\(token\)\{[\s\S]*?\n  \}/)?.[0] || "";
  assert.ok(inicio, "startOpening sumiu do telão");
  assert.match(inicio, /if\(!armed\)return;/, "o telão sem áudio voltou a responder à abertura");
  /* Sem tirar o comentário, a asserção reprova pelo texto que EXPLICA o
     defeito removido — e a saída seria apagar a explicação. */
  assert.ok(
    !/audio-not-armed/.test(semComentarios(inicio)),
    "voltou o carimbo de erro que encerrava a abertura de quem estava narrando",
  );
});

test("um erro só encerra a abertura se ninguém estiver tocando", () => {
  for (const [nome, fonte] of [["a Mesa", PAUTA], ["A Noite", NOITE]]) {
    assert.match(
      fonte,
      /const tocando = estados\.some\(\(o\) => Number\(o\.token\) === token && o\.status === 'playing'\);/,
      `${nome} não olha se alguma tela está tocando antes de desistir`,
    );
    assert.match(
      fonte,
      /if \(terminou \|\| \(falhou && !tocando\)\)/,
      `${nome} volta a encerrar a abertura no primeiro erro, mesmo com outra tela narrando`,
    );
  }
});

/* Visto na TV em 05/09/2026, com a partida em curso: a tela grande mostrava a
   pergunta e mais nada. A fase SENSORES não tem prazo próprio — dura o que a
   fila das atividades durar —, então o bloco do relógio sumia justamente no
   momento em que a mesa inteira faz a mesma coisa contra o mesmo relógio e
   olha para cima. */
test("a tela grande mostra o relógio da atividade quando a fase não tem um", () => {
  const fn = TELAO.match(/function agoraHtml\(f,at\)\{[\s\S]*?\n  \}/)?.[0] || "";
  assert.ok(fn, "agoraHtml sumiu do telão");
  assert.match(fn, /at&&at\.fimMs/, "a atividade deixou de ter prioridade sobre a fase");
  assert.match(fn, /'ATIVIDADE'/, "o bloco não distingue atividade de fase");
  /* O telão serve todas as mesas e não conhece as atividades de nenhuma. */
  assert.match(PAUTA, /sensor, rotulo: rotulo \|\| sensor/, "a atividade sobe sem nome para a tela grande");
  assert.match(
    GAME,
    /abrirAtividade\?\.\(id,fim,state\.game,SENSORS\[id\]\?\.title\|\|id\)/,
    "a Mesa parou de mandar o nome da atividade, e a TV volta a escrever 'norte'",
  );
});

/* "Mariopresente" na tela grande: b e span são os dois inline, e o nome saía
   grudado no estado. Lido de longe, isso não é espaçamento — é nome errado. */
test("no cartão do jogador o nome e o estado ficam em linhas diferentes", () => {
  assert.match(
    TELAO,
    /\.field b,\.player b\{display:block/,
    "o nome do jogador voltou a ser inline e a grudar no estado",
  );
  assert.match(TELAO, /\.field span,\.player span\{display:block/, "o estado voltou a colar no nome");
});

/* Sala LXUSUR, 05/09/2026: o pódio na tela grande anunciou
   `{nome: "18", pontos: 0}` — o nome do jogador era a NOTA dele, e a nota era
   zero. `entregarNota` nasceu como (nome, pontos, partida) e o jogo chamava com
   dois argumentos: (pontuar().total, state.game). O nome virou 18 e os pontos
   viraram Number('antes') → NaN → 0.

   O conserto não é acertar a ordem: é o nome parar de ser argumento. Quem
   entrega a nota não precisa saber como se chama, e a sala é a única fonte que
   não pode discordar dela mesma. */
test("a nota entregue leva o nome que está na sala, não um argumento", () => {
  assert.match(
    PAUTA,
    /async function entregarNota\(pontos, partida\)/,
    "entregarNota voltou a receber o nome de quem chama",
  );
  assert.match(
    PAUTA,
    /fs\.doc\(db, COLECAO, code, 'jogadores', uid\)/,
    "a nota deixou de buscar o nome na sala",
  );
  /* O `[^)]*` ingênuo para no primeiro parêntese, que é o de pontuar(). */
  const chamada = GAME.match(/entregarNota\?\.\(.*?\);/)?.[0] || "";
  assert.equal(
    chamada,
    "entregarNota?.(pontuar().total,state.game);",
    `a chamada mudou de forma (${chamada}) — confira se ela ainda casa com (pontos, partida)`,
  );
});

/* Os três arquivos da Mesa mudaram várias vezes num dia sob o mesmo ?v=, e o
   aparelho do Mario serviu game.js velho do cache: a atividade subiu para a
   sala sem rótulo, que é código do dia anterior. O carimbo tem de andar junto
   com o conteúdo. */
test("os três carimbos de cache da Mesa dizem a mesma versão", () => {
  const achados = [...MESA_HTML.matchAll(/(styles\.css|pauta-da-mesa\.js|game\.js)\?v=([^'"]+)/g)]
    .map((m) => ({ arquivo: m[1], versao: m[2] }));
  assert.equal(achados.length, 3, `esperava 3 carimbos, achei ${achados.length}`);
  const versoes = [...new Set(achados.map((a) => a.versao))];
  assert.equal(
    versoes.length,
    1,
    `os carimbos divergiram: ${achados.map((a) => a.arquivo + "=" + a.versao).join(", ")}`,
  );
});

/* Sala 4CHRML, 05/09/2026: `abertura.concluidaMs` dizia 150 s exatos — o teto
   — quando a narração durou 77. `acabou()` desligava o ouvinte e chamava
   `concluir()` sem guardar que já tinha corrido, e o setTimeout do teto
   continuava agendado: gravava a conclusão uma SEGUNDA vez, por cima.

   O jogo nunca sofreu (quem entra na mesa tem a trava do `feito`). Quem sofreu
   fui eu lendo: diagnostiquei por esse número um defeito que não existia. Um
   carimbo que mente sobre o próprio sistema é pior que carimbo nenhum. */
test("a abertura conclui uma vez só, e o teto não grava por cima", () => {
  for (const [nome, fonte] of [["a Mesa", PAUTA], ["A Noite", NOITE]]) {
    const trecho = fonte.slice(fonte.indexOf("opening.command"));
    assert.match(
      trecho,
      /const acabou = \(\) => \{\n\s*if \(pronto\) return;\n\s*pronto = true;\n\s*clearTimeout\(teto\);/,
      `${nome}: acabou() voltou a poder rodar duas vezes`,
    );
    assert.match(trecho, /teto = setTimeout\(acabou, /, `${nome}: o teto voltou a não ser cancelável`);
  }
});

/* Sala 4CHRML: a tela grande mostrou a RESOLUÇÃO sozinha, sem pódio. O placar
   viajava só no fecho 'podio'; quando ele virava 'detalhe' — que é o que solta
   a composição de pontos nos celulares — a lista sumia da parede.

   O pódio é o estado FINAL da rodada: é o que a mesa olha enquanto cada um lê
   a própria nota. Ele fica até a próxima pergunta. */
test("o pódio não some quando os celulares abrem o relatório", () => {
  assert.match(
    GAME,
    /publicarFecho\(\{fase:'detalhe',placar:state\.placar\}\)/,
    "o fecho 'detalhe' voltou a viajar sem o placar, e a tela grande perde o pódio",
  );
  /* Rede de segurança: o placar já mora em partida.placar como mapa por uid,
     então um fecho que esqueça a lista não apaga o pódio da parede. */
  assert.match(
    TELAO,
    /Object\.values\(room\?\.partida\?\.placar\|\|\{\}\)\.sort/,
    "a tela grande voltou a depender só do que o fecho carrega",
  );
});

/* Foi assim que o aparelho do Mario serviu game.js de ontem no meio de uma
   partida: o arquivo mudou e o carimbo não. A Noite carrega telao-publica.js
   pela cascata de carro-forte-noite/game.js, e ele também mudou hoje. */
test("o carimbo do telão d'A Noite acompanha o arquivo", () => {
  const cascata = ler("carro-forte-noite/game.js");
  const carimbo = cascata.match(/telao-publica\.js\?v=([^']+)/)?.[1];
  assert.ok(carimbo, "telao-publica.js perdeu o carimbo e deixou de furar o cache");
  assert.match(
    carimbo,
    /^\d{8}-/,
    `o carimbo do telão d'A Noite não tem data (${carimbo}) — sem ela ninguém percebe que ficou para trás`,
  );
});

/* A Casa da Costa e A Manhã do Carro-Forte dividem o projeto mosaico-game E a
   coleção "mosaico". Um código de seis letras digitado no jogo errado entrava
   sem aviso nenhum: o Carro-Forte conferia `caseId`, mas só quando ele existe,
   e a Casa não gravava. A porta ficava aberta nos dois sentidos — e o
   intruso aparecia na lista de jogadores da outra mesa, mexendo nas contagens
   de prontidão que decidem quando a partida avança. */
test("as duas mesas carimbam o caso e recusam o do vizinho", () => {
  const CASA = ler("v1/MOSAICO-mesa.html");
  assert.match(CASA, /caseId:"casa-da-costa"/, "a Casa voltou a criar mesa sem dizer de que caso é");
  assert.match(
    CASA,
    /docMesa\.caseId!=="casa-da-costa"/,
    "a Casa voltou a aceitar o código de outro caso do MOSAICO",
  );
  assert.match(SALA, /caseId:CASE_ID/, "o Carro-Forte parou de carimbar o caso");
  assert.match(
    SALA,
    /snap\.data\(\)\.caseId&&snap\.data\(\)\.caseId!==CASE_ID/,
    "o Carro-Forte parou de recusar mesa de outro caso",
  );
});

/* O cânone antigo da Casa saiu das FRASES em 02/09/2026, mas voltou em outra
   forma: `v2/noite-auto.js` carregava EVIDENCIAS_ANTIGAS, dez dos trinta e seis
   fragmentos cravados no arquivo como "rede de segurança" da migração. Ela era
   inalcançável — o fetch ou traz o caso inteiro ou mostra erro — e mesmo assim
   já tinha derivado: F13 dizia "O consumo" e o caso diz "Consumo de água".
   Uma cópia velha do cânone esperando o dia em que vence calada. */
test("A Noite da Casa não guarda uma cópia própria do banco", () => {
  const NOITE_CASA = ler("v2/noite-auto.js").replace(/\/\*[\s\S]*?\*\//g, " ");
  assert.ok(
    !/EVIDENCIAS_ANTIGAS/.test(NOITE_CASA),
    "voltou um banco de fragmentos cravado dentro d'A Noite da Casa",
  );
  assert.ok(
    !/F\d\d:\{h:"/.test(NOITE_CASA),
    "voltou fragmento escrito à mão no arquivo, fora do JSON do caso",
  );
  /* Sem banco não há noite: melhor lançar alto do que jogar com fragmentos de
     outra época. Mesma regra da Mesa em "sem caso não há partida". */
  assert.match(
    NOITE_CASA,
    /throw new Error\('MOSAICO: o caso chegou sem banco de fragmentos\.'\)/,
    "A Noite da Casa voltou a ter uma saída silenciosa quando o caso chega sem banco",
  );
});

/* v2/ é cópia manual de dist/client, e o teste do build só compara modulos/ —
   noite-auto.js ficava de fora. O favicon já derivou assim uma vez: editado no
   v2/ e desfeito pelo build seguinte. */
test("o noite-auto.js publicado é o mesmo da fonte", () => {
  const a = ler("v2/noite-auto.js");
  const b = ler("mosaico-web/public/noite-auto.js");
  assert.equal(a, b, "v2/noite-auto.js divergiu de mosaico-web/public — o próximo build desfaz a correção");
  /* dist/ é ignorado pelo git: num clone limpo ele não existe, e exigir a
     terceira cópia reprovaria a suíte por ausência de arquivo, não por deriva.
     Quando ela estiver aqui, tem de bater. */
  const dist = new URL("../mosaico-web/dist/client/noite-auto.js", import.meta.url);
  if (existsSync(dist))
    assert.equal(a, ler("mosaico-web/dist/client/noite-auto.js"), "v2/noite-auto.js divergiu de dist/client");
});

/* 05/09/2026: a TV ficou congelada em "📺 Conectando o Telão…" para sempre —
   sem mensagem, sem pista. O `if(!jogo)` existia, mas TRÊS LINHAS DEPOIS de
   `jogo.parede`: com um ?jogo= que a tabela não conhece, o módulo morria no
   primeiro acesso e o próprio if nunca chegava a rodar. O erro ficava só no
   console, que ninguém abre numa televisão. */
test("o telão confere o jogo antes de usá-lo", () => {
  /* Sem tirar os comentários, o próprio texto que explica o defeito cita
     `jogo.parede` antes da guarda e reprova a correção. */
  const mod = semComentarios(TELAO.slice(TELAO.indexOf('<script type="module">')));
  const guarda = mod.indexOf("if(!jogo){");
  const usa = mod.indexOf("jogo.parede");
  assert.ok(guarda > 0 && usa > 0, "não achei a guarda ou o uso do jogo no telão");
  assert.ok(
    guarda < usa,
    "o telão voltou a usar `jogo` antes de conferir se ele existe — e trava mudo no 'Conectando'",
  );
  /* Quem digitou errado precisa saber o que digitar, não que errou. */
  assert.match(
    TELAO,
    /Object\.keys\(JOGOS\)\.join/,
    "a mensagem de jogo desconhecido parou de dizer quais existem",
  );
});

/* 05/09/2026, foto da tela do Mario: "Firebase: Error (auth/popup-blocked)".
   A Mesa da Casa abria o pop-up do Google DEPOIS de `await autenticar()` — e um
   await já basta para o navegador considerar que o gesto do usuário acabou.
   Quem tinha sessão Google viva nunca via isso (a checagem de ehGoogle devolve
   antes), então o defeito só atingia quem chega sem sessão: justamente quem
   mais precisa entrar.

   E o efeito visível era pior que o erro: a Mesa já tinha mostrado um código de
   seis letras, com o selo "Conectando…" no canto, e NENHUMA sala no Firestore.
   O Mestre passava esse código para a mesa e ninguém conseguia entrar. */
test("a Mesa da Casa abre o pop-up dentro do toque, e só mostra código de sala que existe", () => {
  const CASA = ler("v1/MOSAICO-mesa.html");
  const fn = CASA.match(/async function autenticarGoogle\(\)\{[\s\S]*?\n\}/)?.[0] || "";
  assert.ok(fn, "autenticarGoogle sumiu");
  const login = fn.indexOf("signInWithPopup");
  const espera = fn.indexOf("await autenticar()");
  assert.ok(login > 0, "o login com Google saiu de autenticarGoogle");
  assert.ok(
    espera === -1 || espera > login,
    "voltou um await antes do pop-up — o navegador perde o gesto e devolve auth/popup-blocked",
  );
  assert.match(
    CASA,
    /auth\/popup-blocked/,
    "a Mesa voltou a tratar pop-up bloqueado como erro genérico, e a mensagem culpa o e-mail",
  );

  /* A gravação vem antes da tela: código na mão sem sala no Firestore é pior
     que erro nenhum, porque parece que deu certo. */
  const criar = CASA.match(/async function criarMesa\(modo\)\{[\s\S]*?\n\}/)?.[0] || "";
  const grava = criar.indexOf("FB.criarMesa(codigo");
  const mostra = criar.indexOf("STATE.tela=modo===");
  assert.ok(grava > 0 && mostra > 0, "não achei a gravação ou a troca de tela em criarMesa");
  assert.ok(grava < mostra, "a Mesa voltou a mostrar o código antes de a sala existir");
});

/* ==========================================================================
   AS TRES ATIVIDADES SENSORIAIS, NO PADRAO DA CASA (05/09/2026)
   ==========================================================================
   Mario jogou as seis no mesmo dia: "a janela do norte, a sala escura
   funcionaram perfeitamente bem. esse vai ser o padrao. Nao gostei do que foi
   feito de atividade para o carro-forte. Aquele servico precisa ser
   substituido."

   O que estes testes guardam nao e a arte - e o que separava as duas
   linhagens. As do Carro-Forte revelavam por PROXIMIDADE DE PONTEIRO sobre uma
   div: o gesto era arrastar o mouse, o mundo nao existia, e um lote de quatro
   cabia inteiro na tela ao mesmo tempo. As da Casa pedem o corpo.            */
test("as atividades do Carro-Forte usam a bussola, e nao varredura de ponteiro", () => {
  const BUSSOLA = ler("carro-forte/bussola.js");
  assert.match(BUSSOLA, /webkitCompassHeading/, "o instrumento perdeu o tratamento de iOS");
  assert.match(BUSSOLA, /oitoNoAr/, "o portao do oito saiu do instrumento");

  for (const nome of ["janela-do-norte", "sala-as-escuras"]) {
    const pagina = ler(`carro-forte/${nome}.html`);
    const codigo = semComentarios(pagina);
    assert.match(pagina, /bussola\.js/, `${nome} nao carrega mais a bussola`);
    assert.match(codigo, /MosaicoBussola/, `${nome} parou de usar o instrumento`);
    assert.match(codigo, /B\.Mira\(/, `${nome} nao cobra mais permanencia no alvo`);
    assert.match(codigo, /oitoNoAr/, `${nome} deixou de pedir a calibragem do oito`);
    assert.ok(
      !/pointermove[\s\S]{0,200}RAIO/.test(codigo),
      `${nome} voltou a revelar por proximidade de ponteiro`,
    );
  }
});

/* O beco sem saida que quase foi para a demonstracao: sem evento de
   orientacao, amostra() nunca roda, a barra fica em zero e o botao do oito
   nunca libera - com a tela por cima de tudo. A anistia afrouxa as metas, mas
   multiplica por zero do mesmo jeito. */
test("o portao do oito sempre tem saida, mesmo sem sensor nenhum", () => {
  const BUSSOLA = semComentarios(ler("carro-forte/bussola.js"));
  assert.match(
    BUSSOLA,
    /seg\s*>\s*25\s*&&\s*bt\.disabled/,
    "sumiu a saida por tempo do oito: sem sensor, o botao fica desabilitado para sempre",
  );
  for (const nome of ["janela-do-norte", "sala-as-escuras"]) {
    const dedo = semComentarios(ler(`carro-forte/${nome}.html`))
      .match(/function porDedo\(\)\{[\s\S]*?\n\}/)?.[0] || "";
    assert.ok(dedo, `${nome}: porDedo sumiu`);
    assert.match(
      dedo,
      /getElementById\(['"]oito['"]\)[\s\S]{0,40}remove\(['"]on['"]\)/,
      `${nome}: o modo dedo nao fecha a tela do oito, e ela fica por cima`,
    );
  }
});

/* A Sala e a unica das tres em que o jogador esta DENTRO do cenario, e foi por
   isso que a mira da Casa nao servia crua: um armario de dois metros a dois
   metros de distancia ocupa meia tela, e cobrar 3,4 graus do centro exato dele
   deixava a barra em zero com o facho cheio em cima da coisa. */
test("a mira da Sala acompanha o tamanho do movel, e o texto le a mesma janela", () => {
  const BUSSOLA = semComentarios(ler("carro-forte/bussola.js"));
  assert.match(
    BUSSOLA,
    /function tolerancia\(alto, altoEl\)/,
    "a tolerancia voltou a ter altura fixa; alvos grandes viram impossiveis",
  );
  const ESCURA = semComentarios(ler("carro-forte/sala-as-escuras.html"));
  assert.match(ESCURA, /mira\.passo\(dt, altoAz, altoEl\)/, "a Sala parou de alargar a mira pelo tamanho do alvo");
  assert.match(
    ESCURA,
    /var tol=mira\.tolerancia\(altoAz, altoEl\)/,
    "o texto de orientacao voltou a ter limiares proprios, e volta a contradizer a barra",
  );
});

/* O que da segundo folego a uma sala pequena, e o que a versao antiga nao
   tinha: uma coisa esconde outra. Sem isso, quatro alvos em 360 graus sao
   quatro alvos, e a busca acaba antes do relogio. */
test("a Sala mantem um objeto escondido atras de outro", () => {
  const ESCURA = semComentarios(ler("carro-forte/sala-as-escuras.html"));
  assert.match(ESCURA, /escondeAtras:'arquivo'/, "o painel deixou de nascer coberto pelo armario");
  assert.match(
    ESCURA,
    /h\.escondeAtras!==o\.id \|\| h\.posto/,
    "sumiu a entrada em cena do que estava escondido: o alvo fica inalcancavel",
  );
  /* Se a capa nao esta no lote da Mesa, ninguem nunca a derruba - e o
     escondido vira alvo impossivel. */
  assert.match(
    ESCURA,
    /if\(!temCapa\) o\.escondeAtras=null/,
    "voltou a ser possivel pedir um alvo cuja capa nao esta em jogo",
  );
});

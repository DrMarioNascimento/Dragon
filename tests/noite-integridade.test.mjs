/* A Noite carrega o núcleo em cascata: `index.html` injeta `game.js`, que
   injeta `game-fixed.js`, que injeta `opening-flow.js`. Nenhum desses passos
   avisa quando o arquivo de baixo não compila — o navegador descarta o script
   inteiro em silêncio, a página continua abrindo, a abertura continua bonita,
   e o que some é a fiação que mora no fim do arquivo: o clique de "Entrar na
   reunião", os botões de ritmo, as três ações da mesa e a API que os bots do
   Solo Lab usam para jogar.

   Foi exatamente o que aconteceu: uma reescrita cortou `game-fixed.js` no meio
   da última expressão. O arquivo ficou vinte bytes menor, o diff parecia uma
   melhoria do fluxo Arriscar, e o único sintoma visível foi um botão que não
   respondia mais. Procurar o erro no botão não adianta — ele nunca chegou a
   ter dono.

   Esta auditoria falha antes de publicar: exige que cada arquivo compile e que
   os pontos de fiação continuem escritos onde a página os espera. */

import { readFileSync, readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";
import assert from "node:assert/strict";

const pasta = new URL("../carro-forte-noite/", import.meta.url);
const ler = nome => readFileSync(new URL(nome, pasta), "utf8");
const scripts = readdirSync(pasta).filter(nome => nome.endsWith(".js")).sort();

function compila(caminho, nome) {
  try {
    execFileSync(process.execPath, ["--check", caminho], { stdio: "pipe" });
  } catch (erro) {
    assert.fail(`${nome} não compila:\n${erro.stderr?.toString() ?? erro.message}`);
  }
}

test("todo script de A Noite compila", () => {
  assert.ok(scripts.length >= 8, "a pasta perdeu scripts");
  for (const nome of scripts) compila(fileURLToPath(new URL(nome, pasta)), nome);
});

/* A auditoria acima só olhava a própria pasta, e por isso deixou passar o
   segundo arquivo cortado: `firebase-room.js` mora na raiz, é compartilhado
   com a Mesa, e estava truncado no meio de `formTelao` — sem `liberar` nem
   `ouvir`. O módulo inteiro era descartado, o evento de liberação nunca era
   disparado, o jogo nunca carregava, e o sintoma era o mesmo de antes: o
   botão de entrar na reunião sem resposta.

   Conferir uma pasta não basta quando a página monta a si mesma a partir de
   três diretórios. Esta varre o que o próprio index.html pede. */
test("todo script que a página pede compila, venha de onde vier", () => {
  const html = ler("index.html");
  const pedidos = [...html.matchAll(/(?:src|f\.src)\s*=\s*['"]([^'"]+\.js)(?:\?[^'"]*)?['"]/g)]
    .map(m => m[1])
    .filter(src => !src.startsWith("http"));
  const deFora = pedidos.filter(src => src.startsWith("../"));
  assert.ok(deFora.length >= 2, "a página deixou de carregar scripts compartilhados; a varredura ficou cega");
  for (const src of new Set(pedidos)) {
    const url = new URL(src, pasta);
    let caminho;
    try {
      caminho = fileURLToPath(url);
      readFileSync(caminho);
    } catch {
      assert.fail(`index.html pede ${src}, que não existe`);
    }
    compila(caminho, src);
  }
});

/* E o terceiro defeito da mesma pilha: a folha é carregada com type="module",
   onde `document.currentScript` é sempre null. Toda a configuração da página
   — projeto Firebase, coleção, nome do evento — virava undefined e caía no
   padrão da Mesa. A página da Noite falava com o projeto errado e anunciava
   um evento que ninguém escutava. */
test("a sala lê a configuração da página mesmo sendo um módulo", () => {
  const sala = readFileSync(new URL("../firebase-room.js", pasta), "utf8");
  assert.ok(
    sala.includes("document.currentScript||"),
    "firebase-room.js voltou a depender só de document.currentScript, que é null em módulo"
  );
  assert.ok(
    /function\s+liberar\s*\(/.test(sala) && /function\s+ouvir\s*\(/.test(sala),
    "firebase-room.js perdeu liberar/ouvir: o portão abre e o jogo nunca começa"
  );
});

test("o núcleo termina com a fiação que a página espera", () => {
  const nucleo = ler("game-fixed.js");
  const fiacao = [
    "enterBtn.onclick",         // Entrar na reunião
    "[data-pace]",              // 30 s / 60 s
    "[data-action]",            // arriscar, capturar, comprar
    "mosaico-opening-finished", // libera a pauta quando a abertura termina
    "scoreBtn.onclick",
    "infoBtn.onclick"
  ];
  for (const marca of fiacao) {
    assert.ok(nucleo.includes(marca), `game-fixed.js perdeu ${marca}`);
  }
});

test("o núcleo expõe a API que os bots do Solo Lab chamam", () => {
  const nucleo = ler("game-fixed.js");
  const chamadas = [...ler("solo-bots.js").matchAll(/core\.solo\.(\w+)\(/g)].map(m => m[1]);
  assert.ok(chamadas.length > 0, "solo-bots.js não chama mais o núcleo");
  for (const nome of new Set(chamadas)) {
    assert.match(nucleo, new RegExp(String.raw`\b${nome}\s*[(:]`), `MosaicoCore.solo perdeu ${nome}`);
  }
  assert.ok(
    nucleo.includes("answers:state.question?"),
    "getSnapshot deixou de devolver answers, e os bots decidem no escuro"
  );
});

test("o carimbo de cache atravessa a cascata inteira", () => {
  const carimbo = (texto, alvo) => {
    const chave = `${alvo}?v=`;
    const i = texto.indexOf(chave);
    assert.ok(i >= 0, `carimbo de ${alvo} não encontrado`);
    return texto.slice(i + chave.length).match(/^[\w-]+/)[0];
  };
  assert.equal(
    carimbo(ler("index.html"), "game.js"),
    carimbo(ler("game.js"), "game-fixed.js"),
    "index.html e game.js pedem versões diferentes: o navegador serve o núcleo velho ao lado do HTML novo"
  );
  assert.equal(
    carimbo(ler("game.js"), "layout-compacto.js"),
    carimbo(ler("layout-compacto.js"), "layout-compacto.css"),
    "o script e a folha do layout compacto pedem versões diferentes: o aparelho veste metade nova e metade velha"
  );
});

/* O layout compacto tira o HUD do topo e o espelha junto aos botões de ação.
   Ele faz isso escondendo `.hud` inteiro — e o ⓘ mora lá dentro. Se o ⓘ não
   mudar de pai antes, ele some junto, e a gaveta de regras fica sem porta:
   não existe outro caminho para abri-la. A folha de estilo já reservava o
   lugar dele em `.topline > #infoBtn` desde o primeiro dia; era só o script
   que nunca completou a mudança. */
test("o layout compacto não leva o ⓘ junto com o HUD que esconde", () => {
  const layout = ler("layout-compacto.js");
  const mudaDePai = layout.indexOf("topline.appendChild(info)");
  const escondeHud = layout.indexOf("hud.classList.add('compact-source-hidden')");
  assert.ok(mudaDePai >= 0, "o ⓘ não muda de pai: a gaveta de regras fica sem porta");
  assert.ok(escondeHud >= 0, "o layout compacto parou de esconder o HUD de origem");
  assert.ok(mudaDePai < escondeHud, "o ⓘ muda de pai tarde demais e some junto com o HUD");
});

/* O M da marca volta a aparecer, maior, ao lado do nome. O que o deixava
   órfão nunca foi o tamanho: com `.topline .brand{display:block}` ele caía
   numa linha própria acima do texto. Em linha, com o nome ao lado, ele é a
   marca; empilhado, é um quadrado solto. É o display que precisa ser
   guardado — esconder o M foi só o curativo que a gente tirou. */
test("o M fica ao lado do nome, não acima dele", () => {
  const css = ler("layout-compacto.css");
  assert.ok(
    css.includes(".topline .brand{display:flex"),
    "a marca voltou a empilhar: o M cai numa linha própria e fica órfão"
  );
  assert.ok(
    !css.includes(".compact-brand .mark{display:none}"),
    "o M está escondido de novo"
  );
  assert.ok(
    !ler("layout-compacto.js").includes("mark.hidden=true"),
    "o script voltou a esconder o M"
  );
});

test("o núcleo não confunde o diálogo com a própria função modal", () => {
  assert.ok(
    !ler("game-fixed.js").includes("window.modal."),
    "`function modal()` ocupa window.modal; o <dialog id=modal> só responde por getElementById"
  );
});

/* Por muito tempo os bots escreveram a frase de cada jogada — "Bot Analítico:
   comprou F5." — e a entregaram a um `finishTurn(){next()}` que não lia o
   argumento. A frase existia, ninguém a via. Se o parâmetro cair de novo, o
   diário volta a mostrar só as jogadas humanas, e nada quebra: é o tipo de
   perda que passa despercebida até alguém reparar que os bots emudeceram. */
test("a frase que os bots escrevem chega ao diário", () => {
  const nucleo = ler("game-fixed.js");
  assert.match(
    nucleo,
    /finishTurn\(\s*\w+\s*\)\s*\{[^}]*nota\(/,
    "finishTurn voltou a descartar o aviso: as jogadas dos bots somem do diário"
  );
  assert.match(ler("solo-bots.js"), /finishTurn\(`/, "os bots pararam de narrar a própria jogada");
  assert.ok(nucleo.includes("getLog:"), "o núcleo deixou de publicar o diário");
  assert.ok(
    ler("solo-sala-casa.js").includes("getLog"),
    "o painel Acompanhamento da rodada voltou a ser um lugar vazio"
  );
});

/* O indicador de VEZ mostra o nome de quem joga — "Você", "Bot Cauteloso" —
   e é dele que os bots leem de quem é a vez. As duas pontas são o mesmo
   texto: se `next()` escrever um nome que `slotFrom` não reconhece, ela
   devolve 0, nenhum bot se identifica, e a mesa congela na primeira jogada
   deles sem erro nenhum no console. */
test("quem escreve a vez e quem lê a vez falam a mesma língua", () => {
  assert.ok(
    ler("game-fixed.js").includes("turnPlayer.textContent=actorName()"),
    "o indicador de vez voltou a ser Arquivo NN e discorda do resto da tela"
  );
  const bots = ler("solo-bots.js");
  assert.ok(
    bots.includes("BOTS.find(b=>b.name===t)"),
    "slotFrom só entende Arquivo NN: com nome de bot na vez, a mesa congela"
  );
  assert.ok(
    bots.includes("voc[eê]"),
    "slotFrom não reconhece 'Você' como o primeiro dossiê: sua própria vez some"
  );
});

/* Seção 5 do PADRAO-SALA-MULTIPLAYER: "qualquer pergunta, cenário ou variante
   definida pelo sistema deve ser gravada no documento da sala e permanecer
   congelada durante aquela sessão; recarga ou reconexão não pode gerar outra
   variante." O núcleo fazia o oposto — `Math.random()` em cada aparelho — e
   numa sala de oito eram oito perguntas diferentes. O sorteio local continua
   existindo, e deve: é o certo no ensaio, onde não há sala. O que não pode
   voltar é ele ser o único caminho. */
test("a pergunta da noite é perguntada à sala antes de ser sorteada", () => {
  const nucleo = ler("game-fixed.js");
  const consulta = nucleo.indexOf("window.MosaicoSalaPartida");
  const sorteio = nucleo.indexOf("ids[Math.floor(Math.random()*ids.length)]");
  assert.ok(consulta >= 0, "o núcleo voltou a sortear sem perguntar à sala");
  assert.ok(sorteio >= 0, "o sorteio local sumiu: o ensaio neste aparelho fica sem pergunta");
  assert.ok(consulta < sorteio, "o sorteio local acontece antes de consultar a sala e vence a pergunta congelada");

  const sala = ler("sala-partida.js");
  assert.ok(sala.includes("'partida.pergunta'"), "sala-partida.js não grava mais a pergunta no documento da sala");
  assert.ok(
    sala.includes("if (atual) return Promise.resolve(atual)"),
    "a gravação deixou de ser idempotente: reconectar volta a re-sortear"
  );
});

/* Um módulo de sincronia que não carrega não pode levar o jogo junto. Foi
   assim que a página ficou morta duas vezes: um arquivo não compilou e o
   navegador descartou tudo em silêncio. Aqui a falha é prevista e o jogo
   abre assim mesmo, sorteando local. */
test("se a sincronia não carregar, o jogo abre mesmo assim", () => {
  const html = ler("index.html");
  const i = html.indexOf("sala-partida.js");
  assert.ok(i >= 0, "index.html deixou de carregar a sincronia da pergunta");
  const trecho = html.slice(i, i + 320);
  assert.ok(trecho.includes("onerror"), "a falha do módulo de sala não é tratada");
  assert.match(
    trecho,
    /onerror=\(\)=>\{[^}]*loadGame\(\)/,
    "o onerror não carrega o jogo: um módulo ausente volta a deixar a página morta"
  );
});

/* A escolha do CAPTURAR é de quem tirar, nunca de qual fragmento — o segredo
   do dossiê alheio é a tensão da mesa. Para a escolha não ser sorteio, ela
   precisa mostrar quem está ganhando. */
test("a lista do capturar mostra quem está fechando campos", () => {
  const nucleo = ler("game-fixed.js");
  assert.ok(nucleo.includes("fechados=s=>"), "a lista do capturar voltou a mostrar todos iguais");
  assert.ok(
    nucleo.includes("${fechados(x.slot)}"),
    "o número de campos fechados sumiu dos botões de escolha"
  );
});

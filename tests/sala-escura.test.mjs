/* A Sala às Escuras — invariantes da sala e do cânone.
 *
 * Existe por causa de 02/09/2026: o cânone antigo sobreviveu meses dentro dos
 * três módulos sensoriais porque ninguém tinha como perceber. O que havia era
 * um remendo por regex em `sensor-casa-da-costa-v2.js` que varria o texto da
 * página em tempo de execução — e que, medido, não acertava NADA. O cofre
 * arrombado continuou lá o tempo todo, porque cofre não é frase: é objeto de
 * cena, com geometria.
 *
 * Estes testes olham a FONTE, não a página renderizada. É a única forma de o
 * cânone antigo não voltar sem aviso.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";

const RAIZ = new URL("../v1/", import.meta.url);
const ler = (n) => readFileSync(new URL(n, RAIZ), "utf8");

const SALA = ler("MOSAICO-26-a-sala-as-escuras.html");
const JANELA = ler("MOSAICO-26-a-janela-do-norte.html");
const VIDRO = ler("MOSAICO-26-vidro-embacado.html");
const SENSOR = ler("js/sensor-casa-da-costa-v2.js");

/* O array OBJETOS lido da fonte. Não dá para importar: a sala é uma página
   inteira com canvas. Ler o literal é o suficiente para as invariantes. */
function objetosDaSala() {
  const ini = SALA.indexOf("var OBJETOS = [");
  const fim = SALA.indexOf("\n];", ini);
  assert.ok(ini > 0 && fim > ini, "array OBJETOS não localizado na sala");
  const bloco = SALA.slice(ini, fim);
  const campo = (t, nome, aspas = true) => {
    const re = aspas
      ? new RegExp(nome + ':"([^"]*)"')
      : new RegExp(nome + ":(true|false)");
    const m = t.match(re);
    return m ? m[1] : null;
  };
  return bloco
    .split(/\n\s*\{ id:/)
    .slice(1)
    .map((pedaco) => {
      const t = "id:" + pedaco;
      return {
        id: campo(t, "id"),
        hora: campo(t, "hora"),
        escondeAtras: campo(t, "escondeAtras"),
        final: /final:true/.test(t),
      };
    });
}

test("a sala tem nove objetos e dois deles ficam escondidos", () => {
  const o = objetosDaSala();
  assert.equal(o.length, 9, "número de objetos");
  const escondidos = o.filter((x) => x.escondeAtras);
  assert.deepEqual(
    escondidos.map((x) => x.id + "←" + x.escondeAtras),
    ["cofre←quadro", "secretaria←escrivaninha"]
  );
});

test("toda capa existe, e vem antes do que ela esconde", () => {
  const o = objetosDaSala();
  const pos = new Map(o.map((x, i) => [x.id, i]));
  for (const x of o) {
    if (!x.escondeAtras) continue;
    assert.ok(pos.has(x.escondeAtras), `capa inexistente: ${x.escondeAtras}`);
    /* Se o escondido vier antes, a sala pede para achar o cofre antes do
       quadro que o cobre — e o enigma fica impossível. */
    assert.ok(
      pos.get(x.escondeAtras) < pos.get(x.id),
      `${x.id} vem antes da sua capa ${x.escondeAtras}`
    );
  }
});

test("as horas sobem: a ordem do array é a ordem dos enigmas", () => {
  const o = objetosDaSala();
  for (let i = 1; i < o.length; i++) {
    assert.ok(
      o[i].hora >= o[i - 1].hora,
      `${o[i].id} (${o[i].hora}) vem depois de ${o[i - 1].id} (${o[i - 1].hora})`
    );
  }
});

test("cabe um setor de 45° para cada objeto procurável", () => {
  const o = objetosDaSala();
  const aoRedor = o.filter((x) => !x.escondeAtras).length;
  /* Os escondidos herdam o rumo da capa e não gastam setor. Se um dia
     sobrarem mais de oito procuráveis, `setores[i]` vira undefined e o rumo
     do último objeto vira NaN — some da sala sem erro nenhum no console. */
  assert.ok(aoRedor <= 8, `${aoRedor} objetos ao redor para 8 setores`);
});

test("a sala termina no nome", () => {
  const o = objetosDaSala();
  const finais = o.filter((x) => x.final);
  assert.equal(finais.length, 1, "só um objeto pode ser o fecho");
  assert.equal(finais[0].id, "secretaria");
  assert.equal(finais[0], o[o.length - 1], "o fecho é o último enigma");
});

test("o cânone antigo não voltou a nenhum dos três módulos", () => {
  /* Cada uma destas frases é do caso anterior — o herdeiro que arromba o
     cofre para pegar um documento. O caso agora é a sétima pessoa que nunca
     saiu da casa, e nada foi levado do cofre (F32). */
  const proibidas = [
    /marca (recente|de dedo) na trava/i,
    /pequeno objeto met[áa]lico/i,
    /a n[ée]voa entrou pela fresta/i,
    /a busca convergiu para o cofre/i,
    /a linha da verdade estava tra[çc]ada/i,
    /21h03/,                       /* o apagão antigo: agora é 21h29 */
    /a porta da sala estava entreaberta/i,
  ];
  for (const [nome, txt] of [
    ["A Sala às Escuras", SALA],
    ["A Janela do Norte", JANELA],
    ["O Vidro Embaçado", VIDRO],
  ]) {
    for (const re of proibidas) {
      assert.ok(!re.test(txt), `${nome} ainda diz ${re}`);
    }
  }
});

test("a camada do caso não remenda mais o texto da página", () => {
  /* O TreeWalker e o MutationObserver saíram em 02/09/2026. Se voltarem, é
     porque alguém tentou consertar cânone por regex de novo — e o certo é
     mudar o texto na fonte. As duas menções que sobram estão no comentário
     que explica isso. */
  assert.equal(
    (SENSOR.match(/createTreeWalker|new MutationObserver/g) || []).length,
    0,
    "sensor-casa-da-costa-v2.js voltou a varrer o DOM"
  );
  assert.ok(
    !/\.replace\(\//.test(SENSOR),
    "sensor-casa-da-costa-v2.js voltou a trocar texto por regex"
  );
});

test("as camadas do jogador resolvem o código da sala pelo STATE.eu", () => {
  /* `STATE.mesa` só existe em três caminhos — criar mesa, painel do Mestre e
     reconexão. Quem entra pelo QR e não recarrega joga a partida inteira com
     `STATE.mesa` null, e o código dele está em `STATE.eu.codigo`.
     Em 02/09/2026 duas camadas ignoravam isso e gravavam calado no vazio:
     o carimbo de chegada (e com ele os 5 pontos de duração) nunca acontecia,
     e consignar no mercado apagava a peça da mão sem pôr no balaio. */
  for (const arq of [
    "js/rendimento-casa-da-costa.js",
    "js/mercado-casa-da-costa.js",
  ]) {
    const txt = ler(arq);
    assert.match(
      txt,
      /STATE\.eu && STATE\.eu\.codigo/,
      `${arq} não tem alternativa a STATE.mesa para o código da sala`
    );
  }
});

test("uma gravação de balaio que não pode acontecer lança, não volta calada", () => {
  /* Voltar calado fazia o chamador seguir em frente como se tivesse gravado —
     e o passo seguinte tirava a peça da mão do jogador. */
  const txt = ler("js/mercado-casa-da-costa.js");
  const bloco = txt.slice(
    txt.indexOf("async function salvarBalaio"),
    txt.indexOf("async function salvarBalaio") + 400
  );
  assert.match(bloco, /throw new Error/, "salvarBalaio voltou a falhar em silêncio");
});

test("a entrada de /Dragon/v2/ carrega A Noite, não o app React", () => {
  /* 02/09/2026: a publicação copiava a casca do React por cima de index.html
     e 404.html, e isso trocava o jogo publicado sem quebrar nada visível —
     a página abre, só que abre OUTRO caso (case.ts, TRUTH elias/m-heranca).
     Salvar os arquivos do rmSync não bastou: a página que os carrega era
     sobrescrita na linha seguinte. */
  const RAIZ_REPO = new URL("../", import.meta.url);
  const lerRepo = (n) => readFileSync(new URL(n, RAIZ_REPO), "utf8");
  for (const nome of ["v2/index.html", "v2/404.html", "v2/_shell.html"]) {
    assert.match(
      lerRepo(nome),
      /room-shell\.js/,
      `${nome} deixou de carregar A Noite`
    );
  }
  /* E a cadeia inteira: a página carrega room-shell, que carrega noite-auto,
     que lê o banco. Qualquer elo que caia deixa o jogo abrindo em branco ou
     contando a história errada. */
  assert.match(lerRepo("mosaico-web/public/room-shell.js"), /noite-auto\.js/);
  assert.match(
    lerRepo("mosaico-web/public/noite-auto.js"),
    /casos\/casa-da-costa\.json/,
    "A Noite deixou de ler o banco do caso"
  );
});

test("nenhum código do banco chega à tela", () => {
  /* F11, H3, R7 e P-D são endereços internos. Na tela viram atalho de memória
     entre partidas: quem já jogou decora que uma certa hipótese é a que sempre
     cai, e passa a resolver pelo código em vez de pelo fato. O banco continua
     usando os códigos — eles só não aparecem.

     Este teste procura o padrão que os põe em texto: uma interpolação do campo
     `id`/`cod`/`frag` seguida de separador visível. Atributo que só serve de
     endereço (value=, onclick=, data-, name=) não conta. */
  const RAIZ_REPO = new URL("../", import.meta.url);
  const lerRepo = (n) => readFileSync(new URL(n, RAIZ_REPO), "utf8");
  const vazando =
    /(\$\{|\+ *)(esc0?\()?[a-zA-Z.]*\.(id|cod|frag)\)?[^;\n]{0,15}(·|<\/)/;
  const arquivos = [
    "mosaico-web/public/noite-auto.js",
    "v1/js/banco-casa-da-costa.js",
    "v1/js/rendimento-casa-da-costa.js",
    "v1/js/mercado-casa-da-costa.js",
    "v1/js/mosaico-casa-da-costa.js",
  ];
  for (const arq of arquivos) {
    const linhas = lerRepo(arq)
      .split("\n")
      .filter((l) => vazando.test(l) && !/value=|onclick|data-|name=/.test(l));
    assert.deepEqual(linhas, [], `${arq} voltou a mostrar código do banco`);
  }
  /* E o dossiê de A Noite, que era o pior caso: "F11 · A porta do jardim". */
  const noite = lerRepo("mosaico-web/public/noite-auto.js");
  assert.ok(
    !/<strong>\$\{c\} ·/.test(noite),
    "o fragmento voltou a ser rotulado pelo código"
  );
});

test("nada que existe só para testar é carregado pela casca do jogo", () => {
  /* Regra do Mario, 02/09/2026. Ela nasceu de um caso concreto: até esse dia
     `casa-solo-bots.js` — sete bots de playtest com evidências inventadas —
     era carregado por noite-shell.html, PUBLICADO, atrás só de um ?soloLab=1.
     O portão funcionava, então o risco era pequeno; o problema é o padrão.
     Artefato de bancada embarcado no jogo é o mesmo padrão que fez bot virar
     jogador de mentira e que faz o teste esconder o caminho publicado.

     As bancadas moram em ferramentas/ e ninguém as carrega: elas se abrem no
     Node ou se injetam pelo console. */
  const RAIZ_REPO = new URL("../", import.meta.url);
  const lerRepo = (n) => readFileSync(new URL(n, RAIZ_REPO), "utf8");
  const cascas = [
    "v1/MOSAICO-mesa.html",
    "mosaico-web/public/noite-shell.html",
    "v2/index.html",
    "v2/404.html",
    "v2/_shell.html",
  ];
  for (const casca of cascas) {
    const txt = lerRepo(casca);
    assert.ok(
      !/ferramentas\//.test(txt),
      `${casca} carrega algo de ferramentas/, que é bancada`
    );
    assert.ok(
      !/casa-solo-bots|soloLab/.test(txt),
      `${casca} voltou a embarcar os bots de playtest`
    );
  }
});

test("o mercado não grava direto no documento do jogador nem da sala", () => {
  /* firestore.rules · ownPlayerUpdate deixa o jogador mexer só em pronto,
     forma, atualizadoEmMs e pistas — e hasOnly reprova a escrita inteira se
     UMA chave estiver fora. Em 02/09/2026 as cinco escritas do mercado eram
     todas negadas, e o balaio pior ainda: mora no documento da SALA, que só
     o Mestre atualiza. Na tela funcionava; no servidor não acontecia nada, e
     o jogador levava o fragmento sem pagar.

     Agora o jogador CRIA um pedido em `acoes` e o Mestre aplica. Este teste
     guarda a separação: fora de aplicar(), que é o lado do Mestre, não pode
     sobrar escrita no documento do jogador nem no da sala. */
  const RAIZ_REPO = new URL("../", import.meta.url);
  const merc = readFileSync(new URL("v1/js/mercado-casa-da-costa.js", RAIZ_REPO), "utf8");

  const iAplicar = merc.indexOf("async function aplicar(");
  assert.ok(iAplicar > 0, "o processador do Mestre sumiu do mercado");
  const fim = merc.indexOf('return "tipo-desconhecido"');
  assert.ok(fim > iAplicar, "não achei o fim de aplicar()");
  /* fora do lado do jogador vai também o CORPO de salvarBalaio: ele grava no
     documento da sala, mas a definição mora fora de aplicar() e só é chamada
     de dentro dele. O que interessa é quem CHAMA. */
  const iSalvar = merc.indexOf("async function salvarBalaio");
  const fSalvar = merc.indexOf("\n  }", iSalvar) + 4;
  const semSalvar = merc.slice(0, iSalvar) + merc.slice(fSalvar);
  const desloca = merc.length - semSalvar.length;
  const ladoJogador =
    semSalvar.slice(0, iAplicar - desloca) + semSalvar.slice(fim - desloca);

  const regras = readFileSync(new URL("firestore.rules", RAIZ_REPO), "utf8");
  const permitidas = regras
    .match(/function ownPlayerUpdate[\s\S]*?hasOnly\(\[([^\]]+)\]\)/)[1]
    .split(",").map((x) => x.trim().replace(/['"]/g, ""));

  for (const m of ladoJogador.matchAll(/atualizarJogador\([^,]+,[^,]+,\s*\{([^}]*)\}/g)) {
    const chaves = [...m[1].matchAll(/(\w+)\s*:/g)].map((x) => x[1]);
    const fora = chaves.filter((c) => !permitidas.includes(c));
    assert.deepEqual(fora, [], `o jogador voltou a gravar ${fora} no próprio documento`);
  }
  assert.equal(
    [...ladoJogador.matchAll(/atualizarMesa\([^)]*\{/g)].length, 0,
    "o jogador voltou a gravar no documento da sala — só o Mestre pode"
  );
  assert.equal(
    [...ladoJogador.matchAll(/await salvarBalaio\(/g)].length, 0,
    "o jogador voltou a mexer no balaio; ele mora no documento da sala"
  );
  /* e o canal tem de existir dos dois lados */
  assert.match(merc, /gravarServidor\([^)]*"acoes"/, "o pedido em acoes sumiu");
  assert.match(merc, /processarAcoesMestre/, "o mercado deixou de pegar carona no ouvinte do Mestre");
});

test("o laboratório de bots não fica de pé no caminho publicado", () => {
  /* Ele entra numa sala DE VERDADE, com a config d'A Noite pronta no campo.
     O Pages serve a raiz do repositório, então esta pasta ficaria acessível ao
     lado do jogo, e um código de sala bastaria para encher a mesa dos outros.
     A config não é tranca: ela já é pública em room-shell.js. A tranca é o
     lugar — bancada roda na máquina de quem testa. */
  const RAIZ = new URL("../", import.meta.url);
  const bots = readFileSync(new URL("ferramentas/laboratorio/bots.js", RAIZ), "utf8");
  assert.match(bots, /function daMaquina/,
    "o laboratório perdeu a guarda de localhost");
  assert.match(bots, /if \(!daMaquina\(\)\)/,
    "a guarda existe mas UI.entrar não a consulta");

  /* e ele não carrega o SDK do Firebase: um initializeApp por bot travava o
     terceiro, e a página inteira passou a falar REST */
  const pagina = readFileSync(new URL("ferramentas/laboratorio/index.html", RAIZ), "utf8");
  assert.ok(!/firebasejs/.test(pagina),
    "o laboratório voltou a carregar o SDK do Firebase");
});

test("a conferência do build não exige arquivo que ninguém carrega", () => {
  /* POR QUE ESTE TESTE EXISTE.

     `noite.js` era o gêmeo velho do `noite-auto.js` — os dois definiam
     `window.MosaicoNoite={fecharModulo}`, com listas de fragmentos
     diferentes — e o `room-shell.js` só carrega o segundo, nos dois caminhos.
     Ele sobreviveu à limpeza do cânone por um motivo torto: a lista A_MAO do
     publicar-pages.mjs o EXIGIA no build, e arquivo exigido parece arquivo
     usado. A conferência que existia para evitar página em branco virou a
     razão de um órfão continuar de pé, carregando cânone velho.

     Então a lista tem duas obrigações agora: o arquivo tem de existir na
     fonte, e alguém tem de carregá-lo. */
  const RAIZ = new URL("../", import.meta.url);
  const publicar = readFileSync(new URL("mosaico-web/scripts/publicar-pages.mjs", RAIZ), "utf8");
  const bloco = publicar.match(/const A_MAO = \[([\s\S]*?)\]/);
  assert.ok(bloco, "não achei a lista A_MAO em publicar-pages.mjs");
  const lista = [...bloco[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  assert.ok(lista.length >= 5, "a lista A_MAO encolheu demais");

  const PUB = new URL("mosaico-web/public/", RAIZ);
  const fonte = new Map();
  for (const nome of lista) {
    const arq = new URL(nome, PUB);
    assert.ok(existsSync(arq), `A_MAO exige ${nome}, que não existe em public/`);
    fonte.set(nome, readFileSync(arq, "utf8"));
  }

  /* a casca é a porta: ela não precisa ser citada por ninguém */
  const CASCA = "noite-shell.html";
  for (const nome of lista) {
    if (nome === CASCA) continue;
    const citado = [...fonte.entries()].some(([n, t]) => n !== nome && t.includes(nome));
    assert.ok(citado,
      `A_MAO exige ${nome} no build, mas nenhum arquivo à mão o carrega — ` +
      "ou ele voltou a ser órfão, ou quem o carregava sumiu");
  }
});

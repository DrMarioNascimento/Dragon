/* Auditoria do caso canônico da Casa da Costa.
   Desde a consolidação por perguntas modulares, a fonte factual única é
   v1/casos/casa-da-costa.json. O antigo CASO_FALLBACK_COMPLETO embutido no
   HTML deixou de ser contrato de publicação e não deve voltar a criar uma
   segunda verdade do caso. */

import { readFileSync } from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

function caso() {
  return JSON.parse(readFileSync(new URL("../v1/casos/casa-da-costa.json", import.meta.url), "utf8"));
}

test("o caso canônico declara realidade única e partidas modulares", () => {
  const c = caso();
  assert.equal(c.id, "casa-da-costa");
  assert.ok(c.realidadeCanonica?.premissa);
  assert.ok(c.realidadeCanonica?.sintese);
  assert.ok(c.partidas && Object.keys(c.partidas).length >= 1);
  assert.ok(c.partidas[c.perguntaPadrao]);
});

test("cada partida aponta para um campo principal existente e respostas válidas", () => {
  const c = caso();
  for (const [id, partida] of Object.entries(c.partidas)) {
    assert.ok(Array.isArray(partida.campos) && partida.campos.length > 0, `${id}: sem campos`);
    assert.ok(partida.campos.some(f => f.id === partida.principal), `${id}: principal inexistente`);
    for (const campo of partida.campos) {
      assert.ok(Array.isArray(campo.opcoes) && campo.opcoes.includes(campo.resposta), `${id}/${campo.id}: resposta fora das opções`);
    }
  }
});

test("a ordem correta do Mosaico cobre todas as pistas públicas", () => {
  const c = caso();
  const publicas = c.publicas.map(p => p.id);
  const ordem = c.mosaico.ordemCorreta;
  assert.equal(ordem.length, publicas.length,
    "a ordem correta e a lista de pistas públicas têm tamanhos diferentes");
  assert.deepEqual([...ordem].sort(), [...publicas].sort(),
    "a ordem correta cita um id que não existe entre as pistas públicas");
});

test("toda pista privada declara uma qualidade que o Mercado sabe pontuar", () => {
  const c = caso();
  for (const [personagem, pista] of Object.entries(c.pistas)) {
    assert.ok(["boa", "mediana", "ruim"].includes(pista.qualidade),
      `a pista de ${personagem} tem qualidade "${pista.qualidade}"`);
  }
});

/* ── Banco modular F01–F36 · Edição Técnica Consolidada (02/09/2026) ─────
   O caso deixou de entregar apenas seis pistas privadas fixas: passou a
   carregar o banco inteiro, com função declarada, hipóteses concorrentes,
   relações e pares entre celulares. A Mesa (v1/js/banco-casa-da-costa.js) e A
   Noite (v2/noite-auto.js) montam o dossiê a partir daqui, e nenhuma das duas
   avisa quando um código citado não existe: a relação simplesmente nunca
   fecha, a hipótese nunca cai, e o sintoma é uma partida morna sem erro
   nenhum no console. Estas auditorias falham antes de publicar. */

const FUNCOES = ["estrutural", "interpretativo", "relacional", "contextual"];

test("o banco modular declara função e família para cada fragmento", () => {
  const c = caso();
  assert.ok(c.fragmentos, "o caso perdeu o banco de fragmentos");
  const codigos = Object.keys(c.fragmentos);
  assert.ok(codigos.length >= 30, `o banco encolheu para ${codigos.length} fragmentos`);
  for (const [cod, f] of Object.entries(c.fragmentos)) {
    assert.match(cod, /^F\d\d$/, `código fora do padrão: ${cod}`);
    assert.ok(f.t && f.d, `${cod}: fragmento sem título ou sem fato`);
    assert.ok(FUNCOES.includes(f.f), `${cod}: função "${f.f}" não é uma das quatro`);
    assert.ok(f.familia, `${cod}: sem família de evidência`);
    assert.ok(Array.isArray(f.m) && f.m.length === 2, `${cod}: sem posição no mapa coletivo`);
  }
});

test("nenhuma hipótese, relação, par ou seleção cita fragmento inexistente", () => {
  const c = caso();
  const existe = cod => Object.prototype.hasOwnProperty.call(c.fragmentos, cod);
  const conferir = (lista, onde) => lista.forEach(cod =>
    assert.ok(existe(cod), `${onde} cita ${cod}, que não existe no banco`));

  for (const h of c.hipoteses) {
    conferir(h.apoia, `${h.id}.apoia`);
    conferir(h.enfraquece, `${h.id}.enfraquece`);
  }
  for (const r of c.relacoes) r.pecas.forEach((g, i) => conferir(g, `${r.id}.peça${i + 1}`));
  for (const p of c.pares) conferir([p.a.f, p.b.f], p.id);
  for (const conj of c.protecao.conjuntos) conferir(conj.flat(), "conjunto protegido");
  for (const [id, s] of Object.entries(c.selecao)) {
    if (id === "_leia") continue;
    conferir(s.centrais, `${id}.centrais`);
    conferir(s.incidentais, `${id}.incidentais`);
  }
});

test("toda partida tem seleção, e toda seleção aponta para hipótese existente", () => {
  const c = caso();
  const hipoteses = new Set(c.hipoteses.map(h => h.id));
  for (const id of Object.keys(c.partidas)) {
    assert.ok(c.selecao[id], `a partida ${id} não tem centrais nem incidentais declarados`);
  }
  for (const [id, s] of Object.entries(c.selecao)) {
    if (id === "_leia") continue;
    assert.ok(c.partidas[id], `seleção para partida inexistente: ${id}`);
    for (const h of [s.hipotese, ...s.derruba]) {
      assert.ok(hipoteses.has(h), `${id} cita a hipótese ${h}, que não existe`);
    }
    const canonica = c.hipoteses.find(h => h.id === s.hipotese);
    assert.ok(canonica.canonica, `${id} fecha em ${s.hipotese}, que não sobrevive ao fechamento`);
  }
});

/* Nenhuma pista isolada resolve: uma relação com um grupo só seria uma pista
   com nome de relação. É o contrário do que o caso promete. */
test("toda relação exige o encontro de pelo menos duas peças", () => {
  const c = caso();
  for (const r of c.relacoes) {
    assert.ok(r.pecas.length >= 2, `${r.id} fecha com uma peça só`);
    assert.ok(r.efeito, `${r.id} não diz que inferência habilita`);
  }
});

/* A Mesa usa os pares como MÃO INICIAL: cada personagem recebe uma metade. Um
   par pode carregar pista de fechamento — é para isso que ele existe, com a
   metade forte num telefone e a referência que a torna legível em outro. O que
   não pode é um par, sozinho, completar uma combinação protegida: aí a divisão
   deixaria de proteger e viraria só um atraso.

   A proteção é declarada em UNIDADES: [["F08","F09"],["F28"],["F35"]] proíbe a
   identidade acompanhada da anotação e do contrato encerrado, e não proíbe F08
   ao lado de F09, que são a mesma unidade partida em duas metades. Se alguém
   reescrever isso como lista plana de códigos, o par P-D — previsto no §17 —
   para de existir sem que nada quebre. */
test("nenhum par, sozinho, completa uma combinação protegida", () => {
  const c = caso();
  for (const conj of c.protecao.conjuntos) {
    assert.ok(conj.every(u => Array.isArray(u)),
      "os conjuntos protegidos voltaram a ser lista plana de códigos; a proteção passa a barrar par legítimo");
  }
  const completa = (conj, mao) => conj.every(u => u.some(x => mao.includes(x)));
  const elegiveis = c.pares.filter(p => !c.protecao.conjuntos.some(conj => completa(conj, [p.a.f, p.b.f])));
  assert.ok(elegiveis.length * 2 >= c.elenco.length,
    `só ${elegiveis.length} pares cabem numa mão inicial; o elenco de ${c.elenco.length} não se cobre`);
  for (const p of c.pares) {
    assert.notEqual(p.a.txt, p.b.txt, `${p.id}: as duas metades são o mesmo texto`);
    assert.ok(p.produz, `${p.id} não declara a relação que as metades produzem`);
  }
});

/* Uma mão inicial que não toca a pergunta em jogo transforma a abertura em
   ruído: a mesa discute apagão numa partida sobre duração. Cada pergunta
   precisa ter par elegível cujas metades sejam centrais dela. */
test("toda pergunta tem par elegível que fala do que ela pergunta", () => {
  const c = caso();
  const completa = (conj, mao) => conj.every(u => u.some(x => mao.includes(x)));
  const elegiveis = c.pares.filter(p => !c.protecao.conjuntos.some(conj => completa(conj, [p.a.f, p.b.f])));
  for (const [id, s] of Object.entries(c.selecao)) {
    if (id === "_leia") continue;
    const toca = elegiveis.filter(p => s.centrais.includes(p.a.f) || s.centrais.includes(p.b.f));
    assert.ok(toca.length >= 1, `a pergunta ${id} não tem nenhum par elegível entre suas centrais`);
  }
});

/* O primeiro terço não recebe nenhuma pista de fechamento. Para isso ser
   possível — e não apenas declarado — o banco precisa ter fragmentos livres
   suficientes para encher um terço da maior duração. */
test("há fragmentos livres bastantes para o primeiro terço ficar limpo", () => {
  const c = caso();
  assert.equal(c.protecao.maxFechoPorTerco.primeiro, 0,
    "o primeiro terço voltou a aceitar pista de fechamento");
  const livres = Object.values(c.fragmentos).filter(f => !f.fecho).length;
  const maior = Math.max(...Object.values(c.duracoes).map(d => d.n));
  assert.ok(livres >= Math.ceil(maior / 3),
    `só ${livres} fragmentos livres para um primeiro terço de ${Math.ceil(maior / 3)}`);
  for (const [id, d] of Object.entries(c.duracoes)) {
    assert.ok(d.n <= Object.keys(c.fragmentos).length, `a duração ${id} pede mais fragmentos do que o banco tem`);
    assert.ok(d.rel <= c.relacoes.length, `a duração ${id} pede mais relações do que existem`);
  }
});

/* O fechamento robusto exige encontro entre as famílias doméstica, física e
   documental. A pergunta-mãe é a que precisa disso inteiro; se as centrais
   dela encolherem para uma família só, o caso fecha por acúmulo, não por
   convergência. */
test("a pergunta-mãe reúne as três famílias de evidência nas centrais", () => {
  const c = caso();
  const centrais = c.selecao[c.perguntaPadrao].centrais;
  const familias = new Set(centrais.map(cod => c.fragmentos[cod].familia));
  for (const f of ["domestica", "fisica", "documental"]) {
    assert.ok(familias.has(f), `as centrais da pergunta-mãe não tocam a família ${f}`);
  }
});

/* Duas camadas leem o mesmo banco e nenhuma é carregada por <script> no HTML:
   a Mesa injeta a sua no fim de mosaico-v5.js, A Noite injeta a sua em
   room-shell.js. Arquivo que não compila é descartado em silêncio pelo
   navegador — a página abre, e o que some é a distribuição.

   A camada da Noite é lida de mosaico-web/public/, que é onde ela MORA desde
   02/09/2026. Antes isto apontava para v2/noite-auto.js — o arquivo
   publicado —, e um teste que lê o build passa a verde com fonte quebrada
   enquanto ninguém publica. */
test("as duas camadas que gastam o banco existem e compilam", async () => {
  const { execFileSync } = await import("node:child_process");
  const { fileURLToPath } = await import("node:url");
  const camadas = ["../v1/js/banco-casa-da-costa.js", "../mosaico-web/public/noite-auto.js"];
  for (const rel of camadas) {
    const caminho = fileURLToPath(new URL(rel, import.meta.url));
    try {
      execFileSync(process.execPath, ["--check", caminho], { stdio: "pipe" });
    } catch (erro) {
      assert.fail(`${rel} não compila:\n${erro.stderr?.toString() ?? erro.message}`);
    }
  }
  const v5 = readFileSync(new URL("../v1/js/mosaico-v5.js", import.meta.url), "utf8");
  assert.match(v5, /banco-casa-da-costa\.js\?v=/,
    "a Mesa deixou de carregar o banco modular: o dossiê some sem erro nenhum");
  const noite = readFileSync(new URL("../mosaico-web/public/noite-auto.js", import.meta.url), "utf8");
  assert.ok(noite.includes("CASO.fragmentos"),
    "A Noite voltou a ter a própria lista de evidências em vez de ler o banco do caso");
});

/* ── Duas atividades por partida (V4 §17) ────────────────────────────────
   As fases `inclinacao` e `constelacao` viraram VAGAS, e a pergunta decide
   quais das três mecânicas sensoriais as ocupam. A camada que faz isso é
   `v1/js/atividades-casa-da-costa.js`, injetada no fim da cascata de
   `mosaico-v5.js`. Nada avisa quando ela some ou quando um nome de atividade
   deixa de bater com `CASO.tarefas`: a Mesa simplesmente volta a jogar sempre
   A Janela do Norte na primeira vaga, sem erro nenhum no console — que foi o
   estado que estas auditorias existem para não deixar voltar. */
test("a Mesa carrega a camada das duas atividades, e ela compila", async () => {
  const { execFileSync } = await import("node:child_process");
  const { fileURLToPath } = await import("node:url");
  const caminho = fileURLToPath(new URL("../v1/js/atividades-casa-da-costa.js", import.meta.url));
  try {
    execFileSync(process.execPath, ["--check", caminho], { stdio: "pipe" });
  } catch (erro) {
    assert.fail(`atividades-casa-da-costa.js não compila:\n${erro.stderr?.toString() ?? erro.message}`);
  }
  const v5 = readFileSync(new URL("../v1/js/mosaico-v5.js", import.meta.url), "utf8");
  assert.match(v5, /atividades-casa-da-costa\.js\?v=/,
    "a Mesa deixou de carregar a camada: volta a jogar sempre a mesma atividade na primeira vaga");
  const banco = v5.indexOf("banco-casa-da-costa.js");
  const ativ = v5.indexOf("atividades-casa-da-costa.js");
  assert.ok(banco >= 0 && ativ > banco,
    "as atividades precisam entrar depois do banco, que entra depois da rotação da pergunta");
});

/* Roda a camada real num window de mentira. Testar a fonte publicada, e não
   uma cópia da tabela, é o que faz esta auditoria continuar valendo quando
   alguém acrescentar uma pergunta nova. */
async function camadaAtividades() {
  const vm = await import("node:vm");
  const { fileURLToPath } = await import("node:url");
  const fonte = readFileSync(fileURLToPath(new URL("../v1/js/atividades-casa-da-costa.js", import.meta.url)), "utf8");
  const guarda = {};
  const win = {
    CASO: caso(), STATE: { doc: null },
    localStorage: {
      getItem: k => (k in guarda ? guarda[k] : null),
      setItem: (k, v) => { guarda[k] = String(v); }
    },
    document: { createElement: () => ({ style: {}, appendChild() {} }), head: { appendChild() {} } },
    console
  };
  win.window = win;
  vm.createContext(win);
  vm.runInContext(fonte, win);
  return win;
}

test("toda pergunta pode receber as três atividades, em três pares distintos", async () => {
  const win = await camadaAtividades();
  const A = win.MosaicoAtividadesCasa;
  const c = caso();
  const validos = new Set(["janela", "vidro", "salaEscura"]);

  for (const id of Object.keys(c.partidas)) {
    const pref = A.preferencia[id];
    assert.ok(Array.isArray(pref), `a partida ${id} não declara preferência de atividade`);
    assert.deepEqual([...pref].sort(), ["janela", "salaEscura", "vidro"],
      `${id}: a preferência precisa ordenar as três, não excluir — excluir deixa a pergunta sem variação`);

    const pares = A.pares(id);
    assert.equal(pares.length, 3, `${id}: deveriam sair três pares distintos`);
    const vistos = new Set();
    for (const p of pares) {
      assert.ok(validos.has(p.inclinacao) && validos.has(p.constelacao), `${id}: atividade desconhecida`);
      assert.notEqual(p.inclinacao, p.constelacao, `${id}: par com a mesma atividade duas vezes`);
      /* A Janela é a chegada à casa: quando entra, vem antes do que se
         descobre dentro dela. */
      assert.notEqual(p.constelacao, "janela", `${id}: A Janela do Norte caiu na segunda vaga`);
      vistos.add([p.inclinacao, p.constelacao].sort().join("+"));
    }
    assert.equal(vistos.size, 3, `${id}: o rodízio repete par antes de esgotar os três`);
  }
});

/* Cada atividade escolhida precisa achar a própria configuração em
   CASO.tarefas. As chaves são historicas — `inclinacao` é A Janela e
   `constelacao` é O Vidro — e renomear uma delas no JSON quebraria a vaga em
   silêncio: a tela abriria sem arquivo e sem pista. */
test("as três atividades têm configuração e arquivo no caso", async () => {
  const win = await camadaAtividades();
  const c = caso();
  const porAtividade = { janela: "inclinacao", vidro: "constelacao", salaEscura: "salaEscura" };
  for (const [atividade, chave] of Object.entries(porAtividade)) {
    const cfg = c.tarefas[chave];
    assert.ok(cfg, `${atividade}: CASO.tarefas.${chave} sumiu`);
    assert.ok(cfg.titulo, `${atividade}: sem título para anunciar na fase`);
    assert.match(cfg.arquivo || "", /\.html\?embed=1$/, `${atividade}: sem arquivo integrado`);
  }
  /* Sala antiga, sem o campo `atividades`, tem de cair no comportamento de
     antes — senão uma mesa em andamento troca de atividade no meio da noite. */
  /* O objeto vem do contexto do vm e tem outro protótipo: espalhar traz
     o valor para o realm do teste, senão deepStrictEqual reprova dois objetos
     idênticos. */
  win.STATE.doc = { tarefaInterior: "sala-escura" };
  assert.deepEqual({ ...win.MosaicoAtividadesCasa.atividades() },
    { inclinacao: "janela", constelacao: "salaEscura" },
    "sala antiga deixou de cair no comportamento anterior");
  win.STATE.doc = null;
  assert.deepEqual({ ...win.MosaicoAtividadesCasa.atividades() },
    { inclinacao: "janela", constelacao: "vidro" },
    "sem documento de sala, o padrão mudou");
});

/* ── O Mosaico coletivo embaralha (02/09/2026) ───────────────────────────
   Ele era o único pedaço da noite que não girava: seis acontecimentos fixos,
   iguais nas seis perguntas, valendo até 20 pontos. Agora tem banco próprio
   e cada sala sorteia dele. Duas armadilhas moram aqui, e as duas produzem
   uma "ordem correta" errada sem quebrar nada — o jogo simplesmente pune
   quem acertar. */
test("o banco do Mosaico é próprio, e toda referência dele tem hora", () => {
  const c = caso();
  const mb = c.mosaicoBanco;
  assert.ok(mb && Array.isArray(mb.pool), "o Mosaico perdeu o banco próprio e voltou a ser bloco fixo");
  const pub = Object.fromEntries(c.publicas.map(p => [p.id, p]));
  const hora = id => id.startsWith("pub-") ? (pub[id] || {}).hora : (c.fragmentos[id] || {}).h;
  for (const id of mb.pool) {
    const h = hora(id);
    assert.ok(h && h !== "—", `${id}: no banco do Mosaico sem hora — não dá para ordenar`);
  }
  const itens = Number(mb.itens) || 6;
  const slots = new Set(mb.pool.map(id => hora(id).split("–")[0]));
  assert.ok(slots.size >= itens,
    `só ${slots.size} horários distintos para sortear ${itens} itens, e dois no mesmo instante não têm ordem certa entre si`);
});

test("a virada do dia é respeitada: a madrugada vem depois da noite", async () => {
  const vm = await import("node:vm");
  const { fileURLToPath } = await import("node:url");
  const fonte = readFileSync(fileURLToPath(new URL("../v1/js/mosaico-casa-da-costa.js", import.meta.url)), "utf8");
  const win = { CASO: caso(), STATE: { mesa: { codigo: "T" }, doc: { partidaId: "sete" } },
    pistasMosaico: () => [], dicasMosaico: () => [], rotuloPistaMosaico: p => p, render: () => {} };
  win.window = win;
  vm.createContext(win);
  vm.runInContext(fonte, win);
  const m = win.MosaicoMosaicoCasa.minutos;
  assert.ok(m("02:15") > m("23:05"), "02h15 é do dia seguinte e tem de vir DEPOIS de 23h05");
  assert.ok(m("08:20") > m("23:05"), "a vistoria das 08h20 fecha a noite, não a abre");
  assert.ok(m("19:40") < m("21:02"), "o aviso ao Morador vem antes das chegadas");
  assert.equal(m("21:29–21:31"), m("21:29"), "faixa de horário ordena pelo instante inicial");

  const itens = win.MosaicoMosaicoCasa.itens();
  assert.equal(itens.length, Number(caso().mosaicoBanco.itens) || 6);
  /* Espalhar traz o array do realm do vm para o do teste: sem isso
     deepStrictEqual reprova dois arrays idênticos pelo protótipo. */
  const slots = [...itens].map(x => m(x.hora));
  assert.equal(new Set(slots).size, slots.length, "dois itens caíram no mesmo horário");
  assert.deepEqual(slots, [...slots].sort((a, b) => a - b), "os itens não saíram em ordem cronológica");
  assert.deepEqual([...win.CASO.mosaico.ordemCorreta], [...itens].map(x => x.id),
    "a ordem canônica não acompanhou o sorteio: a apuração conferiria contra a rodada errada");
});

test("a Mesa carrega a camada do Mosaico, e ela compila", async () => {
  const { execFileSync } = await import("node:child_process");
  const { fileURLToPath } = await import("node:url");
  const caminho = fileURLToPath(new URL("../v1/js/mosaico-casa-da-costa.js", import.meta.url));
  try { execFileSync(process.execPath, ["--check", caminho], { stdio: "pipe" }); }
  catch (e) { assert.fail(`mosaico-casa-da-costa.js não compila:\n${e.stderr?.toString() ?? e.message}`); }
  const v5 = readFileSync(new URL("../v1/js/mosaico-v5.js", import.meta.url), "utf8");
  assert.match(v5, /mosaico-casa-da-costa\.js\?v=/,
    "a Mesa deixou de carregar a camada: o Mosaico volta a ser sempre o mesmo");
});

/* O modal de escolha do Mosaico imprime o `txt` inteiro de cada opção. Isso
   era inofensivo quando o pool eram só as públicas — elas já subiram no
   telão. Com fragmentos do banco no pool, imprimir o fato completo faria do
   Mosaico uma porta lateral para o dossiê: o Portador leria peças que
   ninguém do núcleo foi buscar. Fragmento entra pelo TÍTULO. */
test("o Mosaico não imprime o fato completo de fragmento que ninguém conquistou", async () => {
  const vm = await import("node:vm");
  const { fileURLToPath } = await import("node:url");
  const fonte = readFileSync(fileURLToPath(new URL("../v1/js/mosaico-casa-da-costa.js", import.meta.url)), "utf8");
  const c = caso();
  let achouFragmento = false;
  for (const codigo of ["A1", "B2", "C3", "D4", "E5", "F6", "G7", "H8"]) {
    const win = { CASO: caso(), STATE: { mesa: { codigo }, doc: { partidaId: "sete" } },
      pistasMosaico: () => [], dicasMosaico: () => [], rotuloPistaMosaico: p => p, render: () => {} };
    win.window = win;
    vm.createContext(win);
    vm.runInContext(fonte, win);
    for (const item of win.pistasMosaico()) {
      if (item.id.indexOf("frag-") !== 0) continue;
      achouFragmento = true;
      const cod = item.id.slice(5);
      assert.equal(item.txt, c.fragmentos[cod].t, `${cod}: o Mosaico deveria expor o título`);
      assert.notEqual(item.txt, c.fragmentos[cod].d, `${cod}: o fato completo vazou para a lista de escolha`);
    }
  }
  assert.ok(achouFragmento, "nenhum fragmento entrou no sorteio: o Mosaico voltou a ser só as públicas");
});

/* ── O Mercado do Captura, sobreposto (02/09/2026) ───────────────────────
   Saiu o mercado de negociação da Casa (cada um punha a própria pista à
   venda escolhendo a faixa) e entrou a banca do Captura, com preço fixo.
   Da Casa ficou só a confiança, que passa a julgar o que a pessoa põe no
   balaio em vez do preço que ela pedia. */
test("o Mercado declara as três ações e o preço da repassada é menor", () => {
  const c = caso();
  const m = c.mercado;
  assert.ok(m && m.precos, "o caso perdeu as regras do Mercado");
  for (const k of ["nova", "repassada", "arriscar"]) {
    assert.ok(Number(m.precos[k]) > 0, `${k}: sem preço`);
  }
  /* Repassada tem de ser mais barata que nova: ela carrega o sinal de que
     alguém não a quis, e é esse desconto que dá sentido à escolha da pilha. */
  assert.ok(m.precos.repassada < m.precos.nova,
    "repassada custando o mesmo que nova tira o motivo de escolher a pilha");
  /* Consignar rende o preço da repassada, e recomprar custa o da nova: sem
     essa assimetria dá para viver girando informação. */
  assert.ok(m.precos.repassada < m.precos.nova,
    "sem assimetria, consignar e recomprar vira máquina de moeda");
  assert.equal(c.configuracao.moedasIniciais, 12, "a mesa deixou de começar com 12 moedas");
});

test("a Mesa carrega a camada do Mercado, e ela compila", async () => {
  const { execFileSync } = await import("node:child_process");
  const { fileURLToPath } = await import("node:url");
  const caminho = fileURLToPath(new URL("../v1/js/mercado-casa-da-costa.js", import.meta.url));
  try { execFileSync(process.execPath, ["--check", caminho], { stdio: "pipe" }); }
  catch (e) { assert.fail(`mercado-casa-da-costa.js não compila:\n${e.stderr?.toString() ?? e.message}`); }
  const v5 = readFileSync(new URL("../v1/js/mosaico-v5.js", import.meta.url), "utf8");
  assert.match(v5, /mercado-casa-da-costa\.js\?v=/,
    "a Mesa deixou de carregar o Mercado novo e voltaria ao de negociação");
  /* A confiança é a única coisa que sobrou da Casa; se o Mercado parar de
     registrar negociação, o componente `economia` cai de 20 para 13 em
     silêncio e o placar deixa de fechar em 100. */
  const mkt = readFileSync(caminho, "utf8");
  assert.match(mkt, /faixaPreco:\s*"justo"/,
    "o Mercado parou de registrar negociação: a confiança morre e economia cai para 13");
});

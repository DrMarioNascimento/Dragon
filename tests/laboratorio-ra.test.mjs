import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const text = path => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const bytes = path => readFile(new URL(`../${path}`, import.meta.url));

test("o card 03 abre o laboratório protegido", async () => {
  const [home, guard] = await Promise.all([
    text("index.html"),
    text("laboratorio-ra/guard.js"),
  ]);

  assert.match(home, /id="laboratorio-ra"/);
  assert.match(home, /id="ra-access-form"/);
  assert.doesNotMatch(home, /03 · em breve/i);

  /* A porta era uma senha — sha256 de uma constante escrita no próprio guard.
     Virou o mesmo par que autoriza abrir mesa: conta Google mais a lista
     `config/mestres`, que mora no Firestore e é lida do servidor. A diferença
     que importa não é a tela: a senha estava no código-fonte, a lista não.

     Estas asserções são pelo NEGATIVO de propósito. Uma senha é o caminho
     fácil de voltar quando alguém quiser "só destravar rápido", e voltaria
     junto o hash legível por quem abrisse o arquivo. */
  assert.doesNotMatch(home, /type="password"/, "o campo de senha voltou ao card");
  assert.doesNotMatch(guard, /SHA-256/, "a senha em sha256 voltou ao guard");
  assert.match(guard, /GoogleAuthProvider/, "o guard não valida mais por conta Google");
  assert.match(guard, /config["'],\s*["']mestres/, "o guard não confere mais a lista config/mestres");
  assert.match(guard, /sessionStorage/);
});

test("as páginas protegidas e seus recursos estão publicáveis", async () => {
  const [hub, comparison, spatial, css, model] = await Promise.all([
    text("laboratorio-ra/index.html"),
    text("laboratorio-ra/comparacao.html"),
    text("laboratorio-ra/laboratorio-ra.html"),
    text("laboratorio-ra/laboratorio.css"),
    bytes("laboratorio-ra/escrivaninha.glb"),
  ]);

  for (const page of [hub, comparison, spatial]) {
    assert.match(page, /data-ra-protected/);
    assert.match(page, /guard\.js/);
  }
  assert.match(hub, /href="comparacao\.html"/);
  assert.match(hub, /href="laboratorio-ra\.html"/);
  assert.match(comparison, /getUserMedia/);
  assert.match(comparison, /mra-offset/);
  assert.match(spatial, /src="escrivaninha\.glb"/);
  assert.match(spatial, /ar-modes="webxr scene-viewer quick-look"/);
  assert.match(spatial, /ar-scale="fixed"/);
  assert.ok(css.length > 1000);
  assert.equal(model.toString("ascii", 0, 4), "glTF");
  assert.equal(model.readUInt32LE(4), 2);
  assert.equal(model.readUInt32LE(8), model.length);
});

test("o modelo conserva a largura física aproximada de 1,28 m", async () => {
  const model = await bytes("laboratorio-ra/escrivaninha.glb");
  const jsonLength = model.readUInt32LE(12);
  const json = JSON.parse(model.toString("utf8", 20, 20 + jsonLength).replace(/\0+$/u, ""));
  const position = json.accessors.find(accessor => accessor.type === "VEC3" && accessor.min && accessor.max);
  assert.ok(position);
  assert.ok(Math.abs((position.max[0] - position.min[0]) - 1.28) < 0.001);
});

/* ── BANCADA 05 · A CADEIA ────────────────────────────────────────────────────
   Três telas que só valem juntas, e o que estes testes protegem é a JUNTA:
   os números que uma escreve e a outra lê, e as duas maneiras conhecidas de
   um quebra-cabeça assim virar palpite. */
test("o card 05 abre a cadeia e as três telas estão protegidas", async () => {
  const [hub, mesa, janela, parede, comum] = await Promise.all([
    text("laboratorio-ra/index.html"),
    text("laboratorio-ra/cadeia-escrivaninha.html"),
    text("laboratorio-ra/cadeia-janela.html"),
    text("laboratorio-ra/cadeia-parede.html"),
    text("laboratorio-ra/cadeia.js"),
  ]);

  assert.match(hub, /data-number="05"/);
  assert.match(hub, /href="cadeia-escrivaninha\.html\?s=LAB"/);
  for (const page of [mesa, janela, parede]) {
    assert.match(page, /data-ra-protected/);
    assert.match(page, /guard\.js/);
    assert.match(page, /from "\.\/cadeia\.js"/);
  }
  /* a bancada 04 não pode ter sido puxada para dentro da cadeia: card novo era
     o pedido, justamente para não misturar os dois testes */
  assert.match(hub, /href="gaveta-e-papel\.html"/);
  assert.doesNotMatch(comum, /password|sha-?256/i);
});

test("entre as telas viaja a semente, nunca a resposta", async () => {
  const comum = await text("laboratorio-ra/cadeia.js");
  const vai = comum.match(/export function vai\([^)]*\)\s*\{[\s\S]*?\n\}/);
  assert.ok(vai, "a função vai() sumiu");
  /* só `s` e `dev` entram na URL. Resposta em barra de endereço é resposta
     publicada: é a primeira coisa que um jogador curioso lê. */
  const params = [...vai[0].matchAll(/"([?&])(\w+)=/g)].map(m => m[2]);
  assert.deepEqual(params.sort(), ["dev", "s"]);
  for (const proibido of ["GRAU", "AZIMUTE", "HORA", "ALTURA_OLHOS"]) {
    assert.doesNotMatch(vai[0], new RegExp("\b" + proibido + "\b"),
      `${proibido} está sendo escrito na URL`);
  }
});

test("os graus da escada são os mesmos no papel e nas três telas", async () => {
  const [gerador, mesa, comum] = await Promise.all([
    text("ferramentas/escrivaninha.mjs"),
    text("laboratorio-ra/cadeia-escrivaninha.html"),
    text("laboratorio-ra/cadeia.js"),
  ]);

  const desenhados = gerador.match(/const DEGRAUS = \[([^\]]+)\]/);
  assert.ok(desenhados, "o gerador não desenha mais os graus na escada");
  const numeros = desenhados[1].split(",").map(n => Number(n.trim()));
  assert.equal(numeros.length, 7);

  /* o texto que a tela lê para o jogador tem de ser o que a textura desenha —
     é o tipo de divergência que ninguém percebe até um playtest inteiro parar
     num degrau que não existe */
  assert.ok(mesa.includes(numeros.join(" · ")),
    "a tela anuncia graus diferentes dos que o papel mostra");

  const grau = Number(comum.match(/export const GRAU = (\d+)/)[1]);
  assert.equal(grau, numeros[4], "o quinto degrau deixou de ser o grau da cadeia");

  /* e o sextante largado na mesa NÃO pode estar discado na resposta */
  const arm = Number(gerador.match(/const SEXT_ANG = (\d+)/)[1]);
  assert.notEqual(arm, grau, "o instrumento veio com a resposta já marcada");
});

test("a janela não deixa acertar o farol por tentativa", async () => {
  const janela = await text("laboratorio-ra/cadeia-janela.html");

  /* 1. a estrela certa não pode ser a única com halo: com isso bastava
     procurar a diferente, sem hora, sem grau e sem entender nada */
  assert.doesNotMatch(janela, /if \(e\.alvo\)\s*\{\s*g\.globalAlpha/,
    "a estrela alvo voltou a ter brilho próprio");
  assert.match(janela, /e\.brilho > 0\.85/);

  /* 2. nenhuma outra estrela pode pousar perto da linha do sextante, senão o
     quebra-cabeça tem duas respostas e uma delas é errada */
  assert.match(janela, /Math\.abs\(alt - GRAU\) < 4\.5/);

  /* 3. tocar na luz certa não basta: sem a hora e sem o grau, as nove luzes
     são indistinguíveis — é isso que impede varrer o horizonte no dedo */
  assert.match(janela, /if \(!horaOk \|\| !grauOk\)/);
  assert.match(janela, /LUZES = \[\{ az: AZIMUTE, farol: true \}\]/);
  const outras = janela.match(/for \(const d of \[([^\]]+)\]\)/);
  assert.ok(outras && outras[1].split(",").length >= 6, "a costa ficou com poucas luzes");
});

test("a parede mede a altura pela linha do horizonte, não por um número", async () => {
  const parede = await text("laboratorio-ra/cadeia-parede.html");

  /* o alvo é o ponto de fuga — a altura do olho de quem olha. Um controle em
     metros seria a resposta escrita no enunciado. */
  assert.match(parede, /Math\.abs\(marcaY - VPy\)/);
  assert.doesNotMatch(parede, /<input[^>]+type="range"/, "voltou um controle em metros");

  /* e o quarto precisa das tábuas: são elas que deixam a linha do horizonte
     legível. Sem elas a pista existe e não há como lê-la. */
  assert.match(parede, /TÁBUAS DO ASSOALHO/);

  /* rAF entrega o carimbo de tempo no primeiro argumento; agendar `desenha`
     direto faria o agendador virar o quadro forçado e o lampejo pararia */
  assert.doesNotMatch(parede, /requestAnimationFrame\(desenha\)/);
});

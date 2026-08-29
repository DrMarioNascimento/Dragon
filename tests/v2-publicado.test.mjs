/* O que está publicado em v2/ — e o que só falha depois de publicado.
 *
 * Este arquivo existe por causa de uma classe inteira de erro que passou por
 * toda a revisão anterior: caminho que funciona em localhost e morre em
 * /Dragon/v2/. O Vite reescreve a base dentro do CSS, nunca dentro de string,
 * então "/media/foto-agenda.jpg" vai para a raiz do domínio e dá 404 — no
 * site no ar, a fase inteira do Encaixe abria sem uma única imagem.
 *
 * Nada disso aparece durante o desenvolvimento. Estes testes leem o build
 * como o navegador o lê.                                                    */

import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import assert from "node:assert/strict";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const V2 = join(RAIZ, "v2");
const BASE = "/Dragon/v2/";

/** Referências que não são arquivo e nunca serão — documentadas, não ignoradas. */
const NAO_SAO_ARQUIVO = new Set([
  /* Rota de função de servidor do TanStack Start. O GitHub Pages não tem
     servidor e a noite não chama nenhuma; se um dia chamar, dará 404 e este
     comentário é onde a pessoa vai procurar. */
  "/Dragon/v2/_serverFn/",
]);

function arquivos(dir, filtro) {
  const saida = [];
  for (const nome of readdirSync(dir)) {
    const caminho = join(dir, nome);
    if (statSync(caminho).isDirectory()) saida.push(...arquivos(caminho, filtro));
    else if (filtro(nome)) saida.push(caminho);
  }
  return saida;
}

const textoDoBuild = [
  join(V2, "index.html"),
  ...arquivos(join(V2, "assets"), (n) => n.endsWith(".js") || n.endsWith(".css")),
  ...arquivos(join(V2, "modulos"), (n) => n.endsWith(".html") || n.endsWith(".js")),
];

/* ------------------------------------------------- caminhos absolutos ----- */

/* Pastas que pertencem ao app. Pedidas na raiz do domínio, são sempre 404. */
const PASTAS_DO_APP = ["media", "audio", "icons", "modulos", "__grok"];
const ABSOLUTO = new RegExp(
  `["'\`(]/(?:${PASTAS_DO_APP.join("|")})/[^"'\`)\\s]+|["'\`(]/favicon\\.svg`,
  "g",
);

test("nenhum recurso do jogo é pedido na raiz do domínio", () => {
  const achados = [];
  for (const caminho of textoDoBuild) {
    const texto = readFileSync(caminho, "utf8");
    for (const m of texto.matchAll(ABSOLUTO)) {
      achados.push(`${caminho.slice(RAIZ.length + 1)}: ${m[0].slice(1)}`);
    }
  }
  assert.deepEqual(
    achados,
    [],
    "use import.meta.env.BASE_URL — o site mora em " + BASE + ", não na raiz:\n" +
      achados.join("\n"),
  );
});

test("nenhuma âncora do módulo aponta para fora do app", () => {
  /* O botão de volta do modo tela cheia montava href="/noite" e caía num 404
     do domínio: no iPhone era a única saída visível da tarefa. */
  const voltar = readFileSync(join(V2, "modulos", "voltar.js"), "utf8");
  assert.equal(
    /a\.href\s*=\s*["'`]\//.test(voltar),
    false,
    "voltar.js monta um href absoluto à raiz do domínio",
  );
});

/* ------------------------------------------------ tudo o que é pedido existe */

test("todo endereço sob a base resolve para um arquivo do build", () => {
  const faltando = new Set();
  for (const caminho of textoDoBuild) {
    const texto = readFileSync(caminho, "utf8");
    /* Só o que está em contexto de string ou atributo. Os módulos explicam em
       comentário por que /Dragon/v2/noite dá 404 — citar um endereço não é
       pedi-lo, e um teste que não distingue os dois vira ruído. */
    for (const m of texto.matchAll(/["'`=(]\s*(\/Dragon\/v2\/[A-Za-z0-9._/-]*)/g)) {
      const url = m[1];
      if (NAO_SAO_ARQUIVO.has(url)) continue;
      if (url === BASE) continue;
      if (!existsSync(join(V2, url.slice(BASE.length)))) faltando.add(url);
    }
  }
  assert.deepEqual([...faltando], [], "referências sem arquivo no build");
});

test("o manifesto do PWA existe e aponta para ícones que existem", () => {
  /* O manifesto vinha de um middleware que só roda no dev: no Pages era 404,
     e no iPhone o ícone da tela de início virava um retrato da página. */
  const caminho = join(V2, "manifest.webmanifest");
  assert.ok(existsSync(caminho), "v2/manifest.webmanifest não foi publicado");
  const m = JSON.parse(readFileSync(caminho, "utf8"));
  assert.ok(m.name && m.short_name, "manifesto sem nome");
  for (const icone of m.icons ?? []) {
    const rel = icone.src.replace(/^\.\//, "");
    assert.ok(existsSync(join(V2, rel)), `ícone ausente: ${icone.src}`);
  }
  const html = readFileSync(join(V2, "index.html"), "utf8");
  assert.ok(
    html.includes(`href="${BASE}manifest.webmanifest"`),
    "o index.html não aponta para o manifesto publicado",
  );
});

/* ------------------------------------------ o build corresponde à fonte ---- */

test("os módulos publicados são idênticos aos da fonte", () => {
  /* v2/ é cópia manual de dist/client. Já houve deriva — o favicon foi editado
     direto no v2/ e o build seguinte o desfez. */
  const fonte = join(RAIZ, "mosaico-web", "public", "modulos");
  for (const nome of readdirSync(fonte)) {
    assert.equal(
      readFileSync(join(V2, "modulos", nome), "utf8"),
      readFileSync(join(fonte, nome), "utf8"),
      `v2/modulos/${nome} não corresponde à fonte — refaça o build`,
    );
  }
});

test("o fallback de SPA é o mesmo documento em três nomes", () => {
  const index = readFileSync(join(V2, "index.html"), "utf8");
  for (const nome of ["404.html", "_shell.html"]) {
    assert.equal(
      readFileSync(join(V2, nome), "utf8"),
      index,
      `${nome} divergiu do index.html — rota digitada à mão vai quebrar`,
    );
  }
});

test("as rotas do build usam hash, senão o 404 do Pages assume", () => {
  /* Em /Dragon/v2/ só existe arquivo na raiz do app. Sem hash history, uma
     rota digitada na barra de endereço nunca chega ao roteador. */
  const bundles = arquivos(join(V2, "assets"), (n) => n.endsWith(".js"))
    .map((c) => readFileSync(c, "utf8"))
    .join("");
  assert.ok(
    /createHashHistory|hashchange/.test(bundles),
    "o build de Pages precisa de hash history",
  );
});

/* O caso canônico existe em duas cópias: `casos/casa-da-costa.json`, que o
   jogo baixa, e o literal `CASO_FALLBACK_COMPLETO` embutido em
   `MOSAICO-mesa.html`, usado quando o download falha.

   O comentário no código sempre disse que "a auditoria de publicação
   compara os dois". Esta é a auditoria. Se as cópias divergirem, o jogo
   passa a rodar com outra `solucao` justamente quando a rede falha —
   isto é, quando ninguém está olhando. */

import { readFileSync } from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

const PREFIXO = "var CASO_FALLBACK_COMPLETO=";

function casoEmbutido() {
  const html = readFileSync(new URL("../v1/MOSAICO-mesa.html", import.meta.url), "utf8");
  const linha = html.split("\n").find(l => l.startsWith(PREFIXO));
  assert.ok(linha, `não encontrei uma linha começando com ${PREFIXO}`);
  const bruto = linha.slice(PREFIXO.length).replace(/;\s*$/, "");
  try {
    return JSON.parse(bruto);
  } catch (e) {
    assert.fail(`o literal embutido deixou de ser JSON puro (${e.message}). ` +
                `Se ele passou a conter comentários, aspas simples ou vírgula ` +
                `sobrando, este teste precisa de um parser de verdade.`);
  }
}

function casoExterno() {
  return JSON.parse(readFileSync(new URL("../v1/casos/casa-da-costa.json", import.meta.url), "utf8"));
}

test("a reserva embutida é idêntica ao caso canônico", () => {
  assert.deepStrictEqual(casoEmbutido(), casoExterno(),
    "casos/casa-da-costa.json e CASO_FALLBACK_COMPLETO divergiram. " +
    "Atualize as duas cópias antes de publicar.");
});

test("a solução do caso é a mesma nas duas cópias", () => {
  /* Verificação redundante de propósito: se o deepStrictEqual acima algum dia
     for afrouxado, este continua protegendo o que realmente decide a partida. */
  assert.deepStrictEqual(casoEmbutido().solucao, casoExterno().solucao);
});

test("a ordem correta do Mosaico cobre todas as pistas públicas", () => {
  const caso = casoExterno();
  const publicas = caso.publicas.map(p => p.id);
  const ordem = caso.mosaico.ordemCorreta;
  assert.equal(ordem.length, publicas.length,
    "a ordem correta e a lista de pistas públicas têm tamanhos diferentes");
  assert.deepEqual([...ordem].sort(), [...publicas].sort(),
    "a ordem correta cita um id que não existe entre as pistas públicas");
});

test("a solução aponta para opções que existem na tela de acusação", () => {
  const caso = casoExterno();
  const contem = (lista, id) => caso.deducao[lista].some(x => x.id === id);
  assert.ok(contem("suspeitos", caso.solucao.suspeito), "suspeito da solução não está na lista");
  assert.ok(contem("motivos",   caso.solucao.motivo),   "motivo da solução não está na lista");
  assert.ok(contem("acoes",     caso.solucao.acao),     "ação da solução não está na lista");
  assert.ok(contem("provas",    caso.solucao.prova),    "prova da solução não está na lista");
  assert.ok(contem("lacunas",   caso.solucao.lacuna),   "lacuna da solução não está na lista");
});

test("toda pista privada declara uma qualidade que o Mercado sabe pontuar", () => {
  const caso = casoExterno();
  for (const [personagem, pista] of Object.entries(caso.pistas)) {
    assert.ok(["boa", "mediana", "ruim"].includes(pista.qualidade),
      `a pista de ${personagem} tem qualidade "${pista.qualidade}"`);
  }
});

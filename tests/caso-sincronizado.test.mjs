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

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/* Este teste mede a POSIÇÃO SORTEADA da resposta, não a ordem em que alguém
   escreveu o arquivo. Conferir a fonte pegaria só as listas de hoje: a próxima
   que alguém acrescentar nasce com a verdade em cima — é assim que uma lista
   nasce, a verdade primeiro porque é ela que se tem em mente — e um teste que
   lesse a ordem escrita reprovaria uma lista que o jogo já embaralha.

   Por isso ele arranca o `ordenar` do próprio game.js e roda o sorteio. */

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const fonte = readFileSync(join(root, "carro-forte/game.js"), "utf8");

/* Se a função sumir, o teste NÃO para aqui: cai na ordem escrita no arquivo,
   que é exatamente o estado a que não se pode voltar. Assim a reprovação vem
   com a medida — "fecha inteira na primeira opção em 100% das partidas" — em
   vez de um "função não encontrada", que não diz o que quebrou para quem joga. */
const corpo = fonte.match(/function ordenar\(opts,chave\)\{[\s\S]*?\n\}/);
const ordenar = corpo
  ? new Function("state", `${corpo[0]}; return ordenar;`)
  : () => (opts) => opts;

/* Cada campo é [rótulo, opções, resposta]; o título mais próximo acima diz de
   qual pergunta ele é. */
function campos() {
  const titulos = [...fonte.matchAll(/title:'([^']*)'/g)];
  const tri = /\[\s*'([^']+)'\s*,\s*\[\s*'((?:[^']*'\s*,\s*')*[^']*)'\s*\]\s*,\s*'([^']*)'\s*\]/g;
  const out = [];
  for (const m of fonte.matchAll(tri)) {
    const opts = m[2].split(/'\s*,\s*'/).map((x) => x.trim());
    if (!opts.includes(m[3])) continue;
    const dono = titulos.filter((t) => t.index < m.index).pop();
    out.push({ jogo: dono ? dono[1] : "?", campo: m[1], opts, resposta: m[3] });
  }
  return out;
}

const CAMPOS = campos();
const posicao = (c, semente) =>
  ordenar({ semente })(c.opts, `x·${c.campo}`).indexOf(c.resposta) + 1;

describe("carro-forte · a ordem das opções", () => {
  it("o arquivo ainda tem campos para medir", () => {
    assert.ok(CAMPOS.length >= 25, `só ${CAMPOS.length} campos extraídos`);
  });

  /* O defeito real, medido em 03/09/2026: os cinco campos de "Quem construiu
     a janela?" tinham a resposta na primeira opção — em TODA partida. Escolher
     a de cima em tudo fechava 5/5 sem ler um fragmento.

     O que se mede aqui é a FREQUÊNCIA, não a ausência: um sorteio honesto tem
     de deixar isso acontecer às vezes (uma pergunta de 5 campos com 4 opções
     cai toda em cima uma vez a cada 1024), e um teste que proibisse o caso
     estaria exigindo um baralho viciado. O que não pode voltar é o sempre. */
  it("nenhuma pergunta se fecha na primeira opção mais que por acaso", () => {
    const SEMENTES = 3000;
    for (const jogo of [...new Set(CAMPOS.map((c) => c.jogo))]) {
      const doJogo = CAMPOS.filter((c) => c.jogo === jogo);
      if (doJogo.length < 2) continue;
      let cheias = 0;
      for (let semente = 1; semente <= SEMENTES; semente++) {
        if (doJogo.every((c) => posicao(c, semente) === 1)) cheias++;
      }
      const frac = cheias / SEMENTES;
      const acaso = doJogo.reduce((p, c) => p / c.opts.length, 1);
      assert.ok(
        frac <= Math.max(acaso * 6, 0.01),
        `"${jogo}" fecha inteira na primeira opção em ${(frac * 100).toFixed(2)}% das partidas (acaso: ${(acaso * 100).toFixed(2)}%)`,
      );
    }
  });

  it("a verdade cai em todas as posições, perto do acaso", () => {
    const conta = {};
    let total = 0;
    for (let semente = 1; semente <= 400; semente++) {
      for (const c of CAMPOS) {
        const p = posicao(c, semente);
        conta[p] = (conta[p] || 0) + 1;
        total++;
      }
    }
    const n = Math.max(...CAMPOS.map((c) => c.opts.length));
    for (let p = 1; p <= n; p++) {
      const frac = (conta[p] || 0) / total;
      assert.ok(
        frac > 0.15 && frac < 0.35,
        `posição ${p} sai em ${(frac * 100).toFixed(1)}% dos campos`,
      );
    }
  });

  /* Sem isto a ordem mudaria debaixo do dedo de quem voltasse à tela de
     dedução, e recarregar até a resposta subir viraria estratégia. */
  it("a mesma partida devolve sempre a mesma ordem", () => {
    for (const c of CAMPOS.slice(0, 8)) {
      const a = ordenar({ semente: 12345 })(c.opts, `x·${c.campo}`);
      const b = ordenar({ semente: 12345 })(c.opts, `x·${c.campo}`);
      assert.deepEqual(a, b);
    }
  });

  /* Se a chave fosse só a partida, as listas sairiam correlacionadas e quem
     notasse uma adivinharia as outras. */
  it("campos diferentes da mesma partida não saem na mesma ordem", () => {
    const opts = ["A", "B", "C", "D"];
    const ord = ordenar({ semente: 999 });
    const vistas = new Set(
      ["campo1", "campo2", "campo3", "campo4", "campo5"].map((k) =>
        ord(opts, `x·${k}`).join(""),
      ),
    );
    assert.ok(vistas.size >= 3, `só ${vistas.size} ordens distintas em 5 campos`);
  });

  it("a tela de dedução pede a ordem sorteada, com chave por campo", () => {
    assert.match(fonte, /optionList\(opts,'',state\.game\+'·'\+label\)/);
    assert.match(fonte, /state\.semente=\(Math\.random\(\)/);
  });
});

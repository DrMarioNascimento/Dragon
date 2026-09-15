/**
 * As três telas de A Casa (escrivaninha, maquete e percurso) compartilham
 * `css/ac-janelas.css`. Em 15/09/2026, jogando no iPhone, apareceram três
 * defeitos ali — e o conserto de um deles criou um quarto. Esta auditoria
 * guarda o que foi medido no navegador naquele dia.
 *
 * Nenhum teste do repositório monta CSS, então o que dá para guardar é a
 * forma final da cascata. Cada asserção abaixo nomeia a MEDIDA que a
 * motivou, para que quem mexer saiba o que voltar a medir.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const ler = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8").replace(/\r\n/g, "\n");

const JANELAS = ler("v1/css/ac-janelas.css");
const MAQUETE_CSS = ler("v1/css/ac-maquete.css");
const PAGINAS = [
  "v1/AC-escrivaninha.html",
  "v1/AC-maquete.html",
  "v1/AC-percurso.html",
  "v1/MOSAICO-mesa.html",
  "v1/MOSAICO-26-a-janela-do-norte.html",
  "v1/MOSAICO-26-a-sala-as-escuras.html",
  "v1/MOSAICO-26-vidro-embacado.html"
];
const JANELAS_JS = ler("v1/js/ac-janelas.js");

/** A última declaração de `position` que a cascata aplica ao × das janelas. */
function posicaoFinalDoX() {
  const re = /(^|\n|\})([^{}\n]*dialog[^{}]*>\s*\.close[^{}]*)\{([^}]*)\}/g;
  let m, ultima = null;
  while ((m = re.exec(JANELAS)) !== null) {
    const pos = /position:\s*([a-z]+)/.exec(m[3]);
    if (pos) ultima = { seletor: m[2].trim(), position: pos[1], corpo: m[3] };
  }
  return ultima;
}

describe("A Casa · janelas no telefone", () => {
  it("o × não rola com o texto do diálogo", () => {
    const x = posicaoFinalDoX();
    assert.ok(x, "não achei nenhuma regra de posição para `dialog > .close`");
    assert.equal(x.position, "fixed",
      `o × ficou \`position:${x.position}\` em "${x.seletor}".\n` +
      "Medido em 15/09/2026, no Chromium e reportado pelo Mario no iPhone:\n" +
      "  · `sticky` gruda no CONTENT box, ou seja 84px abaixo do topo da\n" +
      "    janela — o × parava em cima da primeira linha do texto;\n" +
      "  · `absolute` rola junto com o conteúdo: no diálogo “Como jogar”,\n" +
      "    que tem 1088px de conteúdo em 531px de altura, o × ia parar em\n" +
      "    y=-366 e sumia.\n" +
      "Estas janelas não fecham por Esc num telefone nem por toque no fundo\n" +
      "(o único `[data-close]` é o próprio ×). Sem ele na tela, o jogador\n" +
      "fica preso e só sai recarregando a página.");
  });

  it("o × é ancorado na mesma largura que dimensiona a janela", () => {
    const x = posicaoFinalDoX();
    assert.match(JANELAS, /--ac-window-box:/,
      "o token --ac-window-box sumiu: era ele que dava UMA fonte para a " +
      "largura do diálogo e para o recuo do × fixo.");
    assert.match(JANELAS, /dialog\{[^}]*width:var\(--ac-window-box\)/,
      "o diálogo deixou de usar --ac-window-box na largura. Com o × fixo " +
      "ancorado nesse token e o diálogo em outra largura, o × sai da caixa.");
    assert.match(x.corpo, /--ac-window-box/,
      "o × fixo deixou de ler --ac-window-box; ele passa a flutuar em " +
      "relação à janela que deveria fechar.");
  });

  it("a largura do × resiste ao `#objects button` da maquete", () => {
    if (!/#objects\s+button\{[^}]*width:\s*100%/.test(MAQUETE_CSS)) return; // a regra saiu; a trava perdeu o motivo
    const x = posicaoFinalDoX();
    assert.match(x.corpo, /width:44px!important/,
      "`#objects button{width:100%}` na maquete é um ID e ganha de qualquer\n" +
      "seletor de classe. Com o × em `position:fixed`, esses 100% passam a\n" +
      "ser a largura da TELA: medido em 15/09/2026 a 320px, o botão nascia\n" +
      "em x=-30 e o glifo ficava fora da tela, invisível.");
  });

  it("as três telas de A Casa carregam ac-janelas com o mesmo carimbo", () => {
    const achados = PAGINAS.flatMap((p) => {
      const texto = ler(p);
      return [...texto.matchAll(/(?:href|src)="(?:css|js)\/(ac-janelas\.(?:css|js))\?v=([^"]+)"/g)]
        .map((m) => ({ pagina: p, arquivo: m[1], versao: m[2] }));
    });
    assert.equal(achados.length, PAGINAS.length * 2,
      "alguma tela de A Casa parou de carimbar ac-janelas.css ou ac-janelas.js:\n" +
      achados.map((a) => `  ${a.pagina} → ${a.arquivo}`).join("\n") +
      "\nSem carimbo, o aparelho serve a folha antiga do cache ao lado do HTML novo.");
    const versoes = [...new Set(achados.map((a) => a.versao))];
    assert.equal(versoes.length, 1,
      `os carimbos de ac-janelas divergiram (${versoes.join(", ")}):\n` +
      achados.map((a) => `  ${a.pagina} → ${a.arquivo} = ${a.versao}`).join("\n"));
  });

  it("ao começar, remove orientações e cooperação sem deixar espaço ocupado", () => {
    assert.match(JANELAS_JS, /function entrarAtividade\(\)/);
    assert.match(JANELAS_JS, /data-ac-priority="10"/);
    assert.match(JANELAS_JS, /#coop-status/);
    assert.match(JANELAS_JS, /panel\.hidden=true/);
    assert.match(JANELAS, /ac-atividade-iniciada[\s\S]*#coop-status\{display:none!important\}/);
    assert.match(JANELAS_JS, /#intro\.out,#intro\.gone/);
    assert.doesNotMatch(JANELAS_JS, /ac-ver-cena/,
      "a ajuda nativa #help é a única affordance: não crie um segundo botão i.");
  });
});

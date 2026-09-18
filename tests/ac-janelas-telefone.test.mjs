/**
 * As quatro telas de A Casa (escrivaninha, maquete, percurso e sala às
 * escuras) compartilham `css/ac-janelas.css` e `js/ac-janelas.js`.
 *
 * O desenho de 17/09/2026: cada nível de janela mora numa FAIXA (alto, baixo,
 * tela), tudo proporcional a partir de variáveis em `:root`, um botão só — o
 * chevron — que ABRE, e fechar é gesto. Nenhuma janela d'A Casa tem ×.
 *
 * Isto guarda a FORMA da cascata e do código. O que só a tela mostra (dois
 * retângulos se cruzando, um controle coberto) é conferido de verdade por
 * `ac-janelas-sobreposicao.test.mjs`, no Chrome sem tela.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const ler = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8").replace(/\r\n/g, "\n");

const JANELAS = ler("v1/css/ac-janelas.css");
const JANELAS_JS = ler("v1/js/ac-janelas.js");
const CASA = {
  escrivaninha: ler("v1/AC-escrivaninha.html"),
  maquete: ler("v1/AC-maquete.html"),
  percurso: ler("v1/AC-percurso.html"),
  sala: ler("v1/MOSAICO-26-a-sala-as-escuras.html")
};
const PAGINAS = [
  "v1/AC-escrivaninha.html",
  "v1/AC-maquete.html",
  "v1/AC-percurso.html",
  "v1/MOSAICO-mesa.html",
  "v1/MOSAICO-26-a-janela-do-norte.html",
  "v1/MOSAICO-26-a-sala-as-escuras.html",
  "v1/MOSAICO-26-vidro-embacado.html"
];
/* A parte 3 da folha: as faixas d'A Casa. */
const FAIXAS = JANELAS.slice(JANELAS.indexOf("3. as faixas d'A Casa"));

describe("A Casa · janelas", () => {
  it("as quatro telas se declaram d'A Casa e têm o mesmo chevron na barra", () => {
    for (const [nome, html] of Object.entries(CASA)) {
      assert.match(html, /<html[^>]*data-ac-casa/, nome + " não se declara d'A Casa: o sistema de faixas não vale nela");
      assert.match(html, /<button id="help" class="ac-chevron"[^>]*>⌄<\/button>/,
        nome + ": o botão da barra não é o chevron. Duas funções no mesmo canto ensinam a não confiar no botão.");
      assert.doesNotMatch(html, /id="help"[^>]*>(i|🤝 Dupla)</, nome + ": voltou o botão antigo");
    }
  });

  it("nenhuma janela d'A Casa tem × próprio", () => {
    for (const [nome, html] of Object.entries(CASA)) {
      assert.doesNotMatch(html, /class="close"/, nome + ": um × voltou a uma janela d'A Casa");
      assert.doesNotMatch(html, /data-close\b/, nome + ": um data-close voltou");
    }
    assert.match(JANELAS, /html\[data-ac-casa\] dialog>\.close,html\[data-ac-casa\] #intro>\.close\{display:none!important\}/);
    assert.match(JANELAS_JS, /function portaDaIntro\(\)\{\s*if\(CASA\)return;/,
      "a intro d'A Casa ganharia o × automático");
  });

  it("todo diálogo d'A Casa sai por um botão que continua o jogo", () => {
    for (const [nome, html] of Object.entries(CASA)) {
      for (const m of html.matchAll(/<dialog id="([^"]+)"([^>]*)>([\s\S]*?)<\/dialog>/g)) {
        const [, id, attrs, corpo] = m;
        if (/data-ac-decisao/.test(attrs)) continue; // decisão obrigatória: sai pelos próprios botões
        assert.match(corpo, /class="ac-continuar"/, nome + " #" + id + ": diálogo sem botão de continuar — sem ×, o jogador ficaria preso");
      }
    }
    assert.match(CASA.maquete, /<dialog id="portal" data-ac-priority="10" data-ac-decisao/, "o portal é decisão de nível 10");
    assert.match(CASA.percurso, /<dialog id="block" data-ac-priority="10" data-ac-decisao/, "o bloqueio do percurso é decisão de nível 10");
  });

  it("as medidas saem das variáveis, na proporção da tela", () => {
    const raiz = /:root\{([^}]*)\}/.exec(JANELAS)[1];
    for (const [v, valor] of [
      ["--ac-barra", "clamp(48px, 7dvh, 64px)"],
      ["--ac-margem", "clamp(10px, 3vw, 24px)"],
      ["--ac-caixa", "min(34rem, calc(100vw - 2 * var(--ac-margem)))"],
      ["--ac-alto", "22dvh"],
      ["--ac-baixo", "38dvh"],
      ["--ac-rodape", "0px"],
      ["--ac-cromo", "clamp(56px, 12dvh, 84px)"]
    ]) assert.ok(raiz.replace(/\s+/g, " ").includes(v + ": " + valor) || raiz.replace(/\s+/g, "").includes(v + ":" + valor.replace(/\s+/g, "")), v + " mudou de valor ou saiu de :root");
    /* Na parte das faixas, nenhuma posição ou tamanho de janela em px cravado:
       o px só aparece como piso de toque (44), como teto dentro de min(),
       clamp() ou max(), ou em miudezas de cromo. */
    const cravados = [];
    for (const decl of FAIXAS.matchAll(/(?:^|[;{])\s*(top|bottom|left|right|width|height|max-height|max-width)\s*:\s*([^;}]+)/g)) {
      const [, prop, valor] = decl;
      if (!/\d+px/.test(valor) || /var\(|min\(|max\(|clamp\(|calc\(/.test(valor)) continue;
      if (/^(44px|36px|58px|10px|8px)$/.test(valor.replace(/!important/, '').trim())) continue; // piso de toque e o selo compacto do aviso
      cravados.push(prop + ":" + valor.trim());
    }
    assert.deepEqual(cravados, [], "medida de janela cravada em px na parte das faixas: " + cravados.join(", "));
  });

  it("o chevron ABRE; recolher é gesto e relógio", () => {
    assert.match(JANELAS_JS, /closest\('#help'\)\)\{ev\.preventDefault\(\);ev\.stopImmediatePropagation\(\);abrir\(\);return;\}/,
      "o chevron deixou de abrir");
    assert.match(JANELAS_JS, /closest\('\[data-ac-cena\]'\)\)recolher\(\)/, "tocar na cena deixou de recolher");
    assert.match(JANELAS_JS, /TEMPO_AVISO=4000, TEMPO_PAINEIS=15000/, "os tempos do relógio mudaram fora da constante");
    for (const [nome, html] of Object.entries({ escrivaninha: CASA.escrivaninha, maquete: CASA.maquete }))
      assert.match(html, /id="scene" data-ac-cena/, nome + ": a cena não está marcada — tocar nela não recolheria nada");
    /* Na sala, tocar na tela é MIRAR a lanterna: lá o toque não recolhe (o
       quente/frio é jogo), só o relógio. */
    assert.doesNotMatch(CASA.sala, /data-ac-cena/);
    assert.match(CASA.sala, /data-ac-painel/);
  });

  it("o relógio zera na MUDANÇA, nunca na chegada do snapshot", () => {
    /* A sala transmite de segundo em segundo mesmo parada, e o Solo a cada
       200 ms: zerar na chegada faria o relógio nunca terminar. */
    assert.match(JANELAS_JS, /const agora=textoDaPilha\(\);\s*if\(agora===ultimoTexto\)return;/,
      "o observador dos painéis deixou de comparar o texto: reescrever o mesmo texto reabriria tudo");
    const maquete = ler("v1/js/ac-maquete.js");
    assert.match(maquete, /if \(tip && tip !== ultimoTip\) vida\(\);/, "quem guia precisa do relógio zerado pela ponta do colega andando");
    assert.doesNotMatch(maquete, /function receber\(snapshot\) \{\s*vida\(\)/, "zerar o relógio na chegada do snapshot");
  });

  it("'Como jogar' é uma linha da orientação, não um botão da barra", () => {
    for (const nome of ["escrivaninha", "maquete"]) {
      assert.match(CASA[nome], /class="ac-como-jogar" data-ac-abrir="instructions"/, nome);
      assert.match(CASA[nome], /<dialog id="instructions" data-ac-priority="10">/, nome);
    }
    assert.match(JANELAS_JS, /closest\('\[data-ac-abrir\]'\)/);
  });

  it("ninguém é avisado do papel na escrivaninha nem na maquete", () => {
    const desk = ler("v1/js/ac-investigacao.js");
    for (const frase of ["PORTADOR DA LUZ", "PORTADOR DO CONHECIMENTO", "Ilumine para seu colega", "só seu colega consegue ver", "Um não vê sem o outro"])
      assert.ok(!desk.includes(frase), "a escrivaninha voltou a anunciar o papel: " + frase);
    assert.ok(!CASA.escrivaninha.includes("portador da luz"), "o Como jogar voltou a explicar os papéis");
    assert.doesNotMatch(desk, /\$\('instructions'\)\.showModal\(\)/, "as instruções voltaram a abrir sozinhas");
  });

  it("todas as páginas que carregam ac-janelas carimbam a mesma versão", () => {
    const achados = PAGINAS.flatMap((p) => {
      const texto = ler(p);
      return [...texto.matchAll(/(?:href|src)="(?:css|js)\/(ac-janelas\.(?:css|js))\?v=([^"]+)"/g)]
        .map((m) => ({ pagina: p, arquivo: m[1], versao: m[2] }));
    });
    assert.equal(achados.length, PAGINAS.length * 2,
      "alguma tela parou de carimbar ac-janelas.css ou ac-janelas.js:\n" +
      achados.map((a) => `  ${a.pagina} → ${a.arquivo}`).join("\n"));
    const versoes = [...new Set(achados.map((a) => a.versao))];
    assert.equal(versoes.length, 1, `os carimbos de ac-janelas divergiram (${versoes.join(", ")})`);
  });

  it("fora d'A Casa, o caminho antigo continua: a Mesa e os módulos não mudam", () => {
    assert.match(JANELAS_JS, /const CASA=document\.documentElement\.hasAttribute\('data-ac-casa'\);/);
    assert.match(JANELAS_JS, /if\(!CASA\)\{recolherLegado\(\);return;\}/);
    assert.match(JANELAS, /html:not\(\[data-ac-casa\]\) body\.ac-cena-livre \.ac-panel-stack/);
    assert.match(JANELAS, /\[data-ac-priority\]:not\(#intro\):not\(#oito\):not\(#falha\):not\(\.busca-caixa\)/,
      "o cromo de identidade voltou a pintar #intro/#oito/#falha/.busca-caixa.");
    assert.match(JANELAS, /#intro-corpo\{/, "sem #intro-corpo o CTA volta a rolar junto com os cartões e some da dobra.");
    assert.match(JANELAS, /\.busca-caixa\{pointer-events:none\}/);
    assert.match(JANELAS_JS, /function dispararEntradaDaIntro\(/);
    assert.match(JANELAS_JS, /ev\.key==='Escape'&&dispararEntradaDaIntro/);
  });
});

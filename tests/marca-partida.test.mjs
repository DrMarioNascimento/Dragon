/* A Marca Partida — a anamorfose tem de continuar sendo anamorfose.
 *
 * O protótipo espalha os traços de um mostrador pelo quarto de forma que eles
 * só se juntam num rumo. A propriedade que sustenta a atividade inteira é uma:
 * COMPACTO NO ALVO, ESPALHADO FORA DELE. Se alguém mexer na projeção, no foco
 * ou na profundidade dos traços, o desenho pode deixar de fechar — e o modo de
 * falha é cruel, porque a atividade continua abrindo, a lanterna continua
 * varrendo, e simplesmente não existe mais lugar nenhum de onde a hora se leia.
 *
 * Nada nesta suíte pegaria isso: o arquivo continua válido e a página continua
 * carregando. Por isso o teste mede a GEOMETRIA, arrancando as funções reais
 * do próprio arquivo.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const FONTE = readFileSync(join(RAIZ, "laboratorio-ra/a-marca-partida.html"), "utf8");

function motor() {
  const pega = (re, nome) => {
    const m = FONTE.match(re);
    assert.ok(m, `${nome} sumiu de laboratorio-ra/a-marca-partida.html`);
    return m[0];
  };
  const corpo = [
    "var D2R=Math.PI/180, R2D=180/Math.PI;",
    "var clamp=function(v,a,b){return Math.max(a,Math.min(b,v))};",
    "var wrap360=function(a){return ((a%360)+360)%360};",
    "var OLHO=[0,0,1.55];",
    "var W=800,H=450,CX=400,CY=225,ESC=225;",
    pega(/function baseDe\(bearing,elev\)\{[\s\S]*?\n\}/, "baseDe"),
    pega(/var FOCO=[\d.]+;/, "FOCO"),
    pega(/var SEG=\{[\s\S]*?\n\};/, "SEG"),
    pega(/var TRACO=\[[\s\S]*?\];/, "TRACO"),
    pega(/function pontosDaHora\(txt\)\{[\s\S]*?\n\}/, "pontosDaHora"),
    pega(/function semente\(str\)\{[\s\S]*?\n\}/, "semente"),
    pega(/function raio\(base,u,v\)\{[\s\S]*?\n\}/, "raio"),
    pega(/function montarMarca\(hora,alvoB,alvoE,rnd\)\{[\s\S]*?\n\}/, "montarMarca"),
    pega(/function projeta\(P,base\)\{[\s\S]*?\n\}/, "projeta"),
  ].join("\n");
  return new Function(`${corpo}
    return {baseDe,montarMarca,projeta,semente};`)();
}

const M = motor();

/* Largura da nuvem de pontos projetada, em pixels de tela. */
function extensao(marca, bearing, elev) {
  const base = M.baseDe(bearing, elev);
  const xs = [], ys = [];
  for (const m of marca) {
    const A = M.projeta(m.a, base), B = M.projeta(m.b, base);
    if (!A || !B) continue;
    xs.push(A[0], B[0]); ys.push(A[1], B[1]);
  }
  if (xs.length < 8) return null;
  return { larg: Math.max(...xs) - Math.min(...xs), alt: Math.max(...ys) - Math.min(...ys), n: xs.length };
}

test("no alvo, a marca fecha num desenho compacto e inteiro na tela", () => {
  for (const hora of ["21:29", "08:02", "23:05"]) {
    const marca = M.montarMarca(hora, 137, 11, M.semente("prova-" + hora));
    const a = extensao(marca, 137, 11);
    assert.ok(a, `${hora}: os traços nem projetam`);
    /* Cabe na tela de 800×450 com margem — marca encostando na borda é marca
       que não se lê no celular, que é mais estreito ainda. */
    assert.ok(a.larg < 720 && a.alt < 400, `${hora}: a marca ocupa ${a.larg|0}×${a.alt|0}, encosta nas bordas`);
    assert.ok(a.larg > 120, `${hora}: a marca ficou pequena demais para se ler (${a.larg|0}px)`);
  }
});

/* Medir a caixa envolvente foi minha primeira tentativa e estava errada: a 25°
   do alvo a caixa quase não muda (299px contra 229px) e mesmo assim a marca é
   ruído na tela — conferido no navegador. O que quebra a leitura não é o
   tamanho da nuvem, é cada traço sair do lugar DENTRO dela.

   Então o que se mede é o resíduo: onde cada ponta cai agora contra onde ela
   cai no alvo, depois de tirar deslocamento e escala — porque virar a cabeça
   move e aproxima o desenho inteiro sem desmanchá-lo, e isso não é o defeito. */
function residuo(marca, bearing, elev, alvoB, alvoE) {
  const proj = (b, e) => {
    const base = M.baseDe(b, e), p = [];
    for (const m of marca) {
      const A = M.projeta(m.a, base), B = M.projeta(m.b, base);
      if (!A || !B) return null;
      p.push([A[0], A[1]], [B[0], B[1]]);
    }
    return p;
  };
  const normaliza = (p) => {
    const cx = p.reduce((s, q) => s + q[0], 0) / p.length;
    const cy = p.reduce((s, q) => s + q[1], 0) / p.length;
    const r = Math.sqrt(p.reduce((s, q) => s + (q[0] - cx) ** 2 + (q[1] - cy) ** 2, 0) / p.length) || 1;
    return p.map((q) => [(q[0] - cx) / r, (q[1] - cy) / r]);
  };
  const a = proj(alvoB, alvoE), b = proj(bearing, elev);
  if (!a || !b) return Infinity; /* virou de costas: também não se lê */
  const A = normaliza(a), B = normaliza(b);
  let s = 0;
  for (let i = 0; i < A.length; i++) s += Math.hypot(A[i][0] - B[i][0], A[i][1] - B[i][1]);
  return s / A.length;
}

test("fora do alvo, a marca desaba", () => {
  const marca = M.montarMarca("21:29", 137, 11, M.semente("prova-desaba"));
  assert.ok(residuo(marca, 137, 11, 137, 11) < 1e-9, "no alvo o resíduo tem de ser zero, por construção");
  let anterior = 0;
  for (const desvio of [12, 25, 45]) {
    const r = residuo(marca, 137 + desvio, 11, 137, 11);
    assert.ok(r > anterior, `o resíduo parou de crescer entre ${desvio}° e o anterior`);
    anterior = r;
  }
  /* O número absoluto seria chute — o meu primeiro foi, e reprovou um código
     que estava certo. O que tem sentido é a RAZÃO contra a borda da tolerância:
     sair da faixa em que a marca trava tem de piorar a leitura de forma
     visível, não marginal. Medido: 0,071 na borda dos 13°, 0,146 ao dobro
     dela. Se um dia a tolerância abrir, esta conta acompanha sozinha. */
  const naBorda = residuo(marca, 137 + 13, 11, 137, 11);
  const aoDobro = residuo(marca, 137 + 26, 11, 137, 11);
  assert.ok(
    aoDobro >= naBorda * 1.8,
    `ao dobro da tolerância o resíduo é ${aoDobro.toFixed(3)} contra ${naBorda.toFixed(3)} na borda — ` +
      `os traços quase não saíram do lugar, e a anamorfose deixou de ser anamorfose`,
  );
});

/* A profundidade é o que faz o desenho desabar: traços todos à mesma distância
   giram juntos e continuam legíveis de qualquer lugar — seria um adesivo, não
   uma marca partida pelo quarto. */
test("os traços ficam em profundidades diferentes", () => {
  const marca = M.montarMarca("21:29", 0, 0, M.semente("prova-prof"));
  const ts = marca.map((m) => m.t);
  assert.ok(Math.max(...ts) - Math.min(...ts) > 1.2, "os traços estão quase todos à mesma distância");
});

/* A mesma semente tem de montar a mesma marca: é o que faz a mesa inteira
   procurar a mesma coisa, como já vale para as outras três atividades. */
test("a mesma semente monta a mesma marca", () => {
  const um = M.montarMarca("21:29", 137, 11, M.semente("igual"));
  const dois = M.montarMarca("21:29", 137, 11, M.semente("igual"));
  assert.deepEqual(um, dois);
  const outra = M.montarMarca("21:29", 137, 11, M.semente("diferente"));
  assert.notDeepEqual(um, outra, "sementes diferentes deveriam espalhar diferente");
});

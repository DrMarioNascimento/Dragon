/* A Janela do Norte — o norte é um offset, não o alpha.
 *
 * Existe por causa de 03/09/2026. Até então a Mesa fazia
 * `alpha = 360 - webkitCompassHeading` e mandava isso pela matriz de Euler,
 * junto com o beta e o gamma REPORTADOS. Perto de beta = 90° — a postura de
 * quem levanta o braço para mirar uma janela a 39° acima do horizonte — o par
 * (alpha, gamma) é degenerado: infinitas combinações descrevem a mesma
 * orientação física, e o sistema escorrega entre elas com o aparelho parado
 * na mão. Trocar metade desse par por um valor da bússola mistura duas
 * referências, e o rumo oscila.
 *
 * A correção veio d'A Noite: a ATITUDE (o par como o sistema o reporta) dá o
 * rumo, e a bússola vira um OFFSET que anda devagar.
 *
 * O QUE ESTE TESTE MEDE é o comportamento, não a forma: alimenta a função
 * REAL, extraída do arquivo, com um aparelho fisicamente PARADO e uma agulha
 * PERFEITA, deixando escorregar só o par. Um rumo que oscile ali está lendo a
 * degenerescência como movimento.
 *
 * Medido na versão anterior, para calibrar o limiar: 6,0° de oscilação com o
 * par escorregando ±10°, e 15,6° com ±25°. Depois: 1,7° e 1,8°.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const ARQ = new URL("../v1/MOSAICO-26-a-janela-do-norte.html", import.meta.url);
const FONTE = readFileSync(ARQ, "utf8");

function monta() {
  const pega = (re, nome) => {
    const m = FONTE.match(re);
    assert.ok(m, `${nome} não está mais em MOSAICO-26-a-janela-do-norte.html`);
    return m[0];
  };
  const estado = `var PI=Math.PI,D2R=PI/180;
    var clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
    var wrap360=a=>((a%360)+360)%360;
    var wrap180=a=>{a=wrap360(a);return a>180?a-360:a;};
    var raw={bearing:0,elev:0,roll:0},src="nenhuma",started=false;
    var northOffset=0,DECL_MESA=0,temAbsoluto=false;
    var bussOff=null,tOrient=0,rumoSuave=null,iosHead=null,iOSInstavel=false;
    var _agora=0;var performance={now:()=>_agora};`;
  return new Function(
    `${estado}
     ${pega(/function eulerParaVista\([\s\S]*?\n\}/, "eulerParaVista")}
     ${pega(/function onOrient\(e\)\{[\s\S]*?\n\}/, "onOrient")}
     return {ev:e=>onOrient(e), ler:()=>raw.bearing, tick:m=>{_agora+=m}};`,
  )();
}

/* Perto de beta=90° o par (alpha,gamma) é degenerado: (alpha+d, beta, gamma-d)
   descreve a mesma orientação. O aparelho não se mexe; a representação sim. */
function oscilacao(beta, balanco, seed) {
  const g = monta();
  let h = seed >>> 0;
  const rnd = () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0) >>> 8) / 16777216;
  const v = [];
  for (let i = 0; i < 600; i++) {
    g.tick(16);
    const d = (rnd() * 2 - 1) * balanco;
    g.ev({
      alpha: 300 + d, beta, gamma: 2 - d,
      webkitCompassHeading: 90, /* agulha perfeita: o que sobrar é a degenerescência */
      webkitCompassAccuracy: 12,
      absolute: false, type: "deviceorientation",
    });
    if (i > 240) v.push(g.ler());
  }
  const m = v.reduce((a, b) => a + b, 0) / v.length;
  const c = v.map((x) => { let q = x - m; while (q > 180) q -= 360; while (q < -180) q += 360; return q; });
  return Math.sqrt(c.reduce((a, b) => a + b * b, 0) / c.length);
}

test("o rumo não lê a degenerescência do par como movimento", () => {
  for (const beta of [88, 90, 92, 100, 115]) {
    const dp = oscilacao(beta, 10, 5 + beta);
    assert.ok(dp < 3, `com beta ${beta}° o rumo oscila ${dp.toFixed(2)}° (antes: ~6°)`);
  }
});

test("nem quando o par escorrega muito", () => {
  const dp = oscilacao(115, 25, 91);
  assert.ok(dp < 3, `o rumo oscila ${dp.toFixed(2)}° com o par a ±25° (antes: 15,6°)`);
});

/* A forma, não só o efeito: se alguém devolver o alpha cru, o teste acima
   ainda poderia passar por acidente de calibragem. Este não. */
test("a bússola não volta a entrar como alpha", () => {
  assert.doesNotMatch(
    FONTE,
    /alpha *= *360 *- *e\.webkitCompassHeading/,
    "a bússola voltou a substituir o alpha antes da matriz de Euler",
  );
  assert.match(FONTE, /var fundido *= *\(bussOff===null\)/, "o offset da bússola sumiu");
});

/* A declinação da mesa é da Mesa e não existe n'A Noite — ao trazer o offset
   de lá, ela tinha de continuar entrando, e só no caminho do iPhone. */
test("a declinação da mesa sobreviveu ao porte, e só no iPhone", () => {
  assert.match(FONTE, /raw\.bearing=wrap360\(rumoSuave\+northOffset\+DECL_MESA\)/);
  const androidPath = FONTE.match(/\} else \{\s*if\(abs\) src="bússola \(absoluta\)"[\s\S]*?raw\.bearing=wrap360\(v\.bearing\+northOffset\)/);
  assert.ok(androidPath, "o caminho não-iOS não termina mais em bearing+northOffset sem declinação");
});

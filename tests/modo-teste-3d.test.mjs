/* O modo de teste 3D da Mesa SAIU (Mario, 18/09/2026: "estes botões eu já
   havia solicitado a retirada").

   Ele tinha sido "retirado" uma vez escondendo: um js/esconder-teste-3d.js
   apagava o botão flutuante a cada 300 ms e um CSS escondia o resto, mas a
   função, o dock de fases ("Sob outra luz · Escrivaninha", "Câmera RA",
   "Sala 3D & RA", "Mosaico 3D", "Mercado 3D", "Dedução 3D", "Pódio 3D"), os
   atalhos ?teste= e #teste, o botão na tela inicial legada e os desvios
   dentro do Mosaico, do Mercado e da Dedução continuavam no código — e o dock
   voltava por qualquer um desses caminhos. Esconder não é tirar. Este teste
   guarda a AUSÊNCIA. */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const ler = (p) => readFileSync(join(root, p), "utf8").replace(/\r\n/g, "\n");

describe("Mesa · sem modo de teste 3D", () => {
  const html = ler("v1/MOSAICO-mesa.html");
  const css = ler("v1/css/mosaico-3d.css");

  it("nenhuma função, dock, botão ou atalho de URL do modo de teste", () => {
    for (const resto of ["iniciarTeste3D", "irParaFaseTeste3D", "sairTeste3D", "atualizarDockTeste3D",
      "atualizarBotaoFlutuanteTeste", "modoTeste3D", "m3d-dock-teste", "m3d-atalho-teste", "MODO DE TESTE",
      'get("teste")', '"#teste"'])
      assert.ok(!html.includes(resto), "voltou à Mesa: " + resto);
  });

  it("nenhuma regra de CSS do dock ou do botão flutuante", () => {
    for (const resto of [".m3d-dock", ".m3d-badge-launch", ".m3d-pulse-gold", "modo-teste-3d"])
      assert.ok(!css.includes(resto), "voltou ao CSS: " + resto);
  });

  it("o esconderijo saiu junto, e a abertura é da Mesa, não do adaptador de nuvem", () => {
    assert.equal(existsSync(join(root, "v1/js/esconder-teste-3d.js")), false);
    const cloud = ler("v1/js/ac-cloud.js");
    assert.doesNotMatch(cloud, /esconder-teste-3d|mesa-fluxo-abertura|abertura-video-casa|createElement\('script'\)/,
      "o adaptador de nuvem voltou a injetar scripts da Mesa nas telas d'A Casa");
    assert.match(html, /<script defer src="js\/abertura-video-casa\.js\?v=/);
    assert.match(html, /<script defer src="js\/mesa-fluxo-abertura\.js\?v=/);
  });
});

/* Os outros botões extras que saíram na mesma varredura (18/09/2026). */
describe("A Casa · sem botões extras", () => {
  it("a escrivaninha não tem Girar a mesa, Ver por baixo, Usar movimento nem Reiniciar", () => {
    const html = ler("v1/AC-escrivaninha.html"), js = ler("v1/js/ac-investigacao.js");
    for (const id of ["orbit", "below", "motion", "restart"]) {
      assert.ok(!html.includes('id="' + id + '"'), "voltou à escrivaninha: #" + id);
      assert.ok(!js.includes("$('" + id + "')"), "o código voltou a usar #" + id);
    }
    assert.ok(!js.includes("orbiting"), "sobrou o estado do Girar a mesa");
  });

  it("olhar por baixo é tocar nas gavetas, não um botão", () => {
    const js = ler("v1/js/ac-investigacao.js");
    assert.match(js, /function olharPorBaixo\(\)/);
    assert.match(js, /if\(local\.y<alto\*\.85\)olharPorBaixo\(\);/, "o toque nas gavetas deixou de levar para baixo do móvel");
    assert.match(js, /Math\.hypot\(event\.clientX-t\.x,event\.clientY-t\.y\)>8\)return;/, "arrastar (girar/mirar) não pode contar como toque");
  });

  it("dentro da Mesa e do Solo, a sala às escuras não mostra o painel do Mestre", () => {
    const sala = ler("v1/MOSAICO-26-a-sala-as-escuras.html");
    assert.match(sala, /if\(EMBED && !DEV\)\{\s*\["b-mestre","mestre"\]\.forEach/);
    assert.match(sala, /var el=document\.getElementById\("folga"\);\s*if\(el\)/, "pintaFolga quebraria sem o painel");
    assert.match(sala, /if\(inp && inp\.value!==seedStr\)/, "montaSala quebraria sem o campo da semente");
  });
});

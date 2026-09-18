import assert from "node:assert/strict";
import { readFileSync, statSync, existsSync } from "node:fs";
import { describe, it } from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from 'node:vm';

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const ler = (p) => readFileSync(join(root, p), "utf8").replace(/\r\n/g, "\n");

describe("Mosaico RA & Sala 3D Volumétrica · Motor e Integração", () => {
  const threePath = join(root, "v1/js/three.min.js");
  const engineSrc = ler("v1/js/mosaico-ra-engine.js");
  const mesaHtml = ler("v1/MOSAICO-mesa.html");
  const salaHtml = ler("v1/MOSAICO-26-a-sala-as-escuras.html");
  const cssSrc = ler("v1/css/mosaico-3d.css");

  it('girar por mouse ou toque não abre inspeção; um clique seguinte continua funcionando',()=>{
    const events={},globalEvents={};let raycasts=0;
    const window={addEventListener:(name,fn)=>{globalEvents[name]=fn;}};
    const dom={addEventListener:(name,fn)=>{events[name]=fn;},getBoundingClientRect:()=>({left:0,top:0,width:100,height:100})};
    const THREE={Vector2:class{},Raycaster:class{setFromCamera(){}intersectObjects(){raycasts++;return [];}}};
    vm.runInNewContext(engineSrc,{window,document:{getElementById:()=>null},THREE,console});
    const engine=window.MosaicoRA;engine.renderer={domElement:dom};engine.scene={children:[]};engine.ligarControles();
    events.mousedown({clientX:20,clientY:20});globalEvents.mousemove({clientX:80,clientY:20});globalEvents.mouseup();events.click({clientX:80,clientY:20});
    assert.equal(raycasts,0,'soltar arrasto não investiga o objeto sob o cursor');
    events.mousedown({clientX:80,clientY:20});globalEvents.mouseup();events.click({clientX:80,clientY:20});assert.equal(raycasts,1);
    events.touchstart({touches:[{clientX:20,clientY:20}]});globalEvents.touchmove({touches:[{clientX:20,clientY:70}]});globalEvents.touchend();events.click({clientX:20,clientY:70});assert.equal(raycasts,1);
    events.touchstart({touches:[{clientX:20,clientY:20}]});globalEvents.touchend();events.click({clientX:20,clientY:20});assert.equal(raycasts,2,'toque curto continua selecionando');
  });

  it("Three.js local offline está presente e tem tamanho adequado (> 500 KB)", () => {
    assert.ok(existsSync(threePath), "v1/js/three.min.js deve existir");
    const st = statSync(threePath);
    assert.ok(st.size > 500000, `Three.js deve ser a biblioteca completa (>500KB), achou ${st.size}`);
  });

  it("mosaico-ra-engine.js define o módulo global MosaicoRA com todas as capacidades", () => {
    assert.match(engineSrc, /global\.MosaicoRA\s*=\s*MosaicoRA/);
    assert.match(engineSrc, /MosaicoRA\.iniciar\s*=/);
    assert.match(engineSrc, /MosaicoRA\.encerrar\s*=/);
    assert.match(engineSrc, /MosaicoRA\.trocarModo\s*=/);
    assert.match(engineSrc, /MosaicoRA\.construirSala3D\s*=/);
    assert.match(engineSrc, /MosaicoRA\.construirAnamorfose\s*=/);
    assert.match(engineSrc, /MosaicoRA\.ativarCameraRA\s*=/);
    assert.match(engineSrc, /MosaicoRA\.desativarCameraRA\s*=/);
    assert.match(engineSrc, /MosaicoRA\.examinarObjeto\s*=/);
    assert.match(engineSrc, /MosaicoRA\.fecharInspecao\s*=/);
  });

  it("mosaico-ra-engine.js contempla os 9 objetos canônicos da Casa da Costa em 3D", () => {
    const objetos = [
      "quadro", "cofre", "vaso", "escrivaninha",
      "gaveta", "secretaria", "espelho", "janela", "relogio"
    ];
    for (const obj of objetos) {
      assert.match(ler("v1/js/ac-room.js").replaceAll("objects[", "objetos3D["), new RegExp(`objetos3D\\["${obj}"\\]`), `Objeto canônico 3D ausente: ${obj}`);
    }
  });

  it("anamorfose espacial ('A Marca Partida') possui ângulo de alinhamento e tolerância", () => {
    assert.match(engineSrc, /anamorfoseAlvo:\s*\{\s*yaw:\s*137,\s*pitch:\s*11\s*\}/);
    assert.match(engineSrc, /desvioTotal\s*<\s*3\.2/);
    assert.match(engineSrc, /ANAMORFOSE ALINHADA/);
  });

  it("câmera RA suporta shader de luz negra UV forense com pegadas e envelope lacrado", () => {
    assert.match(engineSrc, /criarPistasUV\s*=/);
    assert.match(engineSrc, /pegadaMat/);
    assert.match(engineSrc, /selo/);
  });

  it("MOSAICO-mesa.html integra Three.js e motor RA sem quebrar cache stamps", () => {
    assert.match(mesaHtml, /<script src="js\/three\.min\.js"><\/script>/);
    assert.match(mesaHtml, /mosaico-ra-engine\.js/);
    /* O atalho "Sala 3D & RA" do modo de teste saiu com ele (18/09/2026). */
    assert.doesNotMatch(mesaHtml, /Teste3D|Sala 3D & RA/);
  });

  it("MOSAICO-26-a-sala-as-escuras.html integra Three.js sem expor RA de ensaio", () => {
    assert.match(salaHtml, /<script src="js\/three\.min\.js"><\/script>/);
    assert.match(salaHtml, /mosaico-ra-engine\.js/);
    assert.match(salaHtml, /alternarModo3DRA/);
    /* RA de volta em 18/09/2026, só para quem tem e sem rótulo de ensaio. */
    assert.match(salaHtml, /id="b-entrar-ra" type="button" hidden>Entrar em RA</);
    assert.equal(/>Alternar visual</.test(salaHtml), false);
    assert.equal(/Prefiro jogar sem RA/.test(salaHtml), false);
    assert.match(salaHtml, /id="b-entrar"/);
    assert.match(salaHtml, />Entrar na sala</);
  });

  it("mosaico-3d.css contém estilos para HUD, visor RA, abas e modal de inspeção 360°", () => {
    assert.match(cssSrc, /\.mosaico-ra-container/);
    assert.match(cssSrc, /\.mosaico-ra-hud/);
    assert.match(cssSrc, /\.mosaico-ra-tabs/);
    assert.match(cssSrc, /\.mosaico-ra-tab/);
    assert.match(cssSrc, /\.mosaico-ra-modal/);
  });
});

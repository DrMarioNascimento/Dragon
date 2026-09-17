/* Bancada de medição da maquete: monta o mundo 3D real, a partir do GLB
   publicado, dentro do Node. É o que permite auditar geometria — visibilidade,
   fechaduras, alcance da chave — sem navegador.

   Duas armadilhas resolvidas aqui, e as duas custam horas quando não estão:
   · o `vm` cria um realm próprio, e um ArrayBuffer vindo do `fs` do host falha
     no `instanceof` do GLTFLoader (ele então tenta ler os bytes como texto e
     acusa "Unsupported asset"). Por isso os construtores de array do host são
     injetados no contexto;
   · o GLTFLoader do r128 usa `TextDecoder`, `URL`, `Blob` e temporizadores. */
import { readFileSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';

const raiz = new URL('../', import.meta.url);
const ler = (p) => readFileSync(new URL(p, raiz), 'utf8');

export function bancada() {
  const ctx = createContext({
    console, ArrayBuffer, Uint8Array, Uint16Array, Uint32Array, Int8Array, Int16Array, Int32Array,
    Float32Array, Float64Array, DataView, Map, Set, WeakMap, Promise, TextDecoder, URL, Math, JSON,
    setTimeout, clearTimeout, setInterval, clearInterval, performance,
    window: {}, self: {},
    Blob: class { constructor(partes, o) { this.partes = partes; this.type = (o || {}).type || ''; } },
    URL: Object.assign(function (u, b) { return new URL(u, b || 'file:///maquete/'); },
      { createObjectURL: () => 'blob:maquete/' + Math.random().toString(36).slice(2), revokeObjectURL() {} }),
    document: {
      createElement(tag) {
        if (tag === 'canvas') return { width: 1, height: 1, getContext: () => null, style: {} };
        return elementoFalso();
      },
      createElementNS() { return elementoFalso(); }
    }
  });
  /* O ImageLoader do r128 escuta 'load' e depois escreve em `src`. Sem uma
     imagem que responda, a promessa da textura nunca resolve e o `parse`
     nunca chama o onLoad — a medição trava sem erro nenhum. */
  function elementoFalso() {
    const ouvintes = {};
    const el = {
      style: {}, width: 4, height: 4,
      setAttribute() {}, removeAttribute() {}, appendChild() {},
      addEventListener(t, fn) { (ouvintes[t] || (ouvintes[t] = [])).push(fn); },
      removeEventListener(t, fn) { ouvintes[t] = (ouvintes[t] || []).filter((f) => f !== fn); }
    };
    let src = '';
    Object.defineProperty(el, 'src', {
      get: () => src,
      set(v) { src = v; setTimeout(() => (ouvintes.load || []).forEach((fn) => fn({ target: el })), 0); }
    });
    return el;
  }
  ctx.globalThis = ctx;
  ctx.window.document = ctx.document;
  /* O three.js pede a fábrica de blobs por `window.URL`, não pelo global. */
  ctx.window.URL = ctx.URL; ctx.self.URL = ctx.URL;
  ctx.window.Blob = ctx.Blob; ctx.self.Blob = ctx.Blob;
  runInContext(ler('v1/js/three.min.js'), ctx);
  ctx.window.THREE = ctx.THREE;
  runInContext(ler('v1/js/vendor/GLTFLoader.js'), ctx);
  runInContext(ler('v1/js/ac-maquete-mundo.js'), ctx);
  Object.assign(ctx, ctx.window);
  return ctx;
}

export async function montarMundo(opcoes = {}) {
  const ctx = bancada();
  const bytes = readFileSync(new URL('v1/assets/ac/casa-da-costa-pisos.glb', raiz));
  const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  const cena = await new Promise((ok, falha) => {
    new ctx.THREE.GLTFLoader().parse(buffer, '', (gltf) => ok(gltf.scene), falha);
  });
  return { ctx, THREE: ctx.THREE, mundo: ctx.ACMaquetteMundo.montar(cena, opcoes) };
}

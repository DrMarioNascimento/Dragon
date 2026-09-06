/**
 * Catraca de playtest: leftovers de gate/CTA que já queimaram mesa ao vivo.
 * Estas asserções DEVEM falhar se o texto voltar — não afrouxar o teto.
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { describe, it } from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const ler = (p) => readFileSync(join(root, p), "utf8").replace(/\r\n/g, "\n");

function stripComments(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[\n\r])\s*\/\/[^\n\r]*/g, "$1");
}

function fnSlice(src, name, nextNames) {
  const start = src.indexOf(name);
  assert.ok(start >= 0, `não achei ${name}`);
  let end = src.length;
  for (const n of nextNames) {
    const i = src.indexOf(n, start + name.length);
    if (i > start && i < end) end = i;
  }
  return src.slice(start, end);
}

function walk(dir, pred, acc = []) {
  for (const nome of readdirSync(dir)) {
    if (nome === "node_modules" || nome === ".git") continue;
    const caminho = join(dir, nome);
    const st = statSync(caminho);
    if (st.isDirectory()) walk(caminho, pred, acc);
    else if (pred(nome, caminho)) acc.push(caminho.slice(root.length + 1));
  }
  return acc;
}

const JANELAS = walk(root, (n) => /janela-do-norte/i.test(n) && /\.html$/i.test(n));
const CASA_JANELAS = [
  "v1/MOSAICO-26-a-janela-do-norte.html",
  "v2/modulos/janela-do-norte.html",
  "mosaico-web/public/modulos/janela-do-norte.html",
];

describe("Janela do Norte · nenhuma árvore com Descer do carro", () => {
  it("encontrou as cópias conhecidas", () => {
    assert.ok(JANELAS.length >= 4, `janelas: ${JANELAS.join(", ")}`);
    for (const p of CASA_JANELAS) assert.ok(JANELAS.includes(p), p);
    assert.ok(JANELAS.includes("carro-forte/janela-do-norte.html"));
  });

  it("zero Descer do carro em qualquer janela-do-norte.html", () => {
    const sujos = JANELAS.filter((p) => /Descer do carro/i.test(ler(p)));
    assert.deepEqual(sujos, [], `Descer do carro voltou em: ${sujos.join(", ")}`);
  });

  it("cópias Casa usam Apontar a janela", () => {
    for (const p of CASA_JANELAS) {
      assert.match(ler(p), /Apontar a janela/, p);
    }
  });

  it("Carro não mistura CTA da Casa", () => {
    const carro = ler("carro-forte/janela-do-norte.html");
    assert.match(carro, /Atravessar a rua/);
    assert.equal(/Apontar a janela/.test(carro), false);
  });
});

describe("gate Celular · sem Ensaiar / Telão / Com·Sem telão", () => {
  it("firebase-room menu: Abrir | Entrar only", () => {
    const room = ler("firebase-room.js");
    const menu = fnSlice(room, "function menu(", ["function formTelao("]);
    const plain = stripComments(menu);
    assert.match(plain, /Abrir uma mesa/);
    assert.match(plain, /Entrar em uma mesa/);
    assert.equal(/Ensaiar/.test(plain), false);
    assert.equal(/Entrar como tel/i.test(plain), false);
    assert.equal(/id="drSolo"/.test(menu), false);
    assert.equal(/id="drTelao"/.test(menu), false);
    assert.equal(/Com telão/.test(plain), false);
    assert.equal(/Sem telão/.test(plain), false);
  });

  it("firebase-room Abrir mesa sem picker Com/Sem telão", () => {
    const room = ler("firebase-room.js");
    const master = fnSlice(room, "function renderMasterGate", ["async function autorizado"]);
    const plain = stripComments(master);
    assert.equal(/Com telão/.test(plain), false);
    assert.equal(/data-mode="com-telao"/.test(plain), false);
    assert.equal(/data-mode="sem-telao"/.test(plain), false);
  });

  it("passoTelao morreu de verdade (função + QR Abra o telão)", () => {
    const room = ler("firebase-room.js");
    assert.equal(/function passoTelao\s*\(/.test(room), false);
    assert.equal(/<h2>Abra o telão<\/h2>/.test(room), false);
    assert.equal(/id="drTelaoNext"/.test(room), false);
  });

  it("legacy mesa inicio: Abrir | Entrar; sem Entrar como telão / Ensaiar / Com·Sem", () => {
    const mesa = ler("v1/MOSAICO-mesa.html");
    const inicio = fnSlice(mesa, "function telaInicio()", ["function modalSenha("]);
    const senha = fnSlice(mesa, "function modalSenha()", ["function fecharOrientacaoMestre("]);
    const plain = stripComments(inicio + senha);
    assert.match(plain, /Abrir uma mesa/);
    assert.match(plain, /Entrar em uma mesa/);
    assert.equal(/Entrar como tel/i.test(plain), false);
    assert.equal(/Ensaiar/.test(plain), false);
    assert.equal(/Com tel&atilde;o/.test(plain), false);
    assert.equal(/Sem tel&atilde;o/.test(plain), false);
    assert.equal(/escolherModoMesa\(/.test(plain), false);
  });

  it("overrides Casa (rotação / v2 wrapper) também sem telão no gate", () => {
    for (const p of ["v1/js/rotacao-partidas-casa.js", "v1/js/casa-da-costa-v2.js"]) {
      const src = stripComments(ler(p));
      const gate = src.includes("function()")
        ? src.slice(src.indexOf("global.telaInicio"), src.indexOf("global.telaInicio") + 1800)
        : src;
      assert.equal(/Entrar como tel/i.test(gate), false, p);
      assert.equal(/Ensaiar/.test(gate), false, p);
    }
  });

  it("room-shell v2/mosaico-web: Abrir | Entrar; sem Ensaiar sozinho", () => {
    for (const p of ["v2/room-shell.js", "mosaico-web/public/room-shell.js"]) {
      const menu = fnSlice(ler(p), "function renderMenu()", ["function renderMasterGate"]);
      const plain = stripComments(menu);
      assert.match(plain, /Abrir uma mesa/);
      assert.match(plain, /Entrar em uma mesa/);
      assert.equal(/Ensaiar sozinho/.test(plain), false, p);
      assert.equal(/id="solo"/.test(menu), false, p);
    }
  });

  it("fonte React mosaico-web não reintroduz Ensaiar sozinho no menu", () => {
    const src = ler("mosaico-web/src/routes/index.tsx");
    assert.equal(/Ensaiar sozinho/.test(src), false);
  });
});

describe("produção · v2 não é porta do playtest", () => {
  it("landing Casa não aponta para /v2/", () => {
    const land = ler("casa-da-costa/index.html");
    assert.equal(/href=["'][^"']*v2\//.test(land), false);
    assert.match(land, /não é porta de produção/i);
  });

  it("hub não aponta para /v2/", () => {
    const hub = ler("index.html");
    assert.equal(/href=["'][^"']*v2\//.test(hub), false);
  });
});

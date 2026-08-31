/* A Noite carrega o núcleo em cascata: `index.html` injeta `game.js`, que
   injeta `game-fixed.js`, que injeta `opening-flow.js`. Nenhum desses passos
   avisa quando o arquivo de baixo não compila — o navegador descarta o script
   inteiro em silêncio, a página continua abrindo, a abertura continua bonita,
   e o que some é a fiação que mora no fim do arquivo: o clique de "Entrar na
   reunião", os botões de ritmo, as três ações da mesa e a API que os bots do
   Solo Lab usam para jogar.

   Foi exatamente o que aconteceu: uma reescrita cortou `game-fixed.js` no meio
   da última expressão. O arquivo ficou vinte bytes menor, o diff parecia uma
   melhoria do fluxo Arriscar, e o único sintoma visível foi um botão que não
   respondia mais. Procurar o erro no botão não adianta — ele nunca chegou a
   ter dono.

   Esta auditoria falha antes de publicar: exige que cada arquivo compile e que
   os pontos de fiação continuem escritos onde a página os espera. */

import { readFileSync, readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";
import assert from "node:assert/strict";

const pasta = new URL("../carro-forte-noite/", import.meta.url);
const ler = nome => readFileSync(new URL(nome, pasta), "utf8");
const scripts = readdirSync(pasta).filter(nome => nome.endsWith(".js")).sort();

test("todo script de A Noite compila", () => {
  assert.ok(scripts.length >= 8, "a pasta perdeu scripts");
  for (const nome of scripts) {
    const caminho = fileURLToPath(new URL(nome, pasta));
    try {
      execFileSync(process.execPath, ["--check", caminho], { stdio: "pipe" });
    } catch (erro) {
      assert.fail(`${nome} não compila:\n${erro.stderr?.toString() ?? erro.message}`);
    }
  }
});

test("o núcleo termina com a fiação que a página espera", () => {
  const nucleo = ler("game-fixed.js");
  const fiacao = [
    "enterBtn.onclick",         // Entrar na reunião
    "[data-pace]",              // 30 s / 60 s
    "[data-action]",            // arriscar, capturar, comprar
    "mosaico-opening-finished", // libera a pauta quando a abertura termina
    "scoreBtn.onclick",
    "infoBtn.onclick"
  ];
  for (const marca of fiacao) {
    assert.ok(nucleo.includes(marca), `game-fixed.js perdeu ${marca}`);
  }
});

test("o núcleo expõe a API que os bots do Solo Lab chamam", () => {
  const nucleo = ler("game-fixed.js");
  const chamadas = [...ler("solo-bots.js").matchAll(/core\.solo\.(\w+)\(/g)].map(m => m[1]);
  assert.ok(chamadas.length > 0, "solo-bots.js não chama mais o núcleo");
  for (const nome of new Set(chamadas)) {
    assert.match(nucleo, new RegExp(String.raw`\b${nome}\s*[(:]`), `MosaicoCore.solo perdeu ${nome}`);
  }
  assert.ok(
    nucleo.includes("answers:state.question?"),
    "getSnapshot deixou de devolver answers, e os bots decidem no escuro"
  );
});

test("o carimbo de cache atravessa a cascata inteira", () => {
  const carimbo = (texto, alvo) => {
    const chave = `${alvo}?v=`;
    const i = texto.indexOf(chave);
    assert.ok(i >= 0, `carimbo de ${alvo} não encontrado`);
    return texto.slice(i + chave.length).match(/^[\w-]+/)[0];
  };
  assert.equal(
    carimbo(ler("index.html"), "game.js"),
    carimbo(ler("game.js"), "game-fixed.js"),
    "index.html e game.js pedem versões diferentes: o navegador serve o núcleo velho ao lado do HTML novo"
  );
});

test("o núcleo não confunde o diálogo com a própria função modal", () => {
  assert.ok(
    !ler("game-fixed.js").includes("window.modal."),
    "`function modal()` ocupa window.modal; o <dialog id=modal> só responde por getElementById"
  );
});

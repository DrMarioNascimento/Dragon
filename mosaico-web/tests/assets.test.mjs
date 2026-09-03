/* Todo arquivo que o jogo pede em tempo de execução existe mesmo.
 *
 * Uma imagem que não carrega não derruba nada: a fase abre, os botões
 * funcionam, e só falta a coisa que a fase existe para mostrar. Foi assim que
 * o Encaixe chegou ao ar sem nenhuma foto, duas vezes seguidas e por motivos
 * diferentes — primeiro caminho absoluto à raiz do domínio, depois BASE_URL
 * sem a pasta media/. O segundo é pior: no GitHub Pages
 * /Dragon/v2/foto-agenda.jpg devolve o 404.html, e a resposta parece boa. */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import assert from "node:assert/strict";
import { MEDIA, MIDIA_USADA, midia } from "../src/lib/mosaico/assets.ts";

const WEB = join(dirname(fileURLToPath(import.meta.url)), "..");
const PUBLICO = join(WEB, "public");

test("a base de mídia carrega a pasta, não só a raiz do app", () => {
  /* O bug: `const MEDIA = import.meta.env.BASE_URL` — base certa, pasta
     esquecida. O endereço vira /Dragon/v2/foto-agenda.jpg. */
  assert.ok(MEDIA.endsWith("media/"), `MEDIA = ${MEDIA}`);
  assert.equal(midia("foto-agenda.jpg"), MEDIA + "foto-agenda.jpg");
});

test("toda mídia nomeada pelo jogo está em public/media", () => {
  for (const nome of MIDIA_USADA) {
    assert.ok(
      existsSync(join(PUBLICO, "media", nome)),
      `public/media/${nome} não existe, mas o jogo pede`,
    );
  }
});

/* O teste dos sons saiu junto com os arquivos (02/09/2026). O projeto não
   tem mais áudio: o destravamento do iOS usa um WAV silencioso embutido em
   sound.ts, que não pode faltar do servidor porque não vem do servidor. */

test("nenhum arquivo de mídia órfão em public/", () => {
  /* O outro lado: arquivo que ninguém mais usa continua sendo publicado e
     ninguém sabe se pode apagar. */
  for (const nome of readdirSync(join(PUBLICO, "media"))) {
    assert.ok(
      MIDIA_USADA.includes(nome),
      `public/media/${nome} não é nomeado por ninguém — apague ou registre em MIDIA_USADA`,
    );
  }
});

test("nenhum código do jogo monta caminho de mídia por conta própria", () => {
  /* Um caminho montado à mão em outro arquivo escapa desta suíte inteira.
     Quem precisa de mídia importa de lib/mosaico/assets. */
  const proibido = /["'`]\/(?:media|audio|icons)\/|BASE_URL\s*\}?\s*\+?\s*["'`](?:media|audio)\//;
  const fontes = [];
  (function varre(dir) {
    for (const d of readdirSync(dir, { withFileTypes: true })) {
      const caminho = join(dir, d.name);
      if (d.isDirectory()) varre(caminho);
      else if (/\.(ts|tsx)$/.test(d.name)) fontes.push(caminho);
    }
  })(join(WEB, "src"));

  const culpados = [];
  for (const caminho of fontes) {
    if (caminho.endsWith(join("mosaico", "assets.ts"))) continue;
    const texto = readFileSync(caminho, "utf8");
    /* `${MEDIA}nome.jpg` é o caminho certo. */
    const limpo = texto.replace(/\$\{(?:MEDIA|MODULOS)\}/g, "");
    if (proibido.test(limpo)) culpados.push(caminho.slice(WEB.length + 1));
  }
  assert.deepEqual(culpados, [], "importe MEDIA/MODULOS de lib/mosaico/assets");
});

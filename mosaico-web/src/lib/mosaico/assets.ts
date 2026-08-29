/* Onde ficam os arquivos que o jogo pede em tempo de execução.
 *
 * Esta é a classe de erro que mais custou ao MOSAICO: o Vite reescreve a base
 * dentro do CSS, nunca dentro de string. Um `"/media/foto.jpg"` funciona em
 * localhost e, publicado em /Dragon/v2/, vai para a raiz do domínio e some —
 * e some em silêncio, porque uma imagem que não carrega não derruba nada.
 * A fase inteira do Encaixe chegou ao ar assim.
 *
 * A primeira tentativa de conserto trocou o caminho por `BASE_URL` e perdeu a
 * pasta: virou `/Dragon/v2/foto-agenda.jpg`, que no GitHub Pages devolve o
 * 404.html com status 200 — parece que funcionou. Por isso o caminho passou a
 * ser montado num lugar só, e `tests/assets.test.mjs` confere que todo arquivo
 * nomeado aqui existe mesmo em public/.
 */

/* `import.meta.env` só existe sob o Vite. Nos testes o módulo é lido direto
   pelo node, e ali a base é a raiz — o que importa testar é o resto. */
const BASE: string =
  (import.meta as { env?: { BASE_URL?: string } }).env?.BASE_URL ?? "/";

export const MEDIA = `${BASE}media/`;
export const AUDIO = `${BASE}audio/`;
export const MODULOS = `${BASE}modulos/`;

/** Fotos e tarjas do Encaixe, o vídeo de abertura, os fundos. */
export function midia(nome: string) {
  return MEDIA + nome;
}

/** Os sons da noite. */
export function som(nome: string) {
  return AUDIO + nome;
}

/** Todo arquivo de mídia que o jogo nomeia. A lista existe para o teste
 *  poder conferir que cada um está mesmo em public/ — sem ela, o teste só
 *  saberia checar o que conseguisse adivinhar por regex. */
export const MIDIA_USADA = [
  "abertura.mp4",
  "aguardando.jpg",
  "capa-vertical.jpg",
  "carta-costa.jpg",
  "foto-agenda.jpg",
  "foto-farol.jpg",
  "foto-gaveta.jpg",
  "foto-noite.jpg",
  "fundo-painel.jpg",
  "tarja-agenda.jpg",
  "tarja-farol.jpg",
  "tarja-gaveta.jpg",
  "tarja-noite.jpg",
] as const;

/** Todo som que o jogo nomeia. */
export const SONS_USADOS = [
  "abertura.mp3",
  "encerramento.mp3",
  "tempestade-loop.mp3",
  "tempestade-rajada.mp3",
] as const;

/* Destravar o áudio do iOS — e mais nada.
 *
 * 02/09/2026: os arquivos de som foram apagados do projeto a pedido do Mario.
 * Este módulo tinha `playStorm` e `playOnce`, que NUNCA foram chamados por
 * ninguém: tocavam `tempestade-loop.mp3` e um som avulso que nenhum caminho
 * do jogo pedia. Saíram junto com os arquivos.
 *
 * O que ficou tem motivo. O iOS só permite áudio depois de um gesto, e o
 * botão de som da abertura precisa disso para o VÍDEO tocar com som. Antes o
 * destravamento usava `tempestade-rajada.mp3` mudo; sem arquivo ele falharia
 * em silêncio — `play()` rejeitado, `.catch()` engolindo — e o sintoma
 * apareceria só num iPhone, como vídeo sem som.
 *
 * Agora o destravamento não depende de arquivo nenhum: um WAV silencioso de
 * 44 bytes embutido aqui faz o mesmo trabalho e não pode faltar do servidor.
 */

/* WAV mono, 8 kHz, um quadro de silêncio. É o menor arquivo válido possível,
   e existe só para que o navegador registre um play() bem-sucedido dentro do
   gesto. */
const SILENCIO =
  "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=";

let armed = false;

/** iOS só libera áudio depois de um toque. Chamar do primeiro gesto. */
export function armAudio() {
  if (armed || typeof window === "undefined") return;
  armed = true;
  const a = new Audio(SILENCIO);
  a.setAttribute("playsinline", "true");
  a.muted = true;
  void a
    .play()
    .then(() => {
      a.pause();
      a.src = "";
    })
    .catch(() => {});
}

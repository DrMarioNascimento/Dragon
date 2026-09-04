/* MOSAICO · A CASA DA COSTA — a abertura narrada, para quem ainda não tinha.
   ==========================================================================

   A Mesa da Casa sempre teve abertura. A NOITE e o MODO SOLO não tinham
   nenhuma: zero menções em `noite-auto.js` e em `solo-auto.js`. O jogo
   simplesmente começava, e quem chegava não ouvia a casa falar.

   Decisão do Mario em 03/09/2026: **a abertura é obrigatória em todas as
   experiências.** Pular é escolha de quem assiste, no botão — não do código.

   POR QUE UM ARQUIVO SÓ, E NA RAIZ
   --------------------------------
   É o mesmo caso e a mesma narração. Uma cópia por experiência viraria a
   terceira linhagem do MOSAICO a divergir sozinha, que é a doença que já
   custou caro nos módulos sensoriais.

   Ele mora na RAIZ de propósito. A Noite é build: tudo que entra em `v2/` é
   apagado e recopiado a cada publicação, e só `mosaico-web/public/` sobrevive.
   Daqui, `/Dragon/abertura-casa.js` é servido direto e os dois hospedeiros —
   `/Dragon/v2/` e `/Dragon/solo/` — o alcançam por `../abertura-casa.js`.

   Os caminhos de mídia saem do endereço DESTE arquivo, não do documento:
   os dois hospedeiros estão em pastas diferentes, e caminho relativo ao
   documento acertaria num e erraria no outro.

   O QUE ELE PROMETE A QUEM CHAMA
   ------------------------------
   `MosaicoAberturaCasa.mostrar(aoTerminar)` chama `aoTerminar` UMA vez, sempre
   — narração terminada, pulada, áudio bloqueado ou arquivo fora do ar. Clima
   nunca pode ser o que segura o jogo. É a mesma regra que a Mesa aprendeu
   quando o `onended` era o único caminho e travava a mesa inteira. */
(function () {
  const AQUI = new URL('.', document.currentScript.src);
  const url = (p) => new URL(p, AQUI).href;
  const AUDIO = url('v1/audio/A-Casa-da-Costa-Abertura.mp3');
  /* A arte que o Mario subiu em 02/09 e que estava sem uso. Horizontal para
     tela larga — telão, notebook, celular deitado —, vertical para o retrato. */
  const IMG_LARGA = url('v1/img/Orizontal.jpg');
  const IMG_ALTA = url('v1/img/Vertical.jpg');
  const larga = () => {
    try { return matchMedia('(min-aspect-ratio: 1/1)').matches; } catch (e) { return false; }
  };

  let mostrado = false, terminado = false, fim = null;

  const css = document.createElement('style');
  css.textContent = `
#abCasa{position:fixed;inset:0;z-index:100030;background:#04070b;color:#eef5f2;
  font-family:Inter,system-ui,sans-serif;display:none}
#abCasa.on{display:block}
#abCasa .palco{position:absolute;inset:0;display:grid;place-items:center;overflow:hidden}
#abCasa .palco img{width:100%;height:100%;object-fit:cover}
#abCasa .veu{position:absolute;inset:0;background:linear-gradient(180deg,transparent 55%,#020609e6)}
/* O cartão de preparo cobria a arte quase por inteiro (#02060ae8) e o papel de
   parede virava um vulto. Ele é o que se vê primeiro; o véu agora só escurece
   o bastante para o texto ficar legível por cima. */
#abCasa .prep{position:absolute;inset:0;display:grid;place-items:center;padding:20px;
  background:radial-gradient(120% 80% at 50% 60%,#02060a55,#02060ad8);text-align:center}
#abCasa .cartao{width:min(520px,calc(100% - 28px));padding:20px;border:1px solid #3d5360;
  border-radius:14px;background:linear-gradient(160deg,#13212b,#071016);
  box-shadow:0 8px 0 #020507,0 28px 70px #000b}
#abCasa h2{font:600 27px Georgia,serif;margin:0 0 8px;color:#efc878}
#abCasa p{color:#aab9c1;line-height:1.45;margin:.4rem 0}
#abCasa .btn{width:100%;min-height:54px;margin-top:12px;padding:12px 14px;border:0;
  border-radius:10px;font-weight:800;cursor:pointer;
  background:linear-gradient(#ffc266,#dd8b2e);color:#1b1005;
  box-shadow:inset 0 1px #ffe2b4,0 5px 0 #6a3712}
#abCasa .btn.fantasma{background:transparent;color:#9db1b6;box-shadow:none;
  border:1px solid #35505c;font-weight:600}
#abCasa .controles{position:absolute;left:50%;bottom:max(18px,env(safe-area-inset-bottom));
  transform:translateX(-50%);display:flex;gap:9px;padding:9px 11px;border:1px solid #38566b;
  border-radius:20px;background:linear-gradient(180deg,#10212cef,#07131bef);
  box-shadow:0 14px 30px #0009}
/* O display:flex da regra acima vence o display:none que o atributo hidden
   traz por padrão, e os controles apareciam durante o cartão de preparo —
   Pausar e Reiniciar de uma narração que ainda não tinha começado. */
#abCasa .controles[hidden]{display:none}
#abCasa .controles button{min-width:50px;height:50px;padding:0 13px;border:1px solid #54758a;
  border-radius:15px;background:linear-gradient(145deg,#17364a,#0c2230);color:#efc878;
  font-size:19px;font-weight:900;cursor:pointer}
#abCasa .controles button:active{transform:translateY(1px)}`;
  document.head.appendChild(css);

  const raiz = document.createElement('div');
  raiz.id = 'abCasa';
  raiz.innerHTML =
    `<div class="palco"><img alt="A Casa da Costa" id="abImg"><div class="veu"></div></div>` +
    `<div class="controles" id="abControles" hidden>
       <button id="abPlay" title="Pausar" aria-label="Pausar">Ⅱ</button>
       <button id="abRestart" title="Reiniciar" aria-label="Reiniciar">↻</button>
       <button id="abSkip" title="Pular a abertura" aria-label="Pular a abertura">Pular</button>
     </div>` +
    `<div class="prep" id="abPrep"><div class="cartao">
       <h2>A casa vai falar</h2>
       <p>Ative o som antes de começar. São pouco mais de um minuto, e é aqui que o caso é entregue.</p>
       <button class="btn" id="abIniciar">🔊 Ativar som e começar</button>
       <button class="btn fantasma" id="abPular">Pular a abertura</button>
     </div></div>`;

  const audio = new Audio();
  audio.preload = 'auto';
  audio.playsInline = true;

  function terminar() {
    if (terminado) return;
    terminado = true;
    try { audio.pause(); } catch (e) {}
    raiz.classList.remove('on');
    raiz.remove();
    window.dispatchEvent(new CustomEvent('mosaico-abertura-casa-fim'));
    if (typeof fim === 'function') fim();
  }

  async function comecar() {
    document.getElementById('abPrep').hidden = true;
    document.getElementById('abControles').hidden = false;
    audio.src = AUDIO;
    audio.currentTime = 0;
    try {
      await audio.play();
    } catch (e) {
      /* Bloqueado mesmo depois do toque, ou arquivo fora do ar. A imagem fica
         em pé e quem assiste decide quando seguir — o que não pode é o jogo
         começar por conta própria nem ficar preso esperando um som que não vem. */
      console.error('MOSAICO: a narração da abertura não pôde tocar.', e);
      document.getElementById('abPlay').hidden = true;
      document.getElementById('abRestart').hidden = true;
    }
  }

  function mostrar(aoTerminar) {
    fim = aoTerminar;
    if (mostrado || terminado) { terminar(); return; }
    mostrado = true;
    document.body.appendChild(raiz);
    document.getElementById('abImg').src = larga() ? IMG_LARGA : IMG_ALTA;
    raiz.classList.add('on');

    document.getElementById('abIniciar').onclick = comecar;
    document.getElementById('abPular').onclick = terminar;
    document.getElementById('abSkip').onclick = terminar;
    const play = document.getElementById('abPlay');
    play.onclick = async () => {
      if (audio.paused) {
        try { await audio.play(); play.textContent = 'Ⅱ'; } catch (e) {}
      } else { audio.pause(); play.textContent = '▶'; }
    };
    document.getElementById('abRestart').onclick = async () => {
      audio.currentTime = 0;
      try { await audio.play(); play.textContent = 'Ⅱ'; } catch (e) {}
    };
    /* 900 ms de respiro depois da última palavra: cortar no zero soa como
       queda de linha, não como fim. */
    audio.onended = () => setTimeout(terminar, 900);
    /* Deitar ou levantar o aparelho no meio troca o enquadramento; a narração
       não recomeça. */
    try {
      matchMedia('(min-aspect-ratio: 1/1)').addEventListener('change', () => {
        const img = document.getElementById('abImg');
        if (img) img.src = larga() ? IMG_LARGA : IMG_ALTA;
      });
    } catch (e) {}
  }

  window.MosaicoAberturaCasa = { mostrar, terminar, get vista() { return terminado; } };
})();

/* MOSAICO · A CASA DA COSTA — a abertura narrada, para quem ainda não tinha.
   ==========================================================================

   15/09/2026: o palco pode ser a paisagem 3D (`casa-da-costa-noturna.glb`).
   A foto permanece por baixo e volta se o WebGL ou o modelo falharem.
   Com a paisagem no ar, a narração não fecha sozinha: o jogador toca a
   porta (ou o botão) para entrar. Pular continua valendo. */
(function () {
  const AQUI = new URL('.', document.currentScript.src);
  const url = (p) => new URL(p, AQUI).href;
  const AUDIO = url('v1/audio/A-Casa-da-Costa-Abertura.mp3');
  const IMG_LARGA = url('v1/img/Orizontal.jpg');
  const IMG_ALTA = url('v1/img/Vertical.jpg');
  const PAISAGEM_JS = url('v1/js/ac-paisagem.js?v=20260915-abertura3d');
  const PAISAGEM_GLB = url('v1/assets/ac/casa-da-costa-noturna.glb');
  const larga = () => {
    try { return matchMedia('(min-aspect-ratio: 1/1)').matches; } catch (e) { return false; }
  };

  let mostrado = false, terminado = false, fim = null, paisagemViva = false;

  const css = document.createElement('style');
  css.textContent = `
#abCasa{position:fixed;inset:0;z-index:100030;background:#04070b;color:#eef5f2;
  font-family:Inter,system-ui,sans-serif;display:none}
#abCasa.on{display:block}
#abCasa .palco{position:absolute;inset:0;display:grid;place-items:center;overflow:hidden}
#abCasa .palco img{width:100%;height:100%;object-fit:cover;transition:opacity .7s ease}
#abCasa .palco.tem-3d img{opacity:0;pointer-events:none}
#abPaisagem{position:absolute;inset:0;z-index:0}
#abPaisagem canvas{width:100%;height:100%;display:block;touch-action:none}
#abCasa .veu{position:absolute;inset:0;background:linear-gradient(180deg,transparent 55%,#020609e6);pointer-events:none;z-index:1}
#abCasa .prep{position:absolute;inset:0;display:grid;place-items:center;padding:20px;
  background:radial-gradient(120% 80% at 50% 60%,#02060a55,#02060ad8);text-align:center;z-index:3}
#abCasa .cartao{width:min(520px,calc(100% - 28px));padding:16px;border:1px solid rgba(159,228,255,.52);
  border-radius:14px;background:linear-gradient(165deg,#1a3348,#153044 60%,#102838);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.10),0 18px 50px rgba(0,0,0,.55),0 0 40px rgba(127,212,255,.10)}
#abCasa .cartao-inset{padding:8px 6px 4px;border-radius:10px;background:#03080d;
  border:1px solid rgba(20,36,48,.95);border-left:4px solid #6aa8ca;
  box-shadow:inset 0 3px 10px rgba(0,0,0,.72)}
#abCasa h2{font:600 27px Georgia,serif;margin:0 0 8px;color:#efc878}
#abCasa p{color:#dfeaf5;line-height:1.45;margin:.4rem 0}
#abCasa .btn{width:100%;min-height:54px;margin-top:12px;padding:12px 14px;border:0;
  border-radius:10px;font-weight:800;cursor:pointer;
  background:linear-gradient(180deg,#ffc878,#d6aa58);color:#1b1005;
  box-shadow:inset 0 1px #ffe2b4,0 5px 0 #6a3712,0 12px 22px #000a}
#abCasa .btn.fantasma{background:linear-gradient(180deg,#162a38,#0c1b26);color:#f4f9fd;
  border:1px solid #46667a;font-weight:800;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.08),0 4px 0 #020609}
#abCasa .controles{position:absolute;left:50%;bottom:max(18px,env(safe-area-inset-bottom));
  transform:translateX(-50%);display:flex;gap:9px;padding:9px 11px;border:1px solid #38566b;
  border-radius:20px;background:linear-gradient(180deg,#10212cef,#07131bef);
  box-shadow:0 14px 30px #0009;z-index:4}
#abCasa .controles[hidden]{display:none}
#abCasa .controles button{min-width:50px;height:50px;padding:0 13px;border:1px solid #54758a;
  border-radius:15px;background:linear-gradient(145deg,#17364a,#0c2230);color:#efc878;
  font-size:19px;font-weight:900;cursor:pointer}
#abCasa .controles button:active{transform:translateY(1px)}
#abEntrarPorta{position:absolute;left:50%;bottom:max(86px,calc(env(safe-area-inset-bottom) + 72px));
  transform:translateX(-50%);z-index:4;min-height:48px;padding:12px 18px;border:1px solid #c9a66c;
  border-radius:24px;background:linear-gradient(180deg,#3a2c10,#241a08);color:#ffe1ac;
  font:700 14px/1.2 system-ui,sans-serif;cursor:pointer;box-shadow:0 10px 28px #000a}`;
  document.head.appendChild(css);

  const raiz = document.createElement('div');
  raiz.id = 'abCasa';
  raiz.innerHTML =
    `<div class="palco" id="abPalco"><img alt="A Casa da Costa" id="abImg"><div class="veu"></div></div>` +
    `<div class="controles" id="abControles" hidden>
       <button id="abPlay" title="Pausar" aria-label="Pausar">Ⅱ</button>
       <button id="abRestart" title="Reiniciar" aria-label="Reiniciar">↻</button>
       <button id="abSkip" title="Pular a abertura" aria-label="Pular a abertura">Pular</button>
     </div>` +
    `<div class="prep" id="abPrep"><div class="cartao pf-card">
       <div class="cartao-inset pf-inset">
       <h2>A casa vai falar</h2>
       <p>Ative o som antes de começar. São pouco mais de um minuto, e é aqui que o caso é entregue.</p>
       <button class="btn pf-btn-gold" id="abIniciar">🔊 Ativar som e começar</button>
       <button class="btn fantasma pf-btn-ghost" id="abPular">Pular a abertura</button>
       </div>
     </div></div>`;

  const audio = new Audio();
  audio.preload = 'auto';
  audio.playsInline = true;

  function loadPaisagem() {
    return new Promise((resolve) => {
      if (window.MosaicoPaisagem) { resolve(true); return; }
      const s = document.createElement('script');
      s.src = PAISAGEM_JS;
      s.onload = () => resolve(true);
      s.onerror = () => resolve(false);
      document.head.appendChild(s);
    });
  }

  function terminar() {
    if (terminado) return;
    terminado = true;
    try { audio.pause(); } catch (e) {}
    try { if (window.MosaicoPaisagem) window.MosaicoPaisagem.desmontar(); } catch (e) {}
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
      console.error('MOSAICO: a narração da abertura não pôde tocar.', e);
      document.getElementById('abPlay').hidden = true;
      document.getElementById('abRestart').hidden = true;
    }
    const palco = document.getElementById('abPalco');
    const ok = await loadPaisagem();
    if (!ok || !window.MosaicoPaisagem || !palco) return;
    window.MosaicoPaisagem.montar(palco, {
      glb: PAISAGEM_GLB,
      onPorta: terminar,
      onPronto: () => {
        paisagemViva = true;
        palco.classList.add('tem-3d');
      },
      onFalha: () => { paisagemViva = false; }
    });
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
    audio.onended = () => {
      if (paisagemViva) return;
      setTimeout(terminar, 900);
    };
    try {
      matchMedia('(min-aspect-ratio: 1/1)').addEventListener('change', () => {
        const img = document.getElementById('abImg');
        if (img && !paisagemViva) img.src = larga() ? IMG_LARGA : IMG_ALTA;
      });
    } catch (e) {}
  }

  window.MosaicoAberturaCasa = { mostrar, terminar, get vista() { return terminado; } };
})();

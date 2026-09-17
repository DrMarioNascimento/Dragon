/* A Mesa publicada não leva atalho de laboratório.
   O HTML ainda cria #m3d-atalho-teste; isto apaga na hora. */
(function () {
  const css = document.createElement('style');
  css.textContent =
    '#m3d-atalho-teste,.m3d-badge-launch,' +
    'button[onclick*="iniciarTeste3D"]{display:none!important}';
  document.head.appendChild(css);

  function limpar() {
    const btn = document.getElementById('m3d-atalho-teste');
    if (btn) btn.remove();
    document.querySelectorAll('button[onclick*="iniciarTeste3D"]').forEach(function (el) {
      el.remove();
    });
    if (typeof window.atualizarBotaoFlutuanteTeste === 'function' &&
        !window.atualizarBotaoFlutuanteTeste._apagado) {
      window.atualizarBotaoFlutuanteTeste = function () {
        const x = document.getElementById('m3d-atalho-teste');
        if (x) x.remove();
      };
      window.atualizarBotaoFlutuanteTeste._apagado = true;
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', limpar);
  } else {
    limpar();
  }
  window.addEventListener('load', limpar);
  setInterval(limpar, 300);
})();

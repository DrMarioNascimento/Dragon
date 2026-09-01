/* MOSAICO · expõe de forma mínima o código já exibido pelo módulo da sala. */
(function () {
  function publish() {
    const el = document.querySelector('.dr-sala-code');
    const code = String(el?.textContent || '')
      .trim()
      .toUpperCase();
    if (!/^[A-Z2-9]{6}$/.test(code)) return false;
    window.MOSAICO_ROOM = {
      ...(window.MOSAICO_ROOM || {}),
      code,
      role: window.MOSAICO_ROOM?.role || 'master',
    };
    try {
      sessionStorage.setItem('mosaico_noite_room_code', code);
    } catch {}
    window.dispatchEvent(new CustomEvent('mosaico-room-code-ready', { detail: { code } }));
    return true;
  }
  document.addEventListener(
    'click',
    (e) => {
      if (e.target.closest?.('#dragonSalaBtn')) setTimeout(publish, 30);
      if (e.target.closest?.('#dragonSalaPanel .dr-close')) publish();
    },
    true,
  );
  new MutationObserver(() => publish()).observe(document.documentElement, {
    subtree: true,
    childList: true,
  });
  const saved = (() => {
    try {
      return sessionStorage.getItem('mosaico_noite_room_code') || '';
    } catch {
      return '';
    }
  })();
  if (/^[A-Z2-9]{6}$/.test(saved))
    window.MOSAICO_ROOM = { ...(window.MOSAICO_ROOM || {}), code: saved };
  window.MosaicoRoomCodeBridge = { publish };
})();

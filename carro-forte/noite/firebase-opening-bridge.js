/* MOSAICO · ponte Firebase para a abertura audiovisual.

   ATENÇÃO: este arquivo NÃO é carregado por ninguém hoje. Não é sobra — é
   metade construída. Ele publica o estado da abertura em `noite/{sala}.opening`
   para que os outros aparelhos e o telão acompanhem o que toca no telefone do
   Mestre, e `telao.html` já lê exatamente esses campos (`opening.on`,
   `opening.displaySeenMs`) — hoje espera por um dado que ninguém publica.

   Enquanto não for ligado, o convidado não vê nada durante a abertura, e o
   caminho para abrir o telão também não existe: o `formTelao` que o criava
   estava no pedaço truncado do firebase-room.js e não voltou. Antes de
   apagar isto, leia a auditoria — apagar custa mais do que ligar. */
(async function () {
  let api = null,
    initPromise = null;
  const CONFIG = {
    apiKey: 'AIzaSyA160bkgHBrYBwvIxlENax-aAyLWPMaOU4',
    authDomain: 'mosaico-noite.firebaseapp.com',
    projectId: 'mosaico-noite',
    storageBucket: 'mosaico-noite.firebasestorage.app',
    messagingSenderId: '703343424116',
    appId: '1:703343424116:web:e6990b5c00d43aca6e9721',
  };
  async function init() {
    if (api) return api;
    if (initPromise) return initPromise;
    initPromise = (async () => {
      const appmod = await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js');
      const authmod = await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js');
      const fs = await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js');
      const name = 'dragon-opening-bridge';
      const app =
        appmod.getApps().find((a) => a.name === name) || appmod.initializeApp(CONFIG, name);
      const auth = authmod.getAuth(app);
      if (!auth.currentUser) await authmod.signInAnonymously(auth);
      const code =
        String(
          window.MOSAICO_ROOM?.code ||
            new URLSearchParams(location.search).get('sala') ||
            document.querySelector('.dr-sala-code')?.textContent ||
            '',
        )
          .trim()
          .toUpperCase()
          .match(/[A-Z2-9]{6}/)?.[0] || '';
      if (!code)
        throw new Error('Código da sala não ficou disponível. Reabra Sala e tente novamente.');
      const db = fs.getFirestore(app),
        ref = fs.doc(db, 'noite', code);
      const snap = await fs.getDoc(ref);
      if (!snap.exists() || snap.data()?.ativa !== true)
        throw new Error('Sala não encontrada ou encerrada.');
      api = {
        code,
        async setOpening(data) {
          const patch = { 'opening.updatedAtMs': Date.now() };
          for (const [k, v] of Object.entries(data)) patch['opening.' + k] = v;
          await fs.updateDoc(ref, patch);
        },
        watchOpening(cb) {
          return fs.onSnapshot(ref, (s) => cb(s.exists() ? s.data().opening || {} : {}));
        },
      };
      return api;
    })();
    try {
      return await initPromise;
    } catch (e) {
      initPromise = null;
      throw e;
    }
  }
  window.MosaicoOpeningBridge = { init };
})();

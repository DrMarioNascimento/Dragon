/* MOSAICO · Ensaio Carro-Forte · sala Firebase real para teste end-to-end */
(async function () {
  if (new URLSearchParams(location.search).get('soloLab') !== '1') return;
  const appmod = await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js');
  const authmod = await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js');
  const fs = await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js');
  const cfg = {
    apiKey: 'AIzaSyA160bkgHBrYBwvIxlENax-aAyLWPMaOU4',
    authDomain: 'mosaico-noite.firebaseapp.com',
    projectId: 'mosaico-noite',
    storageBucket: 'mosaico-noite.firebasestorage.app',
    messagingSenderId: '703343424116',
    appId: '1:703343424116:web:e6990b5c00d43aca6e9721',
  };
  const app =
      appmod.getApps().find((a) => a.name === 'dragon-solo-lab') ||
      appmod.initializeApp(cfg, 'dragon-solo-lab'),
    auth = authmod.getAuth(app),
    db = fs.getFirestore(app);
  if (!auth.currentUser) await authmod.signInAnonymously(auth);
  const ALPH = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += ALPH[Math.floor(Math.random() * ALPH.length)];
  const ref = fs.doc(db, 'noite', code);
  await fs.setDoc(ref, {
    ativa: true,
    fase: 'sala',
    mestreUid: auth.currentUser.uid,
    criadaEmMs: Date.now(),
    ritmo: 'automatico',
    caseId: 'carro-forte',
    ensaio: true,
  });
  window.MOSAICO_ROOM = {
    ...(window.MOSAICO_ROOM || {}),
    local: true,
    soloLab: true,
    role: 'master',
    code,
  };
  window.MOSAICO_SOLO_LOBBY = { code, ref, db, fs };
  window.dispatchEvent(new CustomEvent('mosaico-solo-lobby-ready', { detail: { code } }));
})();

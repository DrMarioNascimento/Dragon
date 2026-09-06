/* MOSAICO · ponte Celular (Manhã) → Noite (Captura).
   ==========================================================================
   Continuidade de sessão: mesmo código de sala + pergunta congelada.
   Coleções no mesmo projeto mosaico-noite:
     Manhã  → mosaico/{sala}
     Noite  → noite/{sala}
   A ponte semeia noite/{sala} com partida.pergunta e navega com
   ?from=celular&sala=&pergunta=. Solo/offline só leva a pergunta na URL.
   Não transfere mãos, moedas nem economia experimental. */
(function () {
  const PERGUNTAS = ['peso', 'janela', 'roubo', 'antes', 'quem', 'proteger'];
  const CFG = {
    apiKey: 'AIzaSyA160bkgHBrYBwvIxlENax-aAyLWPMaOU4',
    authDomain: 'mosaico-noite.firebaseapp.com',
    projectId: 'mosaico-noite',
    storageBucket: 'mosaico-noite.firebasestorage.app',
    messagingSenderId: '703343424116',
    appId: '1:703343424116:web:e6990b5c00d43aca6e9721',
  };

  const normalizeSala = (raw) => {
    const s = String(raw ?? '')
      .trim()
      .toUpperCase();
    return /^[A-Z2-9]{6}$/.test(s) ? s : '';
  };
  const normalizePergunta = (raw) => {
    const id = String(raw ?? '')
      .trim()
      .toLowerCase();
    return PERGUNTAS.includes(id) ? id : '';
  };

  function parseHandoffSearch(search) {
    const p = new URLSearchParams(String(search || location.search || '').replace(/^\?/, ''));
    return {
      fromCelular: p.get('from') === 'celular',
      sala: normalizeSala(p.get('sala')),
      pergunta: normalizePergunta(p.get('pergunta')),
    };
  }

  function buildNoiteHandoffUrl(opts = {}) {
    const base = String(opts.base || 'noite/').replace(/\?.*$/, '');
    const withSlash = base.endsWith('/') ? base : `${base}/`;
    const q = new URLSearchParams();
    if (opts.fromCelular !== false) q.set('from', 'celular');
    const sala = normalizeSala(opts.sala);
    const pergunta = normalizePergunta(opts.pergunta);
    if (sala) q.set('sala', sala);
    if (pergunta) q.set('pergunta', pergunta);
    const qs = q.toString();
    return qs ? `${withSlash}?${qs}` : withSlash;
  }

  let api = null;
  async function firebase() {
    if (api) return api;
    const [appmod, authmod, fs] = await Promise.all([
      import('https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js'),
      import('https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js'),
    ]);
    const app =
      appmod.getApps().find((a) => a.name === 'dragon-noite') ||
      appmod.getApps().find((a) => a.options && a.options.projectId === 'mosaico-noite') ||
      appmod.initializeApp(CFG, 'dragon-ponte-noite');
    const auth = authmod.getAuth(app);
    if (!auth.currentUser) await authmod.signInAnonymously(auth);
    api = { fs, db: fs.getFirestore(app), auth };
    return api;
  }

  /* Semeia noite/{sala} com a pergunta congelada da Manhã. Idempotente:
     se a pergunta já está lá, não re-sorteia. fase=jogo evita lobby extra
     quando a sala já veio da Manhã. */
  async function seedNoiteRoom({ sala, pergunta, jogadores } = {}) {
    const code = normalizeSala(sala);
    const id = normalizePergunta(pergunta);
    if (!code || !id) return { ok: false, reason: 'params' };
    const { fs, db, auth } = await firebase();
    const u = auth.currentUser;
    if (!u || u.isAnonymous)
      return { ok: false, reason: 'mestre', message: 'Só o Mestre autenticado abre a ponte na sala.' };
    const ref = fs.doc(db, 'noite', code);
    const snap = await fs.getDoc(ref);
    const data = snap.exists() ? snap.data() : null;
    const perguntaFinal = normalizePergunta(data?.partida?.pergunta) || id;
    const n = Math.max(0, Math.min(8, Number(jogadores) || Number(data?.partida?.jogadores) || 0));
    if (!snap.exists()) {
      await fs.setDoc(ref, {
        ativa: true,
        fase: 'jogo',
        mestreUid: u.uid,
        criadaEmMs: Date.now(),
        modo: 'sem-telao',
        ritmo: 'automatico',
        caseId: 'carro-forte',
        partida: {
          pergunta: perguntaFinal,
          origem: 'celular',
          continuidade: { from: 'celular', emMs: Date.now() },
          atualizadaEmMs: Date.now(),
          ...(n >= 2 ? { jogadores: n } : {}),
        },
      });
    } else {
      const patch = {
        ativa: true,
        caseId: 'carro-forte',
        'partida.pergunta': perguntaFinal,
        'partida.origem': 'celular',
        'partida.continuidade': { from: 'celular', emMs: Date.now() },
        'partida.atualizadaEmMs': Date.now(),
      };
      if (n >= 2) patch['partida.jogadores'] = n;
      if (data?.fase !== 'jogo') patch.fase = 'jogo';
      await fs.updateDoc(ref, patch);
    }
    try {
      await fs.updateDoc(fs.doc(db, 'mosaico', code), {
        'partida.ponteNoite': { pergunta: perguntaFinal, emMs: Date.now() },
      });
    } catch (e) {
      console.warn('MOSAICO: ponte marcada na Noite; marcador na Manhã falhou.', e);
    }
    return { ok: true, sala: code, pergunta: perguntaFinal };
  }

  async function goToNoite({ sala, pergunta, jogadores, base } = {}) {
    const code = normalizeSala(sala || window.MOSAICO_ROOM?.code || '');
    const id = normalizePergunta(pergunta);
    const url = buildNoiteHandoffUrl({
      base: base || 'noite/',
      sala: code,
      pergunta: id,
      fromCelular: true,
    });
    if (code && id && window.MOSAICO_ROOM?.role === 'master') {
      try {
        const r = await seedNoiteRoom({ sala: code, pergunta: id, jogadores });
        if (!r.ok && r.reason === 'mestre') {
          console.warn('MOSAICO: ponte sem seed de Mestre; abrindo Noite assim mesmo.', r);
        }
      } catch (e) {
        console.error('MOSAICO: falha ao semear a sala da Noite; abrindo o link mesmo assim.', e);
      }
    }
    location.href = url;
  }

  window.MosaicoCelularParaNoite = {
    PERGUNTAS,
    normalizeSala,
    normalizePergunta,
    parseHandoffSearch,
    buildNoiteHandoffUrl,
    seedNoiteRoom,
    goToNoite,
  };
})();

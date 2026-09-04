/* MOSAICO · A Noite do Carro-Forte — o que a mesa publica para o telão.
   ==========================================================================

   O `telao.html` é uma página que só LÊ. Ela existe desde agosto esperando um
   `publicState` que ninguém escrevia — este arquivo é quem passou a escrever.

   O QUE ELE PUBLICA, E POR QUE SÓ ISSO
   ------------------------------------
   Aqui a partida é local em cada aparelho. `sala-partida.js` sincroniza três
   coisas e nada mais: a pergunta sorteada, quantos investigadores havia na
   sala e o ritmo. A mão, a vez, o cronômetro, os campos fechados e as capturas
   são de cada telefone — os "oponentes" do `game-fixed.js` são rótulos vazios,
   `Arquivo 02`, `Arquivo 03`.

   Então o telão publica O QUE É DA MESA e não publica o que é de um aparelho
   só. Mostrar a vez ou o cronômetro de quem abriu a sala como se fossem da
   mesa seria pior do que não mostrar nada: seria mentira grande na tela
   grande, e ninguém conseguiria perceber olhando.

   Quando a partida subir para a sala — o mesmo trabalho que a Casa fez em
   55e3d01 — vez, campos e capturas viram fato coletivo e entram aqui. O
   `telao.html` já sabe desenhar os quatro; é só passar a existir o dado.

   QUEM ESCREVE
   ------------
   Só o Mestre. Vários aparelhos gravando o mesmo documento a cada quadro é
   corrida de escrita sem ninguém para arbitrar; e o Mestre é o único que já
   grava na sala hoje (`sala-partida.js`). */
(function () {
  const CFG = {
    apiKey: 'AIzaSyA160bkgHBrYBwvIxlENax-aAyLWPMaOU4',
    authDomain: 'mosaico-noite.firebaseapp.com',
    projectId: 'mosaico-noite',
    storageBucket: 'mosaico-noite.firebasestorage.app',
    messagingSenderId: '703343424116',
    appId: '1:703343424116:web:e6990b5c00d43aca6e9721',
  };

  function codigoDaSala() {
    return (
      window.MOSAICO_ROOM?.code ||
      new URLSearchParams(location.search).get('sala') ||
      ''
    ).toUpperCase();
  }
  /* `MosaicoSalaPartida.mestre` é a mesma leitura que sala-partida.js usa.
     Sem sala, sem Mestre e sem telão — no ensaio local nada disto roda. */
  function souMestre() {
    return !!window.MosaicoSalaPartida?.mestre;
  }

  let api = null;
  async function firebase() {
    if (api) return api;
    const [appmod, authmod, fs] = await Promise.all([
      import('https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js'),
      import('https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js'),
    ]);
    const nome = 'dragon-telao-publica';
    const app =
      appmod.getApps().find((a) => a.name === nome) || appmod.initializeApp(CFG, nome);
    const auth = authmod.getAuth(app);
    if (!auth.currentUser) await authmod.signInAnonymously(auth);
    api = { db: fs.getFirestore(app), doc: fs.doc, updateDoc: fs.updateDoc };
    return api;
  }

  /* Uma gravação falhada não pode derrubar o jogo de quem está com o telefone
     na mão: o telão é acessório, a partida não. Erra alto no console e segue. */
  async function publicar(patch) {
    const code = codigoDaSala();
    if (!code || !souMestre()) return;
    try {
      const { db, doc, updateDoc } = await firebase();
      await updateDoc(doc(db, 'noite', code), patch);
    } catch (e) {
      console.error('MOSAICO: não consegui publicar para o telão.', e);
    }
  }

  /* A pergunta da noite é o único fato coletivo que já existe antes do fim.
     Ela vem da sala, não deste aparelho — quem sorteia é o Mestre e quem
     recebe são todos, inclusive ele ao reconectar. */
  function publicarPergunta() {
    const id = window.MosaicoSalaPartida?.atual;
    if (!id) return false;
    /* QUESTIONS é `const` no topo de um script clássico: existe como variável
       global mas NÃO como propriedade de window. Ler por window devolvia
       undefined e o telão ficava eternamente sem pergunta. */
    const banco = typeof QUESTIONS !== 'undefined' ? QUESTIONS : {};
    const q = banco[id];
    if (!q) return false;
    publicar({
      'publicState.questionTitle': [q.title, q.nature].filter(Boolean).join(' · '),
      'publicState.questionText': q.question || '',
      'publicState.perguntaId': id,
      'publicState.atualizadoEmMs': Date.now(),
    });
    return true;
  }

  /* A pergunta pode chegar depois deste arquivo carregar: o Mestre ainda vai
     sortear, ou a sala ainda vai responder. Tenta até aparecer, e desiste
     depois de dois minutos para não ficar batendo a noite inteira. */
  let tentativas = 0;
  const relogio = setInterval(() => {
    if (publicarPergunta() || ++tentativas > 240) clearInterval(relogio);
  }, 500);
  publicarPergunta();

  window.MosaicoTelao = { publicar, publicarPergunta };
})();

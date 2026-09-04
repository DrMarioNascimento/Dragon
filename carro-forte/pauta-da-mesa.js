/* MOSAICO · A Mesa do Carro-Forte — de quem é a pergunta da partida.
   ==========================================================================

   O DEFEITO
   ---------
   `proximaPartida()` sorteia de um saco guardado em `localStorage`, que é por
   APARELHO. E `firebase-room.js` chama `liberar()` igual para o Mestre e para
   o convidado — quem entra pelo QR não recebe uma tela de jogador, recebe uma
   cópia inteira e independente do jogo.

   Somando as duas coisas: dois celulares na mesma sala abrem PERGUNTAS
   DIFERENTES, cada um achando que joga com o outro. O README já previa, em
   letras: "se um dia a Mesa for jogada em vários aparelhos na mesma sala, o
   sorteio precisa subir para o documento da sala — senão cada aparelho abre
   uma pergunta diferente". Esse dia chegou quando a sala passou a convidar
   por QR.

   O CONSERTO
   ----------
   Quem sorteia é o Mestre, uma vez, e grava na sala. Todos os outros — e ele
   mesmo, ao recarregar — recebem o que está lá. É a mesma forma que A Noite
   usa em `sala-partida.js`, e o mesmo princípio do relé de ações: só o dono da
   sala escreve nela, porque é só o que as regras do Firestore permitem.

   O RODÍZIO NÃO SOBE JUNTO, e é de propósito. O saco de seis perguntas é a
   memória da MESA — o que ela já jogou e o que falta — e o Mestre é a mesa.
   Subir também isso obrigaria a resolver o que acontece quando duas mesas
   diferentes compartilham um mesmo dono, que é problema que ninguém tem.

   Sem sala — ensaio, aparelho solto, solo-lab — devolve o sorteio local
   intacto, exatamente como sempre foi. */
(function () {
  const CFG = {
    apiKey: 'AIzaSyDwshZbqaMOKxdRuyLtdpbijPRdrjVOcxE',
    authDomain: 'mosaico-game.firebaseapp.com',
    projectId: 'mosaico-game',
    storageBucket: 'mosaico-game.firebasestorage.app',
    messagingSenderId: '436141261767',
    appId: '1:436141261767:web:6a83555a2f7c4ed4550fe2',
  };
  const COLECAO = 'mosaico';

  const codigo = () =>
    (window.MOSAICO_ROOM?.code || new URLSearchParams(location.search).get('sala') || '').toUpperCase();
  const souMestre = () => window.MOSAICO_ROOM?.role === 'master';

  let api = null;
  /* Reaproveita o app que firebase-room.js já criou e autenticou. App próprio
     seria outro uid anônimo, e as regras só deixam o Mestre gravar no
     documento da sala — foi exatamente assim que a publicação do telão d'A
     Noite nasceu quebrada, gravando negado em silêncio. */
  async function firebase() {
    if (api) return api;
    const [appmod, authmod, fs] = await Promise.all([
      import('https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js'),
      import('https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js'),
    ]);
    const app =
      appmod.getApps().find((a) => a.name === 'dragon-mesa') ||
      appmod.initializeApp(CFG, 'dragon-pauta');
    const auth = authmod.getAuth(app);
    if (!auth.currentUser) await authmod.signInAnonymously(auth);
    api = { fs, db: fs.getFirestore(app) };
    return api;
  }

  /* `sortear` é o rodízio local de quem chamou — este arquivo não conhece as
     perguntas nem a ordem delas, só decide de quem é a escolha. */
  async function escolher(sortear, novaRodada) {
    const code = codigo();
    if (!code) return sortear();

    let fs, db;
    try {
      ({ fs, db } = await firebase());
    } catch (e) {
      console.error('MOSAICO: sem Firebase para combinar a pauta; sorteio local.', e);
      return sortear();
    }
    const ref = fs.doc(db, COLECAO, code);

    if (souMestre()) {
      const id = sortear();
      try {
        await fs.updateDoc(ref, { 'partida.pergunta': id, 'partida.abertaEmMs': Date.now() });
      } catch (e) {
        /* A mesa continua jogando com a pergunta sorteada; quem perde é a
           sincronia, não a partida de quem está com o aparelho na mão. */
        console.error('MOSAICO: não consegui gravar a pauta na sala.', e);
      }
      return id;
    }

    /* Convidado. Numa rodada nova ele precisa esperar a pergunta MUDAR, senão
       receberia de volta a que acabou de terminar — foi o que me fez guardar
       `ultima`. Com teto: mesa que não responde não pode deixar ninguém
       olhando para uma tela parada. */
    const ultima = novaRodada || null;
    try {
      const snap = await fs.getDoc(ref);
      const atual = snap.exists() ? snap.data()?.partida?.pergunta : null;
      if (atual && atual !== ultima) return atual;
    } catch (e) {
      console.error('MOSAICO: não consegui ler a pauta da sala.', e);
      return sortear();
    }
    return new Promise((resolve) => {
      let pronto = false;
      const acabou = (v) => { if (pronto) return; pronto = true; resolve(v); };
      const un = fs.onSnapshot(ref, (s) => {
        const p = s.exists() ? s.data()?.partida?.pergunta : null;
        if (p && p !== ultima) { un(); acabou(p); }
      }, (e) => { console.error('MOSAICO: perdi a sala ao esperar a pauta.', e); acabou(sortear()); });
      setTimeout(() => { un(); acabou(sortear()); }, 30000);
    });
  }

  window.MosaicoPauta = { escolher, souMestre, temSala: () => !!codigo() };
})();

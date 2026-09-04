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
  /* REAPROVEITA O APP DA SALA, e isto não é economia — é correção.
     Este arquivo criava o próprio app (`dragon-telao-publica`) e fazia o
     próprio `signInAnonymously`. Anônimo em app separado é OUTRO uid, e as
     regras do Firestore só deixam gravar no documento da sala quem for o
     Mestre: `room.mestreUid == request.auth.uid`. Com uid diferente, toda
     gravação para o telão voltava negada — em silêncio, porque o catch só
     escreve no console e o jogo segue.
     `firebase-room.js` já criou `dragon-noite` e já autenticou quem entrou.
     É desse app, e desse uid, que este arquivo precisa falar. */
  async function firebase() {
    if (api) return api;
    const [appmod, authmod, fs] = await Promise.all([
      import('https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js'),
      import('https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js'),
    ]);
    const app =
      appmod.getApps().find((a) => a.name === 'dragon-noite') ||
      appmod.getApps().find((a) => a.name === 'dragon-telao-publica') ||
      appmod.initializeApp(CFG, 'dragon-telao-publica');
    const auth = authmod.getAuth(app);
    if (!auth.currentUser) await authmod.signInAnonymously(auth);
    api = { db: fs.getFirestore(app), doc: fs.doc, updateDoc: fs.updateDoc, auth };
    return api;
  }
  async function meuUid() {
    const { auth } = await firebase();
    return auth.currentUser?.uid || '';
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


  /* ── A ABERTURA TOCA NUM APARELHO SÓ ─────────────────────────────────────
     Regra do Mario (03/09/2026): com telão passa no telão; sem telão, no
     aparelho do Mestre. Uma sala, um som.

     Por algumas horas isto tocou em TODOS os telefones, o que era o conserto
     errado de um defeito real (antes só o Mestre via, e o convidado começava
     a reunião sem a casa ter falado). Oito aparelhos narrando com atrasos
     diferentes é pior que um.

     O telão já sabia receber: ele carimba `opening.status='ready'` quando
     alguém arma o áudio por lá, escuta `command:'start'` com um token, e
     devolve 'playing' e 'finished'. Faltava quem mandasse. */
  const overlay = () => {
    let d = document.getElementById('cfEspera');
    if (d) return d;
    d = document.createElement('div');
    d.id = 'cfEspera';
    d.style.cssText =
      'position:fixed;inset:0;z-index:100025;background:#02070bf5;color:#eef5f2;' +
      'font-family:Inter,system-ui,sans-serif;display:grid;place-items:center;padding:22px;text-align:center';
    document.body.appendChild(d);
    return d;
  };
  const dizer = (titulo, texto) => {
    overlay().innerHTML =
      '<div style="max-width:520px"><h2 style="font:600 30px Georgia,serif;color:#efc878;margin:0 0 10px">' +
      titulo + '</h2><p style="color:#aab9c1;line-height:1.5">' + texto + '</p></div>';
  };
  const fecharEspera = () => document.getElementById('cfEspera')?.remove();

  /* Um telão que ficou aberto ontem não pode sequestrar a abertura de hoje:
     vale só se ele bateu o coração há pouco. telao.html carimba de 5 em 5 s. */
  function telaoVivo(d) {
    const o = d?.opening || {};
    return o.status === 'ready' && Date.now() - Number(o.displaySeenMs || 0) < 15000;
  }

  async function abertura(seguir) {
    const code = codigoDaSala();
    let feito = false;
    const entrar = () => { if (feito) return; feito = true; fecharEspera(); seguir(); };

    /* Sem sala — ensaio, solo-lab — é o próprio aparelho, sem combinar nada. */
    if (!code) { tocarAqui(entrar); return; }

    const { db, doc, updateDoc } = await firebase().catch(() => ({}));
    if (!db) { tocarAqui(entrar); return; }
    const fs2 = await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js');
    const ref = doc(db, 'noite', code);

    if (!souMestre()) {
      dizer('A casa está falando',
        'A abertura está tocando na tela da mesa. Ouça daí — a sua entra sozinha quando ela terminar.');
      const un = fs2.onSnapshot(ref, (s) => {
        if (s.exists() && s.data()?.abertura?.concluida) { un(); entrar(); }
      }, () => entrar());
      setTimeout(() => { un(); entrar(); }, 150000);
      return;
    }

    const concluir = () =>
      updateDoc(ref, { 'abertura.concluida': true, 'abertura.concluidaMs': Date.now() })
        .catch((e) => console.error('MOSAICO: não avisei que a abertura acabou.', e))
        .finally(entrar);

    const snap = await fs2.getDoc(ref).catch(() => null);
    if (snap && telaoVivo(snap.data())) {
      const token = Date.now();
      dizer('A abertura está no telão',
        'A casa fala na tela grande. Os celulares ficam quietos até ela terminar.');
      await updateDoc(ref, { 'opening.command': 'start', 'opening.token': token, 'opening.error': '' })
        .catch((e) => console.error('MOSAICO: não consegui acionar o telão.', e));
      const un = fs2.onSnapshot(ref, (s) => {
        const o = s.exists() ? s.data()?.opening || {} : {};
        if (o.status === 'finished' || o.error) { un(); concluir(); }
      }, () => concluir());
      /* Teto: telão que não responde não pode segurar a reunião. */
      setTimeout(() => { un(); concluir(); }, 150000);
      return;
    }
    tocarAqui(concluir);
  }

  function tocarAqui(depois) {
    if (!window.MosaicoOpening?.show) { depois(); return; }
    window.addEventListener('mosaico-opening-finished', depois, { once: true });
    window.MosaicoOpening.show();
  }


  /* ── UM BARALHO SÓ, UMA MESA SÓ ──────────────────────────────────────────
     Até aqui cada telefone embaralhava o próprio baralho com Math.random() e
     tirava a própria mão. Duas consequências que ninguém via jogando: as mãos
     eram DIFERENTES entre as pessoas, e o mesmo fragmento podia estar em dois
     dossiês ao mesmo tempo. Um placar comparando essas partidas comparava
     cartas diferentes.

     Agora o Mestre reparte UMA vez e publica em `mesa`: quem está na sala
     recebe a própria mão de lá, e o resto do baralho é a pilha comum.

     Quem não é o Mestre não grava nada — as regras do Firestore só deixam o
     dono da sala escrever no documento dela, e foi por ignorar isso que a
     publicação do telão nasceu quebrada hoje de manhã.

     Sem sala — ensaio, solo-lab —, devolve null e quem chamou reparte local,
     exatamente como era. */
  async function distribuir(todosIds, naMao) {
    const code = codigoDaSala();
    if (!code) return null;
    let db, doc, updateDoc, fs2, uid;
    try {
      ({ db, doc, updateDoc } = await firebase());
      fs2 = await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js');
      uid = await meuUid();
      if (!uid) return null;
    } catch (e) {
      console.error('MOSAICO: sem Firebase para repartir a mesa.', e);
      return null;
    }
    const ref = doc(db, 'noite', code);

    const montar = (m, nomes) => ({
      mao: (m.maos && m.maos[uid]) || [],
      pool: m.pool || [],
      jogadores: Object.keys(m.maos || {})
        .filter((u) => u !== uid)
        .map((u) => ({ uid: u, nome: nomes[u] || 'Investigador', naMao: (m.maos[u] || []).length })),
    });

    async function nomesDaSala() {
      const snap = await fs2.getDocs(fs2.collection(db, 'noite', code, 'jogadores'));
      const nomes = {};
      snap.docs.forEach((d) => (nomes[d.id] = (d.data() || {}).nome || 'Investigador'));
      return nomes;
    }

    if (souMestre()) {
      const nomes = await nomesDaSala();
      const naSala = Object.keys(nomes);
      /* Se a sala ainda não registrou ninguém, não há o que repartir: cai no
         local em vez de publicar uma mesa vazia que os outros esperariam. */
      if (!naSala.length) return null;
      const baralho = todosIds.slice();
      for (let i = baralho.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [baralho[i], baralho[j]] = [baralho[j], baralho[i]];
      }
      const maos = {};
      naSala.forEach((u) => (maos[u] = baralho.splice(0, naMao)));
      const mesa = { maos, pool: baralho, distribuidoEmMs: Date.now() };
      try {
        await updateDoc(ref, { mesa });
      } catch (e) {
        console.error('MOSAICO: não consegui publicar a mesa repartida.', e);
        return null;
      }
      return montar(mesa, nomes);
    }

    /* Convidado: espera a repartição do Mestre. Com teto — mesa que não chega
       não pode deixar alguém olhando para uma tela parada; cai no local. */
    const nomes = await nomesDaSala().catch(() => ({}));
    return new Promise((resolve) => {
      let pronto = false;
      const acabou = (v) => { if (pronto) return; pronto = true; resolve(v); };
      const un = fs2.onSnapshot(ref, (snap) => {
        const m = (snap.exists() && snap.data()?.mesa) || null;
        if (m && m.maos && m.maos[uid]) { un(); acabou(montar(m, nomes)); }
      }, (e) => { console.error('MOSAICO: perdi a sala ao esperar a mesa.', e); acabou(null); });
      setTimeout(() => { un(); acabou(null); }, 30000);
    });
  }


  /* ── O QUE UM JOGADOR PEDE, O MESTRE APLICA ──────────────────────────────
     As regras do Firestore não deixam um convidado escrever no documento da
     sala; deixam ele CRIAR em `acoes` um pedido com o próprio uid. É o mesmo
     arranjo que a Casa adotou no mercado (f0d84a5): pedir ao Mestre em vez de
     gravar direto.

     Sem isso a captura não tem como existir de verdade — ela move um fragmento
     do dossiê de outra pessoa para o seu, e ninguém além do Mestre pode mexer
     nos dois lados.

     Todo caminho daqui tem queda macia: se o pedido não sobe, ou se a mesa não
     responde, quem chamou continua com o estado local que já tinha. Um jogo
     que trava é pior que um jogo dessincronizado. */
  let unsubMesa = null, unsubAcoes = null;

  async function ouvirMesa(aoMudar) {
    const code = codigoDaSala();
    if (!code || unsubMesa) return;
    try {
      const { db, doc } = await firebase();
      const fs2 = await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js');
      const uid = await meuUid();
      unsubMesa = fs2.onSnapshot(doc(db, 'noite', code), (snap) => {
        const m = (snap.exists() && snap.data()?.mesa) || null;
        if (m && m.maos) aoMudar(m, uid);
      }, (e) => console.error('MOSAICO: perdi a mesa de vista.', e));
      if (souMestre()) atenderPedidos();
    } catch (e) {
      console.error('MOSAICO: não consegui ouvir a mesa.', e);
    }
  }

  async function pedir(tipo, dados) {
    const code = codigoDaSala();
    if (!code) return false;
    try {
      const { db } = await firebase();
      const fs2 = await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js');
      const uid = await meuUid();
      await fs2.addDoc(fs2.collection(db, 'noite', code, 'acoes'), {
        jogadorId: uid, tipo, ...dados, pedidoEmMs: Date.now(), atendido: false,
      });
      return true;
    } catch (e) {
      console.error('MOSAICO: o pedido não subiu.', e);
      return false;
    }
  }

  /* O Mestre é o único árbitro. Ele lê os pedidos por ordem de chegada, aplica
     sobre a mesa e carimba `atendido` — que só ele pode escrever, então um
     pedido não se auto-atende nem é aplicado duas vezes. */
  async function atenderPedidos() {
    const code = codigoDaSala();
    if (!code || unsubAcoes) return;
    const { db, doc, updateDoc } = await firebase();
    const fs2 = await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js');
    const ref = doc(db, 'noite', code);
    let ocupado = false;
    unsubAcoes = fs2.onSnapshot(
      fs2.query(fs2.collection(db, 'noite', code, 'acoes'), fs2.orderBy('pedidoEmMs')),
      async (snap) => {
        if (ocupado) return;
        const fila = snap.docs.filter((d) => !(d.data() || {}).atendido);
        if (!fila.length) return;
        ocupado = true;
        try {
          for (const d of fila) {
            const a = d.data() || {};
            const atual = await fs2.getDoc(ref);
            const mesa = (atual.exists() && atual.data()?.mesa) || null;
            if (!mesa || !mesa.maos) break;
            const aplicado = aplicar(mesa, a);
            if (aplicado) await updateDoc(ref, { mesa });
            await updateDoc(d.ref, { atendido: true, atendidoEmMs: Date.now() });
          }
        } catch (e) {
          console.error('MOSAICO: falhei ao atender um pedido.', e);
        } finally {
          ocupado = false;
        }
      },
      (e) => console.error('MOSAICO: perdi a fila de pedidos.', e),
    );
  }

  /* Muda a mesa NO LUGAR e diz se mudou. Cada regra confere de novo o que o
     aparelho de quem pediu já tinha conferido: o pedido chega pela rede e
     pode chegar tarde — a pilha esvaziou, a mão do alvo mudou. Quem arbitra
     não confia no que foi pedido, confere no que a mesa tem agora. */
  function aplicar(mesa, a) {
    const minha = mesa.maos[a.jogadorId];
    if (!minha) return false;
    if (a.tipo === 'comprar') {
      if (!mesa.pool || !mesa.pool.length) return false;
      /* A pilha agora é de todos, e duas pessoas podem escolher a mesma peça
         no mesmo segundo. Quem chega depois não fica sem compra: leva a do
         topo. Recusar seria cobrar a moeda e não entregar nada. */
      let i = a.fragmento ? mesa.pool.indexOf(a.fragmento) : 0;
      if (i < 0) i = 0;
      minha.push(mesa.pool.splice(i, 1)[0]);
      return true;
    }
    if (a.tipo === 'capturar') {
      const alvo = mesa.maos[a.alvo];
      if (!alvo || !alvo.length) return false;
      const i = Math.floor(Math.random() * alvo.length);
      minha.push(alvo.splice(i, 1)[0]);
      return true;
    }
    if (a.tipo === 'fechar') {
      mesa.fechados = mesa.fechados || {};
      if (mesa.fechados[a.campo]) return false;
      mesa.fechados[a.campo] = a.nome || 'Investigador';
      return true;
    }
    return false;
  }

  function pararDeOuvir() {
    if (unsubMesa) { unsubMesa(); unsubMesa = null; }
    if (unsubAcoes) { unsubAcoes(); unsubAcoes = null; }
  }
  window.addEventListener('beforeunload', pararDeOuvir);

  window.MosaicoTelao = { publicar, publicarPergunta, abertura, distribuir, ouvirMesa, pedir };
})();

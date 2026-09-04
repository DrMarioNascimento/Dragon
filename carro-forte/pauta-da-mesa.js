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
    /* A conta entra no api porque a nota que cada aparelho entrega precisa
       dizer de quem é: a regra de `acoes` exige jogadorId == request.auth.uid,
       e sem o uid o pedido é recusado. */
    api = { fs, db: fs.getFirestore(app), auth };
    return api;
  }

  /* `sortear` é o rodízio local de quem chamou — este arquivo não conhece as
     perguntas nem a ordem delas, só decide de quem é a escolha.

     E AS OPÇÕES DA MESA VIAJAM JUNTO (04/09/2026). Ritmo, duração e número de
     investigadores eram lidos dos `<select>` de CADA aparelho: quem entrava
     pelo QR escolhia o tamanho do próprio dossiê e a mesa discutia partidas de
     durações diferentes achando que era uma só. Agora quem abre a mesa é quem
     decide, e a decisão desce pela mesma porta da pergunta.

     Devolve sempre `{pergunta, opcoes}`; `opcoes` é null quando não veio da
     sala — aparelho solto e ensaio seguem com o que estiver na tela. */
  async function escolher(sortear, novaRodada, opcoes) {
    const code = codigo();
    if (!code) return { pergunta: sortear(), opcoes: null };

    let fs, db;
    try {
      ({ fs, db } = await firebase());
    } catch (e) {
      console.error('MOSAICO: sem Firebase para combinar a pauta; sorteio local.', e);
      return { pergunta: sortear(), opcoes: null };
    }
    const ref = fs.doc(db, COLECAO, code);

    if (souMestre()) {
      const id = sortear();
      const combinado = { ...(opcoes || {}), telao: usouTelao };
      try {
        await fs.updateDoc(ref, {
          'partida.pergunta': id,
          'partida.abertaEmMs': Date.now(),
          'partida.opcoes': combinado,
          /* O fecho e a fase da rodada passada não podem sobreviver à nova:
             sem zerar, o telão abriria a partida seguinte com o pódio da
             anterior e os aparelhos obedeceriam um prazo já vencido. */
          'partida.fecho': null,
          'partida.fase': null,
          'partida.placar': null,
        });
      } catch (e) {
        /* A mesa continua jogando com a pergunta sorteada; quem perde é a
           sincronia, não a partida de quem está com o aparelho na mão. */
        console.error('MOSAICO: não consegui gravar a pauta na sala.', e);
      }
      return { pergunta: id, opcoes: combinado };
    }

    /* Convidado. Numa rodada nova ele precisa esperar a pergunta MUDAR, senão
       receberia de volta a que acabou de terminar — foi o que me fez guardar
       `ultima`. Com teto: mesa que não responde não pode deixar ninguém
       olhando para uma tela parada. */
    const ultima = novaRodada || null;
    const doDoc = (d) => ({ pergunta: d?.partida?.pergunta || null, opcoes: d?.partida?.opcoes || null });
    try {
      const snap = await fs.getDoc(ref);
      const lido = doDoc(snap.exists() ? snap.data() : null);
      if (lido.pergunta && lido.pergunta !== ultima) return lido;
    } catch (e) {
      console.error('MOSAICO: não consegui ler a pauta da sala.', e);
      return { pergunta: sortear(), opcoes: null };
    }
    return new Promise((resolve) => {
      let pronto = false;
      const acabou = (v) => { if (pronto) return; pronto = true; resolve(v); };
      const un = fs.onSnapshot(ref, (s) => {
        const lido = doDoc(s.exists() ? s.data() : null);
        if (lido.pergunta && lido.pergunta !== ultima) { un(); acabou(lido); }
      }, (e) => { console.error('MOSAICO: perdi a sala ao esperar a pauta.', e); acabou({ pergunta: sortear(), opcoes: null }); });
      setTimeout(() => { un(); acabou({ pergunta: sortear(), opcoes: null }); }, 30000);
    });
  }

  /* ── A ABERTURA TOCA NUM APARELHO SÓ ──────────────────────────────────────
     Regra do Mario: com telão passa no telão; sem telão, no aparelho do
     Mestre. Nunca nos dois, e nunca nos celulares dos jogadores — oito
     aparelhos narrando com atrasos diferentes é pior que um.

     GÊMEO, NÃO COMPARTILHADO. O mesmo mecanismo existe em
     carro-forte-noite/telao-publica.js, e continua em dois arquivos pelo mesmo
     motivo que opening-flow.js: os dois lados falam com PROJETOS diferentes do
     Firebase, por coleções diferentes, e leem "sou o Mestre" de objetos
     diferentes. Consolidar exigiria testar o caminho publicado d'A Noite, que
     não é este trabalho. O que os dois têm de manter igual é o protocolo, e
     ele é curto: o telão se anuncia em <sala>/telao/<uid> com vistoEmMs e
     status; o Mestre escreve opening.command='start' com um token no
     documento da sala; o telão responde finishedToken (ou error+failedToken)
     no próprio documento. */
  const VIVO_MS = 15000;
  const TETO_MS = 150000;

  /* Se a abertura foi para a tela grande, a tela grande existe — e isso decide
     o fecho inteiro: revelação e pódio só no telão, ou revelação em todos os
     celulares. O Mestre já paga essa consulta uma vez, na abertura; guardá-la
     evita perguntar de novo e, sobretudo, evita que os aparelhos discordem no
     meio da partida se alguém desligar a TV. A resposta desce em
     `partida.opcoes.telao`, junto com o resto do que o Mestre decidiu. */
  let usouTelao = false;

  function espera(titulo, texto) {
    let d = document.getElementById('cfEsperaMesa');
    if (!d) {
      d = document.createElement('div');
      d.id = 'cfEsperaMesa';
      d.style.cssText =
        'position:fixed;inset:0;z-index:100025;background:#02070bf5;color:#eef5f2;' +
        'font-family:Inter,system-ui,sans-serif;display:grid;place-items:center;padding:22px;text-align:center';
      document.body.appendChild(d);
    }
    d.innerHTML =
      '<div style="max-width:520px"><h2 style="font:600 30px Georgia,serif;color:#efc878;margin:0 0 10px">' +
      titulo + '</h2><p style="color:#aab9c1;line-height:1.5">' + texto + '</p></div>';
    return d;
  }
  const fecharEspera = () => document.getElementById('cfEsperaMesa')?.remove();

  /* Um telão que ficou aberto ontem não pode sequestrar a abertura de hoje:
     vale só se ele bateu o coração há pouco. telao.html carimba de 5 em 5 s. */
  async function telaoVivo(fs, db, code) {
    try {
      const s = await fs.getDocs(fs.collection(db, COLECAO, code, 'telao'));
      return s.docs.some((d) => {
        const o = d.data() || {};
        return o.status === 'ready' && Date.now() - Number(o.vistoEmMs || 0) < VIVO_MS;
      });
    } catch (e) {
      console.error('MOSAICO: não consegui conferir se há telão nesta sala.', e);
      return false;
    }
  }

  function tocarAqui(depois) {
    if (!window.MosaicoOpening?.show) { depois(); return; }
    window.addEventListener('mosaico-opening-finished', depois, { once: true });
    window.MosaicoOpening.show();
  }

  async function abertura(seguir) {
    const code = codigo();
    let feito = false;
    const entrar = () => { if (feito) return; feito = true; fecharEspera(); seguir(); };

    /* Sem sala — ensaio, aparelho solto — é o próprio aparelho, sem combinar
       nada com ninguém. É ainda a maioria das partidas. */
    if (!code) { tocarAqui(entrar); return; }

    let fs, db;
    try { ({ fs, db } = await firebase()); } catch (e) { tocarAqui(entrar); return; }
    const ref = fs.doc(db, COLECAO, code);

    if (!souMestre()) {
      espera('A casa está falando',
        'A abertura está tocando na tela da mesa. Ouça daí — a sua entra sozinha quando ela terminar.');
      const un = fs.onSnapshot(ref, (s) => {
        if (s.exists() && s.data()?.abertura?.concluida) { un(); entrar(); }
      }, () => entrar());
      setTimeout(() => { un(); entrar(); }, TETO_MS);
      return;
    }

    const concluir = () =>
      fs.updateDoc(ref, { 'abertura.concluida': true, 'abertura.concluidaMs': Date.now() })
        .catch((e) => console.error('MOSAICO: não avisei que a abertura acabou.', e))
        .finally(entrar);

    usouTelao = await telaoVivo(fs, db, code);
    if (usouTelao) {
      const token = Date.now();
      espera('A abertura está no telão',
        'A casa fala na tela grande. Os celulares ficam quietos até ela terminar.');
      await fs.updateDoc(ref, { 'opening.command': 'start', 'opening.token': token, 'opening.error': '' })
        .catch((e) => console.error('MOSAICO: não consegui acionar o telão.', e));
      /* A resposta é conferida CONTRA O TOKEN. O primeiro quadro de um
         onSnapshot traz o que já estava gravado, e um telão que terminou a
         abertura da rodada passada ainda diz 'finished': sem o token, a
         abertura de hoje seria encerrada antes do primeiro segundo. */
      let un = null;
      const acabou = () => { un?.(); un = null; concluir(); };
      un = fs.onSnapshot(fs.collection(db, COLECAO, code, 'telao'), (s) => {
        const estados = s.docs.map((d) => d.data() || {});
        if (estados.some((o) => Number(o.finishedToken) === token || (o.error && Number(o.failedToken) === token))) acabou();
      }, () => acabou());
      /* Teto: telão que não responde não pode segurar a mesa. */
      setTimeout(acabou, TETO_MS);
      return;
    }
    tocarAqui(concluir);
  }

  /* ── A ATIVIDADE DA VEZ, E O PRAZO, SÃO DA MESA ──────────────────────────
     A fila sensorial já era sequencial, mas cada aparelho abria a sua quando
     bem entendia e media o próprio relógio: "todos fazendo juntos" era uma
     intenção escrita no comentário, não um fato do jogo.

     Agora quem abre grava o INSTANTE DO FIM na sala, e todos contam para o
     mesmo segundo. Quem abre é o Mestre — no ritmo automático, assim que a
     anterior fecha; no conduzido, quando ele decide. O jogador nunca abre: ele
     só executa dentro da janela que recebeu.

     Sem sala nada disto roda, e o aparelho solto segue com o próprio relógio. */
  async function abrirAtividade(sensor, fimMs, partida) {
    const code = codigo();
    if (!code || !souMestre()) return;
    try {
      const { fs, db } = await firebase();
      await fs.updateDoc(fs.doc(db, COLECAO, code), {
        'partida.atividade': { sensor, partida: partida || null, abertaEmMs: Date.now(), fimMs },
      });
    } catch (e) {
      console.error('MOSAICO: não consegui abrir a atividade para a mesa.', e);
    }
  }
  /* ── A FASE TAMBÉM É DA MESA ─────────────────────────────────────────────
     Regra do Mario, 04/09/2026: "tudo tem tempo; perdeu o tempo, segue; não
     está, perdeu". Cada fase da partida tem prazo, e o prazo é um só para a
     mesa inteira — senão "todos juntos" continua sendo uma intenção escrita no
     comentário, com uma pessoa no dossiê enquanto a outra ainda lê a pauta.

     Quem abre é o Mestre, e o instante do fim desce daqui. */
  async function abrirFase(nome, fimMs, partida) {
    const code = codigo();
    if (!code || !souMestre()) return;
    try {
      const { fs, db } = await firebase();
      await fs.updateDoc(fs.doc(db, COLECAO, code), {
        'partida.fase': { nome, partida: partida || null, abertaEmMs: Date.now(), fimMs: fimMs || 0 },
      });
    } catch (e) {
      console.error('MOSAICO: não consegui abrir a fase para a mesa.', e);
    }
  }

  /* UM OUVINTE SÓ. Eram três onSnapshot no MESMO documento — atividade, fecho
     e agora a fase —, cada um com o próprio cancelamento para alguém esquecer.
     Este entrega o `partida` inteiro e quem chamou decide o que olhar. */
  let unsubPartida = null;
  async function ouvirPartida(aoMudar) {
    const code = codigo();
    if (!code || unsubPartida) return;
    try {
      const { fs, db } = await firebase();
      unsubPartida = fs.onSnapshot(fs.doc(db, COLECAO, code), (s) => {
        const p = s.exists() ? s.data()?.partida : null;
        if (p) aoMudar(p);
      }, (e) => console.error('MOSAICO: perdi a partida de vista.', e));
    } catch (e) {
      console.error('MOSAICO: não consegui ouvir a partida.', e);
    }
  }

  /* ── O PLACAR COLETIVO, QUE NÃO EXISTIA ──────────────────────────────────
     A Mesa roda uma cópia por aparelho: cada um calculava a própria nota e ela
     morria ali. O telão anunciava `{nome:'A mesa', pontos:…}` — que eram os
     pontos de UM aparelho, o do Mestre, vestidos de coletivos. Numa sala de
     seis pessoas isso é a mentira grande na tela grande que o cabeçalho do
     telao.html manda não fazer.

     Agora cada aparelho ENTREGA a própria nota em `acoes`, que é o que as
     regras do Firestore deixam um convidado criar (`jogadorId == uid`), e o
     Mestre arbitra: lê por ordem de chegada, arquiva em `partida.placar` e
     carimba `atendido` — que só ele pode escrever, então uma nota não se
     autoarquiva nem entra duas vezes. É o mesmo relé que A Noite usa em
     `atenderPedidos`.

     NENHUM PLACAR PARCIAL SAI DAQUI. As notas ficam guardadas e só viram
     pódio quando a mesa inteira entregou — nem o Mestre vê antes, porque o
     Mestre também está jogando. */
  async function entregarNota(nome, pontos, partida) {
    const code = codigo();
    if (!code) return false;
    try {
      const { fs, db } = await firebase();
      const uid = await meuUid();
      await fs.addDoc(fs.collection(db, COLECAO, code, 'acoes'), {
        jogadorId: uid, tipo: 'placar', nome: String(nome || 'Investigador').slice(0, 24),
        pontos: Number(pontos) || 0, partida: partida || null,
        pedidoEmMs: Date.now(), atendido: false,
      });
      return true;
    } catch (e) {
      console.error('MOSAICO: a nota não subiu para a mesa.', e);
      return false;
    }
  }
  async function meuUid() {
    const { auth } = await firebase();
    return auth?.currentUser?.uid || '';
  }

  /* Quantos são "todos": quem está na lista de jogadores da sala. O telão não
     conta — ele não tem documento em `jogadores`. */
  async function quantosNaMesa() {
    const code = codigo();
    if (!code) return 0;
    try {
      const { fs, db } = await firebase();
      const s = await fs.getDocs(fs.collection(db, COLECAO, code, 'jogadores'));
      return s.size;
    } catch (e) {
      console.error('MOSAICO: não consegui contar quem está na mesa.', e);
      return 0;
    }
  }

  let unsubNotas = null;
  async function arbitrarPlacar(aoFechar) {
    const code = codigo();
    if (!code || !souMestre() || unsubNotas) return;
    const { fs, db } = await firebase();
    const ref = fs.doc(db, COLECAO, code);
    let ocupado = false;
    unsubNotas = fs.onSnapshot(
      fs.query(fs.collection(db, COLECAO, code, 'acoes'), fs.orderBy('pedidoEmMs')),
      async (snap) => {
        if (ocupado) return;
        const fila = snap.docs.filter((d) => {
          const a = d.data() || {};
          return a.tipo === 'placar' && !a.atendido;
        });
        if (!fila.length) return;
        ocupado = true;
        try {
          const atual = await fs.getDoc(ref);
          const placar = { ...((atual.exists() && atual.data()?.partida?.placar) || {}) };
          for (const d of fila) {
            const a = d.data() || {};
            if (!placar[a.jogadorId]) placar[a.jogadorId] = { nome: a.nome, pontos: a.pontos };
            await fs.updateDoc(d.ref, { atendido: true, atendidoEmMs: Date.now() });
          }
          await fs.updateDoc(ref, { 'partida.placar': placar });
          const total = await quantosNaMesa();
          aoFechar(
            Object.values(placar).sort((x, y) => y.pontos - x.pontos),
            Object.keys(placar).length,
            total,
          );
        } catch (e) {
          console.error('MOSAICO: falhei ao arquivar uma nota.', e);
        } finally {
          ocupado = false;
        }
      },
      (e) => console.error('MOSAICO: perdi a fila de notas.', e),
    );
  }

  /* ── O FECHO ────────────────────────────────────────────────────────────
     Um objeto só, escrito pelo Mestre e lido por todos:
       {fase:'revelacao', passo:n, passos:[…]}  → a tela grande narra
       {fase:'podio', placar:[…]}               → a tela grande ordena
       {fase:'detalhe'}                         → os celulares abrem a própria
                                                   composição de pontos
     Ele existe apenas quando há telão. Sem telão o Mestre não escreve nada e
     cada celular faz a revelação no próprio ritmo, como sempre fez. */
  function publicarFecho(fecho) {
    return publicar({ 'partida.fecho': { ...fecho, emMs: Date.now() } });
  }

  /* O que a mesa mostra na tela grande. Só o Mestre grava — as regras do
     Firestore não deixam outro, e aqui ele é o único que joga de qualquer
     forma: esta Mesa roda num aparelho só.

     Publica o que é da MESA e nada do que é de quem está com o aparelho na
     mão: a pergunta, e no fim a resolução com o relatório. A tela grande não
     recebe o dossiê de ninguém nem o que ainda está sendo decidido. */
  async function publicar(patch) {
    const code = codigo();
    if (!code || !souMestre()) return;
    try {
      const { fs, db } = await firebase();
      await fs.updateDoc(fs.doc(db, COLECAO, code), patch);
    } catch (e) {
      console.error('MOSAICO: não consegui publicar para o telão.', e);
    }
  }
  function publicarPergunta(g) {
    if (!g) return;
    publicar({
      'publicState.questionTitle': [g.title, g.nature].filter(Boolean).join(' · '),
      'publicState.questionText': g.question || '',
      'publicState.atualizadoEmMs': Date.now(),
      /* Zera o fim da partida anterior: sem isto a resolução e o placar da
         rodada passada ficariam na tela grande durante a rodada nova. */
      'publicState.resposta': '',
      'publicState.placar': [],
    });
  }
  /* A RESOLUÇÃO SOBE; A NOTA, NÃO.
     Aqui morava `[{nome:'A mesa', pontos: s.total}]` — os pontos do aparelho
     do Mestre anunciados como se fossem da mesa. Quem publica pódio agora é o
     fecho, com o placar que a mesa inteira entregou. */
  function publicarFim(g) {
    if (!g) return;
    publicar({
      'publicState.resposta': g.answer || '',
      'publicState.encerradaEmMs': Date.now(),
    });
  }

  window.MosaicoPauta = {
    escolher, abertura, abrirAtividade, abrirFase, ouvirPartida,
    entregarNota, arbitrarPlacar, publicarFecho, quantosNaMesa,
    souMestre, temSala: () => !!codigo(), publicarPergunta, publicarFim,
  };
})();

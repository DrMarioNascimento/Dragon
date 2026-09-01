/* O que a sala decide por todos.

   O PADRAO-SALA-MULTIPLAYER, seção 5: "qualquer pergunta, cenário ou variante
   definida pelo sistema deve ser gravada no documento da sala e permanecer
   congelada durante aquela sessão; recarga ou reconexão não pode gerar outra
   variante."

   Três coisas caíam fora disso, e cada aparelho respondia por si:

   - a pergunta, sorteada com Math.random() em cada telefone — numa mesa de
     oito, oito perguntas diferentes, e recarregar trocava a sua;
   - o número de investigadores, escolhido num seletor que aparecia até no
     aparelho do convidado e só mexia nos adversários locais dele;
   - o ritmo, 30 ou 60 segundos, escolhido por aparelho, cada mesa correndo
     num relógio próprio.

   Os três agora são do Mestre, gravados uma vez, lidos por todos. As escritas
   são idempotentes: o que já está gravado prevalece, então reconectar não
   re-sorteia nem redefine nada.

   No ensaio deste aparelho e no Solo Lab não há sala, e este módulo não se
   instala: o núcleo decide local, que é o certo lá. */

import { getApps } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js';
import { getFirestore, doc, onSnapshot, updateDoc } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';

const sala = window.MOSAICO_ROOM;

if (sala && !sala.local && sala.code) {
  const app = getApps().find(a => a.name === 'dragon-noite');
  if (!app) {
    console.error('MOSAICO: a sala existe mas o app do Firebase não foi encontrado; a partida não será sincronizada.');
  } else {
    const db = getFirestore(app);
    const ref = doc(db, 'noite', sala.code);
    const mestre = sala.role === 'master';

    const estado = { pergunta: '', jogadores: 0, ritmo: 0, ...(sala.room?.partida || {}) };
    const esperando = { pergunta: [], ritmo: [] };

    function recebeu(campo, valor) {
      if (!valor || estado[campo] === valor) return;
      estado[campo] = valor;
      while (esperando[campo]?.length) esperando[campo].shift()(valor);
    }

    onSnapshot(ref, s => {
      const p = (s.exists() && s.data()?.partida) || {};
      if (p.jogadores) estado.jogadores = p.jogadores;
      recebeu('pergunta', p.pergunta);
      recebeu('ritmo', p.ritmo);
    }, erro => console.error('MOSAICO: perdi a sala de vista.', erro));

    const gravar = patch =>
      updateDoc(ref, { ...patch, 'partida.atualizadaEmMs': Date.now() })
        .catch(erro => { console.error('MOSAICO: não consegui gravar na sala.', erro); });

    /* A pauta da noite e quantos a discutem. O Mestre sorteia e grava na
       primeira vez; todos os outros — e o próprio Mestre ao reconectar —
       recebem o que já está lá. O número de investigadores é quem estava na
       sala quando ela começou, não um seletor por aparelho. */
    function abrir(ids, jogadoresNaSala) {
      if (estado.pergunta) return Promise.resolve({ pergunta: estado.pergunta, jogadores: estado.jogadores });
      if (!mestre) {
        return new Promise(resolve => esperando.pergunta.push(pergunta => resolve({ pergunta, jogadores: estado.jogadores })));
      }
      const escolhida = ids[Math.floor(Math.random() * ids.length)];
      const quantos = Math.max(2, Math.min(8, jogadoresNaSala || 0)) || 8;
      return gravar({ 'partida.pergunta': escolhida, 'partida.jogadores': quantos }).then(() => {
        estado.pergunta = estado.pergunta || escolhida;
        estado.jogadores = estado.jogadores || quantos;
        return { pergunta: estado.pergunta, jogadores: estado.jogadores };
      });
    }

    /* O relógio da mesa é um só. Quem escolhe é o Mestre, na tela de ritmo;
       os convidados não veem a escolha, esperam por ela. */
    function ritmo() {
      if (estado.ritmo) return Promise.resolve(estado.ritmo);
      return new Promise(resolve => esperando.ritmo.push(resolve));
    }

    function definirRitmo(valor) {
      const v = +valor;
      if (!v) return Promise.resolve(estado.ritmo);
      if (estado.ritmo) return Promise.resolve(estado.ritmo);
      return gravar({ 'partida.ritmo': v }).then(() => (estado.ritmo = estado.ritmo || v));
    }

    window.MosaicoSalaPartida = {
      abrir, ritmo, definirRitmo, mestre,
      get atual() { return estado.pergunta; },
      get jogadores() { return estado.jogadores; }
    };
    window.dispatchEvent(new CustomEvent('mosaico-sala-partida-pronta'));
  }
}

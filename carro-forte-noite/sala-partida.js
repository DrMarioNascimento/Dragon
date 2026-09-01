/* A pergunta da noite, congelada na sala.

   O PADRAO-SALA-MULTIPLAYER é explícito na seção 5: "qualquer pergunta,
   cenário ou variante definida pelo sistema deve ser gravada no documento da
   sala e permanecer congelada durante aquela sessão; recarga ou reconexão não
   pode gerar outra variante."

   O núcleo fazia o oposto: `Math.random()` em cada aparelho. Numa sala de oito
   pessoas eram oito perguntas diferentes, e recarregar trocava a sua. Todo
   mundo discutindo a mesma manhã, cada um respondendo a outra pergunta.

   Quem sorteia é o Mestre, uma vez, e grava. Os outros esperam e leem. A
   escrita é idempotente: se a pergunta já está lá quando o Mestre chega, ela
   prevalece — reconectar não re-sorteia.

   No ensaio deste aparelho não há sala, e este módulo simplesmente não se
   instala: o núcleo continua sorteando local, que é o certo lá. */

import { getApps } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js';
import { getFirestore, doc, onSnapshot, updateDoc } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';

const sala = window.MOSAICO_ROOM;

if (sala && !sala.local && sala.code) {
  const app = getApps().find(a => a.name === 'dragon-noite');
  if (app) {
    const db = getFirestore(app);
    const ref = doc(db, 'noite', sala.code);
    const mestre = sala.role === 'master';

    let atual = sala.room?.partida?.pergunta || '';
    const esperando = [];

    onSnapshot(ref, s => {
      const id = s.exists() ? s.data()?.partida?.pergunta || '' : '';
      if (!id || id === atual) return;
      atual = id;
      while (esperando.length) esperando.shift()(id);
    });

    /* Devolve o id da pergunta desta sala. O Mestre sorteia e grava na
       primeira vez; todos os outros — e o próprio Mestre ao reconectar —
       recebem o que já está gravado. */
    function pergunta(ids) {
      if (atual) return Promise.resolve(atual);
      if (mestre) {
        const escolhida = ids[Math.floor(Math.random() * ids.length)];
        return updateDoc(ref, { 'partida.pergunta': escolhida, 'partida.congeladaEmMs': Date.now() })
          .then(() => { atual = atual || escolhida; return atual; })
          .catch(erro => {
            console.error('MOSAICO: não foi possível congelar a pergunta na sala.', erro);
            atual = escolhida;
            return escolhida;
          });
      }
      return new Promise(resolve => esperando.push(resolve));
    }

    window.MosaicoSalaPartida = { pergunta, mestre, get atual() { return atual; } };
    window.dispatchEvent(new CustomEvent('mosaico-sala-partida-pronta'));
  } else {
    console.error('MOSAICO: a sala existe mas o app do Firebase não foi encontrado; a pergunta não será congelada.');
  }
}

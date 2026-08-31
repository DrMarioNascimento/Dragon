/* MOSAICO · ponte da abertura usando a instância Firebase já criada por firebase-room.js */
(function(){
let api=null;
async function init(){
  if(api)return api;
  const appmod=await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js');
  const fs=await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js');
  const app=appmod.getApps().find(a=>a.name==='dragon-noite');
  if(!app)throw new Error('Firebase da sala ainda não foi inicializado.');
  const db=fs.getFirestore(app),code=String(window.MOSAICO_ROOM?.code||'').toUpperCase();
  if(!code)throw new Error('Código da sala indisponível.');
  const ref=fs.doc(db,'noite',code);
  api={code,
    async setOpening(data){const patch={'opening.updatedAtMs':Date.now()};for(const[k,v]of Object.entries(data))patch['opening.'+k]=v;await fs.updateDoc(ref,patch)},
    watchOpening(cb){return fs.onSnapshot(ref,s=>cb(s.exists()?(s.data().opening||{}):{}))}
  };
  return api;
}
window.MosaicoOpeningBridge={init};
})();
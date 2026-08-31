/* MOSAICO · ponte da abertura usando a instância Firebase já criada pela sala */
(function(){
let api=null;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function init(){
  if(api)return api;
  const appmod=await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js');
  const fs=await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js');
  let app=null,code='';
  const deadline=Date.now()+8000;
  while(Date.now()<deadline){
    const apps=appmod.getApps();
    app=apps.find(a=>a.options?.projectId==='mosaico-noite')||apps.find(a=>a.name==='dragon-noite')||null;
    code=String(window.MOSAICO_ROOM?.code||new URLSearchParams(location.search).get('sala')||'').trim().toUpperCase();
    if(app&&code)break;
    await sleep(120);
  }
  if(!app)throw new Error('Firebase da sala não ficou disponível. Reabra a sala e tente novamente.');
  if(!code)throw new Error('Código da sala não ficou disponível. Reabra a sala e tente novamente.');
  const db=fs.getFirestore(app),ref=fs.doc(db,'noite',code);
  api={code,
    async setOpening(data){const patch={'opening.updatedAtMs':Date.now()};for(const[k,v]of Object.entries(data))patch['opening.'+k]=v;await fs.updateDoc(ref,patch)},
    watchOpening(cb){return fs.onSnapshot(ref,s=>cb(s.exists()?(s.data().opening||{}):{}))}
  };
  return api;
}
window.MosaicoOpeningBridge={init};
})();
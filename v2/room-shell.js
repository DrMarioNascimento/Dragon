(function(){
'use strict';
const CFG={apiKey:'AIzaSyA160bkgHBrYBwvIxlENax-aAyLWPMaOU4',authDomain:'mosaico-noite.firebaseapp.com',projectId:'mosaico-noite',storageBucket:'mosaico-noite.firebasestorage.app',messagingSenderId:'703343424116',appId:'1:703343424116:web:e6990b5c00d43aca6e9721'};
const ORDEM=['sete','cinco','apagao','nome','corpo','perceber'];
const ROT='mosaico_casa_ultima_partida_noite';
const SENHA_HASH='2ff22e27b070d318da49f2ba1062cfef81e85e7cb826a5e761cbdb5f07c62472';
const MESTRE_LOCAL='mosaico_noite_mestre';
const FORMAS={m:{emoji:'👨',label:'Bem-vindo'},f:{emoji:'👩',label:'Bem-vinda'},n:{emoji:'👥',label:'Tanto faz'}};
const root=document.getElementById('app');
let app,auth,db,roomCode='',roomData=null,players=[],unsubRoom=null,unsubPlayers=null,role='',pendingUser=null;

function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function init(){
  if(!firebase.apps.length) app=firebase.initializeApp(CFG,'noite-shell'); else app=firebase.apps[0];
  auth=firebase.auth(app);db=firebase.firestore(app);
  const q=new URLSearchParams(location.search).get('sala');
  if(q){roomCode=q.toUpperCase();renderJoin();}else renderMenu();
}
function nextPartida(){let last='';try{last=localStorage.getItem(ROT)||''}catch(e){}let i=ORDEM.indexOf(last);return ORDEM[(i+1+ORDEM.length)%ORDEM.length]||'sete';}
function markPartida(id){try{localStorage.setItem(ROT,id)}catch(e){}}
function code(){const A='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';let s='';for(let i=0;i<6;i++)s+=A[Math.floor(Math.random()*A.length)];return s;}
function base(kicker,title,body){root.innerHTML=`<main class="stage shell room-stage"><section class="dossie room-card"><span class="eyebrow">${kicker}</span><h2>${title}</h2>${body}</section></main>`;}
function formas(selected='n'){return `<div class="room-formas">${Object.entries(FORMAS).map(([id,f])=>`<label class="room-forma"><input type="radio" name="roomForma" value="${id}" ${id===selected?'checked':''}><span class="room-forma-emoji">${f.emoji}</span><span>${f.label}</span></label>`).join('')}</div>`;}
function formaAtual(){return document.querySelector('input[name="roomForma"]:checked')?.value||'n';}
async function sha256hex(txt){const buf=new TextEncoder().encode(txt);const h=await crypto.subtle.digest('SHA-256',buf);return Array.from(new Uint8Array(h)).map(b=>b.toString(16).padStart(2,'0')).join('');}
function senhaLiberada(){try{return sessionStorage.getItem(MESTRE_LOCAL)==='1'}catch(e){return false}}

function renderMenu(){
  base('MOSAICO · A NOITE','A Casa da Costa',`<p class="lead">Você possui uma parte da verdade. Para enxergar o todo, precisará das outras pessoas — mas elas também querem vencer.</p><div class="room-actions"><button class="btn btn-gold" id="open">Abrir uma mesa</button><button class="btn btn-ghost" id="join">Entrar em uma mesa</button><button class="btn btn-ghost" id="solo">Ensaiar sozinho</button></div>`);
  document.getElementById('open').onclick=()=>senhaLiberada()?renderGoogle():renderSenha();
  document.getElementById('join').onclick=renderJoin;
  document.getElementById('solo').onclick=launchLocal;
}

function renderSenha(msg=''){
  base('ÁREA DO MESTRE','Abrir uma mesa',`<p class="lead">A abertura da sala possui duas camadas: senha do Mestre e autorização da conta Google.</p><label class="room-label" for="masterPass">Senha do Mestre</label><input id="masterPass" class="room-input room-password" type="password" autocomplete="off" placeholder="senha">${msg?`<div class="room-error">${esc(msg)}</div>`:''}<div class="room-actions"><button class="btn btn-gold" id="checkPass">Continuar</button><button class="btn btn-ghost" id="back">Voltar</button></div>`);
  document.getElementById('checkPass').onclick=conferirSenha;
  document.getElementById('back').onclick=renderMenu;
  document.getElementById('masterPass').onkeydown=e=>{if(e.key==='Enter')conferirSenha()};
  setTimeout(()=>document.getElementById('masterPass')?.focus(),40);
}
async function conferirSenha(){
  const input=document.getElementById('masterPass');const txt=(input?.value||'').trim();
  if(!txt)return renderSenha('Escreva a senha.');
  try{
    if((await sha256hex(txt))!==SENHA_HASH)return renderSenha('Senha incorreta.');
    try{sessionStorage.setItem(MESTRE_LOCAL,'1')}catch(e){}
    renderGoogle();
  }catch(e){renderSenha('Este navegador não permite conferir a senha.');}
}

function renderGoogle(msg=''){
  base('MESTRE DA MESA','Autorização do Mestre',`<p class="lead">A senha foi aceita. Agora entre com a conta Google autorizada para abrir a sala.</p>${msg?`<div class="room-error">${esc(msg)}</div>`:''}<div class="room-actions"><button class="btn btn-gold" id="google">Continuar com Google</button><button class="btn btn-ghost" id="back">Voltar</button></div>`);
  document.getElementById('google').onclick=loginGoogle;
  document.getElementById('back').onclick=renderMenu;
}
async function loginGoogle(){
  renderGoogle('Entrando com Google…');
  try{
    const provider=new firebase.auth.GoogleAuthProvider();provider.setCustomParameters({prompt:'select_account'});
    const cred=await auth.signInWithPopup(provider);pendingUser=cred.user;
    const cfg=await db.collection('config').doc('mestres').get();
    const permitidos=cfg.exists&&Array.isArray(cfg.data().emails)?cfg.data().emails:[];
    const email=(pendingUser.email||'').trim();
    if(!permitidos.includes(email)){
      await auth.signOut();pendingUser=null;
      return renderGoogle('Esta conta Google não está autorizada a abrir mesas.');
    }
    renderIdentifyMaster();
  }catch(e){renderGoogle(e&&e.message?e.message:'Não foi possível entrar com Google.');}
}

function renderIdentifyMaster(msg=''){
  base('IDENTIFICAÇÃO DO JOGADOR','Quem chega agora?',`<p class="lead">O Mestre também participa da sala. Informe como o MOSAICO deve chamar você.</p><label class="room-label" for="name">Seu nome</label><input id="name" class="room-input" maxlength="60" value="${esc(pendingUser?.displayName||'')}" placeholder="Seu nome"><label class="room-label">Como quer que o MOSAICO te chame?</label>${formas('n')}${msg?`<div class="room-error">${esc(msg)}</div>`:''}<div class="room-actions"><button class="btn btn-gold" id="create">Criar sala</button><button class="btn btn-ghost" id="back">Voltar</button></div>`);
  document.getElementById('create').onclick=createRoom;
  document.getElementById('back').onclick=renderGoogle;
}

function renderJoin(msg=''){
  const q=new URLSearchParams(location.search).get('sala');if(q&&!roomCode)roomCode=q.toUpperCase();
  base('ENTRAR','Quem chega agora?',`<p class="lead">Use o código exibido pelo Mestre ou abra diretamente pelo QR.</p><label class="room-label" for="code">Código da mesa</label><input id="code" class="room-input room-code-input" maxlength="6" value="${esc(roomCode)}" placeholder="ABC123" autocapitalize="characters"><label class="room-label" for="name">Seu nome</label><input id="name" class="room-input" maxlength="60" placeholder="Como a mesa te chama"><label class="room-label">Como quer que o MOSAICO te chame?</label>${formas('n')}${msg?`<div class="room-error">${esc(msg)}</div>`:''}<div class="room-actions"><button class="btn btn-gold" id="enter">Entrar na casa</button><button class="btn btn-ghost" id="back">Voltar</button></div>`);
  document.getElementById('enter').onclick=joinRoom;
  document.getElementById('back').onclick=renderMenu;
}

async function createRoom(){
  const name=(document.getElementById('name')?.value||'').trim(),forma=formaAtual();
  if(!name)return renderIdentifyMaster('Escreva seu nome.');
  try{
    const u=pendingUser||auth.currentUser;if(!u)throw new Error('Login Google não encontrado.');
    const cfg=await db.collection('config').doc('mestres').get();
    const permitidos=cfg.exists&&Array.isArray(cfg.data().emails)?cfg.data().emails:[];
    if(!permitidos.includes((u.email||'').trim()))throw new Error('Conta Google não autorizada como Mestre.');
    let c=code();for(let i=0;i<8;i++){const s=await db.collection('noite').doc(c).get();if(!s.exists)break;c=code();}
    const partidaId=nextPartida();
    await db.collection('noite').doc(c).set({ativa:true,fase:'sala',vez:0,modo:'com-telao',ritmo:'automatico',mestreUid:u.uid,criadaEm:firebase.firestore.FieldValue.serverTimestamp(),criadaEmMs:Date.now(),formato:'cheia',v3:true,partidaId,caseId:'casa-da-costa'});
    await db.collection('noite').doc(c).collection('jogadores').doc(u.uid).set({nome:name.slice(0,60),personagem:'',forma,pronto:true,entrouMs:Date.now(),votos:0,moedas:9,total:0,atualizadoEmMs:Date.now(),mestre:true});
    markPartida(partidaId);role='master';roomCode=c;listen();
  }catch(e){renderIdentifyMaster('Não foi possível criar a mesa. '+(e&&e.message?e.message:e));}
}

async function joinRoom(){
  const c=(document.getElementById('code')?.value||'').trim().toUpperCase(),name=(document.getElementById('name')?.value||'').trim(),forma=formaAtual();
  roomCode=c;
  if(c.length!==6)return renderJoin('O código tem 6 caracteres.');
  if(!name)return renderJoin('Escreva seu nome.');
  try{
    let user=auth.currentUser;if(!user||!user.isAnonymous){if(user)await auth.signOut();user=(await auth.signInAnonymously()).user;}
    const ref=db.collection('noite').doc(c),snap=await ref.get();if(!snap.exists||snap.data().ativa!==true)throw new Error('Mesa não encontrada ou encerrada.');
    if(snap.data().caseId&&snap.data().caseId!=='casa-da-costa')throw new Error('Esse código pertence a outro caso do MOSAICO.');
    await ref.collection('jogadores').doc(user.uid).set({nome:name.slice(0,60),personagem:'',forma,pronto:true,entrouMs:Date.now(),votos:0,moedas:9,total:0,atualizadoEmMs:Date.now(),mestre:false},{merge:true});
    role='guest';listen();
  }catch(e){renderJoin('Não foi possível entrar. '+(e&&e.message?e.message:e));}
}

function listen(){
  if(unsubRoom)unsubRoom();if(unsubPlayers)unsubPlayers();
  const ref=db.collection('noite').doc(roomCode);
  unsubRoom=ref.onSnapshot(s=>{roomData=s.exists?s.data():null;if(!roomData){renderMenu();return;}if(roomData.fase==='sala')renderLobby();else launchOnline();},e=>renderMenu('Falha ao acompanhar a sala: '+e.message));
  unsubPlayers=ref.collection('jogadores').orderBy('entrouMs').onSnapshot(s=>{players=s.docs.map(d=>({id:d.id,...d.data()}));if(roomData&&roomData.fase==='sala')renderLobby();});
}
function renderLobby(){
  if(!roomData)return;
  const url=location.origin+location.pathname+'?sala='+encodeURIComponent(roomCode);
  const qr=window.MosaicoQR?MosaicoQR.svg(url,{nivel:'M',margem:4,rotulo:'QR para entrar em A Noite'}):'';
  const list=players.map(p=>{const f=FORMAS[p.forma]||FORMAS.n;return `<div class="room-player"><span class="room-player-name">${f.emoji} ${esc(p.nome||'Jogador')}</span><span>${p.mestre?'Mestre':'Jogador'}</span></div>`}).join('')||'<div class="room-empty">Ninguém chegou ainda.</div>';
  base(role==='master'?'MESTRE DA MESA':'SALA','Sala aberta',`<div class="room-lobby"><div class="room-code"><span>Código da sala</span><strong>${esc(roomCode)}</strong></div><div class="room-grid"><div class="room-qr">${qr}</div><div><p class="muted">Aponte a câmera para o QR ou informe o código.</p><div class="room-players">${list}</div><p class="muted">${players.length} participante(s)</p></div></div>${role==='master'?'<div class="room-master-note"><b>Você é o Mestre da Sala.</b><span>Somente este aparelho pode iniciar a sessão.</span></div><button class="btn btn-gold" id="start">Começar o jogo</button>':'<div class="quote">Aguarde o Mestre iniciar a sessão.</div>'}</div>`);
  if(role==='master')document.getElementById('start').onclick=async()=>{await db.collection('noite').doc(roomCode).update({fase:'dossie',iniciadaEmMs:Date.now()});};
}
function launchOnline(){
  if(window.__MOSAICO_NOITE_LAUNCHED)return;
  window.__MOSAICO_NOITE_LAUNCHED=true;window.MosaicoSala={online:true,role,roomCode,roomData,players,auth,db};
  const id=roomData.partidaId||'sete',idx=ORDEM.indexOf(id);
  try{localStorage.setItem(ROT,ORDEM[(idx-1+ORDEM.length)%ORDEM.length]);localStorage.removeItem('mosaico_noite_costa_auto');}catch(e){}
  root.innerHTML='';const s=document.createElement('script');s.src='noite-auto.js?v=20260830-master';document.body.appendChild(s);
}
function launchLocal(){window.__MOSAICO_NOITE_LAUNCHED=true;root.innerHTML='';const s=document.createElement('script');s.src='noite-auto.js?v=20260830-master';document.body.appendChild(s);}
window.addEventListener('beforeunload',()=>{if(unsubRoom)unsubRoom();if(unsubPlayers)unsubPlayers();});
init();
})();
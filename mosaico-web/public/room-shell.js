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
let ritmo='automatico',localScreen='menu',ownPlayer=null,salaOpen=false;

function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function init(){
  if(!firebase.apps.length) app=firebase.initializeApp(CFG,'noite-shell'); else app=firebase.apps[0];
  auth=firebase.auth(app);db=firebase.firestore(app);
  const q=new URLSearchParams(location.search).get('sala');
  if(q){roomCode=q.toUpperCase();localScreen='join';renderJoin(false);}else renderMenu();
}
function nextPartida(){let last='';try{last=localStorage.getItem(ROT)||''}catch(e){}let i=ORDEM.indexOf(last);return ORDEM[(i+1+ORDEM.length)%ORDEM.length]||'sete';}
function markPartida(id){try{localStorage.setItem(ROT,id)}catch(e){}}
function code(){const A='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';let s='';for(let i=0;i<6;i++)s+=A[Math.floor(Math.random()*A.length)];return s;}
function base(kicker,title,body,cls=''){root.innerHTML=`<main class="stage shell room-stage ${cls}"><section class="dossie room-card"><span class="eyebrow">${kicker}</span><h2>${title}</h2>${body}</section></main>`;}
function formas(selected='m'){return `<div class="room-formas">${Object.entries(FORMAS).map(([id,f])=>`<label class="room-forma"><input type="radio" name="roomForma" value="${id}" ${id===selected?'checked':''}><span class="room-forma-emoji">${f.emoji}</span><span>${f.label}</span></label>`).join('')}</div>`;}
function formaAtual(){return document.querySelector('input[name="roomForma"]:checked')?.value||'m';}
async function sha256hex(txt){const buf=new TextEncoder().encode(txt);const h=await crypto.subtle.digest('SHA-256',buf);return Array.from(new Uint8Array(h)).map(b=>b.toString(16).padStart(2,'0')).join('');}
function senhaLiberada(){try{return sessionStorage.getItem(MESTRE_LOCAL)==='1'}catch(e){return false}}
function joinUrl(){const u=new URL(location.href);u.search='';u.searchParams.set('sala',roomCode);return u.toString();}
function qrSvg(){try{return window.MosaicoQR?MosaicoQR.svg(joinUrl(),{nivel:'M',margem:2,rotulo:'QR da sala',fundo:'#ffffff',tinta:'#05070c'}):''}catch(e){return '<div class="room-empty">QR indisponível — use o código.</div>';}}
function myPlayer(){const uid=auth.currentUser&&auth.currentUser.uid;return players.find(p=>p.id===uid)||ownPlayer;}
function readyCount(){return players.filter(p=>p.pronto===true).length;}
function allReady(){return players.length>0&&readyCount()===players.length;}

function renderMenu(){
  localScreen='menu';
  base('MOSAICO · A NOITE','A Casa da Costa',`<p class="lead">Você possui uma parte da verdade. Para enxergar o todo, precisará das outras pessoas — mas elas também querem vencer.</p><div class="room-actions"><button class="btn btn-gold" id="open">Abrir uma mesa</button><button class="btn btn-ghost" id="join">Entrar em uma mesa</button><button class="btn btn-ghost" id="solo">Ensaiar sozinho</button></div>`,'room-menu');
  document.getElementById('open').onclick=()=>renderMasterGate();
  document.getElementById('join').onclick=()=>{localScreen='join';renderJoin(false)};
  document.getElementById('solo').onclick=launchLocal;
}

function renderMasterGate(msg=''){
  localScreen='master-gate';
  base('ÁREA DO MESTRE','Como a mesa será usada?',`<div class="room-mode-single"><div class="room-mode-icon">📱</div><b>Celular</b><span>A Noite é conduzida diretamente pelo celular do Mestre.</span></div><span class="room-section-label">Como as rodadas devem avançar?</span><button class="room-rhythm ${ritmo==='automatico'?'on':''}" data-r="automatico"><b>AUTOMATICAMENTE · RECOMENDADO</b><span>O jogo avança quando todos terminam.</span></button><button class="room-rhythm ${ritmo==='conduzido'?'on':''}" data-r="conduzido"><b>COM MINHA LIBERAÇÃO</b><span>A Sala avisará quando for hora de avançar.</span></button>${senhaLiberada()?'<p class="muted room-master-known">Mestre reconhecido neste aparelho.</p>':'<input id="masterPass" class="room-input room-password" type="password" autocomplete="off" placeholder="senha">'}${msg?`<div class="room-error">${esc(msg)}</div>`:''}<div class="room-actions"><button class="btn btn-gold" id="openGoogle">Abrir com Google</button><button class="btn btn-ghost" id="back">Cancelar</button></div>`,'room-master-gate');
  document.querySelectorAll('[data-r]').forEach(b=>b.onclick=()=>{ritmo=b.dataset.r;renderMasterGate()});
  document.getElementById('openGoogle').onclick=senhaLiberada()?loginGoogle:conferirSenha;
  document.getElementById('back').onclick=renderMenu;
  const pass=document.getElementById('masterPass');if(pass){pass.onkeydown=e=>{if(e.key==='Enter')conferirSenha()};setTimeout(()=>pass.focus(),30)}
}
async function conferirSenha(){
  const txt=(document.getElementById('masterPass')?.value||'').trim();
  if(!txt)return renderMasterGate('Escreva a senha.');
  try{
    if((await sha256hex(txt))!==SENHA_HASH)return renderMasterGate('Senha incorreta.');
    try{sessionStorage.setItem(MESTRE_LOCAL,'1')}catch(e){}
    await loginGoogle();
  }catch(e){renderMasterGate('Este navegador não permite conferir a senha.');}
}
async function loginGoogle(){
  try{
    const provider=new firebase.auth.GoogleAuthProvider();provider.setCustomParameters({prompt:'select_account'});
    const cred=await auth.signInWithPopup(provider);pendingUser=cred.user;
    const cfg=await db.collection('config').doc('mestres').get();
    const permitidos=cfg.exists&&Array.isArray(cfg.data().emails)?cfg.data().emails:[];
    if(!permitidos.includes((pendingUser.email||'').trim())){
      await auth.signOut();pendingUser=null;return renderMasterGate('Esta conta Google não está autorizada a abrir mesas.');
    }
    await createRoom();
  }catch(e){renderMasterGate((e&&e.message)||'Não foi possível entrar com Google.');}
}
async function createRoom(){
  try{
    const u=pendingUser||auth.currentUser;if(!u)throw new Error('Login Google não encontrado.');
    let c=code();for(let i=0;i<8;i++){const s=await db.collection('noite').doc(c).get();if(!s.exists)break;c=code();}
    const partidaId=nextPartida();
    await db.collection('noite').doc(c).set({ativa:true,fase:'sala',vez:0,modo:'sem-telao',ritmo,mestreUid:u.uid,criadaEm:firebase.firestore.FieldValue.serverTimestamp(),criadaEmMs:Date.now(),formato:'cheia',v3:true,partidaId,caseId:'casa-da-costa'});
    markPartida(partidaId);role='master';roomCode=c;roomData={ativa:true,fase:'sala',modo:'sem-telao',ritmo,mestreUid:u.uid,partidaId,caseId:'casa-da-costa'};
    localScreen='master-orientation';renderMasterOrientation();
  }catch(e){renderMasterGate('Não foi possível criar a mesa. '+((e&&e.message)||e));}
}

function renderMasterOrientation(){
  localScreen='master-orientation';
  base('ÁREA DO MESTRE','Você é o mestre da sala',`<p class="lead room-center">Ative o som do celular e fique atento ao botão <b>Sala</b>.</p><div class="room-master-info"><p><b>Durante a partida, você continuará jogando normalmente.</b></p><p>O botão <b>Sala</b> mostrará comandos exclusivos do mestre, como iniciar, avançar ou liberar uma etapa.</p><p>Quando uma intervenção for necessária, o botão Sala ficará em destaque.</p></div><button class="btn btn-gold" id="understood">Entendi · continuar</button>`,'room-orientation');
  document.getElementById('understood').onclick=()=>{localScreen='join-master';renderJoin(true)};
}

function renderJoin(asMaster,msg=''){
  localScreen=asMaster?'join-master':'join';
  const codeValue=roomCode||(new URLSearchParams(location.search).get('sala')||'').toUpperCase();
  base('ENTRAR','Quem chega agora?',`<p class="lead">Você não escolhe quem é. A casa escolhe por você — como escolheu naquela noite.</p><label class="room-label">Código da mesa</label><input id="code" class="room-input room-code-input" maxlength="6" value="${esc(codeValue)}" ${asMaster?'readonly':''} placeholder="ABC123"><label class="room-label">Seu nome</label><input id="name" class="room-input" maxlength="60" value="${asMaster?esc((pendingUser&&pendingUser.displayName)||''):''}" placeholder="Como a mesa te chama"><label class="room-label">Como quer que o MOSAICO te chame?</label>${formas('m')}${msg?`<div class="room-error">${esc(msg)}</div>`:''}<button class="btn btn-gold" id="enter">Entrar na casa</button><button class="btn btn-ghost" id="back">← Voltar</button>`,'room-join');
  document.getElementById('enter').onclick=()=>joinRoom(asMaster);
  document.getElementById('back').onclick=asMaster?renderMasterOrientation:renderMenu;
}
async function joinRoom(asMaster){
  const c=(document.getElementById('code')?.value||'').trim().toUpperCase(),name=(document.getElementById('name')?.value||'').trim(),forma=formaAtual();roomCode=c;
  if(c.length!==6)return renderJoin(asMaster,'O código tem 6 caracteres.');
  if(!name)return renderJoin(asMaster,'Escreva seu nome.');
  try{
    let user;
    if(asMaster){user=pendingUser||auth.currentUser;if(!user)throw new Error('Mestre não autenticado.');}
    else{user=auth.currentUser;if(!user||!user.isAnonymous){if(user)await auth.signOut();user=(await auth.signInAnonymously()).user;}}
    const ref=db.collection('noite').doc(c),snap=await ref.get();if(!snap.exists||snap.data().ativa!==true)throw new Error('Mesa não encontrada ou encerrada.');
    if(snap.data().caseId&&snap.data().caseId!=='casa-da-costa')throw new Error('Esse código pertence a outro caso do MOSAICO.');
    await ref.collection('jogadores').doc(user.uid).set({nome:name.slice(0,60),personagem:'',forma,pronto:false,entrouMs:Date.now(),votos:0,moedas:9,total:0,atualizadoEmMs:Date.now(),mestre:!!asMaster},{merge:true});
    role=asMaster?'master':'guest';ownPlayer={id:user.uid,nome:name.slice(0,60),forma,pronto:false,mestre:!!asMaster};
    localScreen='objective';listen();renderObjective();
  }catch(e){renderJoin(asMaster,'Não foi possível entrar. '+((e&&e.message)||e));}
}

function renderObjective(){
  localScreen='objective';
  base('ANTES DE COMEÇAR','Objetivo do jogo',`<p class="lead room-center">Analise os fragmentos, estabeleça relações e sustente uma conclusão para a pergunta desta noite.</p><div class="room-objective-list"><div><b>CASO</b><span>Consulte a pergunta, os fatos e as relações disponíveis.</span></div><div><b>ARQUIVO</b><span>Guarda os fragmentos que você reunir durante a partida.</span></div><div><b>DECISÃO</b><span>Feche os campos da pergunta com base no que as evidências sustentam.</span></div><div><b>PONTUAÇÃO</b><span>Seu resultado permanece individual, sem ranking aberto durante a partida.</span></div></div><button class="btn btn-gold" id="objectiveOk">Entendi · entrar no jogo</button>`,'room-objective');
  document.getElementById('objectiveOk').onclick=()=>{localScreen='preparation';renderPreparation();};
}

function renderPreparation(){
  localScreen='preparation';const me=myPlayer();const ready=!!(me&&me.pronto);
  base('RODADA ATUAL','Preparação da mesa',`<div class="room-prep"><span class="room-subeyebrow">VOCÊ ESTÁ NA CASA</span><div class="room-candle">🕯️</div><h3>${ready?'A casa vai começar.':'A casa já decidiu.'}</h3><p>${ready?'Mantenha o celular com você e proteja sua tela. Ele mostrará as instruções quando chegar a sua vez.':'Você ainda não sabe qual fragmento será decisivo nesta noite. Vai descobrir durante a partida.'}</p>${ready?'':`<button class="btn btn-gold" id="ready">Estou pronto para jogar</button>`}<div class="room-ready-count">${readyCount()} de ${players.length||1} já estão prontos.</div></div><div class="room-bottom"><button class="room-bottom-btn" id="caseBtn">🔎 Caso</button>${role==='master'?'<button class="room-bottom-btn room-sala-btn" id="salaBtn">Sala</button>':''}</div>${role==='master'&&salaOpen?salaPanel():''}`,'room-preparation');
  if(!ready)document.getElementById('ready').onclick=markReady;
  if(role==='master')document.getElementById('salaBtn').onclick=()=>{salaOpen=!salaOpen;renderPreparation()};
  const close=document.getElementById('closeSala');if(close)close.onclick=()=>{salaOpen=false;renderPreparation()};
  const start=document.getElementById('startGame');if(start)start.onclick=startGame;
}
async function markReady(){const u=auth.currentUser;if(!u)return;await db.collection('noite').doc(roomCode).collection('jogadores').doc(u.uid).update({pronto:true,atualizadoEmMs:Date.now()});ownPlayer=Object.assign({},ownPlayer,{pronto:true});renderPreparation();}
function salaPanel(){
  const list=players.map(p=>`<div class="room-player"><span>${esc(p.nome||'Jogador')}</span><span>${p.pronto?'pronto':'aguardando'}</span></div>`).join('')||'<div class="room-empty">Nenhum participante conectado.</div>';
  return `<div class="room-sala-overlay"><div class="room-sala-panel"><div class="room-sala-head"><div><span class="eyebrow">MESTRE · PREPARAÇÃO DA MESA</span><h2>Sala</h2><p class="muted">${ritmo==='conduzido'?'Ritmo conduzido pelo mestre':'Ritmo automático'}</p></div><button class="btn btn-ghost room-close" id="closeSala">Fechar</button></div><details open class="room-accordion room-action"><summary>Ação do mestre necessária</summary><div><button class="btn btn-gold" id="startGame" ${allReady()?'':'disabled'}>Começar</button></div></details><details class="room-accordion"><summary>Código e QR da sala</summary><div><div class="room-code"><strong>${esc(roomCode)}</strong></div><div class="room-qr">${qrSvg()}</div></div></details><details class="room-accordion"><summary>Participantes · ${players.length}</summary><div class="room-players">${list}</div></details></div></div>`;
}
async function startGame(){if(!allReady())return;await db.collection('noite').doc(roomCode).update({fase:'dossie',iniciadaEmMs:Date.now()});}

function listen(){
  if(unsubRoom)unsubRoom();if(unsubPlayers)unsubPlayers();const ref=db.collection('noite').doc(roomCode);
  unsubRoom=ref.onSnapshot(s=>{roomData=s.exists?s.data():null;if(!roomData){renderMenu();return;}if(roomData.fase!=='sala'){launchOnline();return;}if(localScreen==='preparation')renderPreparation();});
  unsubPlayers=ref.collection('jogadores').orderBy('entrouMs').onSnapshot(s=>{players=s.docs.map(d=>({id:d.id,...d.data()}));ownPlayer=myPlayer();if(localScreen==='preparation')renderPreparation();});
}
function launchOnline(){
  if(window.__MOSAICO_NOITE_LAUNCHED)return;window.__MOSAICO_NOITE_LAUNCHED=true;
  window.MosaicoSala={online:true,role,roomCode,roomData,players,auth,db};const id=roomData.partidaId||'sete',idx=ORDEM.indexOf(id);
  try{localStorage.setItem(ROT,ORDEM[(idx-1+ORDEM.length)%ORDEM.length]);localStorage.removeItem('mosaico_noite_costa_auto');}catch(e){}
  root.innerHTML='';const s=document.createElement('script');s.src='noite-auto.js?v=20260902-tecnica';document.body.appendChild(s);
}
function launchLocal(){window.__MOSAICO_NOITE_LAUNCHED=true;root.innerHTML='';const s=document.createElement('script');s.src='noite-auto.js?v=20260902-tecnica';document.body.appendChild(s);}
window.addEventListener('beforeunload',()=>{if(unsubRoom)unsubRoom();if(unsubPlayers)unsubPlayers();});
init();
})();
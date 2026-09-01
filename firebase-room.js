import { initializeApp, getApps } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js';
import { getAuth, GoogleAuthProvider, signInWithPopup, getRedirectResult, signInAnonymously, signOut } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js';
import { getFirestore, doc, setDoc, getDoc, updateDoc, collection, onSnapshot, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';

/* Esta folha é carregada com type="module", e em módulo document.currentScript
   é null: a configuração da página — projeto Firebase, coleção, nome do evento
   de liberação — era lida como undefined e caía inteira no padrão da Mesa. A
   página da Noite abria a sala no projeto errado e anunciava um evento que
   ninguém escuta, então o jogo nunca carregava e o botão de entrar não fazia
   nada. Procurar pela própria tag devolve o que o HTML sempre disse. */
const script=document.currentScript||document.querySelector('script[src*="firebase-room.js"]');
const PROJECT=script?.dataset.project||'mesa';
const ROOT=script?.dataset.root||(PROJECT==='noite'?'noite':'mosaico');
const CASE_ID=script?.dataset.case||'caso';
const TITLE=script?.dataset.title||'MOSAICO';
const READY_EVENT=script?.dataset.readyEvent||'mosaico-room-ready';
const SENHA_HASH='2ff22e27b070d318da49f2ba1062cfef81e85e7cb826a5e761cbdb5f07c62472';
const MESTRE_LOCAL=`dragon_${PROJECT}_mestre`;
const CONFIGS={
  mesa:{apiKey:'AIzaSyDwshZbqaMOKxdRuyLtdpbijPRdrjVOcxE',authDomain:'mosaico-game.firebaseapp.com',projectId:'mosaico-game',storageBucket:'mosaico-game.firebasestorage.app',messagingSenderId:'436141261767',appId:'1:436141261767:web:6a83555a2f7c4ed4550fe2'},
  noite:{apiKey:'AIzaSyA160bkgHBrYBwvIxlENax-aAyLWPMaOU4',authDomain:'mosaico-noite.firebaseapp.com',projectId:'mosaico-noite',storageBucket:'mosaico-noite.firebasestorage.app',messagingSenderId:'703343424116',appId:'1:703343424116:web:e6990b5c00d43aca6e9721'}
};
const app=getApps().find(a=>a.name===`dragon-${PROJECT}`)||initializeApp(CONFIGS[PROJECT],`dragon-${PROJECT}`);
const auth=getAuth(app),db=getFirestore(app);
const ALPH='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const FORMAS={m:{emoji:'👨',label:'Bem-vindo'},f:{emoji:'👩',label:'Bem-vinda'},n:{emoji:'👥',label:'Tanto faz'}};
let role='',code='',players=[],room=null,unsubRoom=null,unsubPlayers=null,pendingUser=null;
let modo=PROJECT==='mesa'?'com-telao':'sem-telao',ritmo='automatico',salaAberta=false,gameReleased=false,intencao='sala';
const q=new URLSearchParams(location.search).get('sala');

function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function gerar(){let s='';for(let i=0;i<6;i++)s+=ALPH[Math.floor(Math.random()*ALPH.length)];return s;}
function roomRef(c){return doc(db,ROOT,c)}
function playerRef(c,uid){return doc(db,ROOT,c,'jogadores',uid)}
function joinUrl(c){const u=new URL(location.href);u.search='';u.searchParams.set('sala',c);return u.toString();}
function qr(c){const url=joinUrl(c);if(window.MosaicoQR)return window.MosaicoQR.svg(url,{nivel:'M',margem:4,rotulo:'QR para entrar na sala'});return `<div class="room-qr-fallback">${esc(c)}</div>`;}
async function sha256hex(txt){const buf=new TextEncoder().encode(txt);const h=await crypto.subtle.digest('SHA-256',buf);return Array.from(new Uint8Array(h)).map(b=>b.toString(16).padStart(2,'0')).join('');}
function senhaLiberada(){try{return sessionStorage.getItem(MESTRE_LOCAL)==='1'}catch(e){return false}}

function css(){const st=document.createElement('style');st.textContent=`
#dragonRoomGate{position:fixed;inset:0;z-index:99999;background:radial-gradient(900px 600px at 50% -10%,#16242a 0,transparent 55%),#061014;color:#f0eadc;font-family:Inter,system-ui,sans-serif;overflow:auto}.dr-shell{width:min(620px,calc(100% - 28px));margin:auto;padding:max(24px,env(safe-area-inset-top)) 0 max(36px,env(safe-area-inset-bottom))}.dr-brand{font-size:12px;letter-spacing:.22em;text-transform:uppercase;color:#e8a94a;font-weight:800}.dr-card{margin-top:18px;padding:20px;border:1px solid #31404a;border-radius:14px;background:linear-gradient(160deg,#121c22,#080e12);box-shadow:inset 0 1px rgba(255,255,255,.06),0 7px 0 #020507,0 22px 45px rgba(0,0,0,.45)}.dr-card h1,.dr-card h2{font-family:Georgia,serif;margin:.25rem 0 .6rem}.dr-card h1{font-size:clamp(38px,10vw,62px);line-height:.95}.dr-card p{color:#afbdc5;line-height:1.5}.dr-btn{width:100%;min-height:52px;margin-top:10px;border:0;border-radius:10px;padding:12px 14px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;cursor:pointer;background:linear-gradient(#ffc266,#dd8b2e);color:#1b1005;box-shadow:inset 0 1px #ffe2b4,0 5px 0 #6a3712}.dr-btn.secondary{background:linear-gradient(#24343d,#142128);color:#dce8ed;box-shadow:inset 0 1px rgba(255,255,255,.08),0 5px 0 #030709;border:1px solid #334750}.dr-btn.danger{background:linear-gradient(#7d2d2a,#4b1715);color:#fff3ef;box-shadow:inset 0 1px rgba(255,255,255,.08),0 5px 0 #1b0706}.dr-input{width:100%;min-height:50px;margin-top:10px;border-radius:9px;border:1px solid #3a4c56;background:#071014;color:#fff;padding:12px;font-size:17px}.dr-code{font:800 clamp(40px,12vw,70px)/1 monospace;letter-spacing:.13em;color:#ffc46b;text-align:center;margin:12px 0}.dr-qr{width:min(300px,80vw);margin:14px auto;background:white;padding:10px;border-radius:12px}.dr-qr svg{display:block;width:100%;height:auto}.dr-list{display:grid;gap:8px;margin-top:14px}.dr-player{padding:10px 12px;border:1px solid #2d3b43;border-radius:9px;background:#0a1318;display:flex;justify-content:space-between;gap:10px}.dr-note{font-size:13px;color:#82959f}.dr-error{margin-top:12px;padding:10px;border-left:3px solid #e56b52;background:#28110e;color:#ffd4ca}.room-qr-fallback{color:#111;font:800 36px monospace;text-align:center;padding:40px 5px}.dr-formas{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:14px 0}.dr-forma{position:relative;min-height:100px;border:1px solid #344750;border-radius:11px;background:#0a1419;color:#dce8ed;padding:10px 5px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:7px;cursor:pointer;box-shadow:0 4px 0 #020507}.dr-forma input{position:absolute;opacity:0}.dr-forma:has(input:checked){border-color:#e8a94a;background:#25190e;color:#ffc46b}.dr-forma .em{font-size:28px}.dr-forma .lb{font-family:Georgia,serif;font-size:16px;text-align:center}.dr-ident{font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#e8a94a;font-weight:800;margin-top:15px}.dr-choice{width:100%;margin-top:9px;padding:14px;border:1px solid #344750;border-radius:10px;background:#0a1419;color:#dce8ed;text-align:left;cursor:pointer}.dr-choice.on{border-color:#e8a94a;background:#25190e;color:#ffc46b}.dr-choice b,.dr-choice span{display:block}.dr-choice span{margin-top:5px;color:#9eafb8;font-size:13px}.dr-master-info{padding:14px;border-left:3px solid #e8a94a;background:#0a1318;border-radius:8px}.dr-master-info p{margin:.45rem 0}
#dragonSalaBtn{position:fixed;z-index:100002;right:max(14px,env(safe-area-inset-right));bottom:max(14px,env(safe-area-inset-bottom));min-width:140px;height:48px;border:1px solid #4d6774;border-radius:10px;background:#071014;color:#bdeeff;font:800 12px Inter,system-ui,sans-serif;letter-spacing:.16em;text-transform:uppercase;box-shadow:0 6px 22px rgba(0,0,0,.5);cursor:pointer}#dragonSalaPanel{position:fixed;z-index:100003;inset:0;background:rgba(0,0,0,.72);display:flex;align-items:flex-start;justify-content:center;overflow:auto;padding:24px 14px}#dragonSalaPanel .dr-sala-card{width:min(620px,100%);margin:auto;background:#071014;border:1px solid #334750;border-radius:14px;padding:18px;color:#e6edf2;box-shadow:0 22px 60px rgba(0,0,0,.58);font-family:Inter,system-ui,sans-serif}.dr-sala-head{display:flex;justify-content:space-between;gap:12px;align-items:center}.dr-sala-head h2{font:600 34px Georgia,serif;margin:0}.dr-close{border:1px solid #344750;background:#101b21;color:#e6edf2;border-radius:8px;padding:10px 14px;cursor:pointer;font-weight:800}.dr-sala-section{margin-top:14px;padding-top:14px;border-top:1px solid #26343c}.dr-sala-section summary{cursor:pointer;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#afc8d5}.dr-sala-code{font:800 38px monospace;letter-spacing:.15em;text-align:center;color:#ffc46b;margin:12px 0}.dr-sala-qr{width:min(250px,75vw);margin:auto;background:#fff;padding:10px;border-radius:10px}.dr-sala-qr svg{display:block;width:100%;height:auto}.dr-sala-actions{display:grid;gap:8px;margin-top:12px}
`;document.head.appendChild(st)}
function gate(){let el=document.getElementById('dragonRoomGate');if(!el){el=document.createElement('div');el.id='dragonRoomGate';document.body.appendChild(el)}return el}
function formas(selected='m'){return `<div class="dr-formas">${Object.entries(FORMAS).map(([id,f])=>`<label class="dr-forma"><input type="radio" name="drForma" value="${id}" ${id===selected?'checked':''}><span class="em">${f.emoji}</span><span class="lb">${f.label}</span></label>`).join('')}</div>`}
function formaAtual(){return document.querySelector('input[name="drForma"]:checked')?.value||'m'}

function menu(error=''){
  gate().innerHTML=`<div class="dr-shell"><div class="dr-brand">DRAGON GAMES · ${esc(TITLE)}</div><div class="dr-card"><h1>${esc(TITLE)}</h1><p>O Mestre abre a mesa. Os jogadores entram pelo QR ou pelo código.</p>${error?`<div class="dr-error">${esc(error)}</div>`:''}<button class="dr-btn" id="drOpen">Abrir uma mesa</button><button class="dr-btn secondary" id="drJoin">Entrar em uma mesa</button><button class="dr-btn secondary" id="drSolo">Ensaiar neste aparelho</button></div></div>`;
  /* Sem a seta, o clique entra como primeiro argumento — e o primeiro
     argumento de renderMasterGate é a mensagem de erro. A tela abria
     acusando '[object PointerEvent]' antes de qualquer coisa dar errado. */
  document.getElementById('drOpen').onclick=()=>{intencao='sala';renderMasterGate()};
  document.getElementById('drJoin').onclick=()=>formEntrar('');
  /* Ensaiar era a porta dos fundos: entrava direto no jogo, sem conta e sem
     conferência nenhuma. Passa pela mesma validação do Google e pela mesma
     lista de mestres — o que ele dispensa é a SALA, não a autorização. Nenhum
     documento é criado no Firestore, e sem sala não há botão Sala. */
  document.getElementById('drSolo').onclick=()=>{intencao='ensaio';renderMasterGate()};
}
function renderMasterGate(error=''){
  const ensaio=intencao==='ensaio';
  const modoHtml=PROJECT==='mesa'
    ? `<div class="dr-ident">Como a mesa será usada?</div><button class="dr-choice ${modo==='com-telao'?'on':''}" data-mode="com-telao"><b>📺 Com telão</b><span>Um aparelho fica no painel.</span></button><button class="dr-choice ${modo==='sem-telao'?'on':''}" data-mode="sem-telao"><b>📱 Sem telão</b><span>Quem abre também joga pelo celular.</span></button>`
    : `<div class="dr-ident">Como a mesa será usada?</div><div class="dr-master-info"><p><b>📱 Celular</b></p><p>A Noite é conduzida diretamente pelo celular do Mestre.</p></div>`;
  /* No ensaio o modo e o ritmo não têm o que configurar: não existe sala, não
     existe telão e não existe ninguém para esperar. Fica só a validação. */
  const corpo=ensaio
    ? `<div class="dr-master-info"><p><b>📱 Só neste aparelho</b></p><p>Nenhuma sala é aberta e ninguém entra por QR. Serve para você percorrer a partida sozinho.</p></div>`
    : `${modoHtml}<div class="dr-ident">Como as rodadas devem avançar?</div><button class="dr-choice ${ritmo==='automatico'?'on':''}" data-rhythm="automatico"><b>AUTOMATICAMENTE · RECOMENDADO</b><span>O jogo avança quando todos terminam.</span></button><button class="dr-choice ${ritmo==='conduzido'?'on':''}" data-rhythm="conduzido"><b>COM MINHA LIBERAÇÃO</b><span>A Sala avisará quando for hora de avançar.</span></button>`;
  gate().innerHTML=`<div class="dr-shell"><div class="dr-brand">${esc(TITLE)} · ÁREA DO MESTRE</div><div class="dr-card"><h2>${ensaio?'Ensaiar neste aparelho':'Abrir uma mesa'}</h2>${corpo}${senhaLiberada()?'<p class="dr-note">Mestre reconhecido neste aparelho.</p>':'<input class="dr-input" id="drPass" type="password" autocomplete="off" placeholder="senha">'}${error?`<div class="dr-error">${esc(error)}</div>`:''}<button class="dr-btn" id="drGoogle">${ensaio?'Ensaiar com Google':'Abrir com Google'}</button><button class="dr-btn secondary" id="drBack">Cancelar</button></div></div>`;
  document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{modo=b.dataset.mode;renderMasterGate()});
  document.querySelectorAll('[data-rhythm]').forEach(b=>b.onclick=()=>{ritmo=b.dataset.rhythm;renderMasterGate()});
  document.getElementById('drGoogle').onclick=senhaLiberada()?loginMestre:conferirSenha;
  document.getElementById('drBack').onclick=()=>menu();
  const p=document.getElementById('drPass');if(p){p.onkeydown=e=>{if(e.key==='Enter')conferirSenha()};setTimeout(()=>p.focus(),20)}
}
async function conferirSenha(){
  const txt=(document.getElementById('drPass')?.value||'').trim();if(!txt)return renderMasterGate('Escreva a senha.');
  try{if((await sha256hex(txt))!==SENHA_HASH)return renderMasterGate('Senha incorreta.');try{sessionStorage.setItem(MESTRE_LOCAL,'1')}catch(e){}await loginMestre();}
  catch(e){renderMasterGate('Este navegador não permite conferir a senha.');}
}
/* O redirect só volta com resultado quando a página e o authDomain estão na
   mesma origem. Aqui a página é drmarionascimento.github.io e o authDomain é
   <projeto>.firebaseapp.com — origens diferentes. Desde o SDK 9.13 todo
   navegador que particiona armazenamento de terceiros (Safari e, por tabela,
   qualquer navegador de iPhone; Firefox; e cada vez mais o Chrome) devolve
   getRedirectResult VAZIO nessa situação: a pessoa vai ao Google, volta, e o
   bootstrap cai no menu. É o login em laço que nunca abre mesa.

   Mandar todo celular direto para o redirect (d21682b, "Abre o Google uma vez
   só no celular") transformou o caso raro em regra: no celular não havia mais
   nenhum caminho que funcionasse.

   O popup funciona nos dois lados — no celular ele abre uma aba e volta
   sozinho, sem sair da página. Ele volta a ser o caminho; o redirect fica só
   para quem realmente bloqueia popup, e nesse caso a volta é anunciada em vez
   de virar menu silencioso. */
async function autorizado(user){
  const cfg=await getDoc(doc(db,'config','mestres'));
  const permitidos=cfg.exists()&&Array.isArray(cfg.data().emails)?cfg.data().emails:[];
  return permitidos.includes((user.email||'').trim());
}
/* Ninguém mais parte para o redirect, mas quem já estava no meio de uma viagem
   antiga volta com esta marca. Ler e apagar limpa o resto e devolve o que o
   Mestre havia escolhido antes de sair da página. */
function recuperarEscolhas(){
  let bruto=null;try{bruto=sessionStorage.getItem('dragon.room.open')}catch{}
  if(!bruto)return false;
  try{sessionStorage.removeItem('dragon.room.open')}catch{}
  try{const e=JSON.parse(bruto);if(e?.modo)modo=e.modo;if(e?.ritmo)ritmo=e.ritmo}catch{}
  return true;
}
async function abrirComoMestre(user){
  pendingUser=user;
  if(!(await autorizado(user))){await signOut(auth);pendingUser=null;return renderMasterGate('Esta conta Google não está autorizada a abrir mesas.');}
  if(intencao==='ensaio')return liberarEnsaio();
  await criarSalaBase();
}
/* O ensaio passa pela mesma validação e não cria nada: sem documento de sala,
   sem código, sem QR. `role` fica vazio de propósito — é ele que decide se o
   botão flutuante da Sala é instalado, e no ensaio não há sala para abrir. */
function liberarEnsaio(){
  role='';code='';room=null;
  liberar({local:true,ensaio:true});
}
/* A mensagem crua do SDK chegava em inglês e falando de SAML: "Unable to
   process request due to missing initial state…". Quem lê é o Mestre com o
   celular na mão, no escuro, com a mesa esperando. Cada erro que a gente sabe
   nomear vira uma frase que diz o que fazer. */
function mensagemLogin(e){
  const c=e?.code||'',txt=String(e?.message||'');
  if(c==='auth/missing-initial-state'||/missing initial state/i.test(txt))
    return 'Este navegador apagou o estado do login no meio do caminho — é o que acontece quando a página volta de um redirecionamento. Toque em “Abrir com Google” de novo: agora a janela abre por cima desta página, sem sair dela.';
  if(c==='auth/popup-blocked')
    return 'O navegador bloqueou a janela do Google. Libere o pop-up para esta página e tente de novo. Se você abriu por dentro de outro aplicativo, abra a página no Safari ou no Chrome.';
  if(c==='auth/popup-closed-by-user'||c==='auth/cancelled-popup-request')
    return 'A janela do Google foi fechada antes de concluir. Toque em “Abrir com Google” para tentar outra vez.';
  if(c==='auth/unauthorized-domain')
    return 'Este endereço não está autorizado no Firebase Auth deste projeto.';
  if(c==='auth/network-request-failed')
    return 'A rede caiu durante o login. Confira a conexão e tente de novo.';
  return txt||'Não foi possível entrar com Google.';
}
/* Sem queda para o redirect. Nesta hospedagem ele nunca conclui — a página sai
   de drmarionascimento.github.io e o authDomain é <projeto>.firebaseapp.com, e
   o navegador que particiona armazenamento devolve missing-initial-state na
   volta. Mandar alguém para lá é tirá-lo da página para trazê-lo de volta com
   um erro. Quando o popup não abre, o caminho é liberar o popup — e a mensagem
   diz isso. */
async function loginMestre(){
  try{
    const provider=new GoogleAuthProvider();provider.setCustomParameters({prompt:'select_account'});
    const {user}=await signInWithPopup(auth,provider);
    await abrirComoMestre(user);
  }catch(e){renderMasterGate(mensagemLogin(e))}
}
async function criarSalaBase(){
  try{
    const u=pendingUser||auth.currentUser;if(!u)throw new Error('Login Google não encontrado.');
    code=gerar();for(let i=0;i<8;i++){if(!(await getDoc(roomRef(code))).exists())break;code=gerar()}
    await setDoc(roomRef(code),{ativa:true,fase:'sala',mestreUid:u.uid,criadaEm:serverTimestamp(),criadaEmMs:Date.now(),modo,ritmo,caseId:CASE_ID});
    role='master';room={ativa:true,fase:'sala',mestreUid:u.uid,modo,ritmo,caseId:CASE_ID};
    formEntrar('',true);
  }catch(e){renderMasterGate('Não foi possível criar a mesa. '+(e?.message||e))}
}
function formEntrar(err='',asMaster=false){
  /* O campo do nome vinha preenchido com o displayName da conta Google, então o
     Mestre entrava na mesa com o nome civil completo e ele aparecia no lobby e
     no estado público para todos os participantes. Isto é um jogo: o nome é da
     partida, escolhido na hora, e a conta Google serve só para autorizar quem
     abre. O campo nasce vazio, e nada da conta é gravado — o documento do
     jogador guarda apenas o que foi digitado aqui. */
  /* Eram duas telas para o Mestre: uma explicando o botão Sala, com um "Entendi
     · continuar", e só depois o formulário de nome. Logo após o Google, isso
     parecia pedido de login repetido. O aviso da Sala virou um bloco dentro do
     próprio formulário, e o Mestre entra na mesa em um toque.

     Aqui o Mestre não tem "Voltar": a sala já existe no Firestore quando esta
     tela aparece, e voltar ao menu a deixaria órfã, aberta e sem dono. */
  const aviso=asMaster?`<div class="dr-master-info"><p>Sala criada. Durante a partida você continua jogando normalmente.</p><p>O botão <b>Sala</b> fica disponível o tempo todo: por ele você acompanha os participantes, consulta QR e código, e encerra a sala.</p></div>`:'';
  gate().innerHTML=`<div class="dr-shell"><div class="dr-brand">${esc(TITLE)}${asMaster?' · ÁREA DO MESTRE':''}</div><div class="dr-card"><h2>${asMaster?'Sua mesa está aberta':'Quem chega agora?'}</h2><p>Escolha o nome que a mesa vai ver nesta partida. Não precisa ser o seu.</p>${aviso}<input class="dr-input" id="drCode" maxlength="6" placeholder="CÓDIGO" value="${esc(code||q||'')}" ${asMaster?'readonly':''}><div class="dr-ident">Nome nesta partida</div><input class="dr-input" id="drName" maxlength="24" placeholder="Como quer ser chamado" autocomplete="off">${formas('m')}${err?`<div class="dr-error">${esc(err)}</div>`:''}<button class="dr-btn" id="drEnter">${asMaster?'Entrar na mesa':'Entrar'}</button>${asMaster?'':'<button class="dr-btn secondary" id="drBack">Voltar</button>'}</div></div>`;
  document.getElementById('drBack')?.addEventListener('click',()=>menu());
  document.getElementById('drEnter').onclick=()=>entrar(asMaster);
  setTimeout(()=>document.getElementById('drName')?.focus(),20)
}
async function entrar(asMaster=false){
  try{
    code=(document.getElementById('drCode').value||'').trim().toUpperCase();const nome=(document.getElementById('drName').value||'').trim(),forma=formaAtual();
    if(code.length!==6||!nome)return formEntrar('Informe o código e seu nome.',asMaster);
    /* Autenticar antes de ler. A regra de `get` exige signedIn(), e um
       aparelho que chega pelo QR não tem sessão nenhuma: lendo primeiro, o
       convidado levava "Missing or insufficient permissions" antes mesmo de
       existir para o Firebase. O Mestre nunca viu, porque já entrou com o
       Google. O padrão manda que a autenticação anônima do convidado
       aconteça em segundo plano — é este o lugar dela. */
    let u;
    if(asMaster){u=pendingUser||auth.currentUser;if(!u)throw new Error('Mestre não autenticado.');}
    else{u=auth.currentUser;if(!u||!u.isAnonymous){if(u)await signOut(auth);u=(await signInAnonymously(auth)).user;}}
    const snap=await getDoc(roomRef(code));if(!snap.exists()||snap.data().ativa!==true)return formEntrar('Sala não encontrada ou encerrada.',asMaster);
    if(snap.data().caseId&&snap.data().caseId!==CASE_ID)return formEntrar('Esse código pertence a outro caso do MOSAICO.',asMaster);
    await setDoc(playerRef(code,u.uid),{nome:nome.slice(0,24),forma,mestre:!!asMaster,pronto:true,entrouMs:Date.now(),atualizadoEmMs:Date.now()},{merge:true});
    /* Quem manda sobre isto é o documento da sala, não o caminho que a pessoa
       tomou para chegar aqui. O Mestre que recarrega, que volta pelo QR ou que
       reconecta entra pelo mesmo formulário do convidado — e saía marcado como
       convidado, perdendo a abertura e o painel Sala na própria mesa que abriu.
       Comparar o uid com mestreUid devolve a verdade em qualquer caminho. */
    role=(asMaster||snap.data().mestreUid===u.uid)?'master':'guest';ouvir();
  }catch(e){formEntrar(e?.message||'Não foi possível entrar.',asMaster)}
}
function ouvir(){
  unsubRoom?.();unsubPlayers?.();
  unsubRoom=onSnapshot(roomRef(code),s=>{room=s.exists()?s.data():null;if(!room){if(!gameReleased)menu();return;}if(room.fase==='jogo'&&!gameReleased)liberar({code,role,room,players});else if(!gameReleased)renderLobby();else atualizarSalaPersistente();});
  unsubPlayers=onSnapshot(collection(db,ROOT,code,'jogadores'),s=>{players=s.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(a.entrouMs||0)-(b.entrouMs||0));if(!gameReleased)renderLobby();else atualizarSalaPersistente()});
}
function renderLobby(){
  if(!code||!room)return;const master=role==='master';
  gate().innerHTML=`<div class="dr-shell"><div class="dr-brand">${esc(TITLE)} · ${master?'MESTRE DA MESA':'SALA'}</div><div class="dr-card"><h2>${master?'Sala aberta':'Você entrou'}</h2><div class="dr-code">${esc(code)}</div>${master?`<div class="dr-qr">${qr(code)}</div><p class="dr-note">QR e código ficam nesta sala durante toda a entrada dos participantes.</p>`:''}<div class="dr-list">${players.map(p=>{const f=FORMAS[p.forma]||FORMAS.n;return `<div class="dr-player"><span>${f.emoji} ${esc(p.nome||'Jogador')}</span><b>${p.mestre?'Mestre':'Jogador'}</b></div>`}).join('')||'<div class="dr-player"><span>Aguardando jogadores…</span></div>'}</div>${master?`<button class="dr-btn" id="drStart">Começar o jogo</button>`:`<p class="dr-note">Aguardando o Mestre iniciar a partida…</p>`}</div></div>`;
  if(master)document.getElementById('drStart').onclick=async()=>{await updateDoc(roomRef(code),{fase:'jogo',iniciadaEmMs:Date.now()})}
}
function liberar(detail){
  gameReleased=true;document.getElementById('dragonRoomGate')?.remove();window.MOSAICO_ROOM=detail;
  if(role==='master')instalarSalaPersistente();
  window.dispatchEvent(new CustomEvent(READY_EVENT,{detail}));
}
function instalarSalaPersistente(){
  if(document.getElementById('dragonSalaBtn'))return;
  const b=document.createElement('button');b.id='dragonSalaBtn';b.type='button';b.textContent='Sala';b.onclick=()=>{salaAberta=!salaAberta;atualizarSalaPersistente()};document.body.appendChild(b);atualizarSalaPersistente();
}
function atualizarSalaPersistente(){
  if(role!=='master'||!gameReleased)return;
  let p=document.getElementById('dragonSalaPanel');
  if(!salaAberta){p?.remove();return;}
  if(!p){p=document.createElement('div');p.id='dragonSalaPanel';document.body.appendChild(p)}
  p.innerHTML=`<div class="dr-sala-card"><div class="dr-sala-head"><div><div class="dr-brand">MESTRE · ${esc(TITLE)}</div><h2>Sala</h2><p class="dr-note">${room?.ritmo==='conduzido'?'Ritmo conduzido pelo Mestre':'Ritmo automático'}</p></div><button class="dr-close" id="drSalaClose">Fechar</button></div><details class="dr-sala-section" open><summary>Código e QR da sala</summary><div class="dr-sala-code">${esc(code)}</div><div class="dr-sala-qr">${qr(code)}</div></details><details class="dr-sala-section"><summary>Participantes · ${players.length}</summary><div class="dr-list">${players.map(x=>`<div class="dr-player"><span>${esc(x.nome||'Jogador')}</span><b>${x.mestre?'Mestre':'Jogador'}</b></div>`).join('')}</div></details><details class="dr-sala-section"><summary>Encerrar sala</summary><div class="dr-sala-actions"><button class="dr-btn danger" id="drEndRoom">Encerrar sala</button></div></details></div>`;
  document.getElementById('drSalaClose').onclick=()=>{salaAberta=false;atualizarSalaPersistente()};
  document.getElementById('drEndRoom').onclick=encerrarSala;
}
async function encerrarSala(){
  if(role!=='master'||!code)return;
  if(!confirm('Encerrar esta sala para todos os participantes?'))return;
  try{await updateDoc(roomRef(code),{ativa:false,encerradaEmMs:Date.now()});location.href=location.pathname;}
  catch(e){alert('Não foi possível encerrar a sala. '+(e?.message||e));}
}
css();
getRedirectResult(auth).then(r=>{
  const voltandoDoGoogle=recuperarEscolhas();
  /* Se o Google devolveu usuário, seguimos mesmo sem a marca da viagem: alguns
     navegadores limpam o sessionStorage no salto. O contrário é o que não pode
     passar em silêncio — saiu para o Google, voltou sem nada, e antes disso
     reaparecia o menu como se nada tivesse acontecido. */
  if(r?.user)return abrirComoMestre(r.user);
  if(voltandoDoGoogle)return renderMasterGate('O Google voltou sem concluir o login neste navegador. Toque em “Abrir com Google” de novo: desta vez a janela abre por cima desta página, sem sair dela.');
  if(q){code=q.toUpperCase();return formEntrar('',false)}
  menu();
}).catch(e=>{
  const voltandoDoGoogle=recuperarEscolhas();
  /* O missing-initial-state é justamente o caso em que a marca da viagem some
     junto com o resto do estado — exigir a marca para mostrar o erro deixava a
     falha cair no menu outra vez, calada. O código do erro basta para saber que
     havia um login em curso. */
  const erroDeLogin=/missing initial state|auth\//i.test(String(e?.code||'')+' '+String(e?.message||''));
  if(voltandoDoGoogle||erroDeLogin)return renderMasterGate(mensagemLogin(e));
  if(q){code=q.toUpperCase();return formEntrar('',false)}
  menu();
});

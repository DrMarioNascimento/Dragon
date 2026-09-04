/* MOSAICO — conta Google e progresso pessoal no projeto mosaico-noite.
   Usado por A Noite (v2) e Modo Solo. A Mesa permanece isolada no projeto
   mosaico-game. O jogo só é carregado depois que a conta foi resolvida e o
   estado remoto, quando disponível, foi restaurado no localStorage. */
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";
import {
  getAuth, GoogleAuthProvider, onAuthStateChanged, signInWithPopup,
  signInWithRedirect, getRedirectResult, signOut
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";
import {
  getFirestore, doc, getDoc, setDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

const firebaseConfig={
  apiKey:"AIzaSyA160bkgHBrYBwvIxlENax-aAyLWPMaOU4",
  authDomain:"mosaico-noite.firebaseapp.com",
  projectId:"mosaico-noite",
  storageBucket:"mosaico-noite.firebasestorage.app",
  messagingSenderId:"703343424116",
  appId:"1:703343424116:web:e6990b5c00d43aca6e9721"
};
const APP_NAME="mosaico-conta";
const firebaseApp=getApps().find(a=>a.name===APP_NAME)||initializeApp(firebaseConfig,APP_NAME);
const auth=getAuth(firebaseApp);
const db=getFirestore(firebaseApp);
const tag=document.querySelector('script[type="module"][src*="firebase-user.js"]');
const experience=(tag&&tag.dataset.experience)||"mosaico";
const storageKeys=((tag&&tag.dataset.storageKeys)||"").split(",").map(s=>s.trim()).filter(Boolean);
let firestoreOk=true,lastSignature="",syncTimer=null,currentUser=null;

function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));}
function css(){
  if(document.getElementById("mosaico-cloud-style"))return;
  const s=document.createElement("style");s.id="mosaico-cloud-style";s.textContent=`
  #mosaico-login{position:fixed;inset:0;z-index:100000;display:flex;align-items:center;justify-content:center;padding:24px;background:radial-gradient(800px 500px at 50% 0,#2b170b 0,transparent 58%),#070605;color:#f4ead7;font-family:Inter,system-ui,sans-serif}
  #mosaico-login .ml-card{width:min(430px,100%);padding:28px 24px;border:1px solid rgba(232,187,85,.35);border-radius:16px;background:linear-gradient(160deg,#21170f,#0e0b08);box-shadow:inset 0 1px rgba(255,255,255,.06),0 7px 0 #020201,0 26px 70px #000b;text-align:center}
  #mosaico-login .ml-k{font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:#e8bb55;font-weight:800}
  #mosaico-login h1{margin:10px 0 5px;font:600 clamp(42px,12vw,64px)/.95 "Cormorant Garamond",Georgia,serif}
  #mosaico-login h2{margin:5px 0 16px;font:600 24px/1.15 "Cormorant Garamond",Georgia,serif;color:#ffd982}
  #mosaico-login p{color:#c6b69f;line-height:1.5;margin:0 0 20px}
  #mosaico-login button{width:100%;min-height:52px;border:0;border-radius:10px;padding:13px 16px;background:linear-gradient(#ffd979,#dba22f);color:#201503;font:800 14px Inter,system-ui,sans-serif;letter-spacing:.07em;text-transform:uppercase;box-shadow:inset 0 1px #fff7cc,0 5px 0 #77500d;cursor:pointer}
  #mosaico-login .ml-status{min-height:22px;margin-top:14px;color:#f0c990;font-size:13px}
  #mosaico-account{position:fixed;z-index:99990;right:10px;top:max(9px,env(safe-area-inset-top));display:flex;align-items:center;gap:7px;max-width:min(66vw,360px);padding:7px 9px;border:1px solid rgba(232,187,85,.32);border-radius:999px;background:rgba(7,6,5,.88);backdrop-filter:blur(10px);color:#f4ead7;font:600 11px/1.15 Inter,system-ui,sans-serif;box-shadow:0 5px 18px #0008}
  #mosaico-account span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}#mosaico-account button{border:0;background:transparent;color:#ffd982;font:800 10px Inter,system-ui,sans-serif;text-transform:uppercase;cursor:pointer;padding:4px}
  #mosaico-account.warn{border-color:#b85b46}#mosaico-account.warn:before{content:"!";color:#ff9b7e;font-weight:900}
  `;document.head.appendChild(s);
}
function tituloExperiencia(){return experience.includes("solo")?"Modo Solo":"A Noite";}
function gate(msg){
  css();let g=document.getElementById("mosaico-login");if(!g){g=document.createElement("div");g.id="mosaico-login";document.body.appendChild(g)}
  g.innerHTML=`<div class="ml-card"><div class="ml-k">Dragon Games · MOSAICO</div><h1>A Casa da Costa</h1><h2>${esc(tituloExperiencia())}</h2><p>Entre com Google para continuar. A pergunta, a rotação e o progresso ficam vinculados à sua conta e podem ser retomados em outro aparelho.</p><button id="mosaico-google">Entrar com Google</button><div class="ml-status">${esc(msg||"")}</div></div>`;
  document.getElementById("mosaico-google").onclick=entrarGoogle;
}
function hideGate(){let g=document.getElementById("mosaico-login");if(g)g.remove();}
function accountChip(user){
  let c=document.getElementById("mosaico-account");if(!c){c=document.createElement("div");c.id="mosaico-account";document.body.appendChild(c)}
  c.classList.toggle("warn",!firestoreOk);c.title=firestoreOk?"Progresso sincronizado no Firebase":"Conta Google ativa; sincronização aguardando regras do Firestore";
  c.innerHTML=`<span>${esc(user.displayName||user.email||"Google")}${firestoreOk?" · Firebase":" · local"}</span><button>Sair</button>`;
  c.querySelector("button").onclick=sair;
}
function storageSnapshot(){const o={};for(const k of storageKeys){try{o[k]=localStorage.getItem(k)}catch(e){o[k]=null}}return o;}
function signature(o){return JSON.stringify(o);}
function progressRef(user){return doc(db,"usuarios",user.uid,"experiencias",experience);}
async function restore(user){
  try{
    const snap=await getDoc(progressRef(user));firestoreOk=true;
    if(snap.exists()){
      const st=snap.data().storage||{};
      for(const k of storageKeys){if(!Object.prototype.hasOwnProperty.call(st,k))continue;try{if(st[k]==null)localStorage.removeItem(k);else localStorage.setItem(k,String(st[k]))}catch(e){}}
    }
  }catch(e){firestoreOk=false;console.warn("MOSAICO: progresso remoto indisponível",e)}
  lastSignature=signature(storageSnapshot());
}
async function sync(force){
  if(!currentUser)return;const storage=storageSnapshot(),sig=signature(storage);if(!force&&sig===lastSignature)return;
  try{
    await setDoc(progressRef(currentUser),{storage,email:currentUser.email||"",nome:currentUser.displayName||"",experiencia:experience,atualizadoEm:serverTimestamp()},{merge:true});
    firestoreOk=true;lastSignature=sig;accountChip(currentUser);
  }catch(e){firestoreOk=false;accountChip(currentUser);console.warn("MOSAICO: não foi possível salvar no Firestore",e)}
}
function startSync(){clearInterval(syncTimer);syncTimer=setInterval(()=>sync(false),900);document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="hidden")sync(true)});window.addEventListener("pagehide",()=>sync(true));}
async function entrarGoogle(){
  /* Sem `prompt:"select_account"`: ele obrigava a escolher a conta mesmo com
     sessão viva no Google, e era o que fazia parecer que o login não colava.
     Quem já entrou uma vez volta direto. */
  const status=document.querySelector("#mosaico-login .ml-status"),provider=new GoogleAuthProvider();if(status)status.textContent="Abrindo o Google…";
  try{await signInWithPopup(auth,provider)}catch(e){const code=e&&e.code||"";if(code==="auth/popup-blocked"||code==="auth/operation-not-supported-in-this-environment"){if(status)status.textContent="Redirecionando para o Google…";await signInWithRedirect(auth,provider);return}if(status)status.textContent=(code==="auth/unauthorized-domain"?"Este domínio ainda não está autorizado no Firebase.":code==="auth/operation-not-allowed"?"Ative o provedor Google no projeto mosaico-noite.":"Não foi possível entrar com Google.")}}
async function sair(){try{await sync(true)}catch(e){}clearInterval(syncTimer);try{await signOut(auth)}catch(e){}location.reload();}
async function ready(user){currentUser=user;await restore(user);hideGate();accountChip(user);startSync();window.MosaicoUserCloud={user,entrarGoogle,sair,sincronizarAgora:()=>sync(true),get firestoreOk(){return firestoreOk}};window.dispatchEvent(new CustomEvent("mosaico-cloud-ready",{detail:{user,firestoreOk,experience}}));}
css();gate("Verificando sua conta…");
try{await getRedirectResult(auth)}catch(e){}
/* O SOLO NÃO PEDE MAIS LOGIN PARA COMEÇAR (03/09/2026).
   Isto era um portão: sem conta Google, a tela de entrada ficava para sempre e
   o jogo nunca carregava. Num modo de UMA pessoa, a conta serve para levar o
   progresso a outro aparelho — é conveniência, não requisito, e não deveria
   estar entre a pessoa e o jogo.

   Sem conta, o jogo entra em modo local: o progresso fica no aparelho, e o
   convite para entrar com Google vira um selo discreto no canto em vez de uma
   parede. Quem entrar depois recupera o que estava na nuvem pelo `restore`.

   Nada disso afrouxa a privacidade: sem conta não há leitura nem escrita no
   Firestore, e as regras de `usuarios/{uid}` continuam exigindo que o uid do
   pedido seja o dono. O que mudou é só quem é obrigado a se identificar para
   jogar sozinho. */
function convite(){
  css();
  let c=document.getElementById("mosaico-account");
  if(!c){c=document.createElement("div");c.id="mosaico-account";document.body.appendChild(c)}
  c.classList.remove("warn");
  c.title="Entrar com Google leva seu progresso para outros aparelhos";
  c.innerHTML='<span>progresso neste aparelho</span><button>Entrar</button>';
  c.querySelector("button").onclick=entrarGoogle;
}
function prontoLocal(){
  currentUser=null;hideGate();convite();
  window.MosaicoUserCloud={user:null,entrarGoogle,sair,sincronizarAgora:()=>{},get firestoreOk(){return false}};
  window.dispatchEvent(new CustomEvent("mosaico-cloud-ready",{detail:{user:null,firestoreOk:false,experience}}));
}
let handled=false;
onAuthStateChanged(auth,user=>{
  if(handled&&user===currentUser)return;
  if(user){handled=true;ready(user)}
  else if(!handled){handled=true;prontoLocal()}
  else{currentUser=null;convite()}
});

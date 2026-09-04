/* MOSAICO · Laboratório RA — a porta do card.
   ==========================================================================

   O QUE MUDOU (03/09/2026)
   Era uma senha: sha256 de uma constante escrita neste arquivo, conferida no
   navegador. Agora é o mesmo par que as mesas já usam para saber quem pode
   abrir sala — conta Google mais a lista `config/mestres`, que mora no
   Firestore e é lida do servidor.

   A diferença que importa não é a tela: é que a senha estava AQUI, legível
   por quem abrisse o código-fonte, e a lista não está. Trocar quem entra
   deixou de ser reescrever o hash e virou editar um documento.

   A VALIDAÇÃO É DO CARD INTEIRO, não de cada página. Quem passa uma vez entra
   em qualquer bancada do laboratório; quem não passa não entra em nenhuma.
   `data-ra-protected` continua marcando as páginas de dentro.

   O LIMITE, DITO SEM MAQUIAGEM
   O GitHub Pages serve arquivo estático: quem souber o endereço baixa o HTML
   sem passar por porta nenhuma, e a marca de liberado vive no sessionStorage
   deste navegador. Isto é barreira de acesso casual, e é honesto enquanto o
   que estiver atrás dela for protótipo.

   O que NÃO pode ir para cá é dado que precise mesmo ficar fechado. Para esse,
   a barreira tem de estar nas Regras do Firestore, onde não há console que
   contorne — é lá que `emailMestre()` protege as salas de verdade. */
(() => {
  "use strict";

  const ACCESS_KEY = "dragon.ra.access.v1";
  const isProtected = document.documentElement.hasAttribute("data-ra-protected");

  let isUnlocked = false;
  try { isUnlocked = sessionStorage.getItem(ACCESS_KEY) === "liberado"; }
  catch (error) { isUnlocked = false; }

  if (isProtected && !isUnlocked) {
    window.location.replace("../index.html?laboratorio=acesso#laboratorio-ra");
    return;
  }

  /* Mesmo projeto que a Mesa usa, e é de propósito: a lista de quem pode é uma
     só. Duas listas seriam duas verdades, e uma delas ficaria velha. */
  const CFG = {
    apiKey: "AIzaSyDwshZbqaMOKxdRuyLtdpbijPRdrjVOcxE",
    authDomain: "mosaico-game.firebaseapp.com",
    projectId: "mosaico-game",
    storageBucket: "mosaico-game.firebasestorage.app",
    messagingSenderId: "436141261767",
    appId: "1:436141261767:web:6a83555a2f7c4ed4550fe2",
  };

  async function firebase() {
    const [appmod, authmod, fs] = await Promise.all([
      import("https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js"),
      import("https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js"),
    ]);
    const app =
      appmod.getApps().find(a => a.name === "dragon-mesa") ||
      appmod.getApps().find(a => a.name === "dragon-lab") ||
      appmod.initializeApp(CFG, "dragon-lab");
    return { auth: authmod.getAuth(app), authmod, fs, db: fs.getFirestore(app) };
  }

  /* Uma vez, e só uma: sem `prompt:'select_account'` e reaproveitando a sessão
     que o navegador já guarda. É a mesma regra que passou a valer nas mesas
     hoje — pedir de novo o que já se tem é pedágio, não segurança. */
  async function entrarComGoogle() {
    const { auth, authmod, fs, db } = await firebase();
    let user = auth.currentUser;
    if (!user || user.isAnonymous || !user.email) {
      const provider = new authmod.GoogleAuthProvider();
      user = (await authmod.signInWithPopup(auth, provider)).user;
    }
    const snap = await fs.getDoc(fs.doc(db, "config", "mestres"));
    const emails = snap.exists() && Array.isArray(snap.data().emails) ? snap.data().emails : [];
    if (!emails.includes((user.email || "").trim())) {
      await authmod.signOut(auth).catch(() => {});
      const erro = new Error("Esta conta Google não está autorizada no laboratório.");
      erro.recusado = true;
      throw erro;
    }
    return user;
  }

  function ready() {
    const form = document.getElementById("ra-access-form");
    const message = document.getElementById("ra-access-message");

    if (form && message) {
      form.addEventListener("submit", async event => {
        event.preventDefault();
        const button = form.querySelector("button[type='submit']");
        button.disabled = true;
        message.textContent = "Verificando a conta…";
        try {
          await entrarComGoogle();
          try { sessionStorage.setItem(ACCESS_KEY, "liberado"); } catch (e) {}
          message.textContent = "Acesso liberado.";
          window.location.assign(form.dataset.destination || "laboratorio-ra/");
        } catch (error) {
          message.textContent = error && error.recusado
            ? error.message
            : "Não foi possível entrar com Google. " + ((error && error.message) || "");
        } finally {
          button.disabled = false;
        }
      });

      if (new URLSearchParams(window.location.search).get("laboratorio") === "acesso") {
        document.getElementById("laboratorio-ra")?.scrollIntoView({ block: "center" });
      }
    }

    document.querySelectorAll("[data-ra-lock]").forEach(button => {
      button.addEventListener("click", () => {
        try { sessionStorage.removeItem(ACCESS_KEY); } catch (e) {}
        window.location.replace("../index.html#laboratorio-ra");
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", ready, { once: true });
  } else {
    ready();
  }
})();

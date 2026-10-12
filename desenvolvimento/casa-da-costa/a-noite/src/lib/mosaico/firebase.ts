import { getApps, initializeApp } from "firebase/app";
import {
  GoogleAuthProvider,
  getAuth,
  getRedirectResult,
  linkWithPopup,
  signInAnonymously,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type User,
} from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getFirestore,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  type Unsubscribe,
} from "firebase/firestore";

/** A Noite — app Firebase isolado da mesa HTML (`mesa` / coleção `mosaico`). */
export const EDICAO = "noite";

export const firebaseConfig = {
  apiKey: "AIzaSyA160bkgHBrYBwvIxlENax-aAyLWPMaOU4",
  authDomain: "mosaico-noite.firebaseapp.com",
  projectId: "mosaico-noite",
  storageBucket: "mosaico-noite.firebasestorage.app",
  messagingSenderId: "703343424116",
  appId: "1:703343424116:web:e6990b5c00d43aca6e9721",
};

const app =
  getApps().find((a) => a.name === EDICAO) ?? initializeApp(firebaseConfig, EDICAO);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const ROOT = "noite";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function gerarCodigo() {
  let s = "";
  for (let i = 0; i < 6; i++) s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return s;
}

export function isGoogleUser(user: User | null | undefined) {
  return !!user && user.providerData.some((p) => p.providerId === "google.com");
}

export async function consumeGoogleRedirect(): Promise<User | null> {
  try {
    const res = await getRedirectResult(auth);
    return res?.user ?? null;
  } catch {
    return null;
  }
}

function googleProvider() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  return provider;
}

function authMessage(e: unknown) {
  const code = e && typeof e === "object" && "code" in e ? String((e as { code: string }).code) : "";
  if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
    return "Login com Google cancelado.";
  }
  if (code === "auth/unauthorized-domain") {
    return "Este endereço ainda não está autorizado no Firebase.";
  }
  if (code === "auth/operation-not-allowed") {
    return "Ligue o provedor Google em Authentication → Sign-in method.";
  }
  if (e instanceof Error && e.message) return e.message;
  return "Não foi possível entrar com o Google.";
}

/** Dono da mesa: conta Google. Convidado continua anônimo. */
export async function ensureGoogle(): Promise<User> {
  if (isGoogleUser(auth.currentUser)) return auth.currentUser!;
  const provider = googleProvider();
  try {
    if (auth.currentUser?.isAnonymous) {
      try {
        return (await linkWithPopup(auth.currentUser, provider)).user;
      } catch {
        await signOut(auth);
      }
    }
    return (await signInWithPopup(auth, provider)).user;
  } catch (e) {
    const code = e && typeof e === "object" && "code" in e ? String((e as { code: string }).code) : "";
    if (
      code === "auth/popup-blocked" ||
      code === "auth/operation-not-supported-in-this-environment"
    ) {
      await signInWithRedirect(auth, provider);
      throw new Error("Redirecionando para o Google…");
    }
    throw new Error(authMessage(e));
  }
}

export async function ensureAuth(): Promise<User> {
  if (auth.currentUser) return auth.currentUser;
  const cred = await signInAnonymously(auth);
  return cred.user;
}

export type RoomDoc = {
  ativa: boolean;
  fase: string;
  vez: number;
  modo: string;
  ritmo: string;
  mestreUid: string;
  criadaEmMs: number;
  fragmentosLiberados?: boolean;
  mosaicoAbertoMs?: number;
  v3?: boolean;
  formato?: "curta" | "cheia";
  lanternaCurta?: "janela" | "salaescura";
  faseAteMs?: number | null;
  /** cenário da tarefa desta fase: todos os telefones montam o mesmo */
  semente?: string;
  noiteAteMs?: number | null;
  /** uids na ordem da mesa (entrouMs). A vez aponta para este índice. */
  ordem?: string[];
};

export type PlayerDoc = {
  id?: string;
  nome: string;
  personagem: string;
  forma: "m" | "f" | "n";
  pronto: boolean;
  entrouMs: number;
  votos: number;
  moedas: number;
  total: number;
  atualizadoEmMs: number;
  nucleo?: number;
  fragmentoPronto?: boolean;
  fragmentoProntoMs?: number;
  pistas?: string[];
  comodo?: string;
};

export function roomRef(code: string) {
  return doc(db, ROOT, code);
}

export function playerRef(code: string, uid: string) {
  return doc(db, ROOT, code, "jogadores", uid);
}

export async function criarSala(uid: string, formato: "curta" | "cheia" = "cheia") {
  let code = gerarCodigo();
  for (let i = 0; i < 8; i++) {
    const snap = await getDoc(roomRef(code));
    if (!snap.exists()) break;
    code = gerarCodigo();
  }
  await setDoc(roomRef(code), {
    ativa: true,
    fase: "sala",
    vez: 0,
    modo: "sem-telao",
    ritmo: "automatico",
    mestreUid: uid,
    criadaEm: serverTimestamp(),
    criadaEmMs: Date.now(),
    formato,
    v3: true,
  });
  return code;
}

export async function entrarSala(
  code: string,
  uid: string,
  nome: string,
  forma: "m" | "f" | "n",
) {
  const room = await getDoc(roomRef(code));
  if (!room.exists() || room.data()?.ativa !== true) {
    throw new Error("Sala não encontrada ou já encerrada.");
  }
  const ja = await getDoc(playerRef(code, uid));
  if (ja.exists()) {
    /* REENTRADA. Recarregar a página, perder a rede um instante ou voltar do
       Google traz a pessoa de volta por aqui — e um setDoc inteiro apagava
       personagem, núcleo e cômodo. Ela voltava sem papel, e como o Fragmento
       sai do núcleo, voltava sempre na cor 1. Só o que ela mesma pode mudar
       é reescrito. */
    await updateDoc(playerRef(code, uid), {
      nome: nome.slice(0, 60),
      forma,
      atualizadoEmMs: Date.now(),
    });
    return;
  }
  await setDoc(playerRef(code, uid), {
    nome: nome.slice(0, 60),
    personagem: "",
    forma,
    pronto: false,
    entrouMs: Date.now(),
    votos: 0,
    moedas: 9,
    total: 0,
    atualizadoEmMs: Date.now(),
  });
}

/** Empurra a mesa para a próxima fase sem risco de empurrar duas vezes.
 *
 *  Dois telefones podem tocar "Seguir" no mesmo instante — e, desde que o
 *  resgate existe, isso deixou de ser raro. A transação relê a fase dentro
 *  da escrita: quem chegar depois vê que ela já mudou e desiste. Sem isto,
 *  dois toques simultâneos pulavam uma fase inteira da noite.
 *
 *  Devolve verdadeiro se foi esta chamada que moveu a mesa. */
export async function avancarMesa(
  code: string,
  faseEsperada: string,
  data: Record<string, unknown>,
): Promise<boolean> {
  return runTransaction(db, async (tx) => {
    const snap = await tx.get(roomRef(code));
    if (!snap.exists()) return false;
    if ((snap.data() as RoomDoc).fase !== faseEsperada) return false;
    tx.update(roomRef(code), data);
    return true;
  });
}

export async function atualizarMesa(code: string, data: Record<string, unknown>) {
  await updateDoc(roomRef(code), data);
}

export async function atualizarJogador(
  code: string,
  uid: string,
  data: Record<string, unknown>,
) {
  await updateDoc(playerRef(code, uid), { ...data, atualizadoEmMs: Date.now() });
}

export function ouvirSala(
  code: string,
  onRoom: (room: RoomDoc | null) => void,
  onPlayers: (players: PlayerDoc[]) => void,
  onErro?: (e: unknown) => void,
): Unsubscribe {
  /* Sem este quarto argumento, uma queda de rede ou uma regra negando
     leitura encerrava a escuta em silêncio: a tela ficava parada e ninguém
     sabia se era o jogo ou o sinal. */
  const un1 = onSnapshot(
    roomRef(code),
    (snap) => onRoom(snap.exists() ? { ...(snap.data() as RoomDoc) } : null),
    (e) => onErro?.(e),
  );
  const un2 = onSnapshot(
    collection(db, ROOT, code, "jogadores"),
    (snap) =>
      onPlayers(
        snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as PlayerDoc) }))
          .sort((a, b) => a.entrouMs - b.entrouMs),
      ),
    (e) => onErro?.(e),
  );
  return () => {
    un1();
    un2();
  };
}

export async function gravarVoto(code: string, uid: string, para: string) {
  await setDoc(doc(db, ROOT, code, "votos", uid), {
    de: uid,
    para,
    ms: Date.now(),
  });
}

export async function gravarDeducao(
  code: string,
  uid: string,
  d: {
    suspeito: string;
    motivo: string;
    acao: string;
    prova: string;
    lacuna: string;
  },
) {
  await setDoc(doc(db, ROOT, code, "deducoes", uid), {
    id: uid,
    suspeito: d.suspeito,
    motivo: d.motivo,
    acao: d.acao,
    prova: d.prova,
    lacuna: d.lacuna,
    pistasUsadas: [],
    submetidoEm: Date.now(),
  });
}

export async function gravarTarefa(
  code: string,
  uid: string,
  tarefa: "inclinacao" | "constelacao" | "sala",
  runId: string,
) {
  await setDoc(doc(db, ROOT, code, "tarefas", `${uid}_${tarefa}`), {
    tarefa,
    jogadorId: uid,
    runId,
    concluidoEm: Date.now(),
  });
}

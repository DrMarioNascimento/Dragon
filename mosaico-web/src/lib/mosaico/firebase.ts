import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, type User } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getFirestore,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
  type Unsubscribe,
} from "firebase/firestore";

export const firebaseConfig = {
  apiKey: "AIzaSyDwshZbqaMOKxdRuyLtdpbijPRdrjVOcxE",
  authDomain: "mosaico-game.firebaseapp.com",
  projectId: "mosaico-game",
  storageBucket: "mosaico-game.firebasestorage.app",
  messagingSenderId: "436141261767",
  appId: "1:436141261767:web:6a83555a2f7c4ed4550fe2",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const ROOT = "mosaico";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function gerarCodigo() {
  let s = "";
  for (let i = 0; i < 6; i++) s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return s;
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
};

export type PlayerDoc = {
  id?: string;
  nome: string;
  personagem: string;
  forma: "m" | "f";
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

export async function criarSala(uid: string) {
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
  });
  return code;
}

export async function entrarSala(
  code: string,
  uid: string,
  nome: string,
  forma: "m" | "f",
) {
  const room = await getDoc(roomRef(code));
  if (!room.exists() || room.data()?.ativa !== true) {
    throw new Error("Sala não encontrada ou já encerrada.");
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
): Unsubscribe {
  const un1 = onSnapshot(roomRef(code), (snap) => {
    onRoom(snap.exists() ? ({ ...(snap.data() as RoomDoc) }) : null);
  });
  const un2 = onSnapshot(collection(db, ROOT, code, "jogadores"), (snap) => {
    onPlayers(
      snap.docs
        .map((d) => ({ id: d.id, ...(d.data() as PlayerDoc) }))
        .sort((a, b) => a.entrouMs - b.entrouMs),
    );
  });
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

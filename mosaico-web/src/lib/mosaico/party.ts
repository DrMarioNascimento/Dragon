import { create } from "zustand";
import {
  atualizarJogador,
  atualizarMesa,
  criarSala,
  ensureAuth,
  entrarSala,
  gravarDeducao,
  gravarVoto,
  ouvirSala,
  type PlayerDoc,
  type RoomDoc,
} from "./firebase";
import {
  CHAR_IDS,
  assignComodos,
  assignNucleos,
  nextPhase,
} from "./v3";

export type PartyMode = "idle" | "firebase" | "local";

type PartyState = {
  mode: PartyMode;
  code: string | null;
  uid: string | null;
  isMaster: boolean;
  room: RoomDoc | null;
  players: PlayerDoc[];
  error: string | null;
  connecting: boolean;
  localFase: string;
  localVez: number;
  localTiles: string[];
  deduction: {
    suspectId: string | null;
    motiveId: string | null;
    actionId: string | null;
    proofId: string | null;
    gapId: string | null;
  };
  submittedAt: number | null;
  voteTarget: string | null;
  oilBought: string | null;
  lanternDone: boolean;
  pistas: Record<string, boolean>;
  observe: Record<string, boolean>;
  unsub: (() => void) | null;
  connect: () => Promise<void>;
  create: (nome: string, forma: "m" | "f" | "n") => Promise<void>;
  join: (code: string, nome: string, forma: "m" | "f" | "n") => Promise<void>;
  localStart: (nome: string, forma: "m" | "f" | "n") => void;
  ready: () => Promise<void>;
  startNight: () => Promise<void>;
  advance: () => Promise<void>;
  setVez: (vez: number) => Promise<void>;
  confirmFragment: () => Promise<void>;
  vote: (targetId: string) => void;
  buyOil: (id: string) => void;
  setDeduction: (partial: PartyState["deduction"]) => void;
  submitDeduction: () => void;
  setLocalTiles: (tiles: string[]) => void;
  markLanternDone: () => void;
  markPista: (id: string) => void;
  markObserve: (charId: string, soou: boolean) => void;
  leave: () => void;
};

function shuffle<T>(arr: T[]) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const useParty = create<PartyState>((set, get) => ({
  mode: "idle",
  code: null,
  uid: null,
  isMaster: false,
  room: null,
  players: [],
  error: null,
  connecting: false,
  localFase: "sala",
  localVez: 0,
  localTiles: [],
  deduction: {
    suspectId: null,
    motiveId: null,
    actionId: null,
    proofId: null,
    gapId: null,
  },
  submittedAt: null,
  voteTarget: null,
  oilBought: null,
  lanternDone: false,
  pistas: {},
  observe: {},
  unsub: null,

  connect: async () => {
    try {
      const user = await ensureAuth();
      set({ uid: user.uid, error: null });
    } catch (e) {
      set({
        error:
          "Não foi possível ligar a mesa nesta página. Use o endereço publicado do MOSAICO, ou ensaiar sozinho.",
      });
      throw e;
    }
  },

  create: async (nome, forma) => {
    set({ connecting: true, error: null });
    try {
      await get().connect();
      const uid = get().uid!;
      const code = await criarSala(uid);
      await entrarSala(code, uid, nome, forma);
      get().unsub?.();
      const unsub = ouvirSala(
        code,
        (room) => set({ room }),
        (players) => set({ players }),
      );
      set({
        mode: "firebase",
        code,
        isMaster: true,
        unsub,
        connecting: false,
      });
    } catch (e) {
      set({
        connecting: false,
        error: e instanceof Error ? e.message : "Não foi possível criar a mesa.",
      });
    }
  },

  join: async (code, nome, forma) => {
    set({ connecting: true, error: null });
    const clean = code.trim().toUpperCase();
    try {
      await get().connect();
      const uid = get().uid!;
      await entrarSala(clean, uid, nome, forma);
      get().unsub?.();
      const unsub = ouvirSala(
        clean,
        (room) => set({ room, isMaster: room?.mestreUid === uid }),
        (players) => set({ players }),
      );
      set({ mode: "firebase", code: clean, unsub, connecting: false });
    } catch (e) {
      set({
        connecting: false,
        error: e instanceof Error ? e.message : "Não foi possível entrar.",
      });
    }
  },

  localStart: (nome, forma) => {
    const uid = "local";
    set({
      mode: "local",
      code: "LOCAL",
      uid,
      isMaster: true,
      localFase: "sala",
      localVez: 0,
      submittedAt: null,
      voteTarget: null,
      oilBought: null,
      localTiles: [],
      lanternDone: false,
      pistas: {},
      observe: {},
      room: {
        ativa: true,
        fase: "sala",
        vez: 0,
        modo: "sem-telao",
        ritmo: "automatico",
        mestreUid: uid,
        criadaEmMs: Date.now(),
        v3: true,
      },
      players: [
        {
          id: uid,
          nome,
          personagem: "elias",
          forma,
          pronto: true,
          entrouMs: Date.now(),
          votos: 0,
          moedas: 9,
          total: 0,
          atualizadoEmMs: Date.now(),
          nucleo: 1,
          comodo: "vidro",
        },
      ],
    });
  },

  ready: async () => {
    const { mode, code, uid } = get();
    if (mode === "local") {
      set((s) => ({
        players: s.players.map((p) => (p.id === uid ? { ...p, pronto: true } : p)),
      }));
      return;
    }
    if (!code || !uid) return;
    await atualizarJogador(code, uid, { pronto: true });
  },

  startNight: async () => {
    const { mode, code, players } = get();
    const chars = shuffle([...CHAR_IDS]);
    const nucleos = assignNucleos(players.length);
    const comodos = assignComodos(players.length);
    if (mode === "local") {
      set((s) => ({
        localFase: "encenacao",
        room: s.room ? { ...s.room, fase: "encenacao", vez: 0 } : s.room,
        players: s.players.map((p, i) => ({
          ...p,
          personagem: chars[i % chars.length],
          nucleo: nucleos[i],
          comodo: comodos[i],
        })),
      }));
      return;
    }
    if (!code) return;
    for (let i = 0; i < players.length; i++) {
      const p = players[i];
      if (!p.id) continue;
      await atualizarJogador(code, p.id, {
        personagem: chars[i % chars.length],
        nucleo: nucleos[i],
        comodo: comodos[i],
      });
    }
    await atualizarMesa(code, { fase: "encenacao", vez: 0, v3: true });
  },

  advance: async () => {
    const { mode, room, code, localFase } = get();
    const fase = mode === "local" ? localFase : room?.fase || "sala";
    let nxt = nextPhase(fase);
    if (nxt === "votacao" && get().players.length < 2) nxt = nextPhase("votacao");
    if (!nxt) return;
    const extra: Record<string, unknown> = { fase: nxt };
    if (nxt === "cor") extra.mosaicoAbertoMs = Date.now();
    if (nxt === "encaixe") extra.fragmentosLiberados = true;
    if (mode === "local") {
      set((s) => ({
        localFase: nxt,
        lanternDone: false,
        room: s.room ? { ...s.room, fase: nxt, ...extra } : s.room,
      }));
      return;
    }
    if (!code) return;
    set({ lanternDone: false });
    await atualizarMesa(code, extra);
  },

  setVez: async (vez) => {
    const { mode, code } = get();
    if (mode === "local") {
      set((s) => ({
        localVez: vez,
        room: s.room ? { ...s.room, vez } : s.room,
      }));
      return;
    }
    if (!code) return;
    await atualizarMesa(code, { vez });
  },

  confirmFragment: async () => {
    const { mode, code, uid } = get();
    if (mode === "local") {
      set((s) => ({
        players: s.players.map((p) =>
          p.id === uid ? { ...p, fragmentoPronto: true, fragmentoProntoMs: Date.now() } : p,
        ),
      }));
      return;
    }
    if (!code || !uid) return;
    await atualizarJogador(code, uid, {
      fragmentoPronto: true,
      fragmentoProntoMs: Date.now(),
    });
  },

  vote: (targetId) => {
    const { mode, code, uid } = get();
    set({ voteTarget: targetId });
    if (mode === "firebase" && code && uid && targetId !== uid) {
      void gravarVoto(code, uid, targetId);
    }
  },
  buyOil: (id) => set({ oilBought: id }),
  setDeduction: (partial) =>
    set((s) => ({ deduction: { ...s.deduction, ...partial } })),
  submitDeduction: () => {
    const { mode, code, uid, deduction } = get();
    const at = Date.now();
    set({ submittedAt: at });
    if (
      mode === "firebase" &&
      code &&
      uid &&
      deduction.suspectId &&
      deduction.motiveId &&
      deduction.actionId &&
      deduction.proofId &&
      deduction.gapId
    ) {
      void gravarDeducao(code, uid, {
        suspeito: deduction.suspectId,
        motivo: deduction.motiveId,
        acao: deduction.actionId,
        prova: deduction.proofId,
        lacuna: deduction.gapId,
      });
    }
  },
  setLocalTiles: (tiles) => set({ localTiles: tiles }),
  markLanternDone: () => set({ lanternDone: true }),
  markPista: (id) =>
    set((s) => ({ pistas: { ...s.pistas, [id]: true }, lanternDone: true })),
  markObserve: (charId, soou) =>
    set((s) => ({ observe: { ...s.observe, [charId]: soou } })),

  leave: () => {
    get().unsub?.();
    set({
      mode: "idle",
      code: null,
      isMaster: false,
      room: null,
      players: [],
      unsub: null,
      submittedAt: null,
    });
  },
}));

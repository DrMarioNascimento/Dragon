import { create } from "zustand";
import {
  atualizarJogador,
  atualizarMesa,
  consumeGoogleRedirect,
  criarSala,
  ensureAuth,
  ensureGoogle,
  entrarSala,
  gravarDeducao,
  gravarVoto,
  ouvirSala,
  type PlayerDoc,
  type RoomDoc,
} from "./firebase";
import { podeAbrirMesa, studioPodeAbrir } from "./mestres";
import {
  CHAR_IDS,
  FASE_S,
  NOITE_TETO_S,
  assignComodos,
  assignNucleos,
  nextPhase,
  type NoiteFormato,
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
  create: (nome: string, forma: "m" | "f" | "n", formato?: NoiteFormato) => Promise<void>;
  join: (code: string, nome: string, forma: "m" | "f" | "n") => Promise<void>;
  localStart: (nome: string, forma: "m" | "f" | "n", formato?: NoiteFormato) => void;
  ready: () => Promise<void>;
  startNight: () => Promise<void>;
  advance: () => Promise<void>;
  forcarAcusacao: () => Promise<void>;
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

  create: async (nome, forma, formato = "cheia") => {
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.setItem("noite.criar", JSON.stringify({ nome, forma, formato }));
    }
    set({ connecting: true, error: null });
    try {
      await consumeGoogleRedirect();
      const user = await ensureGoogle();
      if (!studioPodeAbrir() && !podeAbrirMesa(user.email)) {
        set({
          connecting: false,
          uid: user.uid,
          error: "Nesta fase só o estúdio abre mesa.",
        });
        return;
      }
      const code = await criarSala(user.uid, formato);
      await entrarSala(code, user.uid, nome, forma);
      get().unsub?.();
      const unsub = ouvirSala(
        code,
        (room) => set({ room }),
        (players) => set({ players }),
      );
      if (typeof sessionStorage !== "undefined") sessionStorage.removeItem("noite.criar");
      set({
        mode: "firebase",
        code,
        uid: user.uid,
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

  localStart: (nome, forma, formato = "cheia") => {
    const uid = "local";
    const lanternaCurta: "janela" | "salaescura" = Math.random() < 0.5 ? "janela" : "salaescura";
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
        formato,
        lanternaCurta,
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
    const { mode, code, players, room } = get();
    const chars = shuffle([...CHAR_IDS]);
    const nucleos = assignNucleos(players.length);
    const comodos = assignComodos(players.length);
    const formato: NoiteFormato = room?.formato === "curta" ? "curta" : "cheia";
    const lanternaCurta: "janela" | "salaescura" = Math.random() < 0.5 ? "janela" : "salaescura";
    const now = Date.now();
    const noiteAteMs = now + NOITE_TETO_S[formato] * 1000;
    const faseAteMs = now + (FASE_S.encenacao ?? 90) * 1000;
    const extra = { fase: "encenacao", vez: 0, v3: true, formato, lanternaCurta, noiteAteMs, faseAteMs };
    if (mode === "local") {
      set((s) => ({
        localFase: "encenacao",
        room: s.room ? { ...s.room, ...extra } : s.room,
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
    await atualizarMesa(code, extra);
  },

  advance: async () => {
    const { mode, room, code, localFase } = get();
    const fase = mode === "local" ? localFase : room?.fase || "sala";
    const formato: NoiteFormato = room?.formato === "curta" ? "curta" : "cheia";
    const lanterna = room?.lanternaCurta === "salaescura" ? "salaescura" : "janela";
    let nxt = nextPhase(fase, formato, lanterna);
    if (nxt === "votacao" && get().players.length < 2) nxt = nextPhase("votacao", formato, lanterna);
    if (!nxt) return;
    const now = Date.now();
    const s = FASE_S[nxt];
    const extra: Record<string, unknown> = {
      fase: nxt,
      faseAteMs: s ? now + s * 1000 : null,
    };
    if (nxt === "cor") extra.mosaicoAbertoMs = now;
    if (nxt === "encaixe") extra.fragmentosLiberados = true;
    if (mode === "local") {
      set((s) => ({
        localFase: nxt,
        lanternDone: false,
        room: s.room ? { ...s.room, ...extra } : s.room,
      }));
      return;
    }
    if (!code) return;
    set({ lanternDone: false });
    await atualizarMesa(code, extra);
  },

  forcarAcusacao: async () => {
    const { mode, room, code, localFase } = get();
    const fase = mode === "local" ? localFase : room?.fase || "sala";
    if (fase === "deducao" || fase === "resultado" || fase === "sala") return;
    const now = Date.now();
    const extra = { fase: "deducao" as const, faseAteMs: now + (FASE_S.deducao ?? 120) * 1000 };
    if (mode === "local") {
      set((s) => ({
        localFase: "deducao",
        lanternDone: false,
        room: s.room ? { ...s.room, ...extra } : s.room,
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
      (deduction.suspectId || deduction.actionId || deduction.proofId)
    ) {
      void gravarDeducao(code, uid, {
        suspeito: deduction.suspectId ?? "",
        motivo: deduction.motiveId ?? "",
        acao: deduction.actionId ?? "",
        prova: deduction.proofId ?? "",
        lacuna: deduction.gapId ?? "",
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

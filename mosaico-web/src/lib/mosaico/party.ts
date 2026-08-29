import { create } from "zustand";
import {
  atualizarJogador,
  avancarMesa,
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
import {
  CHAR_IDS,
  FASE_S,
  FASES_SENSOR,
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
  /** a escuta do Firestore caiu (rede ou permissão) */
  offline: boolean;
  connect: () => Promise<void>;
  /** volta para a mesa guardada nesta aba, depois de recarregar a página */
  restore: () => Promise<boolean>;
  create: (nome: string, forma: "m" | "f" | "n", formato?: NoiteFormato) => Promise<void>;
  join: (code: string, nome: string, forma: "m" | "f" | "n") => Promise<void>;
  localStart: (nome: string, forma: "m" | "f" | "n", formato?: NoiteFormato) => Promise<void>;
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

const FICHA_VAZIA: PartyState["deduction"] = {
  suspectId: null,
  motiveId: null,
  actionId: null,
  proofId: null,
  gapId: null,
};

/* O que morre com a fase. Antes só o lanternDone era zerado, e o voto, o
   óleo e as peças da carta atravessavam a noite inteira. */
const FASE_LIMPA = {
  lanternDone: false,
  voteTarget: null as string | null,
  oilBought: null as string | null,
  localTiles: [] as string[],
};

const CHAVE_SALA = "noite.sala";

/* Guardado na aba, não no aparelho: recarregar a página traz a pessoa de
   volta à mesa, mas fechar a aba encerra de verdade. */
function guardaSala(code: string, uid: string) {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(CHAVE_SALA, JSON.stringify({ code, uid }));
  } catch {
    /* modo privado do Safari: sem memória, sem reconexão. Não é motivo
       para derrubar quem está jogando. */
  }
}

function esqueceSala() {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.removeItem(CHAVE_SALA);
  } catch {
    /* idem */
  }
}

function salaGuardada(): { code: string; uid: string } | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(CHAVE_SALA);
    if (!raw) return null;
    const v = JSON.parse(raw) as { code?: string; uid?: string };
    return v.code && v.uid ? { code: v.code, uid: v.uid } : null;
  } catch {
    return null;
  }
}

/* Duas palavras não: o campo do mestre dentro da tarefa aceita qualquer
   texto e o mundo sai de um hash dele. Curto e legível basta, e serve
   para o grupo se re-sincronizar à mão se preciso. */
function sementeDeTarefa() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

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
  offline: false,

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

  /** Recarregou a página no meio do jogo. O estado do Zustand morre com a
   *  aba, então antes disso a pessoa caía em "A mesa ainda não foi aberta"
   *  e, ao reentrar pelo código, perdia o personagem. Aqui ela volta pela
   *  sala que a aba guardou, sem reescrever o próprio jogador. */
  restore: async () => {
    if (get().mode !== "idle") return true;
    const guardada = salaGuardada();
    if (!guardada) return false;
    set({ connecting: true, error: null });
    try {
      const user = await ensureAuth();
      if (user.uid !== guardada.uid) {
        /* Outra conta nesta aba: a mesa guardada não é dela. */
        esqueceSala();
        set({ connecting: false });
        return false;
      }
      get().unsub?.();
      const unsub = ouvirSala(
        guardada.code,
        (room) => set({ room, isMaster: room?.mestreUid === user.uid, offline: false }),
        (players) => set({ players, offline: false }),
        () => set({ offline: true }),
      );
      set({
        mode: "firebase",
        code: guardada.code,
        uid: user.uid,
        unsub,
        connecting: false,
      });
      return true;
    } catch {
      esqueceSala();
      set({ connecting: false });
      return false;
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
      set({ uid: user.uid, error: null });
      const code = await criarSala(user.uid, formato);
      await entrarSala(code, user.uid, nome, forma);
      get().unsub?.();
      const unsub = ouvirSala(
        code,
        (room) => set({ room, offline: false }),
        (players) => set({ players, offline: false }),
        () => set({ offline: true }),
      );
      if (typeof sessionStorage !== "undefined") sessionStorage.removeItem("noite.criar");
      guardaSala(code, user.uid);
      set({
        mode: "firebase",
        code,
        uid: user.uid,
        isMaster: true,
        unsub,
        connecting: false,
      });
    } catch (e) {
      const raw = e instanceof Error ? e.message : "";
      const msg = /permission|insufficient/i.test(raw)
        ? "Esse Google não está autorizado a abrir mesa."
        : raw || "Não foi possível criar a mesa.";
      set({
        connecting: false,
        error: msg,
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
        (room) => set({ room, isMaster: room?.mestreUid === uid, offline: false }),
        (players) => set({ players, offline: false }),
        () => set({ offline: true }),
      );
      guardaSala(clean, uid);
      set({ mode: "firebase", code: clean, unsub, connecting: false });
    } catch (e) {
      set({
        connecting: false,
        error: e instanceof Error ? e.message : "Não foi possível entrar.",
      });
    }
  },

  /* O ensaio não escreve nada: nem sala, nem jogador, nem dedução, nem uma
     linha no Firestore. Exigir uma conta Google aqui pedia MAIS
     autenticação do que o jogo real pede a um convidado, que entra anônimo
     só com o código — e no iPhone aberto pela tela de início a janela de
     popup não abre, o Firebase cai para o redirect e muita gente não
     voltava. O modo feito para experimentar era o mais difícil de abrir. */
  localStart: async (nome, forma, formato = "cheia") => {
    /* O ensaio não escreve nada: nem sala, nem jogador, nem dedução, nem uma
     linha no Firestore. Exigir uma conta Google aqui pedia MAIS
     autenticação do que o jogo real pede a um convidado — que entra anônimo
     só com o código — e no iPhone aberto pela tela de início a janela de
     popup não abre, o Firebase cai para o redirect e muita gente não
     voltava. O modo feito para experimentar era o mais difícil de abrir. */
    const uid = "ensaio-" + Math.random().toString(36).slice(2, 10);
    const lanternaCurta: "janela" | "salaescura" =
    Math.random() < 0.5 ? "janela" : "salaescura";
    set({
      mode: "local",
      code: "LOCAL",
      uid,
      isMaster: true,
      connecting: false,
      localFase: "sala",
      localVez: 0,
      submittedAt: null,
      voteTarget: null,
      oilBought: null,
      localTiles: [],
      lanternDone: false,
      pistas: {},
      observe: {},
      deduction: FICHA_VAZIA,
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
    /* A tarefa sensorial derivava o cenário do próprio relógio de cada
       aparelho — uma rodada de 30 minutos. Uma fase que atravessasse a
       virada da meia hora deixava metade do grupo num mundo e metade no
       outro, numa tarefa que é jogador contra jogador sobre o MESMO
       cenário. Agora quem manda é a mesa, e ela manda uma vez só. */
    if (FASES_SENSOR.includes(nxt)) extra.semente = sementeDeTarefa();
    if (mode === "local") {
      set((s) => ({
        ...FASE_LIMPA,
        localFase: nxt,
        room: s.room ? { ...s.room, ...extra } : s.room,
      }));
      return;
    }
    if (!code) return;
    set(FASE_LIMPA);
    /* Transacional: qualquer telefone pode empurrar depois que o relógio
       vence, então dois podem empurrar no mesmo instante. Quem chegar
       segundo vê a fase já trocada e desiste — antes, os dois escreviam e
       a mesa pulava uma fase inteira. */
    await avancarMesa(code, fase, extra);
  },

  forcarAcusacao: async () => {
    const { mode, room, code, localFase } = get();
    const fase = mode === "local" ? localFase : room?.fase || "sala";
    if (fase === "deducao" || fase === "resultado" || fase === "sala") return;
    const now = Date.now();
    const extra = { fase: "deducao" as const, faseAteMs: now + (FASE_S.deducao ?? 120) * 1000 };
    if (mode === "local") {
      set((s) => ({
        ...FASE_LIMPA,
        localFase: "deducao",
        room: s.room ? { ...s.room, ...extra } : s.room,
      }));
      return;
    }
    if (!code) return;
    set(FASE_LIMPA);
    await avancarMesa(code, fase, extra);
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
    /* Votar em si mesmo é recusado pela regra do Firestore. Marcar na tela
       um voto que o servidor não recebeu deixava a pessoa achando que tinha
       votado — a tela dizia sim e a mesa não sabia. */
    if (targetId === uid) return;
    set({ voteTarget: targetId });
    if (mode === "firebase" && code && uid) {
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
    esqueceSala();
    /* Sair tem de apagar a partida inteira. Antes ficavam a acusação, as
       pistas, o voto e o Fragmento confirmado: a partida seguinte na mesma
       aba abria a ficha de dedução já preenchida com a anterior. */
    set({
      mode: "idle",
      code: null,
      isMaster: false,
      room: null,
      players: [],
      unsub: null,
      offline: false,
      error: null,
      connecting: false,
      localFase: "sala",
      localVez: 0,
      localTiles: [],
      lanternDone: false,
      pistas: {},
      observe: {},
      deduction: FICHA_VAZIA,
      submittedAt: null,
      voteTarget: null,
      oilBought: null,
    });
  },
}));

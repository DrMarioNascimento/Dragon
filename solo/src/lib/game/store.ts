import { create } from "zustand";
import {
  ACTIONS,
  GAPS,
  MOTIVES,
  PIECE_KEYS,
  PROOFS,
  SUSPECTS,
  TILES,
  TRUTH,
  type PieceKey,
  type SuspectId,
  type TileId,
} from "./case";

export type Phase =
  | "title"
  | "brief"
  | "story"
  | "assemble"
  | "hand"
  | "hyp1"
  | "market"
  | "mosaic"
  | "hyp2"
  | "last"
  | "deduce"
  | "reveal";

function mulberry32(a: number) {
  return () => {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(list: readonly T[], rng: () => number): T[] {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function newSeed() {
  return (Math.floor(Math.random() * 0xffffffff) ^ Date.now()) >>> 0;
}

function listsFor(seed: number) {
  const rng = mulberry32(seed);
  return {
    suspects: shuffle(SUSPECTS, rng),
    motives: shuffle(MOTIVES, rng),
    actions: shuffle(ACTIONS, rng),
    proofs: shuffle(PROOFS, rng),
    gaps: shuffle(GAPS, rng),
  };
}

function scramblePieces(id: TileId, seed: number): PieceKey[] {
  const variants: PieceKey[][] = [
    ["tr", "tl", "bl", "br"],
    ["tl", "tr", "br", "bl"],
    ["bl", "tl", "tr", "br"],
  ];
  const i = TILES.findIndex((t) => t.id === id);
  const rng = mulberry32(seed ^ (i + 1) * 31);
  return variants[Math.floor(rng() * variants.length)] ?? variants[0];
}

export type Deduction = {
  suspect: SuspectId | null;
  motive: string | null;
  action: string | null;
  proof: string | null;
  gap: string | null;
};

type MarketLot = { id: string; kindLabel: string; tileId: TileId; cost: number };

type GameState = {
  phase: Phase;
  seed: number;
  lists: ReturnType<typeof listsFor>;
  storyIndex: number;
  coins: number;
  assembleId: TileId;
  assembleQueue: TileId[];
  assembleAfter: Phase;
  assembleOrder: PieceKey[];
  assemblePick: number | null;
  owned: TileId[];
  classified: Partial<Record<TileId, boolean>>;
  selectedTile: TileId | null;
  mosaic: (TileId | null)[];
  hyp1: { suspects: SuspectId[]; gap: string | null };
  marketLots: MarketLot[];
  marketRound: number;
  lastAction: "verify" | "discard" | "buy" | null;
  verified: TileId | null;
  deduce: Deduction;
  deduceStartedAt: number | null;
  deduceMs: number | null;
  go: (p: Phase) => void;
  nextStory: () => void;
  pickAssemble: (index: number) => void;
  classify: (id: TileId) => void;
  setHyp1Suspect: (id: SuspectId) => void;
  setHyp1Gap: (gap: string) => void;
  buyLot: (lotId: string) => void;
  skipMarket: () => void;
  selectTile: (id: TileId | null) => void;
  placeMosaic: (slot: number) => void;
  setDeduce: (patch: Partial<Deduction>) => void;
  verifyTile: (id: TileId) => void;
  submitDeduce: () => void;
  reset: () => void;
};

const MARKET: MarketLot[] = [
  { id: "lot-pilar", kindLabel: "Lote pilar", tileId: "foto-farol", cost: 4 },
  { id: "lot-conex", kindLabel: "Lote conector", tileId: "foto-noite", cost: 3 },
  { id: "lot-amb", kindLabel: "Lote ambiguidade", tileId: "foto-agenda", cost: 2 },
];

function score(s: GameState) {
  const hit = s.deduce.suspect === TRUTH.suspect;
  const time = hit ? 32 : 0;
  const fields = [
    s.deduce.motive === TRUTH.motive,
    s.deduce.action === TRUTH.action,
    s.deduce.proof === TRUTH.proof,
    s.deduce.gap === TRUTH.gap,
  ].filter(Boolean).length;
  const quality = hit ? ([0, 3, 6, 10, 13][fields] ?? 0) : 0;
  const mosaicOk = TILES.every((t, i) => s.mosaic[i] === t.id);
  const coop = mosaicOk ? 30 : 8;
  const coinPts = s.coins >= 9 ? 8 : s.coins >= 7 ? 7 : s.coins >= 5 ? 5 : s.coins >= 3 ? 3 : s.coins >= 1 ? 1 : 0;
  const spend = hit && s.owned.includes("foto-farol") ? 5 : hit ? 2 : 0;
  const econ = Math.min(20, coinPts + spend);
  return { hit, time, quality, coop, econ, total: time + quality + coop + econ, mosaicOk, fields };
}

function blank(seed = newSeed()) {
  return {
    phase: "title" as Phase,
    seed,
    lists: listsFor(seed),
    storyIndex: 0,
    coins: 11,
    assembleId: "carta-costa" as TileId,
    assembleQueue: ["foto-gaveta"] as TileId[],
    assembleAfter: "hand" as Phase,
    assembleOrder: scramblePieces("carta-costa", seed),
    assemblePick: null as number | null,
    owned: [] as TileId[],
    classified: {} as Partial<Record<TileId, boolean>>,
    selectedTile: null as TileId | null,
    mosaic: [null, null, null, null, null] as (TileId | null)[],
    hyp1: { suspects: [] as SuspectId[], gap: null as string | null },
    marketLots: MARKET,
    marketRound: 0,
    lastAction: null as GameState["lastAction"],
    verified: null as TileId | null,
    deduce: { suspect: null, motive: null, action: null, proof: null, gap: null } as Deduction,
    deduceStartedAt: null as number | null,
    deduceMs: null as number | null,
  };
}

export const useGame = create<GameState>((set, get) => ({
  ...blank(),
  go: (p) =>
    set((s) => ({
      phase: p,
      deduceStartedAt: p === "deduce" ? Date.now() : s.deduceStartedAt,
    })),
  nextStory: () =>
    set((s) => {
      if (s.storyIndex >= 2) return { phase: "assemble" as Phase };
      return { storyIndex: s.storyIndex + 1 };
    }),
  pickAssemble: (index) =>
    set((s) => {
      if (s.assemblePick === null) return { assemblePick: index };
      if (s.assemblePick === index) return { assemblePick: null };
      const order = [...s.assembleOrder];
      const a = s.assemblePick;
      [order[a], order[index]] = [order[index], order[a]];
      const done = order.every((k, i) => k === PIECE_KEYS[i]);
      if (!done) return { assembleOrder: order, assemblePick: null };
      const owned = s.owned.includes(s.assembleId) ? s.owned : [...s.owned, s.assembleId];
      const [next, ...rest] = s.assembleQueue;
      if (next) {
        return {
          owned,
          assembleOrder: scramblePieces(next, s.seed),
          assemblePick: null,
          assembleId: next,
          assembleQueue: rest,
        };
      }
      return {
        owned,
        assembleOrder: order,
        assemblePick: null,
        assembleQueue: [],
        phase: s.assembleAfter,
      };
    }),
  classify: (id) =>
    set((s) => ({ classified: { ...s.classified, [id]: true } })),
  setHyp1Suspect: (id) =>
    set((s) => {
      const has = s.hyp1.suspects.includes(id);
      let suspects = has
        ? s.hyp1.suspects.filter((x) => x !== id)
        : [...s.hyp1.suspects, id];
      if (suspects.length > 2) suspects = suspects.slice(-2);
      return { hyp1: { ...s.hyp1, suspects } };
    }),
  setHyp1Gap: (gap) => set((s) => ({ hyp1: { ...s.hyp1, gap } })),
  buyLot: (lotId) =>
    set((s) => {
      const lot = s.marketLots.find((l) => l.id === lotId);
      if (!lot || s.owned.includes(lot.tileId) || s.coins < lot.cost) return s;
      const round = s.marketRound + 1;
      const after: Phase = round >= 2 ? "mosaic" : "market";
      const extra =
        round >= 2
          ? TILES.map((t) => t.id).filter((id) => id !== lot.tileId && !s.owned.includes(id))
          : [];
      return {
        coins: s.coins - lot.cost,
        marketRound: round,
        assembleId: lot.tileId,
        assembleQueue: extra,
        assembleAfter: after,
        assembleOrder: scramblePieces(lot.tileId, s.seed),
        assemblePick: null,
        phase: "assemble" as Phase,
      };
    }),
  skipMarket: () =>
    set((s) => {
      const missing = TILES.map((t) => t.id).filter((id) => !s.owned.includes(id));
      return { owned: [...s.owned, ...missing], phase: "mosaic" as Phase };
    }),
  selectTile: (id) => set({ selectedTile: id }),
  placeMosaic: (slot) =>
    set((s) => {
      const mosaic = [...s.mosaic];
      if (s.selectedTile) {
        const prev = mosaic.indexOf(s.selectedTile);
        if (prev >= 0) mosaic[prev] = null;
        mosaic[slot] = s.selectedTile;
        return { mosaic, selectedTile: null };
      }
      if (mosaic[slot]) {
        mosaic[slot] = null;
        return { mosaic };
      }
      return s;
    }),
  setDeduce: (patch) => set((s) => ({ deduce: { ...s.deduce, ...patch } })),
  verifyTile: (id) => set({ verified: id, lastAction: "verify" }),
  submitDeduce: () =>
    set((s) => ({
      phase: "reveal" as Phase,
      deduceMs: s.deduceStartedAt ? Date.now() - s.deduceStartedAt : 0,
    })),
  reset: () => set({ ...blank() }),
}));

export { score, listsFor, MOTIVES, ACTIONS, PROOFS, GAPS };

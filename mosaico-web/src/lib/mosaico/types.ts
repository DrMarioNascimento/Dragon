export type ClueKind = "pilar" | "conector" | "contexto" | "ambiguidade" | "boato";
export type SocialRole = "observador" | "boato" | "neutro";
export type RoomId =
  | "sala"
  | "corredor"
  | "escada"
  | "sotao"
  | "cozinha"
  | "jardim"
  | "porta"
  | "cofre";

export type PhaseId =
  | "story"
  | "storyVote"
  | "fragment"
  | "hypo1"
  | "market1"
  | "market2"
  | "negotiate"
  | "mosaic"
  | "coopVote"
  | "hypo2"
  | "lastAction"
  | "deduction"
  | "reveal"
  | "scoreboard";

export const PHASE_ORDER: PhaseId[] = [
  "story",
  "storyVote",
  "fragment",
  "hypo1",
  "market1",
  "market2",
  "negotiate",
  "mosaic",
  "coopVote",
  "hypo2",
  "lastAction",
  "deduction",
  "reveal",
  "scoreboard",
];

export const PHASE_LABEL: Record<PhaseId, string> = {
  story: "A história que pula",
  storyVote: "O clima da mesa",
  fragment: "Fragmentação",
  hypo1: "Hipótese I",
  market1: "Mercado cego",
  market2: "Mercado cego",
  negotiate: "Negociação vinculada",
  mosaic: "Mosaico coletivo",
  coopVote: "Quem colaborou",
  hypo2: "Hipótese II",
  lastAction: "Última ação",
  deduction: "Dedução final",
  reveal: "Revelação",
  scoreboard: "Placar",
};

export const PHASE_PROGRESS: Partial<Record<PhaseId, number>> = {
  hypo1: 20,
  market1: 40,
  market2: 40,
  mosaic: 60,
  hypo2: 80,
  deduction: 100,
};

export const BID_AMOUNTS = [1, 2, 3, 4, 5, 6, 8] as const;
export const STARTING_COINS = 11;
export const PLAYER_COUNT = 6;

export interface Character {
  id: string;
  seat: number;
  title: string;
  name: string;
  role: SocialRole;
  blurb: string;
  arrival: string;
}

export interface Clue {
  id: string;
  kind: ClueKind;
  title: string;
  body: string;
  room: RoomId;
  pillar?: string;
  reliability: 1 | 2 | 3;
  truthful: boolean;
  mosaicLabel: string;
}

export interface StoryCard {
  id: string;
  kicker: string;
  text: string;
}

export interface MarketLot {
  id: string;
  round: 1 | 2;
  kind: ClueKind;
  clueId: string;
}

export interface CartaTile {
  id: string;
  label: string;
  correctIndex: number | null;
}

export interface Option {
  id: string;
  label: string;
  hint?: string;
}

export interface CaseTruth {
  suspectId: string;
  motiveId: string;
  actionId: string;
  proofId: string;
  gapId: string;
  usedClueIds: string[];
}

export interface Hypothesis {
  suspects: string[];
  gapId: string | null;
  explanationId: string | null;
}

export interface Deduction {
  suspectId: string | null;
  motiveId: string | null;
  actionId: string | null;
  proofId: string | null;
  gapId: string | null;
  usedClueIds: string[];
  submittedAt: number | null;
}

export interface PlayerState {
  id: string;
  seat: number;
  characterId: string;
  isHuman: boolean;
  coins: number;
  clueIds: string[];
  acquiredIds: string[];
  discardedIds: string[];
  verified: Record<string, boolean>;
  storyDone: boolean;
  phaseDone: boolean;
  hypo1: Hypothesis;
  hypo2: Hypothesis;
  deduction: Deduction;
  mosaicSubmitted: string[];
  lastActionDone: boolean;
  lastActionKind: "comprar" | "trocar" | "verificar" | "descartar" | null;
  storyVote: string | null;
  coopVote: string | null;
}

export interface Bid {
  playerId: string;
  lotId: string;
  amount: number;
}

export interface TradeOffer {
  id: string;
  fromId: string;
  toId: string;
  giveClueId: string;
  wantKind: ClueKind;
  status: "pending" | "accepted" | "declined" | "done";
}

export interface Nucleus {
  id: string;
  memberIds: string[];
  carta: (string | null)[];
  submittedAt: number | null;
  correct: boolean;
  attempts: number;
  place: number | null;
}

export interface ScoreBreakdown {
  playerId: string;
  tempo: number;
  qualidade: number;
  coopColetiva: number;
  coopVoto: number;
  economia: number;
  performance: number;
  total: number;
  acertou: boolean;
}

export interface MatchLog {
  t: number;
  text: string;
}

export interface Match {
  id: string;
  startedAt: number;
  phase: PhaseId;
  phaseStartedAt: number;
  revealStep: number;
  humanSeats: number[];
  activeSeat: number;
  players: PlayerState[];
  lots: MarketLot[];
  lotWinners: Record<string, string>;
  bids: Bid[];
  trades: TradeOffer[];
  mosaicPublic: { playerId: string; clueId: string }[];
  nuclei: Nucleus[];
  scores: ScoreBreakdown[] | null;
  log: MatchLog[];
  quorumUntil: number | null;
  marketUntil: number | null;
}

export type GameAction =
  | { type: "STORY_DONE"; playerId: string }
  | { type: "STORY_VOTE"; playerId: string; targetId: string }
  | { type: "FRAGMENT_DONE"; playerId: string }
  | { type: "SET_HYPO"; playerId: string; which: 1 | 2; hypo: Hypothesis }
  | { type: "HYPO_DONE"; playerId: string }
  | { type: "BID"; playerId: string; lotId: string; amount: number }
  | { type: "PASS_BID"; playerId: string }
  | { type: "RESOLVE_MARKET" }
  | { type: "OFFER_TRADE"; playerId: string; toId: string; giveClueId: string; wantKind: ClueKind }
  | { type: "ANSWER_TRADE"; playerId: string; tradeId: string; accept: boolean }
  | { type: "NEGOTIATE_DONE"; playerId: string }
  | { type: "SUBMIT_MOSAIC"; playerId: string; clueIds: string[] }
  | { type: "PLACE_CARTA"; nucleusId: string; slot: number; tileId: string | null }
  | { type: "SUBMIT_CARTA"; nucleusId: string }
  | { type: "MOSAIC_DONE"; playerId: string }
  | { type: "COOP_VOTE"; playerId: string; targetId: string }
  | { type: "LAST_ACTION"; playerId: string; kind: PlayerState["lastActionKind"]; payload?: string }
  | { type: "LAST_DONE"; playerId: string }
  | { type: "SET_DEDUCTION"; playerId: string; deduction: Partial<Deduction> }
  | { type: "SUBMIT_DEDUCTION"; playerId: string }
  | { type: "REVEAL_NEXT" }
  | { type: "ADVANCE_IF_READY" }
  | { type: "SET_ACTIVE_SEAT"; seat: number }
  | { type: "TICK" };

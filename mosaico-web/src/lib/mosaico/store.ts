import { create } from "zustand";
import { createMatch, reduce, runBots } from "./engine";
import type { GameAction, Match } from "./types";

const KEY = "mosaico.match.v1";

function loadMatch(): Match | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Match;
  } catch {
    return null;
  }
}

function saveMatch(match: Match | null) {
  if (typeof window === "undefined") return;
  if (!match) localStorage.removeItem(KEY);
  else localStorage.setItem(KEY, JSON.stringify(match));
}

type GameStore = {
  match: Match | null;
  hydrated: boolean;
  hydrate: () => void;
  start: (humanSeats: number[]) => void;
  dispatch: (action: GameAction) => void;
  reset: () => void;
};

export const useGame = create<GameStore>((set, get) => ({
  match: null,
  hydrated: false,
  hydrate: () => {
    const current = get().match;
    if (current) {
      set({ hydrated: true });
      return;
    }
    set({ match: loadMatch(), hydrated: true });
  },
  start: (humanSeats) => {
    const match = createMatch(humanSeats);
    runBots(match);
    saveMatch(match);
    set({ match, hydrated: true });
  },
  dispatch: (action) => {
    const current = get().match;
    if (!current) return;
    const next = reduce(current, action);
    saveMatch(next);
    set({ match: next });
  },
  reset: () => {
    saveMatch(null);
    set({ match: null });
  },
}));

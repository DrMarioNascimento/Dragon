import {
  BID_AMOUNTS,
  PHASE_ORDER,
  PLAYER_COUNT,
  STARTING_COINS,
  type Bid,
  type Deduction,
  type GameAction,
  type Hypothesis,
  type Match,
  type Nucleus,
  type PhaseId,
  type PlayerState,
  type ScoreBreakdown,
} from "./types";
import {
  CARTA_TILES,
  CHARACTERS,
  CLUE_BY_ID,
  MARKET_LOTS,
  STARTING_HANDS,
  TRUTH,
  LEFTOVER_BUY,
} from "./case";

const emptyHypo = (): Hypothesis => ({
  suspects: [],
  gapId: null,
  explanationId: null,
});

const emptyDeduction = (): Deduction => ({
  suspectId: null,
  motiveId: null,
  actionId: null,
  proofId: null,
  gapId: null,
  usedClueIds: [],
  submittedAt: null,
});

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

function player(m: Match, id: string) {
  const p = m.players.find((x) => x.id === id);
  if (!p) throw new Error(`Jogador ${id} não encontrado`);
  return p;
}

function clone<T>(v: T): T {
  return structuredClone(v);
}

export function createMatch(humanSeats: number[]): Match {
  const seats = [...new Set(humanSeats.filter((s) => s >= 0 && s < PLAYER_COUNT))].sort();
  const humans = seats.length ? seats : [0];
  const now = Date.now();
  const players: PlayerState[] = CHARACTERS.map((c) => ({
    id: c.id,
    seat: c.seat,
    characterId: c.id,
    isHuman: humans.includes(c.seat),
    coins: STARTING_COINS,
    clueIds: [...(STARTING_HANDS[c.id] ?? [])],
    acquiredIds: [],
    discardedIds: [],
    verified: {},
    storyDone: false,
    phaseDone: false,
    hypo1: emptyHypo(),
    hypo2: emptyHypo(),
    deduction: emptyDeduction(),
    mosaicSubmitted: [],
    lastActionDone: false,
    lastActionKind: null,
    storyVote: null,
    coopVote: null,
  }));

  const a = players.slice(0, 3).map((p) => p.id);
  const b = players.slice(3, 6).map((p) => p.id);

  return {
    id: uid("mesa"),
    startedAt: now,
    phase: "story",
    phaseStartedAt: now,
    revealStep: 0,
    humanSeats: humans,
    activeSeat: humans[0] ?? 0,
    players,
    lots: MARKET_LOTS.map((l) => ({ ...l })),
    lotWinners: {},
    bids: [],
    trades: [],
    mosaicPublic: [],
    nuclei: [
      {
        id: "alfa",
        memberIds: a,
        carta: [null, null, null, null, null, null],
        submittedAt: null,
        correct: false,
        attempts: 0,
        place: null,
      },
      {
        id: "beta",
        memberIds: b,
        carta: [null, null, null, null, null, null],
        submittedAt: null,
        correct: false,
        attempts: 0,
        place: null,
      },
    ],
    scores: null,
    log: [{ t: now, text: "A tempestade chegou antes dos convidados." }],
    quorumUntil: null,
    marketUntil: null,
  };
}

function log(m: Match, text: string) {
  m.log.push({ t: Date.now(), text });
  if (m.log.length > 40) m.log.splice(0, m.log.length - 40);
}

function resetPhaseFlags(m: Match) {
  for (const p of m.players) p.phaseDone = false;
  m.quorumUntil = null;
}

export function enterPhase(m: Match, phase: PhaseId, now = Date.now()) {
  m.phase = phase;
  m.phaseStartedAt = now;
  resetPhaseFlags(m);
  if (phase === "market1" || phase === "market2") {
    m.marketUntil = now + 75_000;
    m.bids = m.bids.filter((b) => {
      const lot = m.lots.find((l) => l.id === b.lotId);
      return lot && lot.round !== (phase === "market1" ? 1 : 2);
    });
  } else {
    m.marketUntil = null;
  }
  if (phase === "story") {
    for (const p of m.players) p.storyDone = false;
  }
  runBots(m, now);
}

function humansOf(m: Match) {
  return m.players.filter((p) => p.isHuman);
}

function readyCount(m: Match) {
  if (m.phase === "story") return m.players.filter((p) => p.storyDone).length;
  if (m.phase === "deduction") {
    return m.players.filter((p) => p.deduction.submittedAt != null).length;
  }
  return m.players.filter((p) => p.phaseDone).length;
}

function isReady(m: Match, p: PlayerState) {
  if (m.phase === "story") return p.storyDone;
  if (m.phase === "deduction") return p.deduction.submittedAt != null;
  return p.phaseDone;
}

function maybeQuorum(m: Match, now: number) {
  const humans = m.players.filter((p) => p.isHuman);
  if (humans.length > 0 && humans.some((p) => !isReady(m, p))) return;
  if (readyCount(m) >= PLAYER_COUNT) {
    advance(m, now);
  }
}

function advance(m: Match, now: number) {
  if (m.phase === "market1" || m.phase === "market2") {
    const round = currentRound(m);
    if (round) resolveMarket(m, round);
  }
  if (m.phase === "deduction") {
    m.scores = scoreMatch(m);
  }
  const idx = PHASE_ORDER.indexOf(m.phase);
  const next = PHASE_ORDER[idx + 1];
  if (!next) return;
  enterPhase(m, next, now);
}

function currentRound(m: Match): 1 | 2 | 0 {
  if (m.phase === "market1") return 1;
  if (m.phase === "market2") return 2;
  return 0;
}

function hasBidThisRound(m: Match, playerId: string) {
  const round = currentRound(m);
  return m.bids.some((b) => {
    if (b.playerId !== playerId) return false;
    const lot = m.lots.find((l) => l.id === b.lotId);
    return lot?.round === round;
  });
}

function resolveMarket(m: Match, round: 1 | 2) {
  const lots = m.lots.filter((l) => l.round === round);
  for (const lot of lots) {
    if (m.lotWinners[lot.id]) continue;
    const bids = m.bids
      .filter((b) => b.lotId === lot.id && b.amount > 0)
      .sort((a, b) => b.amount - a.amount);
    const top = bids[0];
    if (!top) continue;
    const winner = player(m, top.playerId);
    if (winner.coins < top.amount) continue;
    winner.coins -= top.amount;
    winner.clueIds.push(lot.clueId);
    winner.acquiredIds.push(lot.clueId);
    m.lotWinners[lot.id] = winner.id;
    const who = CHARACTERS.find((c) => c.id === winner.id);
    log(m, `${who?.title ?? winner.id} leva um lote de ${lot.kind}.`);
  }
}

function nucleusOf(m: Match, playerId: string) {
  return m.nuclei.find((n) => n.memberIds.includes(playerId));
}

function cartaCorrect(carta: (string | null)[]) {
  if (carta.some((x) => !x)) return false;
  return carta.every((id, i) => {
    const tile = CARTA_TILES.find((t) => t.id === id);
    return tile?.correctIndex === i;
  });
}

function assignPlaces(m: Match) {
  const done = m.nuclei
    .filter((n) => n.correct && n.submittedAt)
    .sort((a, b) => (a.submittedAt ?? 0) - (b.submittedAt ?? 0));
  done.forEach((n, i) => {
    n.place = i + 1;
  });
}

export function leftoverFor(kind: string) {
  return LEFTOVER_BUY.filter((x) => x.kind === kind);
}

function applyLastAction(
  m: Match,
  p: PlayerState,
  kind: PlayerState["lastActionKind"],
  payload?: string,
) {
  if (p.lastActionDone) return;
  p.lastActionKind = kind;
  if (kind === "verificar" && payload) {
    const clue = CLUE_BY_ID[payload];
    if (clue && p.clueIds.includes(payload)) {
      p.verified[payload] = clue.truthful;
      log(m, `${CHARACTERS.find((c) => c.id === p.id)?.title} verifica um fragmento.`);
    }
  } else if (kind === "descartar" && payload) {
    if (p.clueIds.includes(payload)) {
      p.clueIds = p.clueIds.filter((id) => id !== payload);
      p.discardedIds.push(payload);
    }
  } else if (kind === "comprar" && payload) {
    const item = LEFTOVER_BUY.find((x) => x.clueId === payload);
    const cost = 3;
    if (item && p.coins >= cost && !p.clueIds.includes(item.clueId)) {
      p.coins -= cost;
      p.clueIds.push(item.clueId);
      p.acquiredIds.push(item.clueId);
      log(m, `${CHARACTERS.find((c) => c.id === p.id)?.title} compra um último fragmento.`);
    }
  } else if (kind === "trocar" && payload) {
    const [toId, giveId] = payload.split("::");
    const other = m.players.find((x) => x.id === toId);
    if (other && giveId && p.clueIds.includes(giveId)) {
      const take = other.clueIds.find((id) => {
        const c = CLUE_BY_ID[id];
        return c && (c.kind === "pilar" || c.kind === "conector") && id !== giveId;
      });
      if (take) {
        p.clueIds = p.clueIds.filter((id) => id !== giveId);
        other.clueIds = other.clueIds.filter((id) => id !== take);
        p.clueIds.push(take);
        other.clueIds.push(giveId);
        p.acquiredIds.push(take);
        other.acquiredIds.push(giveId);
      }
    }
  }
  p.lastActionDone = true;
  p.phaseDone = true;
}

export function reduce(match: Match, action: GameAction, now = Date.now()): Match {
  const m = clone(match);

  switch (action.type) {
    case "SET_ACTIVE_SEAT": {
      if (m.humanSeats.includes(action.seat)) m.activeSeat = action.seat;
      break;
    }
    case "STORY_DONE": {
      player(m, action.playerId).storyDone = true;
      maybeQuorum(m, now);
      break;
    }
    case "STORY_VOTE": {
      const p = player(m, action.playerId);
      if (action.targetId === p.id) break;
      p.storyVote = action.targetId;
      p.phaseDone = true;
      maybeQuorum(m, now);
      break;
    }
    case "FRAGMENT_DONE": {
      player(m, action.playerId).phaseDone = true;
      maybeQuorum(m, now);
      break;
    }
    case "SET_HYPO": {
      const p = player(m, action.playerId);
      if (action.which === 1) p.hypo1 = action.hypo;
      else p.hypo2 = action.hypo;
      break;
    }
    case "HYPO_DONE": {
      player(m, action.playerId).phaseDone = true;
      maybeQuorum(m, now);
      break;
    }
    case "BID": {
      const p = player(m, action.playerId);
      const lot = m.lots.find((l) => l.id === action.lotId);
      const round = currentRound(m);
      if (!lot || lot.round !== round) break;
      if (m.lotWinners[lot.id]) break;
      if (hasBidThisRound(m, p.id)) break;
      if (!(BID_AMOUNTS as readonly number[]).includes(action.amount)) break;
      if (action.amount > p.coins) break;
      m.bids.push({ playerId: p.id, lotId: lot.id, amount: action.amount });
      p.phaseDone = true;
      maybeQuorum(m, now);
      break;
    }
    case "PASS_BID": {
      const p = player(m, action.playerId);
      if (hasBidThisRound(m, p.id)) break;
      m.bids.push({ playerId: p.id, lotId: `__pass-${currentRound(m)}`, amount: 0 });
      p.phaseDone = true;
      maybeQuorum(m, now);
      break;
    }
    case "RESOLVE_MARKET": {
      const round = currentRound(m);
      if (round) resolveMarket(m, round);
      break;
    }
    case "OFFER_TRADE": {
      const p = player(m, action.playerId);
      if (!p.clueIds.includes(action.giveClueId)) break;
      if (action.toId === p.id) break;
      m.trades.push({
        id: uid("tr"),
        fromId: p.id,
        toId: action.toId,
        giveClueId: action.giveClueId,
        wantKind: action.wantKind,
        status: "pending",
      });
      runBots(m, now);
      break;
    }
    case "ANSWER_TRADE": {
      const tr = m.trades.find((t) => t.id === action.tradeId);
      if (!tr || tr.toId !== action.playerId || tr.status !== "pending") break;
      if (!action.accept) {
        tr.status = "declined";
        break;
      }
      const from = player(m, tr.fromId);
      const to = player(m, tr.toId);
      const give = tr.giveClueId;
      const take = to.clueIds.find((id) => CLUE_BY_ID[id]?.kind === tr.wantKind);
      if (!from.clueIds.includes(give) || !take) {
        tr.status = "declined";
        break;
      }
      from.clueIds = from.clueIds.filter((id) => id !== give);
      to.clueIds = to.clueIds.filter((id) => id !== take);
      from.clueIds.push(take);
      to.clueIds.push(give);
      from.acquiredIds.push(take);
      to.acquiredIds.push(give);
      tr.status = "done";
      log(m, "Uma troca vinculada foi cumprida.");
      break;
    }
    case "NEGOTIATE_DONE": {
      player(m, action.playerId).phaseDone = true;
      maybeQuorum(m, now);
      break;
    }
    case "SUBMIT_MOSAIC": {
      const p = player(m, action.playerId);
      const ids = action.clueIds.filter((id) => p.clueIds.includes(id)).slice(0, 3);
      p.mosaicSubmitted = ids;
      for (const id of ids) {
        if (!m.mosaicPublic.some((x) => x.clueId === id && x.playerId === p.id)) {
          m.mosaicPublic.push({ playerId: p.id, clueId: id });
        }
      }
      break;
    }
    case "PLACE_CARTA": {
      const n = m.nuclei.find((x) => x.id === action.nucleusId);
      if (!n || n.correct) break;
      const next = [...n.carta];
      if (action.tileId) {
        const prev = next.indexOf(action.tileId);
        if (prev >= 0) next[prev] = null;
      }
      const slot =
        action.slot >= 0 ? action.slot : next.findIndex((x) => !x);
      if (slot < 0 || slot >= next.length) break;
      next[slot] = action.tileId;
      n.carta = next;
      break;
    }
    case "SUBMIT_CARTA": {
      const n = m.nuclei.find((x) => x.id === action.nucleusId);
      if (!n || n.correct) break;
      n.attempts += 1;
      if (cartaCorrect(n.carta)) {
        n.correct = true;
        n.submittedAt = now;
        assignPlaces(m);
        log(m, `Núcleo ${n.id === "alfa" ? "Alfa" : "Beta"} montou a carta.`);
      }
      break;
    }
    case "MOSAIC_DONE": {
      const p = player(m, action.playerId);
      p.phaseDone = true;
      const n = nucleusOf(m, p.id);
      if (n && !n.correct && cartaCorrect(n.carta)) {
        n.correct = true;
        n.submittedAt = now;
        assignPlaces(m);
      }
      maybeQuorum(m, now);
      break;
    }
    case "COOP_VOTE": {
      const p = player(m, action.playerId);
      const n = nucleusOf(m, p.id);
      if (!n?.memberIds.includes(action.targetId) || action.targetId === p.id) break;
      p.coopVote = action.targetId;
      p.phaseDone = true;
      maybeQuorum(m, now);
      break;
    }
    case "LAST_ACTION": {
      applyLastAction(m, player(m, action.playerId), action.kind, action.payload);
      maybeQuorum(m, now);
      break;
    }
    case "LAST_DONE": {
      const p = player(m, action.playerId);
      p.lastActionDone = true;
      p.phaseDone = true;
      maybeQuorum(m, now);
      break;
    }
    case "SET_DEDUCTION": {
      const p = player(m, action.playerId);
      p.deduction = { ...p.deduction, ...action.deduction };
      break;
    }
    case "SUBMIT_DEDUCTION": {
      const p = player(m, action.playerId);
      if (p.deduction.submittedAt) break;
      p.deduction.submittedAt = now;
      p.phaseDone = true;
      maybeQuorum(m, now);
      break;
    }
    case "REVEAL_NEXT": {
      m.revealStep += 1;
      if (m.revealStep >= 8) {
        enterPhase(m, "scoreboard", now);
      }
      break;
    }
    case "ADVANCE_IF_READY": {
      maybeQuorum(m, now);
      break;
    }
    case "TICK": {
      if (m.marketUntil && now >= m.marketUntil) {
        const round = currentRound(m);
        if (round) {
          for (const p of m.players) {
            if (!hasBidThisRound(m, p.id)) {
              m.bids.push({ playerId: p.id, lotId: `__pass-${round}`, amount: 0 });
              p.phaseDone = true;
            }
          }
          resolveMarket(m, round);
          advance(m, now);
        }
      } else if (m.quorumUntil && now >= m.quorumUntil) {
        for (const p of m.players) {
          if (m.phase === "story") p.storyDone = true;
          p.phaseDone = true;
          if (m.phase === "deduction" && !p.deduction.submittedAt) {
            p.deduction.submittedAt = now;
          }
        }
        if (m.phase === "market1" || m.phase === "market2") {
          resolveMarket(m, currentRound(m) as 1 | 2);
        }
        advance(m, now);
      } else {
        maybeQuorum(m, now);
      }
      break;
    }
  }

  return m;
}

function rankPoints(rank: number) {
  const table = [32, 29, 26, 23, 20, 17];
  return table[rank] ?? 14;
}

function coinPoints(coins: number) {
  if (coins >= 9) return 8;
  if (coins >= 7) return 7;
  if (coins >= 5) return 5;
  if (coins >= 3) return 3;
  if (coins >= 1) return 1;
  return 0;
}

function qualityPoints(fields: number) {
  if (fields >= 4) return 13;
  if (fields === 3) return 10;
  if (fields === 2) return 6;
  if (fields === 1) return 3;
  return 0;
}

function coopPlacePoints(place: number | null, correct: boolean) {
  if (!correct || !place) return 0;
  if (place === 1) return 20;
  if (place === 2) return 16;
  if (place === 3) return 12;
  if (place === 4) return 8;
  return 4;
}

export function scoreMatch(m: Match): ScoreBreakdown[] {
  const correct = m.players.filter((p) => p.deduction.suspectId === TRUTH.suspectId);
  const ordered = [...correct].sort(
    (a, b) => (a.deduction.submittedAt ?? Infinity) - (b.deduction.submittedAt ?? Infinity),
  );

  const storyVotes: Record<string, number> = {};
  const coopVotes: Record<string, number> = {};
  for (const p of m.players) {
    if (p.storyVote) storyVotes[p.storyVote] = (storyVotes[p.storyVote] ?? 0) + 1;
    if (p.coopVote) coopVotes[p.coopVote] = (coopVotes[p.coopVote] ?? 0) + 1;
  }
  const storyMax = Math.max(0, ...Object.values(storyVotes));
  const storyWinners = Object.entries(storyVotes)
    .filter(([, n]) => n === storyMax && storyMax > 0)
    .map(([id]) => id);

  const rows: ScoreBreakdown[] = m.players.map((p) => {
    const acertou = p.deduction.suspectId === TRUTH.suspectId;
    const rank = acertou ? ordered.findIndex((x) => x.id === p.id) : -1;
    const tempo = acertou && rank >= 0 ? rankPoints(rank) : 0;

    let fields = 0;
    if (acertou) {
      if (p.deduction.motiveId === TRUTH.motiveId) fields += 1;
      if (p.deduction.actionId === TRUTH.actionId) fields += 1;
      if (p.deduction.proofId === TRUTH.proofId) fields += 1;
      if (p.deduction.gapId === TRUTH.gapId) fields += 1;
    }
    const qualidade = acertou ? qualityPoints(fields) : 0;

    const n = nucleusOf(m, p.id);
    const coopColetiva = coopPlacePoints(n?.place ?? null, Boolean(n?.correct));

    const nMembers = n?.memberIds.length ?? 0;
    let coopVoto = 0;
    if (nMembers === 2) coopVoto = 5;
    else {
      const votesHere = n?.memberIds.map((id) => ({ id, v: coopVotes[id] ?? 0 })) ?? [];
      const max = Math.max(0, ...votesHere.map((x) => x.v));
      const winners = votesHere.filter((x) => x.v === max && max > 0);
      if (winners.length === 1 && winners[0].id === p.id) coopVoto = 10;
      else if (winners.length > 1 && winners.some((w) => w.id === p.id)) {
        coopVoto = Math.floor(10 / winners.length);
      }
    }

    const used = p.deduction.usedClueIds
      .map((id) => CLUE_BY_ID[id])
      .filter(Boolean);
    const avgRel =
      used.length === 0 ? 2 : used.reduce((s, c) => s + c.reliability, 0) / used.length;
    let confiabilidade = 0;
    if (avgRel >= 2.6) confiabilidade = 7;
    else if (avgRel <= 1.5) confiabilidade = -7;

    const usedAcquired = p.deduction.usedClueIds.some((id) => p.acquiredIds.includes(id));
    let gasto = 0;
    if (acertou && usedAcquired) gasto = 5;
    else if (acertou) gasto = 2;
    if (confiabilidade <= -1) gasto = 0;

    const economia = Math.max(0, Math.min(20, coinPoints(p.coins) + gasto + confiabilidade));
    const performance = storyWinners.includes(p.id)
      ? storyWinners.length === 1
        ? 5
        : Math.floor(5 / storyWinners.length)
      : 0;

    const total = tempo + qualidade + coopColetiva + coopVoto + economia + performance;
    return {
      playerId: p.id,
      tempo,
      qualidade,
      coopColetiva,
      coopVoto,
      economia,
      performance,
      total,
      acertou,
    };
  });

  rows.sort((a, b) => {
    if (a.acertou !== b.acertou) return a.acertou ? -1 : 1;
    if (a.tempo !== b.tempo) return b.tempo - a.tempo;
    const ca = a.coopColetiva + a.coopVoto;
    const cb = b.coopColetiva + b.coopVoto;
    if (ca !== cb) return cb - ca;
    if (a.economia !== b.economia) return b.economia - a.economia;
    return b.total - a.total;
  });

  return rows;
}

function botPick<T>(arr: T[], i: number): T | undefined {
  if (!arr.length) return undefined;
  return arr[i % arr.length];
}

function botHypothesis(p: PlayerState, which: 1 | 2): Hypothesis {
  const clues = p.clueIds.map((id) => CLUE_BY_ID[id]).filter(Boolean);
  const strong = clues.filter((c) => c.kind === "pilar" || c.kind === "conector");
  const suspects = ["elias", "helena", "clara"];
  if (strong.length >= 2 || which === 2) {
    return {
      suspects: ["elias", "helena"],
      gapId: "g-agua-porta",
      explanationId: "x-elias",
    };
  }
  return {
    suspects: [botPick(suspects, p.seat) ?? "helena", "clara"],
    gapId: "g-sotao",
    explanationId: botPick(["x-helena", "x-tempestade", "x-clara"], p.seat) ?? "x-helena",
  };
}

function botDeduction(p: PlayerState): Deduction {
  const clues = p.clueIds.map((id) => CLUE_BY_ID[id]).filter(Boolean);
  const pillars = clues.filter((c) => c.kind === "pilar").length;
  const connectors = clues.filter((c) => c.kind === "conector").length;
  const knows = pillars + connectors >= 3 || p.acquiredIds.length >= 1;
  const used = p.clueIds.filter((id) => {
    const c = CLUE_BY_ID[id];
    return c && (c.kind === "pilar" || c.kind === "conector");
  }).slice(0, 4);
  if (knows) {
    return {
      suspectId: "elias",
      motiveId: "m-heranca",
      actionId: "a-disjuntor",
      proofId: p.seat % 2 === 0 ? "pr-marcas" : "pr-relogio",
      gapId: p.clueIds.includes("c03") || p.clueIds.includes("k05") ? "g-agua-porta" : "g-luz",
      usedClueIds: used,
      submittedAt: null,
    };
  }
  const wrong = p.seat % 3 === 0 ? "helena" : p.seat % 3 === 1 ? "clara" : "tomas";
  return {
    suspectId: wrong,
    motiveId: wrong === "helena" ? "m-heranca" : wrong === "clara" ? "m-reportagem" : "m-medo",
    actionId: wrong === "helena" ? "a-helena-cofre" : wrong === "clara" ? "a-clara" : "a-sotao",
    proofId: wrong === "clara" ? "pr-bolsa" : "pr-sombra",
    gapId: "g-sotao",
    usedClueIds: used,
    submittedAt: null,
  };
}

function botBid(m: Match, p: PlayerState) {
  const round = currentRound(m);
  if (!round || hasBidThisRound(m, p.id)) return;
  const lots = m.lots.filter((l) => l.round === round && !m.lotWinners[l.id]);
  const prefer =
    p.characterId === "tomas" || p.characterId === "nilo"
      ? ["conector", "pilar", "contexto"]
      : p.characterId === "elias" || p.characterId === "clara"
        ? ["pilar", "ambiguidade", "contexto"]
        : ["pilar", "conector", "contexto"];
  const lot =
    lots.find((l) => l.kind === prefer[0]) ??
    lots.find((l) => l.kind === prefer[1]) ??
    lots[p.seat % lots.length];
  if (!lot) {
    m.bids.push({ playerId: p.id, lotId: `__pass-${round}`, amount: 0 });
    p.phaseDone = true;
    return;
  }
  const amount = Math.min(p.coins, 2 + (p.seat % 3) + (lot.kind === "pilar" ? 1 : 0));
  const legal = [...BID_AMOUNTS].reverse().find((n) => n <= amount) ?? 1;
  if (legal > p.coins) {
    m.bids.push({ playerId: p.id, lotId: `__pass-${round}`, amount: 0 });
  } else {
    m.bids.push({ playerId: p.id, lotId: lot.id, amount: legal });
  }
  p.phaseDone = true;
}

function fillBotCarta(n: Nucleus, now: number) {
  if (n.correct) return;
  const ordered = CARTA_TILES.filter((t) => t.correctIndex != null).sort(
    (a, b) => (a.correctIndex ?? 0) - (b.correctIndex ?? 0),
  );
  n.carta = ordered.map((t) => t.id);
  n.correct = true;
  n.submittedAt = now + 18_000;
  n.attempts = 1;
}

export function runBots(m: Match, now = Date.now()) {
  const bots = m.players.filter((p) => !p.isHuman);

  if (m.phase === "story") {
    for (const b of bots) b.storyDone = true;
  }

  if (m.phase === "storyVote") {
    for (const b of bots) {
      const others = m.players.filter((p) => p.id !== b.id);
      const human = others.find((p) => p.isHuman);
      b.storyVote = human && b.seat % 2 === 0 ? human.id : others[(b.seat + 1) % others.length].id;
      b.phaseDone = true;
    }
  }

  if (m.phase === "fragment") {
    for (const b of bots) b.phaseDone = true;
  }

  if (m.phase === "hypo1" || m.phase === "hypo2") {
    for (const b of bots) {
      const which = m.phase === "hypo1" ? 1 : 2;
      const hypo = botHypothesis(b, which);
      if (which === 1) b.hypo1 = hypo;
      else b.hypo2 = hypo;
      b.phaseDone = true;
    }
  }

  if (m.phase === "market1" || m.phase === "market2") {
    for (const b of bots) botBid(m, b);
  }

  if (m.phase === "negotiate") {
    for (const b of bots) {
      const pending = m.trades.filter((t) => t.toId === b.id && t.status === "pending");
      for (const tr of pending) {
        const give = CLUE_BY_ID[tr.giveClueId];
        const accept = Boolean(give && (give.kind === "pilar" || give.kind === "conector"));
        if (accept) {
          const take = b.clueIds.find((id) => CLUE_BY_ID[id]?.kind === tr.wantKind);
          const from = player(m, tr.fromId);
          if (take && from.clueIds.includes(tr.giveClueId)) {
            from.clueIds = from.clueIds.filter((id) => id !== tr.giveClueId);
            b.clueIds = b.clueIds.filter((id) => id !== take);
            from.clueIds.push(take);
            b.clueIds.push(tr.giveClueId);
            from.acquiredIds.push(take);
            b.acquiredIds.push(tr.giveClueId);
            tr.status = "done";
          } else tr.status = "declined";
        } else tr.status = "declined";
      }
      b.phaseDone = true;
    }
  }

  if (m.phase === "mosaic") {
    for (const b of bots) {
      const pick = b.clueIds
        .map((id) => CLUE_BY_ID[id])
        .filter((c) => c && (c.kind === "pilar" || c.kind === "conector"))
        .slice(0, 2);
      b.mosaicSubmitted = pick.map((c) => c.id);
      for (const c of pick) {
        if (!m.mosaicPublic.some((x) => x.clueId === c.id && x.playerId === b.id)) {
          m.mosaicPublic.push({ playerId: b.id, clueId: c.id });
        }
      }
      b.phaseDone = true;
    }
    for (const n of m.nuclei) {
      const hasHuman = n.memberIds.some((id) => m.players.find((p) => p.id === id)?.isHuman);
      if (!hasHuman) fillBotCarta(n, now);
    }
    assignPlaces(m);
  }

  if (m.phase === "coopVote") {
    for (const b of bots) {
      const n = nucleusOf(m, b.id);
      const others = (n?.memberIds ?? []).filter((id) => id !== b.id);
      const human = others.find((id) => m.players.find((p) => p.id === id)?.isHuman);
      const humanP = human ? player(m, human) : null;
      if (humanP && humanP.mosaicSubmitted.length > 0) b.coopVote = humanP.id;
      else b.coopVote = others[0] ?? null;
      b.phaseDone = true;
    }
  }

  if (m.phase === "lastAction") {
    for (const b of bots) {
      if (b.coins >= 3 && b.seat % 2 === 0) {
        const item = LEFTOVER_BUY[b.seat % LEFTOVER_BUY.length];
        applyLastAction(m, b, "comprar", item.clueId);
      } else {
        const amb = b.clueIds.find((id) => {
          const c = CLUE_BY_ID[id];
          return c && (c.kind === "boato" || c.kind === "ambiguidade");
        });
        if (amb) applyLastAction(m, b, "verificar", amb);
        else {
          b.lastActionDone = true;
          b.phaseDone = true;
        }
      }
    }
  }

  if (m.phase === "deduction") {
    for (const b of bots) {
      if (b.deduction.submittedAt) continue;
      b.deduction = { ...botDeduction(b), submittedAt: now + 12_000 + b.seat * 900 };
      b.phaseDone = true;
    }
  }
}

export function viewingPlayer(m: Match): PlayerState {
  return m.players.find((p) => p.seat === m.activeSeat) ?? m.players[0];
}

export function otherHumansNeedPass(m: Match) {
  return m.humanSeats.length > 1;
}



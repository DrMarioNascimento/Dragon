import { useGame } from "@/lib/mosaico/store";
import { Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { RotateHint } from "./rotate-hint";
import {
  CoopVotePhase,
  DeductionPhase,
  FragmentPhase,
  Hypo1Phase,
  Hypo2Phase,
  LastActionPhase,
  MarketPhase,
  MosaicPhase,
  NegotiatePhase,
  RevealPhase,
  ScorePhase,
  StoryPhase,
  StoryVotePhase,
} from "./phases";
import { GameShell, PassGate } from "./shell";

export function GameApp() {
  const match = useGame((s) => s.match);
  const hydrated = useGame((s) => s.hydrated);
  const hydrate = useGame((s) => s.hydrate);
  const dispatch = useGame((s) => s.dispatch);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    const id = window.setInterval(() => dispatch({ type: "TICK" }), 1000);
    return () => window.clearInterval(id);
  }, [dispatch]);

  if (!hydrated) {
    return (
      <div className="relative flex min-h-dvh items-center justify-center bg-background">
        <img
          src="/media/aguardando.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-50"
        />
        <p className="relative font-serif text-3xl tracking-[0.28em] text-primary">MOSAICO</p>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background px-6 text-center">
        <p className="font-serif text-3xl text-primary">MOSAICO</p>
        <p className="text-sm text-fog">A mesa ainda não foi aberta nesta noite.</p>
        <Link
          to="/"
          className="inline-flex h-11 min-h-11 items-center justify-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground"
        >
          Voltar ao início
        </Link>
      </div>
    );
  }

  return (
    <GameShell match={match}>
      <RotateHint />
      <PassGate match={match} />
      {match.phase === "story" && <StoryPhase match={match} />}
      {match.phase === "storyVote" && <StoryVotePhase match={match} />}
      {match.phase === "fragment" && <FragmentPhase match={match} />}
      {match.phase === "hypo1" && <Hypo1Phase match={match} />}
      {match.phase === "market1" && <MarketPhase match={match} />}
      {match.phase === "market2" && <MarketPhase match={match} />}
      {match.phase === "negotiate" && <NegotiatePhase match={match} />}
      {match.phase === "mosaic" && <MosaicPhase match={match} />}
      {match.phase === "coopVote" && <CoopVotePhase match={match} />}
      {match.phase === "hypo2" && <Hypo2Phase match={match} />}
      {match.phase === "lastAction" && <LastActionPhase match={match} />}
      {match.phase === "deduction" && <DeductionPhase match={match} />}
      {match.phase === "reveal" && <RevealPhase match={match} />}
      {match.phase === "scoreboard" && <ScorePhase match={match} />}
    </GameShell>
  );
}

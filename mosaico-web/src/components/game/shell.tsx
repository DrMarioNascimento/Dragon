import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CHARACTERS, ROLE_LABEL } from "@/lib/mosaico/case";
import { viewingPlayer } from "@/lib/mosaico/engine";
import { useGame } from "@/lib/mosaico/store";
import {
  PHASE_LABEL,
  PHASE_PROGRESS,
  type Match,
  type PhaseId,
} from "@/lib/mosaico/types";
import { BookOpen, Coins, Home, X } from "lucide-react";
import { type ReactNode, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ClueCard, cluesFrom } from "./clues";
import { MosaicMark } from "./mark";

export function GameShell({
  match,
  children,
  footer,
}: {
  match: Match;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const me = viewingPlayer(match);
  const character = CHARACTERS.find((c) => c.id === me.characterId)!;
  const [notebook, setNotebook] = useState(false);
  const progress = PHASE_PROGRESS[match.phase] ?? 0;
  const clues = useMemo(() => cluesFrom(me.clueIds), [me.clueIds]);

  return (
    <div className="relative mx-auto flex min-h-dvh max-w-lg flex-col bg-background">
      <div className="pointer-events-none absolute inset-0 mosaic-grain opacity-35" />
      <div className="pointer-events-none absolute inset-0 cover-tint opacity-80" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/70 via-background/90 to-background" />

      <header className="relative z-10 flex items-center gap-3 border-b border-border px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <MosaicMark className="size-5 text-primary" />
        <div className="min-w-0 flex-1">
          <p className="brand-wordmark text-lg text-primary">MOSAICO</p>
          <p className="mt-1 truncate text-base uppercase tracking-[0.16em] text-muted-foreground">
            {PHASE_LABEL[match.phase]}
          </p>
        </div>
        <div className="flex items-center gap-1 text-accent">
          <Coins className="size-4" />
          <span className="tabular-nums text-lg font-medium">{me.coins}</span>
        </div>
        <Link
          to="/"
          aria-label="Voltar ao início"
          className="inline-flex size-11 min-h-11 items-center justify-center rounded-md text-fog hover:bg-muted hover:text-foreground"
        >
          <Home className="size-5" />
        </Link>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Caderno de pistas"
          onClick={() => setNotebook(true)}
        >
          <BookOpen className="size-5" />
        </Button>
      </header>

      {progress > 0 && (
        <div className="relative z-10 h-0.5 bg-muted">
          <div
            className="h-full bg-accent transition-[width] duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <div className="relative z-10 flex items-center justify-between px-4 py-2">
        <div>
          <p className="font-serif text-base leading-tight">{character.title}</p>
          <p className="text-base text-muted-foreground">{character.name}</p>
        </div>
        <Badge>{ROLE_LABEL[character.role]}</Badge>
      </div>

      <main className="relative z-10 flex-1 overflow-y-auto overscroll-y-contain px-4 pb-28 pt-2 [-webkit-overflow-scrolling:touch]">
        {children}
      </main>

      {footer && (
        <div className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-lg border-t border-border bg-background/95 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 backdrop-blur-sm">
          {footer}
        </div>
      )}

      {notebook && (
        <div className="fixed inset-0 z-40 mx-auto max-w-lg bg-background/95 backdrop-blur-sm">
          <div className="flex items-center justify-between border-b border-border px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
            <h2 className="font-serif text-2xl">Caderno</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setNotebook(false)}
              aria-label="Fechar caderno"
            >
              <X className="size-5" />
            </Button>
          </div>
          <div className="h-[calc(100dvh-56px)] space-y-3 overflow-y-auto px-4 py-4">
            {clues.length === 0 ? (
              <p className="text-lg text-muted-foreground">Ainda não há fragmentos.</p>
            ) : (
              clues.map((c) => (
                <ClueCard key={c.id} clue={c} verified={me.verified[c.id]} />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function Tip({ id, children }: { id: string; children: string }) {
  const [open, setOpen] = useState(() => {
    if (typeof window === "undefined") return false;
    return !localStorage.getItem(`noite.tip.${id}`);
  });
  if (!open) return null;
  return (
    <button
      type="button"
      onClick={() => {
        localStorage.setItem(`noite.tip.${id}`, "1");
        setOpen(false);
      }}
      className="mb-4 w-full rounded-lg border border-accent/25 bg-accent/8 px-3 py-2 text-left text-lg italic text-fog"
    >
      {children}
    </button>
  );
}

export function PassGate({ match }: { match: Match }) {
  const dispatch = useGame((s) => s.dispatch);
  const me = viewingPlayer(match);
  if (match.humanSeats.length < 2) return null;
  const waiting = match.players.filter(
    (p) => p.isHuman && p.seat !== match.activeSeat && !isDone(match.phase, p),
  );
  if (me && isDone(match.phase, me) && waiting.length > 0) {
    const next = waiting[0];
    if (!next) return null;
    const ch = CHARACTERS.find((c) => c.id === next.characterId);
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background px-6 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(2rem,env(safe-area-inset-top))] text-center">
        <MosaicMark className="mb-6 size-8 text-primary" />
        <p className="text-base uppercase tracking-[0.28em] text-muted-foreground">
          Passe o celular
        </p>
        <h2 className="mt-3 font-serif text-4xl">{ch?.title}</h2>
        <p className="mt-1 text-fog">{ch?.name}</p>
        <Button
          className="mt-8"
          size="lg"
          onClick={() => dispatch({ type: "SET_ACTIVE_SEAT", seat: next.seat })}
        >
          Sou {ch?.title}
        </Button>
      </div>
    );
  }
  return null;
}

function isDone(phase: PhaseId, p: { storyDone: boolean; phaseDone: boolean; deduction: { submittedAt: number | null } }) {
  if (phase === "story") return p.storyDone;
  if (phase === "deduction") return p.deduction.submittedAt != null;
  return p.phaseDone;
}

import { Button } from "@/components/ui/button";
import { useParty } from "@/lib/mosaico/party";
import { cn } from "@/lib/utils";
import { useState } from "react";

export function PalimpsestoPlay() {
  const done = useParty((s) => s.markLanternDone);
  const [on, setOn] = useState(false);
  return (
    <div className="space-y-4 px-5 pb-28 pt-6">
      <p className="text-[11px] uppercase tracking-[0.22em] text-accent">Empilha os vidros.</p>
      <h2 className="font-serif text-3xl">Palimpsesto</h2>
      <p className="text-sm text-fog">
        No ensaio: dois ecrãs neste telefone. Na festa, um aparelho em cima do outro.
        Sozinho, ninguém lê a frase.
      </p>
      <div className="relative mx-auto h-56 w-full max-w-sm">
        <div
          className={cn(
            "absolute left-4 top-2 h-44 w-40 rounded-2xl border-2 border-primary/40 bg-card p-3 transition-all duration-500",
            on && "left-10 opacity-40",
          )}
        >
          <p className="font-serif text-sm leading-6 text-fog">
            ELIAS · · · · O
            <br />· · BAIXOU · ·
            <br />· DISJUNTOR ·
          </p>
          <p className="mt-3 text-[10px] uppercase tracking-widest text-muted-foreground">Helena</p>
        </div>
        <div
          className={cn(
            "absolute right-4 top-6 h-44 w-40 rounded-2xl border-2 border-primary bg-background/90 p-3 shadow-lg transition-all duration-500",
            on ? "right-10 top-2 ring-4 ring-primary/30" : "",
          )}
        >
          {on ? (
            <p className="pt-6 text-center font-serif text-xl leading-7 text-primary">
              Elias baixou
              <br />
              o disjuntor
            </p>
          ) : (
            <p className="pt-10 text-center text-sm text-muted-foreground">Lanterna de Nilo</p>
          )}
        </div>
      </div>
      <Button
        className="w-full"
        size="lg"
        onClick={() => {
          setOn(true);
          done();
        }}
      >
        {on ? "A frase atravessou" : "Empilhar os vidros"}
      </Button>
    </div>
  );
}

export function EspelhoPlay() {
  const done = useParty((s) => s.markLanternDone);
  const [shown, setShown] = useState(false);
  return (
    <div className="space-y-4 px-5 pb-28 pt-6">
      <p className="text-[11px] uppercase tracking-[0.22em] text-accent">Mostra. Não leias.</p>
      <h2 className="font-serif text-3xl">O espelho</h2>
      <p className="text-sm text-fog">
        A pista está ao contrário. No ensaio, viras o ecrã. Na festa, o vizinho lê no teu telefone.
      </p>
      <div className="rounded-lg border border-border bg-card px-4 py-8 text-center">
        <p className="font-serif text-2xl leading-8 text-primary" style={{ transform: shown ? "none" : "scaleX(-1)" }}>
          a marca na trava
          <br />
          é de Elias
        </p>
        <p className="mt-4 text-[11px] uppercase tracking-widest text-muted-foreground">
          {shown ? "O vizinho leu" : "Clara — não leias em voz alta"}
        </p>
      </div>
      <Button
        className="w-full"
        size="lg"
        onClick={() => {
          setShown(true);
          done();
        }}
      >
        {shown ? "Lido pelo outro lado" : "Mostrei ao vizinho"}
      </Button>
    </div>
  );
}

const ROOMS = ["Sala", "Corredor", "Cofre"] as const;

export function PlantaPlay() {
  const done = useParty((s) => s.markLanternDone);
  const [path, setPath] = useState<string[]>([]);
  const ok = path.length === 3 && path.every((n, i) => n === ROOMS[i]);

  function tap(name: string) {
    const expect = ROOMS[path.length];
    if (name !== expect) {
      setPath(name === "Sala" ? ["Sala"] : []);
      return;
    }
    const next = [...path, name];
    setPath(next);
    if (next.length === 3) done();
  }

  return (
    <div className="space-y-4 px-5 pb-28 pt-6">
      <p className="text-[11px] uppercase tracking-[0.22em] text-accent">A mesa é a casa.</p>
      <h2 className="font-serif text-3xl">A planta</h2>
      <p className="text-sm text-fog">
        Três aparelhos no tampo. No ensaio, três faixas neste ecrã. Toca na ordem do culpado:
        Sala, Corredor, Cofre.
      </p>
      <div className="flex items-end justify-center gap-2">
        {ROOMS.map((name, i) => {
          const lit = path[i] === name || (ok && path.includes(name));
          return (
            <button
              key={name}
              type="button"
              onClick={() => tap(name)}
              className={cn(
                "flex h-36 flex-1 flex-col items-center justify-end rounded-2xl border-2 pb-3 font-serif text-lg",
                lit ? "border-primary bg-primary/15 text-primary" : "border-border text-fog",
              )}
            >
              {name}
            </button>
          );
        })}
      </div>
      <p className="text-center text-sm text-muted-foreground">
        {ok ? "O caminho acendeu." : path.length ? path.join(" → ") : "Toca os cômodos."}
      </p>
    </div>
  );
}

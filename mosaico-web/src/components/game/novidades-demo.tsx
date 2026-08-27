import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useEffect, useState, type ReactNode } from "react";

type Idea = "palimpsesto" | "espelho" | "formacao";

const IDEAS: { id: Idea; kicker: string; title: string; why: string }[] = [
  {
    id: "palimpsesto",
    kicker: "Um vidro sobre o outro",
    title: "Palimpsesto",
    why: "Nenhum telefone tem a frase. Só lê quem empilha o seu no do vizinho.",
  },
  {
    id: "espelho",
    kicker: "Mostra, não lê",
    title: "O espelho",
    why: "A pista está ao contrário. Só o outro, olhando a sua tela, consegue ler.",
  },
  {
    id: "formacao",
    kicker: "A mesa é a casa",
    title: "A planta",
    why: "Três aparelhos no tampo viram cômodos. O caminho do culpado acende entre eles.",
  },
];

export function NovidadesDemo({ onBack }: { onBack?: () => void }) {
  const [idea, setIdea] = useState<Idea>("palimpsesto");
  const [run, setRun] = useState(0);

  return (
    <div className="flex flex-col gap-4">
      <header className="text-center">
        <p className="text-[11px] uppercase tracking-[0.22em] text-accent">Novo nesta noite</p>
        <h2 className="mt-1 font-serif text-3xl">Três gestos que a mesa ainda não tinha</h2>
      </header>

      <div className="flex gap-2">
        {IDEAS.map((it) => (
          <button
            key={it.id}
            type="button"
            onClick={() => {
              setIdea(it.id);
              setRun((n) => n + 1);
            }}
            className={cn(
              "min-h-11 flex-1 rounded-md px-2 text-[11px] uppercase tracking-widest",
              idea === it.id ? "bg-primary/15 text-primary" : "text-muted-foreground",
            )}
          >
            {it.title}
          </button>
        ))}
      </div>

      <p className="text-center text-sm leading-relaxed text-fog">
        {IDEAS.find((i) => i.id === idea)?.why}
      </p>

      <div className="relative mx-auto h-[min(46vh,340px)] w-full max-w-lg">
        {idea === "palimpsesto" && <Palimpsesto key={run} />}
        {idea === "espelho" && <Espelho key={run} />}
        {idea === "formacao" && <Formacao key={run} />}
      </div>

      <p className="text-center text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
        {IDEAS.find((i) => i.id === idea)?.kicker}
      </p>

      <div className="flex gap-2">
        <Button className="flex-1" variant="soft" onClick={() => setRun((n) => n + 1)}>
          De novo
        </Button>
        {onBack && (
          <Button className="flex-1" variant="ghost" onClick={onBack}>
            Menu
          </Button>
        )}
      </div>
    </div>
  );
}

function Palimpsesto() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setOn(true), 900);
    return () => window.clearTimeout(t);
  }, []);
  return (
    <div className="relative flex h-full items-center justify-center">
      <Phone className={cn("absolute transition-all duration-700", on ? "-translate-x-6" : "-translate-x-16 -rotate-3")}>
        <p className="px-3 pt-6 font-serif text-[13px] leading-6 text-fog">
          ELIAS · · · · O
          <br />
          · · BAIXOU · ·
          <br />
          · DISJUNTOR ·
        </p>
        <p className="absolute bottom-2 w-full text-center text-[9px] uppercase tracking-widest text-primary">
          Helena
        </p>
      </Phone>
      <Phone
        className={cn(
          "absolute transition-all duration-700",
          on ? "translate-x-4 opacity-90" : "translate-x-20 rotate-3",
        )}
        lantern
      >
        {on && (
          <p className="px-3 pt-10 text-center font-serif text-lg leading-6 text-primary">
            Elias baixou
            <br />
            o disjuntor
          </p>
        )}
        <p className="absolute bottom-2 w-full text-center text-[9px] uppercase tracking-widest text-primary">
          Nilo
        </p>
      </Phone>
    </div>
  );
}

function Espelho() {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setShown(true), 1100);
    return () => window.clearTimeout(t);
  }, []);
  return (
    <div className="flex h-full items-center justify-center gap-3">
      <Phone>
        <p
          className="px-2 pt-8 text-center font-serif text-base leading-6 text-primary"
          style={{ transform: "scaleX(-1)" }}
        >
          a marca na trava
          <br />
          é de Elias
        </p>
        <p className="absolute bottom-2 w-full text-center text-[9px] uppercase tracking-widest text-primary">
          Clara
        </p>
      </Phone>
      <div
        className={cn(
          "flex h-[88%] w-[38%] flex-col items-center justify-center rounded-md border border-dashed border-primary/30 transition-opacity duration-500",
          shown ? "opacity-100" : "opacity-0",
        )}
      >
        <p className="px-2 text-center text-[11px] uppercase tracking-widest text-fog">O vizinho lê</p>
        <p className="mt-2 px-2 text-center font-serif text-sm text-primary">
          a marca na trava
          <br />
          é de Elias
        </p>
      </div>
    </div>
  );
}

function Formacao() {
  const [lit, setLit] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setLit(true), 800);
    return () => window.clearTimeout(t);
  }, []);
  return (
    <div className="relative flex h-full items-end justify-center gap-2 pb-2">
      <Room name="Sala" shift={lit ? "" : "-translate-y-3 -rotate-2"} />
      <div
        className={cn(
          "mb-10 h-1 w-6 rounded-full transition-colors duration-500",
          lit ? "bg-primary" : "bg-border",
        )}
      />
      <Room name="Corredor" shift={lit ? "" : "translate-y-2"} />
      <div
        className={cn(
          "mb-10 h-1 w-6 rounded-full transition-colors duration-700",
          lit ? "bg-primary" : "bg-border",
        )}
      />
      <Room name="Cofre" shift={lit ? "" : "-translate-y-4 rotate-2"} glow={lit} />
    </div>
  );
}

function Room({ name, shift, glow }: { name: string; shift: string; glow?: boolean }) {
  return (
    <div
      className={cn(
        "flex h-[70%] w-[28%] flex-col items-center justify-end rounded-[1.1rem] border-2 bg-card/80 pb-2 transition-all duration-700",
        glow ? "border-primary" : "border-primary/40",
        shift,
      )}
    >
      <p className="font-serif text-sm text-primary">{name}</p>
    </div>
  );
}

function Phone({
  children,
  className,
  lantern,
}: {
  children: ReactNode;
  className?: string;
  lantern?: boolean;
}) {
  return (
    <div
      className={cn(
        "box-depth h-[88%] w-[42%] overflow-hidden rounded-[1.35rem]",
        lantern && "bg-background/70 ring-4 ring-primary/25",
        className,
      )}
    >
      {children}
    </div>
  );
}

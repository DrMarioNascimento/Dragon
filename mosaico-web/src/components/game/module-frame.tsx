import { MODULOS } from "@/lib/mosaico/assets";
import { isAppleTouch, isDesktopPointer } from "@/lib/mosaico/device";
import type { NightModule } from "@/lib/mosaico/modules";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { MosaicMark } from "./mark";

/* `embed=1` é o modo INTEGRADO: a tarefa entrega uma execução, manda o tempo
   à Mesa e para, porque quem decide o que vem depois é a Mesa. Fora dela não
   existe ninguém para decidir — e era isso que travava a lanterna: aberta por
   "/noite/<tarefa>", a tarefa entrava em modo integrado, revelava a primeira
   pista, escrevia "aguarde a classificação" e ficava ali. No iPhone era pior,
   porque a página abre em tela cheia e nem sequer há uma moldura escutando.
   Agora só a noite (compact) embute; a lanterna abre a tarefa como ela é
   sozinha: caderno de pistas, próxima rodada, descanso e tempo por rodada. */

export function ModuleFrame({
  mod,
  compact,
  semente,
  onDone,
}: {
  mod: NightModule;
  compact?: boolean;
  /** cenário mandado pela Mesa; sem ele a tarefa usa o próprio relógio */
  semente?: string;
  onDone?: (ms: number) => void;
}) {
  const [mode, setMode] = useState<"wait" | "apple" | "frame">("wait");
  const [desktop, setDesktop] = useState(false);
  const runId = mod.slug;
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    setDesktop(isDesktopPointer());
    /* Na noite (compact) o iframe fica: sair da página mata a mesa.
       Só a lanterna sozinha, no iPhone, pede tela cheia. */
    if (compact) setMode("frame");
    else setMode(isAppleTouch() ? "apple" : "frame");
  }, [compact]);

  useEffect(() => {
    if (mode !== "apple") return;
    /* tela cheia, sem moldura: `from=1` é só o botão de volta ao MOSAICO. */
    window.location.replace(`${MODULOS}${mod.file}?from=1`);
  }, [mode, mod.file]);

  useEffect(() => {
    if (!compact) return;
    function onMsg(ev: MessageEvent) {
      const d = ev.data as { mosaico?: string; tempoMs?: number; runId?: string } | null;
      if (!d || d.mosaico !== "tarefa-ok") return;
      if (d.runId && d.runId !== runId) return;
      onDoneRef.current?.(typeof d.tempoMs === "number" ? d.tempoMs : 0);
    }
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [compact, runId]);

  if (mode !== "frame") {
    return (
      <div className="flex h-dvh flex-col items-center justify-center bg-background px-6 text-center">
        <MosaicMark className="mb-4 size-8 text-primary" />
        <p className="brand-wordmark text-3xl text-primary">MOSAICO</p>
        <p className="mt-3 font-serif text-xl italic text-fog">{mod.title}</p>
        <p className="mt-4 max-w-sm text-lg text-muted-foreground">
          No iPhone a casa precisa da tela inteira para o giroscópio responder.
        </p>
      </div>
    );
  }

  const base = `${MODULOS}${mod.file}`;
  /* `s` fixa o cenário: com ela, todos os telefones da mesa montam a mesma
     janela, a mesma sala e a mesma ordem de pistas — e a virada da rodada
     de 30 minutos deixa de reescrever o mundo no meio da fase. */
  const semeia = semente ? `&s=${encodeURIComponent(semente)}` : "";
  const src = compact
    ? `${base}?embed=1&run=${encodeURIComponent(runId)}${semeia}`
    : desktop
      ? `${base}?dev=1`
      : base;

  return (
    <div className={cn("relative bg-background", compact ? "h-full" : "h-dvh")}>
      {!compact && (
        <Link
          to="/noite"
          className="absolute right-3 top-[max(0.75rem,env(safe-area-inset-top))] z-20 inline-flex min-h-11 items-center gap-2 rounded-full border border-accent/30 bg-background/80 px-4 text-base font-semibold uppercase tracking-[0.16em] text-accent backdrop-blur-sm"
        >
          <ArrowLeft className="size-4" />
          MOSAICO
        </Link>
      )}
      <iframe
        key={src}
        title={mod.title}
        src={src}
        className="h-full w-full border-0"
        allow="accelerometer; gyroscope; magnetometer; fullscreen; autoplay"
        allowFullScreen
      />
    </div>
  );
}

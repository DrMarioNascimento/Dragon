import { Button } from "@/components/ui/button";
import { isAppleTouch, isDesktopPointer } from "@/lib/mosaico/device";
import type { NightModule } from "@/lib/mosaico/modules";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { MosaicMark } from "./mark";

function formatTime(ms: number) {
  const cent = Math.floor(ms / 10);
  const s = Math.floor(cent / 100);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  const c = cent % 100;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")},${String(c).padStart(2, "0")}`;
}

export function ModuleFrame({
  mod,
  compact,
  onDone,
}: {
  mod: NightModule;
  compact?: boolean;
  onDone?: (ms: number) => void;
}) {
  const [run, setRun] = useState(0);
  const [doneMs, setDoneMs] = useState<number | null>(null);
  const [mode, setMode] = useState<"wait" | "apple" | "frame">("wait");
  const [desktop, setDesktop] = useState(false);
  const runId = `${mod.slug}-${run}`;
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
    window.location.replace(`${import.meta.env.BASE_URL}modulos/${mod.file}?embed=1&from=1`);
  }, [mode, mod.file]);

  useEffect(() => {
    setDoneMs(null);
    function onMsg(ev: MessageEvent) {
      const d = ev.data as { mosaico?: string; tempoMs?: number; runId?: string } | null;
      if (!d || d.mosaico !== "tarefa-ok") return;
      if (d.runId && d.runId !== runId) return;
      if (typeof d.tempoMs === "number") setDoneMs(d.tempoMs);
      else setDoneMs(0);
      onDoneRef.current?.(typeof d.tempoMs === "number" ? d.tempoMs : 0);
    }
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [runId]);

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

  const src = `${import.meta.env.BASE_URL}modulos/${mod.file}?embed=1&run=${encodeURIComponent(runId)}${!compact && desktop ? "&dev=1" : ""}`;

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
        key={runId}
        title={mod.title}
        src={src}
        className="h-full w-full border-0"
        allow="accelerometer; gyroscope; magnetometer; fullscreen; autoplay"
        allowFullScreen
      />
      {doneMs !== null && !compact && (
        <div className="absolute inset-x-0 bottom-0 z-30 flex flex-col items-center gap-3 bg-gradient-to-t from-background via-background/95 to-transparent px-6 pb-[max(5.5rem,env(safe-area-inset-bottom))] pt-16">
          <p className="text-base uppercase tracking-[0.2em] text-accent">Fragmento localizado</p>
          <p className="font-serif text-3xl text-foreground">{mod.title}</p>
          {doneMs > 0 && (
            <p className="font-mono text-lg tabular-nums text-fog">{formatTime(doneMs)}</p>
          )}
          <p className="max-w-sm text-center text-lg text-muted-foreground">
            O tempo ficou registrado. Na mesa, a colocação define a pista.
          </p>
          <div className="mt-2 flex w-full max-w-sm gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setDoneMs(null)}>
              Continuar
            </Button>
            <Button
              className="flex-1"
              onClick={() => {
                setDoneMs(null);
                setRun((n) => n + 1);
              }}
            >
              De novo
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

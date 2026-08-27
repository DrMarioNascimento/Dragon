import { Button } from "@/components/ui/button";
import { RotateHint } from "@/components/game/rotate-hint";
import { CHARACTERS, ROLE_LABEL } from "@/lib/mosaico/case";
import { armAudio, playOnce, playStorm, stopVoice } from "@/lib/mosaico/sound";
import { useGame } from "@/lib/mosaico/store";
import { cn } from "@/lib/utils";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Compass, Play, Users, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/")({
  component: Home,
});

type Screen = "open" | "menu" | "solo" | "mesa" | "como";

function Home() {
  const nav = useNavigate();
  const start = useGame((s) => s.start);
  const match = useGame((s) => s.match);
  const hydrate = useGame((s) => s.hydrate);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [screen, setScreen] = useState<Screen>("open");
  const [seat, setSeat] = useState<number | null>(null);
  const [count, setCount] = useState(2);
  const [picked, setPicked] = useState<number[]>([]);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (match) setScreen("menu");
  }, [match]);

  function skipOpen() {
    const v = videoRef.current;
    if (v) {
      v.pause();
      v.currentTime = v.duration || 0;
    }
    stopVoice();
    setScreen("menu");
  }

  function begin(seats: number[]) {
    start(seats);
    void nav({ to: "/play" });
  }

  return (
    <main className="relative min-h-dvh overflow-hidden bg-background text-foreground">
      <RotateHint />
      <img
        src="/media/capa-vertical.jpg"
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
      <video
        ref={videoRef}
        className={cn(
          "absolute inset-0 h-full w-full object-cover transition-opacity duration-700",
          screen === "open" ? "opacity-100" : "opacity-0",
        )}
        src="/media/abertura.mp4"
        poster="/media/aguardando.jpg"
        autoPlay
        muted={muted}
        playsInline
        preload="metadata"
        disablePictureInPicture
        disableRemotePlayback
        {...{ "webkit-playsinline": "true", "x5-playsinline": "true" }}
        onEnded={() => {
          setScreen("menu");
          if (!muted) playStorm(true);
        }}
      />
      <div
        className={cn(
          "absolute inset-0 transition-opacity duration-500",
          screen === "open" ? "bg-background/20" : "bg-background/80",
        )}
      />

      {screen === "open" && (
        <div className="relative z-10 flex min-h-dvh flex-col justify-between px-6 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(2rem,env(safe-area-inset-top))]">
          <p className="text-center text-[11px] uppercase tracking-[0.32em] text-fog">
            A Casa da Costa
          </p>
          <div className="flex flex-col items-center gap-3">
            <Button variant="amber" size="lg" onClick={skipOpen}>
              Pular abertura
            </Button>
            <button
              type="button"
              className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground"
              onClick={() => {
                setMuted(false);
                armAudio();
                void videoRef.current?.play();
              }}
            >
              {muted ? "Ativar som" : "Som ligado"}
            </button>
            <button
              type="button"
              className="text-[11px] uppercase tracking-[0.18em] text-fog"
              onClick={() => playOnce("/audio/abertura.mp3", 0.85)}
            >
              Ouvir a casa
            </button>
          </div>
        </div>
      )}

      {screen !== "open" && (
        <div className="relative z-10 mx-auto flex min-h-dvh max-w-lg flex-col px-6 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-[max(2.5rem,env(safe-area-inset-top))]">
          <header className="stagger-in text-center">
            <p className="text-[11px] uppercase tracking-[0.34em] text-muted-foreground">
              A verdade é um fragmento
            </p>
            <h1 className="mt-2 font-serif text-6xl font-medium tracking-[0.08em] text-primary">
              MOSAICO
            </h1>
            <p className="mt-3 font-serif text-lg italic text-fog">
              Jogo de dedução distribuída
            </p>
          </header>

          {screen === "menu" && (
            <div className="stagger-in mt-12 flex flex-col gap-3">
              {match && (
                <Button size="lg" onClick={() => void nav({ to: "/play" })}>
                  Continuar a noite
                </Button>
              )}
              <Button size="lg" onClick={() => setScreen("solo")}>
                <Play className="size-4" />
                Jogar o caso
              </Button>
              <Button variant="outline" size="lg" onClick={() => setScreen("mesa")}>
                <Users className="size-4" />
                Mesa local
              </Button>
              <Button
                variant="amber"
                size="lg"
                onClick={() => void nav({ to: "/noite" })}
              >
                <Compass className="size-4" />
                A noite da casa
              </Button>
              <Button variant="ghost" onClick={() => setScreen("como")}>
                Como jogar
              </Button>
              <p className="mt-8 text-center text-[11px] leading-relaxed text-muted-foreground">
                Caso piloto · A Casa da Costa
                <br />
                Mario Nascimento & Osana Melo Nascimento
              </p>
            </div>
          )}

          {screen === "solo" && (
            <SeatPicker
              title="Escolha o seu lugar na casa"
              taken={[]}
              selected={seat}
              onSelect={setSeat}
              onBack={() => setScreen("menu")}
              onConfirm={() => begin([seat ?? 0])}
              confirmLabel="Entrar na tempestade"
              disabled={seat == null}
            />
          )}

          {screen === "mesa" && (
            <div className="mt-8 space-y-4">
              <h2 className="font-serif text-2xl">Quantos jogadores</h2>
              <div className="flex gap-2">
                {[2, 3, 4, 5, 6].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => {
                      setCount(n);
                      setPicked([]);
                    }}
                    className={cn(
                      "min-h-11 flex-1 rounded-md border tabular-nums",
                      count === n ? "border-accent bg-accent/15 text-accent" : "border-border",
                    )}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                Cada pessoa escolhe um assento. Os demais lugares ficam com a mesa.
              </p>
              <SeatPicker
                title={`Assentos (${picked.length}/${count})`}
                taken={[]}
                selected={null}
                multi={picked}
                onSelect={(s) =>
                  setPicked((prev) =>
                    prev.includes(s)
                      ? prev.filter((x) => x !== s)
                      : prev.length < count
                        ? [...prev, s]
                        : prev,
                  )
                }
                onBack={() => setScreen("menu")}
                onConfirm={() => begin(picked)}
                confirmLabel="Abrir a mesa"
                disabled={picked.length !== count}
              />
            </div>
          )}

          {screen === "como" && (
            <div className="mt-8 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-2xl">Como jogar</h2>
                <Button variant="ghost" size="icon" onClick={() => setScreen("menu")} aria-label="Fechar">
                  <X className="size-5" />
                </Button>
              </div>
              <ol className="space-y-3 text-sm leading-relaxed text-fog">
                <li><strong className="text-foreground">0.</strong> A história pula — cada um lê um pedaço.</li>
                <li><strong className="text-foreground">1.</strong> Fragmentos só seus. Ninguém vê o caderno alheio.</li>
                <li><strong className="text-foreground">2.</strong> Hipótese I, ainda fraca.</li>
                <li><strong className="text-foreground">3.</strong> Mercado cego: compra o tipo, não o conteúdo.</li>
                <li><strong className="text-foreground">4.</strong> Troca vinculada: prometeu, o sistema cumpre.</li>
                <li><strong className="text-foreground">5.</strong> Mosaico coletivo e a carta da noite.</li>
                <li><strong className="text-foreground">6.</strong> Hipótese II, última ação, dedução individual.</li>
                <li><strong className="text-foreground">7.</strong> A casa revela. O placar junta tempo, qualidade, cooperação, risco.</li>
              </ol>
              <p className="font-serif text-lg italic text-fog">
                Todos querem resolver o caso. A vitória é individual.
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Feito para o telefone, em pé. No iPhone: Compartilhar → Adicionar à Tela de Início.
                No Android: o menu do Chrome → Adicionar à tela inicial. Quando a casa pedir movimento, aceite.
              </p>
              <Button className="w-full" onClick={() => setScreen("solo")}>
                Escolher lugar
              </Button>
            </div>
          )}
        </div>
      )}
    </main>
  );
}

function SeatPicker({
  title,
  selected,
  taken,
  multi,
  onSelect,
  onBack,
  onConfirm,
  confirmLabel,
  disabled,
}: {
  title: string;
  selected: number | null;
  taken: number[];
  multi?: number[];
  onSelect: (seat: number) => void;
  onBack: () => void;
  onConfirm: () => void;
  confirmLabel: string;
  disabled?: boolean;
}) {
  return (
    <div className="mt-8 space-y-3">
      <h2 className="font-serif text-2xl">{title}</h2>
      {CHARACTERS.map((c) => {
        const isOn = selected === c.seat || Boolean(multi?.includes(c.seat));
        const busy = taken.includes(c.seat);
        return (
          <button
            key={c.id}
            type="button"
            disabled={busy}
            onClick={() => onSelect(c.seat)}
            className={cn(
              "w-full rounded-xl border p-4 text-left transition-[border-color,background-color] duration-150",
              isOn ? "border-accent bg-accent/10" : "border-border bg-card/80",
            )}
          >
            <div className="flex items-baseline justify-between gap-2">
              <p className="font-serif text-xl">{c.title}</p>
              <span className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                {ROLE_LABEL[c.role]}
              </span>
            </div>
            <p className="text-sm text-fog">{c.name}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{c.blurb}</p>
          </button>
        );
      })}
      <div className="flex gap-2 pt-2">
        <Button variant="outline" className="flex-1" onClick={onBack}>
          Voltar
        </Button>
        <Button className="flex-1" disabled={disabled} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </div>
  );
}

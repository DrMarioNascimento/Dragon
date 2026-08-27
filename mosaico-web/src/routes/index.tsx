import { Button } from "@/components/ui/button";
import { MosaicMark } from "@/components/game/mark";
import { RotateHint } from "@/components/game/rotate-hint";
import { armAudio, playOnce, playStorm, stopVoice } from "@/lib/mosaico/sound";
import { useParty } from "@/lib/mosaico/party";
import { cn } from "@/lib/utils";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Compass, DoorOpen, Play, QrCode } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/")({
  component: Home,
});

type Screen = "open" | "menu" | "criar" | "entrar" | "ensaiar" | "como";

function Home() {
  const nav = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [screen, setScreen] = useState<Screen>("open");
  const [muted, setMuted] = useState(true);
  const [nome, setNome] = useState("");
  const [forma, setForma] = useState<"m" | "f">("m");
  const [codigo, setCodigo] = useState("");
  const create = useParty((s) => s.create);
  const join = useParty((s) => s.join);
  const localStart = useParty((s) => s.localStart);
  const connecting = useParty((s) => s.connecting);
  const error = useParty((s) => s.error);
  const mode = useParty((s) => s.mode);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const q = new URLSearchParams(window.location.search).get("sala");
    if (q) {
      setCodigo(q.toUpperCase());
      setScreen("entrar");
    }
  }, []);

  useEffect(() => {
    if (mode !== "idle") void nav({ to: "/play" });
  }, [mode, nav]);

  function skipOpen() {
    const v = videoRef.current;
    if (v) {
      v.pause();
      v.currentTime = v.duration || 0;
    }
    stopVoice();
    setScreen("menu");
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
        {...{ "webkit-playsinline": "true", "x-playsinline": "true" }}
        onEnded={() => {
          setScreen("menu");
          if (!muted) playStorm(true);
        }}
      />
      <div className="cover-tint absolute inset-0" />
      <div
        className={cn(
          "absolute inset-0 transition-opacity duration-500",
          screen === "open" ? "bg-background/10" : "bg-background/72",
        )}
      />

      {screen === "open" && (
        <div className="relative z-10 flex min-h-dvh flex-col justify-between px-6 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(2rem,env(safe-area-inset-top))]">
          <div className="flex flex-col items-center gap-3">
            <MosaicMark className="size-8 text-primary" />
            <p className="brand-wordmark text-4xl text-primary">MOSAICO</p>
            <p className="text-center text-[11px] uppercase tracking-[0.28em] text-fog">
              A Casa da Costa
            </p>
          </div>
          <div className="flex flex-col items-center gap-3">
            <Button variant="soft" size="lg" onClick={skipOpen}>
              Pular abertura
            </Button>
            <button
              type="button"
              className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground"
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
              className="text-[11px] uppercase tracking-[0.16em] text-fog"
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
            <MosaicMark className="mx-auto mb-5 size-9 text-primary" />
            <p className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
              A verdade é um fragmento
            </p>
            <h1 className="brand-wordmark mt-2 text-6xl text-primary">MOSAICO</h1>
            <p className="mt-3 font-serif text-lg italic text-fog">
              A noite na mesa
            </p>
          </header>

          {screen === "menu" && (
            <div className="stagger-in mt-10 flex flex-col gap-3">
              <Button size="lg" onClick={() => setScreen("criar")}>
                <DoorOpen className="size-4" />
                Abrir uma mesa
              </Button>
              <Button variant="outline" size="lg" onClick={() => setScreen("entrar")}>
                <QrCode className="size-4" />
                Entrar com o código
              </Button>
              <Button variant="soft" size="lg" onClick={() => setScreen("ensaiar")}>
                <Play className="size-4" />
                Ensaiar sozinho
              </Button>
              <Button
                variant="ghost"
                size="lg"
                onClick={() => void nav({ to: "/noite" })}
              >
                <Compass className="size-4" />
                A lanterna
              </Button>
              <Button variant="ghost" onClick={() => setScreen("como")}>
                Como jogar
              </Button>
              <p className="mt-8 text-center text-[11px] leading-relaxed text-muted-foreground">
                Cada um no próprio telefone. A mesa senta. A casa existe neste cômodo.
                <br />
                Mario Nascimento & Osana Melo Nascimento
              </p>
            </div>
          )}

          {(screen === "criar" || screen === "entrar" || screen === "ensaiar") && (
            <form
              className="mt-8 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                const n = nome.trim() || "Jogador";
                if (screen === "ensaiar") {
                  localStart(n);
                  return;
                }
                if (screen === "criar") void create(n, forma);
                else void join(codigo, n, forma);
              }}
            >
              <h2 className="font-serif text-2xl">
                {screen === "criar"
                  ? "Abrir a mesa"
                  : screen === "entrar"
                    ? "Entrar"
                    : "Ensaiar"}
              </h2>
              {screen === "entrar" && (
                <input
                  className="h-12 w-full rounded-md border border-border bg-card px-3 tracking-[0.2em] uppercase"
                  placeholder="CÓDIGO"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                  autoCapitalize="characters"
                />
              )}
              <input
                className="h-12 w-full rounded-md border border-border bg-card px-3"
                placeholder="Seu nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
              />
              <div className="flex gap-2">
                {(
                  [
                    ["m", "Ele"],
                    ["f", "Ela"],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setForma(id)}
                    className={cn(
                      "h-11 flex-1 rounded-md border text-sm",
                      forma === id
                        ? "border-accent bg-accent/15 text-accent"
                        : "border-border",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button className="w-full" size="lg" type="submit" disabled={connecting}>
                {connecting
                  ? "Ligando a mesa…"
                  : screen === "criar"
                    ? "Criar sala"
                    : screen === "entrar"
                      ? "Entrar"
                      : "Começar o ensaio"}
              </Button>
              <Button type="button" variant="ghost" className="w-full" onClick={() => setScreen("menu")}>
                Voltar
              </Button>
            </form>
          )}

          {screen === "como" && (
            <div className="mt-8 space-y-3 text-sm leading-relaxed text-fog">
              <p>Resolver um caso: quem abriu o cofre na Casa da Costa, em dois minutos de apagão.</p>
              <p>O telefone diz uma frase por vez:</p>
              <ol className="list-decimal space-y-1 pl-5">
                <li>É a sua vez. Faça.</li>
                <li>Aponta — a janela, depois o cômodo.</li>
                <li>Procura a sua cor.</li>
                <li>Encosta a carta.</li>
                <li>Compra ou guarda.</li>
                <li>Quem foi?</li>
              </ol>
              <p>A mesa escolhe personagem, vez e time. Cada um acusa sozinho.</p>
              <Button variant="ghost" onClick={() => setScreen("menu")}>
                Voltar
              </Button>
            </div>
          )}
        </div>
      )}
    </main>
  );
}

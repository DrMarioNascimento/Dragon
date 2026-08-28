import { Button } from "@/components/ui/button";
import { MosaicMark } from "@/components/game/mark";
import { CartaDemo } from "@/components/game/carta-demo";
import { NovidadesDemo } from "@/components/game/novidades-demo";
import { FORMA_OPCOES, type Forma } from "@/lib/mosaico/arquetipo";
import { armAudio, stopVoice } from "@/lib/mosaico/sound";
import { useParty } from "@/lib/mosaico/party";
import type { NoiteFormato } from "@/lib/mosaico/v3";
import { cn } from "@/lib/utils";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Compass, DoorOpen, Play, Puzzle, QrCode, Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/")({
  component: Home,
});

type Screen = "open" | "menu" | "criar" | "entrar" | "ensaiar" | "como" | "carta" | "novo";

function Home() {
  const nav = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [screen, setScreen] = useState<Screen>(() => {
    if (typeof window === "undefined") return "menu";
    return new URLSearchParams(window.location.search).get("sala")
      ? "entrar"
      : "menu";
  });
  const [muted, setMuted] = useState(true);
  const [nome, setNome] = useState("");
  const [forma, setForma] = useState<Forma>("n");
  const [codigo, setCodigo] = useState("");
  const [formato, setFormato] = useState<NoiteFormato>("curta");
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

  function skipOpen(e?: { stopPropagation?: () => void }) {
    e?.stopPropagation?.();
    try {
      videoRef.current?.pause();
    } catch {
      /* ignore */
    }
    try {
      stopVoice();
    } catch {
      /* ignore */
    }
    setScreen("menu");
  }

  useEffect(() => {
    if (screen !== "open") return;
    const id = window.setTimeout(() => setScreen("menu"), 14000);
    return () => window.clearTimeout(id);
  }, [screen]);

  return (
    <main className="relative min-h-full bg-background text-foreground">
      <img
        src={`${import.meta.env.BASE_URL}media/capa-vertical.jpg`}
        alt=""
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
      />
      <video
        ref={videoRef}
        className={cn(
          "pointer-events-none absolute inset-0 h-full w-full object-cover transition-opacity duration-700",
          screen === "open" ? "opacity-100" : "opacity-0",
        )}
        src={`${import.meta.env.BASE_URL}media/abertura.mp4`}
        poster="/media/aguardando.jpg"
        autoPlay
        muted={muted}
        playsInline
        preload="metadata"
        disablePictureInPicture
        disableRemotePlayback
        {...{ "webkit-playsinline": "true", "x-playsinline": "true" }}
        onEnded={() => setScreen("menu")}
        onError={() => setScreen("menu")}
      />
      <div
        className={cn(
          "pointer-events-none absolute inset-0 transition-colors duration-500",
          screen === "open"
            ? "bg-gradient-to-b from-background/70 via-transparent to-transparent"
            : "bg-background/90",
        )}
      />

      {screen === "open" && (
        <button
          type="button"
          className="relative z-10 flex min-h-dvh w-full flex-col px-4 pt-[max(0.75rem,env(safe-area-inset-top))] text-left"
          onClick={() => skipOpen()}
          aria-label="Pular abertura"
        >
          <div className="flex items-center justify-between gap-3">
            <span
              role="button"
              tabIndex={0}
              className="pointer-events-auto inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-background/70 px-3 text-base uppercase tracking-widest text-fog backdrop-blur-sm"
              onClick={(e) => {
                e.stopPropagation();
                setMuted((m) => !m);
                armAudio();
                if (muted) void videoRef.current?.play();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") e.currentTarget.click();
              }}
            >
              {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
              {muted ? "Som" : "Som ligado"}
            </span>
            <span className="pointer-events-none rounded-full border border-primary/40 bg-background/80 px-4 py-2 text-lg text-primary backdrop-blur-sm">
              Toque para pular
            </span>
          </div>
        </button>
      )}

      {screen !== "open" && (
        <div className="relative z-20 mx-auto flex min-h-full max-w-lg flex-col px-6 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,env(safe-area-inset-top))]">
          {screen !== "carta" && screen !== "novo" && (
          <header className="stagger-in shrink-0 text-center">
            <MosaicMark className="mx-auto mb-5 size-9 text-primary" />
            <p className="text-base uppercase tracking-[0.28em] text-muted-foreground">
              A Casa da Costa
            </p>
            <h1 className="brand-wordmark mt-2 text-5xl text-primary sm:text-6xl">MOSAICO</h1>
            <p className="mt-3 font-serif text-lg italic text-fog">
              A noite na mesa
            </p>
          </header>
          )}

          {screen === "menu" && (
            <div className="stagger-in mt-8 flex flex-col gap-4">
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
              <Button variant="soft" size="lg" onClick={() => setScreen("novo")}>
                <Puzzle className="size-4" />
                Três gestos novos
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
              <p className="mt-8 text-center text-base leading-relaxed text-muted-foreground">
                Cada um no próprio telefone. A mesa senta.
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
                  localStart(n, forma, formato);
                  return;
                }
                if (screen === "criar") void create(n, forma, formato);
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
                  className="field-depth h-12 w-full rounded-md px-3 tracking-[0.2em] uppercase"
                  placeholder="CÓDIGO"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                  autoCapitalize="characters"
                />
              )}
              <input
                className="field-depth h-12 w-full rounded-md px-3"
                placeholder="Seu nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
              />
              <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Boas-vindas">
                {FORMA_OPCOES.map(({ id, emoji, label }) => (
                  <label
                    key={id}
                    className={cn(
                      "relative z-20 flex min-h-[6.5rem] cursor-pointer flex-col items-center justify-center gap-2 rounded-lg px-1 py-3",
                      forma === id ? "btn-depth" : "box-depth",
                    )}
                  >
                    <input
                      type="radio"
                      name="forma"
                      value={id}
                      checked={forma === id}
                      onChange={() => setForma(id)}
                      className="absolute inset-0 z-30 cursor-pointer opacity-0"
                      aria-label={label}
                    />
                    <span className="pointer-events-none text-3xl leading-none" aria-hidden>
                      {emoji}
                    </span>
                    <span className="pointer-events-none font-serif text-lg italic text-fog">{label}</span>
                  </label>
                ))}
              </div>
              {(screen === "criar" || screen === "ensaiar") && (
                <div className="grid grid-cols-2 gap-2">
                  <label
                    className={cn(
                      "relative z-20 cursor-pointer rounded-lg px-3 py-3 text-left",
                      formato === "curta" ? "btn-depth" : "box-depth",
                    )}
                  >
                    <input
                      type="radio"
                      name="formato"
                      value="curta"
                      checked={formato === "curta"}
                      onChange={() => setFormato("curta")}
                      className="absolute inset-0 z-30 cursor-pointer opacity-0"
                    />
                    <p className="pointer-events-none font-serif text-lg">Noite curta</p>
                    <p className="pointer-events-none text-base text-muted-foreground">uns 20 min</p>
                  </label>
                  <label
                    className={cn(
                      "relative z-20 cursor-pointer rounded-lg px-3 py-3 text-left",
                      formato === "cheia" ? "btn-depth" : "box-depth",
                    )}
                  >
                    <input
                      type="radio"
                      name="formato"
                      value="cheia"
                      checked={formato === "cheia"}
                      onChange={() => setFormato("cheia")}
                      className="absolute inset-0 z-30 cursor-pointer opacity-0"
                    />
                    <p className="pointer-events-none font-serif text-lg">Noite cheia</p>
                    <p className="pointer-events-none text-base text-muted-foreground">uns 40 min</p>
                  </label>
                </div>
              )}
              {error && <p className="text-lg text-destructive">{error}</p>}
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

          {screen === "novo" && (
            <div className="stagger-in mt-2">
              <NovidadesDemo onBack={() => setScreen("menu")} />
            </div>
          )}

          {screen === "carta" && (
            <div className="stagger-in mt-6">
              <CartaDemo onBack={() => setScreen("menu")} />
            </div>
          )}

          {screen === "como" && (
            <div className="mt-8 space-y-3 text-lg leading-relaxed text-fog">
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

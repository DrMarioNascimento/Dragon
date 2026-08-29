import { Button } from "@/components/ui/button";
import { REVEAL_SLIDES } from "@/lib/mosaico/case";
import { tituloPapel, tituloPapelNaMesa } from "@/lib/mosaico/arquetipo";
import { useParty } from "@/lib/mosaico/party";
import {
  CHAR_IDS,
  DEDUCAO,
  FRAGMENTOS,
  PHONE_LINE,
  ROTEIRO,
  VERDADE,
  fotoDoNucleo,
  papeisNoGrupo,
  FOTO_IDS,
  camposDoNucleo,
  nucleoDoCampo,
  CAMPOS_FICHA,
  type CampoFicha,
  type V3Phase,
} from "@/lib/mosaico/v3";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CartaPuzzle, FOTOS, type FotoId } from "./carta-puzzle";
import { EspelhoPlay, PalimpsestoPlay, PlantaPlay } from "./gesto-play";
import { FaseRelogio } from "./cronometro";
import { MosaicMark } from "./mark";
import { ModuleFrame } from "./module-frame";
import { NIGHT_MODULES } from "@/lib/mosaico/modules";

/* Lê da store: é um hook, e o nome tem de dizer isso. */
function useEu() {
  const uid = useParty((s) => s.uid);
  const players = useParty((s) => s.players);
  return players.find((p) => p.id === uid) ?? players[0] ?? null;
}

function Line({ children }: { children: string }) {
  return (
    <p className="text-base uppercase tracking-[0.22em] text-accent">{children}</p>
  );
}

const LANTERN_FASES = ["janela", "vidro", "salaescura", "palimpsesto", "espelho", "planta"];

function HostBar() {
  const isMaster = useParty((s) => s.isMaster);
  const advance = useParty((s) => s.advance);
  const lanternDone = useParty((s) => s.lanternDone);
  const fase = useParty((s) => (s.mode === "local" ? s.localFase : s.room?.fase));
  const faseAte = useParty((s) => s.room?.faseAteMs);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(t);
  }, []);
  if (!isMaster) return null;
  if (faseAte && faseAte > now) return null;
  if (fase && LANTERN_FASES.includes(fase)) {
    if (!lanternDone) return null;
  } else if (!fase || !["votacao", "encaixe", "deducao"].includes(fase)) {
    return null;
  }
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 px-4 pb-[max(0.8rem,env(safe-area-inset-bottom))] pt-3">
      <Button className="w-full" size="lg" onClick={() => void advance()}>
        Seguir
      </Button>
    </div>
  );
}

function ObserverPlay({ nome }: { nome: string }) {
  const [pick, setPick] = useState<null | boolean>(null);
  return (
    <div className="space-y-5 px-5 pb-10 pt-6">
      <Line>Observa. Joga.</Line>
      <h2 className="font-serif text-3xl">{nome} está a fazer</h2>
      <p className="text-lg text-fog">Não esperes. Isto soou verdadeiro?</p>
      <div className="flex gap-2">
        <Button
          className="flex-1"
          variant={pick === true ? "default" : "outline"}
          onClick={() => setPick(true)}
        >
          Verdadeiro
        </Button>
        <Button
          className="flex-1"
          variant={pick === false ? "default" : "outline"}
          onClick={() => setPick(false)}
        >
          Falso
        </Button>
      </div>
      {pick !== null && (
        <p className="text-center font-serif text-lg italic text-primary">
          Fica. A casa ouviu.
        </p>
      )}
    </div>
  );
}

function SalaScreen() {
  const players = useParty((s) => s.players);
  const code = useParty((s) => s.code);
  const isMaster = useParty((s) => s.isMaster);
  const ready = useParty((s) => s.ready);
  const startNight = useParty((s) => s.startNight);
  const eu = useEu();
  const link =
    typeof window !== "undefined" && code && code !== "LOCAL"
      ? `${window.location.origin}${import.meta.env.BASE_URL}?sala=${code}`
      : null;

  return (
    <div className="space-y-5 px-5 pb-10 pt-6">
      <Line>{PHONE_LINE.sala}</Line>
      <h1 className="font-serif text-4xl">A mesa</h1>
      <p className="text-lg text-fog">
        Aponta. Mostra. Acusa. No teste, um jogador passa por tudo.
      </p>
      {code && code !== "LOCAL" && (
        <div className="box-depth rounded-lg px-4 py-5 text-center">
          <p className="text-base uppercase tracking-[0.2em] text-muted-foreground">
            Código da sala
          </p>
          <p className="mt-2 font-serif text-4xl tracking-[0.2em] text-primary">{code}</p>
          {link && (
            <>
              <img
                alt="QR da mesa"
                className="mx-auto mt-4 rounded-md bg-white p-2"
                width={220}
                height={220}
                src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(link)}`}
              />
              <p className="mt-3 text-lg text-fog">
                Os outros apontam a câmera aqui. Sem digitar código.
              </p>
            </>
          )}
        </div>
      )}
      <ul className="space-y-2">
        {players.map((p) => (
          <li
            key={p.id}
            className="box-depth flex items-center justify-between rounded-md px-3 py-2 text-lg"
          >
            <span>{p.nome}</span>
            <span className="text-base text-muted-foreground">
              {p.pronto ? "pronto" : "entrando"}
            </span>
          </li>
        ))}
      </ul>
          {eu && !eu.pronto && !isMaster && (
        <Button className="w-full" size="lg" onClick={() => void ready()}>
          Estou pronto
        </Button>
      )}
      {isMaster && (
        <Button
          className="w-full"
          size="lg"
          onClick={() => void startNight()}
          disabled={players.length < 1}
        >
          Começar o jogo
        </Button>
      )}
    </div>
  );
}

function EnceneScreen() {
  const players = useParty((s) => s.players);
  const uid = useParty((s) => s.uid);
  const vez = useParty((s) => (s.mode === "local" ? s.localVez : s.room?.vez ?? 0));
  const setVez = useParty((s) => s.setVez);
  const isMaster = useParty((s) => s.isMaster);
  const advance = useParty((s) => s.advance);
  const formato = useParty((s) => s.room?.formato);
  const ator = players[vez] ?? players[0];
  const tour = players.length === 1 && formato !== "curta";
  const [charI, setCharI] = useState(0);
  const personagem = tour ? CHAR_IDS[charI] : ator?.personagem || "tomas";
  const mine = tour || ator?.id === uid;
  const roteiro = ROTEIRO[personagem] ?? ROTEIRO.tomas;
  const eu = players.find((p) => p.id === uid);
  const mascara = tituloPapel(personagem, eu?.forma);
  const markObserve = useParty((s) => s.markObserve);
  const [step, setStep] = useState<"entenda" | "faca" | "fale" | "julga">("entenda");

  if (!mine) {
    return <ObserverPlay nome={ator?.nome || "Alguém"} />;
  }

  function seguir() {
    if (formato === "curta") {
      void advance();
      return;
    }
    if (tour) {
      if (charI < CHAR_IDS.length - 1) {
        setCharI(charI + 1);
        setStep("entenda");
        return;
      }
      void advance();
      return;
    }
    const n = vez + 1;
    if (n >= players.length || n >= 6) void advance();
    else void setVez(n);
    setStep("entenda");
  }

  return (
    <div className="space-y-5 px-5 pb-10 pt-6">
      <Line>{PHONE_LINE.encenacao}</Line>
      <p className="font-serif text-xl text-primary">{mascara}</p>
      {tour && (
        <p className="text-base uppercase tracking-widest text-muted-foreground">
          Cena {charI + 1} de {CHAR_IDS.length}
        </p>
      )}
      {step === "entenda" && (
        <>
          <h2 className="font-serif text-3xl">Entenda a cena</h2>
          <p className="text-base leading-relaxed text-fog">{roteiro.resumo}</p>
          <Button className="w-full" size="lg" onClick={() => setStep("faca")}>
            Faça
          </Button>
        </>
      )}
      {step === "faca" && (
        <>
          <h2 className="font-serif text-3xl">Faça</h2>
          <p className="text-base leading-relaxed text-fog">{roteiro.acao}</p>
          <Button className="w-full" size="lg" onClick={() => setStep("fale")}>
            Fale
          </Button>
        </>
      )}
      {step === "fale" && (
        <>
          <h2 className="font-serif text-3xl">Fale</h2>
          <p className="font-serif text-xl italic leading-relaxed">{roteiro.fala}</p>
          <Button
            className="w-full"
            size="lg"
            onClick={() => setStep("julga")}
          >
            Toque para concluir sua apresentação
          </Button>
        </>
      )}
      {step === "julga" && (
        <>
          <h2 className="font-serif text-3xl">Isto soou verdadeiro?</h2>
          <p className="text-lg text-fog">Mesmo sozinho: observa o que acabaste de fazer.</p>
          <Button
            className="w-full"
            size="lg"
            onClick={() => {
              markObserve(personagem, true);
              seguir();
            }}
          >
            Verdadeiro
          </Button>
          <Button
            className="w-full"
            variant="outline"
            size="lg"
            onClick={() => {
              markObserve(personagem, false);
              seguir();
            }}
          >
            Falso
          </Button>
        </>
      )}
      {step === "entenda" && !tour && (
        <button
          type="button"
          className="block w-full text-center text-base text-muted-foreground"
          onClick={() => seguir()}
        >
          Prefiro observar
        </button>
      )}
      {isMaster && players.length > 1 && (
        <button
          type="button"
          className="block w-full text-center text-base text-muted-foreground"
          onClick={() => void setVez(Math.min(vez + 1, players.length - 1))}
        >
          Pular a apresentação atual
        </button>
      )}
    </div>
  );
}

function VotoScreen() {
  const players = useParty((s) => s.players);
  const uid = useParty((s) => s.uid);
  const vote = useParty((s) => s.vote);
  const voteTarget = useParty((s) => s.voteTarget);
  const others = players.filter((p) => p.id !== uid);
  return (
    <div className="space-y-4 px-5 pb-28 pt-6">
      <Line>{PHONE_LINE.votacao}</Line>
      <h2 className="font-serif text-3xl">Quem deu o clima?</h2>
      <p className="text-lg text-muted-foreground">Um toque. Sem votar em si.</p>
      <div className="flex flex-col gap-2">
        {(others.length ? others : players).map((p) => (
          <Button
            key={p.id}
            variant={voteTarget === p.id ? "default" : "outline"}
            onClick={() => vote(p.id!)}
          >
            {p.nome}
          </Button>
        ))}
      </div>
    </div>
  );
}

function LanternPhase({ slug }: { slug: string }) {
  const mod = NIGHT_MODULES.find((m) => m.slug === slug)!;
  const markPista = useParty((s) => s.markPista);
  const lanternDone = useParty((s) => s.lanternDone);
  return (
    <div className={cn("fixed inset-0 z-10 bg-background", lanternDone && "pb-24")}>
      <ModuleFrame mod={mod} compact onDone={() => markPista(slug)} />
    </div>
  );
}

function CorScreen() {
  const eu = useEu();
  const confirmFragment = useParty((s) => s.confirmFragment);
  const players = useParty((s) => s.players);
  const room = useParty((s) => s.room);
  const n = Number(eu?.nucleo || 1) as 1 | 2 | 3 | 4;
  const f = FRAGMENTOS[n];
  const ready = players.filter((p) => p.fragmentoPronto).length;
  const opened = Number(room?.mosaicoAbertoMs) || Date.now();
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 250);
    return () => window.clearInterval(id);
  }, []);
  const elapsed = Date.now() - opened + tick * 0;
  const locked = elapsed < 5000;

  return (
    <div className={cn("relative flex min-h-dvh flex-col items-center justify-center px-6 pb-16 pt-16 text-center text-white", f.cls)}>
      <p className="text-base uppercase tracking-[0.24em] opacity-80">Seu Fragmento é</p>
      <h1 className="mt-3 font-serif text-4xl">{f.nome}</h1>
      <p className="mt-2 text-lg">Tela {f.cor}</p>
      <p className="mt-6 max-w-xs text-lg leading-relaxed opacity-90">
        Procura quem tem a mesma cor. A carta só fecha com eles.
      </p>
      <p className="mt-8 font-serif text-3xl tabular-nums">
        {String(Math.floor(elapsed / 60000)).padStart(2, "0")}:
        {String(Math.floor(elapsed / 1000) % 60).padStart(2, "0")}
      </p>
      {eu?.fragmentoPronto ? (
        <p className="mt-8 text-lg">
          Fragmento encontrado. {ready} de {players.length} confirmaram.
        </p>
      ) : (
        <Button
          className="mt-8"
          size="lg"
          disabled={locked}
          onClick={() => void confirmFragment()}
        >
          {locked ? "Espere um instante…" : "OK, encontrei meu Fragmento"}
        </Button>
      )}
    </div>
  );
}

function EncaixeScreen() {
  const players = useParty((s) => s.players);
  const uid = useParty((s) => s.uid);
  const eu = useEu();
  const nucleo = eu?.nucleo ?? 1;
  const membros = players
    .filter((p) => p.nucleo === nucleo)
    .slice()
    .sort((a, b) => (a.id || "").localeCompare(b.id || ""));
  const idx = Math.max(0, membros.findIndex((p) => p.id === uid));
  const papeis = papeisNoGrupo(membros.length);
  const daCasa = fotoDoNucleo(nucleo);
  const [foto, setFoto] = useState<FotoId>(daCasa);
  const [feitas, setFeitas] = useState<FotoId[]>([]);
  const [tarjaEnsaio, setTarjaEnsaio] = useState(false);
  const ensaio = players.length === 1;
  const papel = ensaio ? (tarjaEnsaio ? "tarja" : "full") : papeis[idx];
  const meta = FOTOS[foto];

  return (
    <div className="space-y-4 px-5 pb-28 pt-6">
      <Line>{PHONE_LINE.encaixe}</Line>
      <h2 className="font-serif text-3xl">
        {papel === "tarja" ? "A tarja" : meta.onde.split(".")[0]}
      </h2>
      <p className="text-lg text-fog">{meta.onde}</p>
      <CartaPuzzle
        key={`${foto}-${papel}`}
        foto={foto}
        papel={papel}
        phones={membros.length}
        onComplete={() =>
          setFeitas((prev) => (prev.includes(foto) ? prev : [...prev, foto]))
        }
      />
      {ensaio && feitas.includes(foto) && !tarjaEnsaio && feitas.length < FOTO_IDS.length && (
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => {
            const i = FOTO_IDS.indexOf(foto);
            setFoto(FOTO_IDS[(i + 1) % FOTO_IDS.length]);
          }}
        >
          O outro objeto
        </Button>
      )}
      {ensaio && feitas.length >= 1 && !tarjaEnsaio && (
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => setTarjaEnsaio(true)}
        >
          A tarja do ímpar
        </Button>
      )}
    </div>
  );
}

function DeducaoScreen() {
  const d = useParty((s) => s.deduction);
  const setDeduction = useParty((s) => s.setDeduction);
  const submit = useParty((s) => s.submitDeduction);
  const submittedAt = useParty((s) => s.submittedAt);
  const players = useParty((s) => s.players);
  const mode = useParty((s) => s.mode);
  const eu = useEu();
  const nNucleos =
    mode === "local" ? 1 : new Set(players.map((p) => p.nucleo || 1)).size;
  const meus = camposDoNucleo(eu?.nucleo ?? 1, nNucleos);
  const [ouvi, setOuvi] = useState<Partial<Record<CampoFicha, boolean>>>({});
  const ready = CAMPOS_FICHA.every((c) => d[c]) && !submittedAt;
  const suspeitos = DEDUCAO.suspeitos.map((s) => ({
    ...s,
    label: tituloPapelNaMesa(s.id, players),
  }));

  function Field({
    label,
    field,
    opts,
  }: {
    label: string;
    field: CampoFicha;
    opts: { id: string; label: string }[];
  }) {
    const dono = nucleoDoCampo(field, nNucleos);
    const meu = meus.includes(field) || !!ouvi[field];
    const frag = FRAGMENTOS[dono as 1 | 2 | 3 | 4];
    return (
      <label className="block space-y-1">
        <span className="text-base uppercase tracking-[0.16em] text-muted-foreground">
          {label}
        </span>
        {meu ? (
          <select
            className="field-depth h-11 w-full rounded-md px-3"
            value={d[field] ?? ""}
            disabled={!!submittedAt}
            onChange={(e) => setDeduction({ ...d, [field]: e.target.value || null })}
          >
            <option value="">—</option>
            {opts.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        ) : (
          <button
            type="button"
            className="box-depth w-full rounded-md px-3 py-3 text-left text-lg text-fog"
            onClick={() => setOuvi((s) => ({ ...s, [field]: true }))}
          >
            A casa deu isso ao fragmento {frag?.cor ?? dono}. Quando a mesa falar, toca aqui.
          </button>
        )}
      </label>
    );
  }

  return (
    <div className="space-y-4 px-5 pb-28 pt-6">
      <Line>{PHONE_LINE.deducao}</Line>
      <h2 className="font-serif text-3xl">Quem foi?</h2>
      <p className="text-lg text-fog">
        Três linhas. A tua, tu marcas. As outras, a mesa fala.
      </p>
      <Field label="Suspeito" field="suspectId" opts={suspeitos} />
      <Field label="O que fez" field="actionId" opts={DEDUCAO.acoes} />
      <Field label="A prova" field="proofId" opts={DEDUCAO.provas} />
      <Button className="w-full" size="lg" disabled={!ready} onClick={submit}>
        Acusar — não se muda
      </Button>
      {submittedAt && (
        <p className="text-center text-lg text-fog">Registrado. Aguarde a casa.</p>
      )}
    </div>
  );
}

function ResultadoScreen() {
  const d = useParty((s) => s.deduction);
  const submittedAt = useParty((s) => s.submittedAt);
  const players = useParty((s) => s.players);
  const acertou = d.suspectId === VERDADE.suspectId;
  const qualidade = [
    d.actionId === VERDADE.actionId,
    d.proofId === VERDADE.proofId,
  ].filter(Boolean).length;
  const tempo = acertou ? 32 : 0;
  const caso = acertou ? [0, 6, 13][qualidade] : 0;
  const total = tempo + caso;

  return (
    <div className="space-y-6 px-5 pb-16 pt-6">
      <Line>{PHONE_LINE.resultado}</Line>
      <h2 className="font-serif text-3xl">A casa fala</h2>
      {REVEAL_SLIDES.map((s) => (
        <section key={s.title} className="space-y-1">
          <p className="text-base uppercase tracking-[0.18em] text-accent">{s.kicker}</p>
          <h3 className="font-serif text-xl">{s.title}</h3>
          <p className="text-lg leading-relaxed text-fog">{s.body}</p>
        </section>
      ))}
      <div className="box-depth rounded-lg px-4 py-4">
        <p className="font-serif text-2xl text-primary">
          {acertou
            ? `Você apontou ${tituloPapelNaMesa("elias", players)}.`
            : "A casa não era quem você acusou."}
        </p>
        <p className="mt-2 text-lg text-fog">
          Tempo {tempo} · Caso {caso}
        </p>
        <p className="mt-3 font-serif text-4xl text-primary">{submittedAt ? total : "—"}</p>
        <ul className="mt-4 space-y-1 text-lg">
          {players.map((p) => (
            <li key={p.id}>
              {p.nome}
              {p.personagem ? ` · ${tituloPapel(p.personagem, p.forma)}` : ""}
            </li>
          ))}
        </ul>
      </div>
      <Link to="/" className="block text-center text-lg text-accent">
        Voltar ao início
      </Link>
    </div>
  );
}

export function PartyApp() {
  const mode = useParty((s) => s.mode);
  const fase = useParty((s) =>
    s.mode === "local" ? s.localFase : s.room?.fase || "sala",
  ) as V3Phase | "sala" | "comodo";
  const leave = useParty((s) => s.leave);
  const players = useParty((s) => s.players);
  const lanternDone = useParty((s) => s.lanternDone);
  const [moduleOverlay, setModuleOverlay] = useState(false);

  useEffect(() => {
    function onModuleUi(ev: MessageEvent) {
      if (ev.origin !== window.location.origin) return;
      const d = ev.data as { mosaico?: string; open?: boolean } | null;
      if (!d || d.mosaico !== "ui-overlay") return;
      setModuleOverlay(Boolean(d.open));
    }
    window.addEventListener("message", onModuleUi);
    return () => window.removeEventListener("message", onModuleUi);
  }, []);

  useEffect(() => {
    setModuleOverlay(false);
  }, [fase]);

  if (mode === "idle") {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 px-6">
        <MosaicMark className="size-8 text-primary" />
        <p className="text-lg text-fog">A mesa ainda não foi aberta.</p>
        <Link to="/" className="text-lg text-accent">
          Voltar
        </Link>
      </div>
    );
  }

  const hideChrome = fase === "cor" || LANTERN_FASES.includes(fase);
  const showHost =
    fase === "votacao" ||
    fase === "encaixe" ||
    fase === "deducao" ||
    (fase === "cor" && players.some((p) => p.fragmentoPronto)) ||
    (LANTERN_FASES.includes(fase) && lanternDone);

  return (
    <div className="relative min-h-dvh bg-background">
      {!hideChrome && (
        <header className="grid grid-cols-[3.5rem_minmax(0,1fr)_3.5rem] items-center px-4 pt-[max(0.8rem,env(safe-area-inset-top))]">
          <button
            type="button"
            className="inline-flex min-h-11 items-center justify-start text-base text-muted-foreground"
            onClick={leave}
          >
            Sair
          </button>
          <p className="min-w-0 text-center text-base uppercase tracking-[0.16em] text-accent">
            {fase && fase in PHONE_LINE ? PHONE_LINE[fase as V3Phase] : "MOSAICO"}
          </p>
          <span aria-hidden="true" className="w-14" />
        </header>
      )}
      {!moduleOverlay && <FaseRelogio />}
      {hideChrome && !moduleOverlay && (
        <button
          type="button"
          className="absolute right-4 top-[max(0.8rem,env(safe-area-inset-top))] z-40 min-h-11 rounded-full border border-white/15 bg-background/70 px-3 text-base text-white/90 backdrop-blur-sm"
          onClick={leave}
        >
          Sair
        </button>
      )}
      {fase === "sala" && <SalaScreen />}
      {fase === "encenacao" && <EnceneScreen />}
      {fase === "votacao" && <VotoScreen />}
      {fase === "janela" && <LanternPhase slug="janela" />}
      {(fase === "vidro" || fase === "comodo") && <LanternPhase slug="vidro" />}
      {fase === "salaescura" && <LanternPhase slug="sala" />}
      {fase === "cor" && <CorScreen />}
      {fase === "palimpsesto" && <PalimpsestoPlay />}
      {fase === "espelho" && <EspelhoPlay />}
      {fase === "planta" && <PlantaPlay />}
      {fase === "encaixe" && <EncaixeScreen />}
      {fase === "deducao" && <DeducaoScreen />}
      {fase === "resultado" && <ResultadoScreen />}
      {showHost && !moduleOverlay && <HostBar />}
    </div>
  );
}

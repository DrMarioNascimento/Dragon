import { Button } from "@/components/ui/button";
import { CHARACTERS, REVEAL_SLIDES } from "@/lib/mosaico/case";
import { useParty } from "@/lib/mosaico/party";
import {
  CHAR_IDS,
  DEDUCAO,
  ENVELOPES,
  FRAGMENTOS,
  PHONE_LINE,
  ROTEIRO,
  VERDADE,
  pecasDoTelefone,
  type V3Phase,
} from "@/lib/mosaico/v3";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CartaPuzzle } from "./carta-puzzle";
import { EspelhoPlay, PalimpsestoPlay, PlantaPlay } from "./gesto-play";
import { MosaicMark } from "./mark";
import { ModuleFrame } from "./module-frame";
import { NIGHT_MODULES } from "@/lib/mosaico/modules";

function me() {
  const uid = useParty((s) => s.uid);
  const players = useParty((s) => s.players);
  return players.find((p) => p.id === uid) ?? players[0] ?? null;
}

function Line({ children }: { children: string }) {
  return (
    <p className="text-[11px] uppercase tracking-[0.22em] text-accent">{children}</p>
  );
}

const LANTERN_FASES = ["janela", "vidro", "salaescura", "palimpsesto", "espelho", "planta"];

function HostBar() {
  const isMaster = useParty((s) => s.isMaster);
  const advance = useParty((s) => s.advance);
  const lanternDone = useParty((s) => s.lanternDone);
  const fase = useParty((s) => (s.mode === "local" ? s.localFase : s.room?.fase));
  if (!isMaster) return null;
  if (fase && LANTERN_FASES.includes(fase)) {
    if (!lanternDone) return null;
  } else if (!fase || !["votacao", "encaixe", "oleo", "deducao"].includes(fase)) {
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
      <p className="text-sm text-fog">Não esperes. Isto soou verdadeiro?</p>
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
  const eu = me();
  const link =
    typeof window !== "undefined" && code && code !== "LOCAL"
      ? `${window.location.origin}/?sala=${code}`
      : null;

  return (
    <div className="space-y-5 px-5 pb-10 pt-6">
      <Line>{PHONE_LINE.sala}</Line>
      <h1 className="font-serif text-4xl">A mesa</h1>
      <p className="text-sm text-fog">
        Aponta. Mostra. Acusa. No teste, um jogador passa por tudo.
      </p>
      {code && code !== "LOCAL" && (
        <div className="box-depth rounded-lg px-4 py-5 text-center">
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            Código da sala
          </p>
          <p className="mt-2 font-serif text-4xl tracking-[0.2em] text-primary">{code}</p>
          {link && <p className="mt-2 break-all text-xs text-fog">{link}</p>}
        </div>
      )}
      <ul className="space-y-2">
        {players.map((p) => (
          <li
            key={p.id}
            className="box-depth flex items-center justify-between rounded-md px-3 py-2 text-sm"
          >
            <span>{p.nome}</span>
            <span className="text-xs text-muted-foreground">
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
  const ator = players[vez] ?? players[0];
  const tour = players.length === 1;
  const [charI, setCharI] = useState(0);
  const personagem = tour ? CHAR_IDS[charI] : ator?.personagem || "tomas";
  const mine = tour || ator?.id === uid;
  const roteiro = ROTEIRO[personagem] ?? ROTEIRO.tomas;
  const markObserve = useParty((s) => s.markObserve);
  const [step, setStep] = useState<"entenda" | "faca" | "fale" | "julga">("entenda");

  if (!mine) {
    return <ObserverPlay nome={ator?.nome || "Alguém"} />;
  }

  function seguir() {
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
      {tour && (
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
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
          <p className="text-sm text-fog">Mesmo sozinho: observa o que acabaste de fazer.</p>
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
          className="block w-full text-center text-xs text-muted-foreground"
          onClick={() => seguir()}
        >
          Prefiro observar
        </button>
      )}
      {isMaster && players.length > 1 && (
        <button
          type="button"
          className="block w-full text-center text-xs text-muted-foreground"
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
      <p className="text-sm text-muted-foreground">Um toque. Sem votar em si.</p>
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

function LanternPhase({ slug, line }: { slug: string; line: string }) {
  const mod = NIGHT_MODULES.find((m) => m.slug === slug)!;
  const markPista = useParty((s) => s.markPista);
  const lanternDone = useParty((s) => s.lanternDone);
  return (
    <div className={cn("flex min-h-[calc(100dvh-3.5rem)] flex-col", lanternDone ? "pb-24" : "pb-2")}>
      <p className="px-5 pb-2 pt-1 text-[11px] uppercase tracking-[0.22em] text-accent">{line}</p>
      <div className="min-h-0 flex-1">
        <ModuleFrame mod={mod} compact onDone={() => markPista(slug)} />
      </div>
    </div>
  );
}

function CorScreen() {
  const eu = me();
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
      <p className="text-[11px] uppercase tracking-[0.24em] opacity-80">Seu Fragmento é</p>
      <h1 className="mt-3 font-serif text-4xl">{f.nome}</h1>
      <p className="mt-2 text-lg">Tela {f.cor}</p>
      <p className="mt-6 max-w-xs text-sm leading-relaxed opacity-90">
        Procura quem tem a mesma cor. A carta só fecha com eles.
      </p>
      <p className="mt-8 font-serif text-3xl tabular-nums">
        {String(Math.floor(elapsed / 60000)).padStart(2, "0")}:
        {String(Math.floor(elapsed / 1000) % 60).padStart(2, "0")}
      </p>
      {eu?.fragmentoPronto ? (
        <p className="mt-8 text-sm">
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
  const eu = me();
  const membros = players.filter((p) => p.nucleo === (eu?.nucleo ?? 1));
  const idx = Math.max(0, membros.findIndex((p) => p.id === uid));
  const mine = pecasDoTelefone(idx, membros.length);

  return (
    <div className="space-y-4 px-5 pb-28 pt-6">
      <Line>{PHONE_LINE.encaixe}</Line>
      <h2 className="font-serif text-3xl">Encosta a carta</h2>
      <CartaPuzzle mine={mine} phones={membros.length} />
    </div>
  );
}

function OleoScreen() {
  const oilBought = useParty((s) => s.oilBought);
  const buyOil = useParty((s) => s.buyOil);
  return (
    <div className="space-y-4 px-5 pb-28 pt-6">
      <Line>{PHONE_LINE.oleo}</Line>
      <h2 className="font-serif text-3xl">A porta que você não andou</h2>
      <p className="text-sm text-fog">Envelope lacrado. Só o cômodo aparece. Um round. Ou guarda o óleo.</p>
      {ENVELOPES.map((e) => (
        <button
          key={e.id}
          type="button"
          disabled={!!oilBought}
          onClick={() => buyOil(e.id)}
          className={cn(
            "w-full rounded-lg px-4 py-4 text-left",
            oilBought === e.id ? "btn-depth" : "box-depth",
          )}
        >
          <p className="text-xs uppercase tracking-[0.16em] text-accent">
            {e.comodo} · {e.preco} de óleo
          </p>
          {oilBought === e.id ? (
            <p className="mt-2 text-sm">{e.txt}</p>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">Conteúdo cego até comprar.</p>
          )}
        </button>
      ))}
    </div>
  );
}

function DeducaoScreen() {
  const d = useParty((s) => s.deduction);
  const setDeduction = useParty((s) => s.setDeduction);
  const submit = useParty((s) => s.submitDeduction);
  const submittedAt = useParty((s) => s.submittedAt);
  const ready =
    d.suspectId && d.motiveId && d.actionId && d.proofId && d.gapId && !submittedAt;

  function Field({
    label,
    field,
    opts,
  }: {
    label: string;
    field: keyof typeof d;
    opts: { id: string; label: string }[];
  }) {
    return (
      <label className="block space-y-1">
        <span className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
          {label}
        </span>
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
      </label>
    );
  }

  return (
    <div className="space-y-4 px-5 pb-28 pt-6">
      <Line>{PHONE_LINE.deducao}</Line>
      <h2 className="font-serif text-3xl">Quem foi?</h2>
      <Field label="Suspeito" field="suspectId" opts={DEDUCAO.suspeitos} />
      <Field label="Motivo" field="motiveId" opts={DEDUCAO.motivos} />
      <Field label="O que fez" field="actionId" opts={DEDUCAO.acoes} />
      <Field label="Prova" field="proofId" opts={DEDUCAO.provas} />
      <Field label="A lacuna" field="gapId" opts={DEDUCAO.lacunas} />
      <Button className="w-full" size="lg" disabled={!ready} onClick={submit}>
        Acusar — não se muda
      </Button>
      {submittedAt && (
        <p className="text-center text-sm text-fog">Registrado. Aguarde a casa.</p>
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
    d.motiveId === VERDADE.motiveId,
    d.actionId === VERDADE.actionId,
    d.proofId === VERDADE.proofId,
    d.gapId === VERDADE.gapId,
  ].filter(Boolean).length;
  const tempo = acertou ? 32 : 0;
  const caso = acertou ? [0, 3, 6, 10, 13][qualidade] : 0;
  const total = tempo + caso + 5 + 20;

  return (
    <div className="space-y-6 px-5 pb-16 pt-6">
      <Line>{PHONE_LINE.resultado}</Line>
      <h2 className="font-serif text-3xl">A casa fala</h2>
      {REVEAL_SLIDES.map((s) => (
        <section key={s.title} className="space-y-1">
          <p className="text-[11px] uppercase tracking-[0.18em] text-accent">{s.kicker}</p>
          <h3 className="font-serif text-xl">{s.title}</h3>
          <p className="text-sm leading-relaxed text-fog">{s.body}</p>
        </section>
      ))}
      <div className="box-depth rounded-lg px-4 py-4">
        <p className="font-serif text-2xl text-primary">
          {acertou ? "Você apontou o Morador." : "A casa não era quem você acusou."}
        </p>
        <p className="mt-2 text-sm text-fog">
          Tempo {tempo} · Caso {caso} · Cena 5 · Óleo 20
        </p>
        <p className="mt-3 font-serif text-4xl text-primary">{submittedAt ? total : "—"}</p>
        <ul className="mt-4 space-y-1 text-sm">
          {players.map((p) => {
            const ch = CHARACTERS.find((c) => c.id === p.personagem);
            return (
              <li key={p.id}>
                {p.nome}
                {ch ? ` · ${ch.title}` : ""}
              </li>
            );
          })}
        </ul>
      </div>
      <Link to="/" className="block text-center text-sm text-accent">
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

  if (mode === "idle") {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 px-6">
        <MosaicMark className="size-8 text-primary" />
        <p className="text-sm text-fog">A mesa ainda não foi aberta.</p>
        <Link to="/" className="text-sm text-accent">
          Voltar
        </Link>
      </div>
    );
  }

  const hideChrome = fase === "cor";
  const players = useParty((s) => s.players);
  const lanternDone = useParty((s) => s.lanternDone);
  const showHost =
    fase === "votacao" ||
    fase === "encaixe" ||
    fase === "oleo" ||
    fase === "deducao" ||
    (fase === "cor" && players.some((p) => p.fragmentoPronto)) ||
    (LANTERN_FASES.includes(fase) && lanternDone);

  return (
    <div className="relative min-h-dvh bg-background">
      {!hideChrome && (
        <header className="flex items-center justify-between px-4 pt-[max(0.8rem,env(safe-area-inset-top))]">
          <button type="button" className="inline-flex min-h-11 items-center text-xs text-muted-foreground" onClick={leave}>
            Sair
          </button>
          <p className="max-w-[14rem] text-center text-[11px] uppercase tracking-[0.18em] text-accent">
            {fase && fase in PHONE_LINE ? PHONE_LINE[fase as V3Phase] : "MOSAICO"}
          </p>
          <span className="w-8" />
        </header>
      )}
      {hideChrome && (
        <button
          type="button"
          className="absolute left-4 top-[max(0.8rem,env(safe-area-inset-top))] z-20 min-h-11 text-xs text-white/80"
          onClick={leave}
        >
          Sair
        </button>
      )}
      {fase === "sala" && <SalaScreen />}
      {fase === "encenacao" && <EnceneScreen />}
      {fase === "votacao" && <VotoScreen />}
      {fase === "janela" && <LanternPhase slug="janela" line={PHONE_LINE.janela} />}
      {(fase === "vidro" || fase === "comodo") && (
        <LanternPhase slug="vidro" line={PHONE_LINE.vidro} />
      )}
      {fase === "salaescura" && <LanternPhase slug="sala" line={PHONE_LINE.salaescura} />}
      {fase === "cor" && <CorScreen />}
      {fase === "palimpsesto" && <PalimpsestoPlay />}
      {fase === "espelho" && <EspelhoPlay />}
      {fase === "planta" && <PlantaPlay />}
      {fase === "encaixe" && <EncaixeScreen />}
      {fase === "oleo" && <OleoScreen />}
      {fase === "deducao" && <DeducaoScreen />}
      {fase === "resultado" && <ResultadoScreen />}
      {showHost && <HostBar />}
    </div>
  );
}

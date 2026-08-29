import { Button } from "@/components/ui/button";
import { REVEAL_SLIDES } from "@/lib/mosaico/case";
import { tituloPapel, tituloPapelNaMesa } from "@/lib/mosaico/arquetipo";
import { useParty } from "@/lib/mosaico/party";
import {
  CHAR_IDS,
  DEDUCAO,
  fragmentoDoNucleo,
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
  podeSeguir,
  FASES_LANTERNA,
  proximoAtor,
  type V3Phase,
} from "@/lib/mosaico/v3";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { CartaPuzzle, FOTOS, type FotoId } from "./carta-puzzle";
import { EspelhoPlay, PalimpsestoPlay, PlantaPlay } from "./gesto-play";
import { FaseRelogio } from "./cronometro";
import { MosaicMark } from "./mark";
import { ModuleFrame } from "./module-frame";
import { NIGHT_MODULES } from "@/lib/mosaico/modules";
import MosaicoQR from "@/lib/mosaico/qr";
import { useNavigate } from "@tanstack/react-router";

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

/* A mesma lista que a v3 usa para decidir o "Seguir" — uma só, para as duas
   não se afastarem. */
const LANTERN_FASES: readonly string[] = FASES_LANTERNA;

function formatarTempoTarefa(ms: number) {
  const cent = Math.floor(ms / 10);
  const seg = Math.floor(cent / 100);
  const mm = String(Math.floor(seg / 60)).padStart(2, "0");
  const ss = String(seg % 60).padStart(2, "0");
  const cc = String(cent % 100).padStart(2, "0");
  return mm + ":" + ss + "," + cc;
}

function HostBar({ coberto = false }: { coberto?: boolean }) {
  const isMaster = useParty((s) => s.isMaster);
  const advance = useParty((s) => s.advance);
  const setVez = useParty((s) => s.setVez);
  const lanternDone = useParty((s) => s.lanternDone);
  const players = useParty((s) => s.players);
  const fase = useParty((s) => (s.mode === "local" ? s.localFase : s.room?.fase));
  const faseAte = useParty((s) => s.room?.faseAteMs);
  const vez = useParty((s) => (s.mode === "local" ? s.localVez : s.room?.vez ?? 0));
  const [now, setNow] = useState(Date.now());
  const [indo, setIndo] = useState(false);
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(t);
  }, []);
  useEffect(() => {
    setIndo(false);
  }, [fase, vez]);

  const faseVencida = !faseAte || faseAte <= now;
  const mostra = podeSeguir({
    fase,
    isMaster,
    lanternDone,
    algumFragmento: players.some((p) => p.fragmentoPronto),
    faseVencida,
  });
  if (!mostra) return null;
  /* Uma tela interna do modulo cobre a moldura, e enquanto a tarefa esta em
     curso esconder o "Seguir" e o certo: senao ele fica por cima do dialogo.
     Mas depois que a tarefa acabou - ou que o relogio venceu - o que estiver
     aberto la dentro deixou de importar, e era exatamente ali que a mesa
     ficava sem saida: o aviso de "a bussola nao respondeu" nunca se fecha
     sozinho, e com ele aberto o botao nunca voltava. */
  if (coberto && !lanternDone && !faseVencida) return null;
  /* Quando o relógio já venceu e quem toca não conduz a mesa, isto é um
     resgate: vale dizer isso, senão parece que o jogo tem dois donos. */
  const resgate = !isMaster && faseVencida;

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 px-4 pb-[max(0.8rem,env(safe-area-inset-bottom))] pt-3">
      {resgate && (
        <p className="mb-2 text-center text-base text-muted-foreground">
          O tempo desta parte acabou. Qualquer um pode seguir.
        </p>
      )}
      <Button
        className="w-full"
        size="lg"
        disabled={indo}
        onClick={() => {
          setIndo(true);
          if (fase === "encenacao") {
            const n = proximoAtor(vez, players.length);
            if (n !== null) {
              void setVez(n).finally(() => setIndo(false));
              return;
            }
          }
          void advance();
        }}
      >
        {indo ? "Seguindo…" : "Seguir"}
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

/* O QR é por onde as pessoas entram. Ele vinha de api.qrserver.com: um
   serviço de terceiros no caminho crítico da entrada, que exige rede boa na
   sala e ainda manda o endereço da mesa para fora. O codificador do próprio
   MOSAICO já existia na v1, conferido módulo a módulo contra a norma em
   tests/qr.test.mjs — a noite só não o estava usando. */
function QrDaMesa({ link }: { link: string }) {
  const svg = useMemo(() => {
    try {
      return MosaicoQR.svg(link, { rotulo: "Código QR para entrar na mesa" });
    } catch {
      return null;
    }
  }, [link]);
  if (!svg) return null;
  return (
    <div
      className="mx-auto mt-4 w-[220px] max-w-full rounded-md bg-white p-2"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
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
      <h1 className="font-serif text-4xl">A mesa</h1>
      <p className="text-lg text-fog">
        {players.length > 1
          ? "Aponta. Mostra. Acusa. Cada um no próprio telefone."
          : "Aponta. Mostra. Acusa. Sozinho, a casa te dá todos os papéis, um de cada vez."}
      </p>
      {code && code !== "LOCAL" && (
        <div className="box-depth rounded-lg px-4 py-5 text-center">
          <p className="text-base uppercase tracking-[0.2em] text-muted-foreground">
            Código da sala
          </p>
          <p className="mt-2 font-serif text-4xl tracking-[0.2em] text-primary">{code}</p>
          {link && (
            <>
              <QrDaMesa link={link} />
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

  async function seguir() {
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
    const n = proximoAtor(vez, players.length);
    if (n === null) {
      void advance();
      return;
    }
    try {
      await setVez(n);
      setStep("entenda");
    } catch {
      /* A escrita foi recusada. Sem isto a tela voltava para "Entenda a
         cena" com a vez ainda no mesmo ator — parecia um laço. */
    }
  }

  return (
    <div className="space-y-5 px-5 pb-10 pt-6">
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
  const players = useParty((s) => s.players);
  const semente = useParty((s) => s.room?.semente);
  const [tempo, setTempo] = useState<number | null>(null);
  return (
    <div className={cn("fixed inset-0 z-10 bg-background", lanternDone && "pb-24")}>
      <ModuleFrame
        mod={mod}
        compact
        semente={semente}
        onDone={(ms) => {
          setTempo(ms);
          markPista(slug);
        }}
      />
      {/* Concluida a tarefa, a moldura ficava mostrando o modulo parado ate
          o relogio vencer - podiam ser dois minutos de tela morta. Agora ela
          diz o que aconteceu, e o "Seguir" ja esta disponivel embaixo. */}
      {lanternDone && (
        <div className="pointer-events-none absolute inset-x-0 bottom-24 z-20 flex flex-col items-center gap-1 bg-gradient-to-t from-background via-background/95 to-transparent px-6 pb-6 pt-16 text-center">
          <p className="text-base uppercase tracking-[0.2em] text-accent">
            Fragmento localizado
          </p>
          <p className="font-serif text-2xl text-foreground">{mod.title}</p>
          {tempo != null && tempo > 0 && (
            <p className="font-mono text-lg tabular-nums text-fog">
              {formatarTempoTarefa(tempo)}
            </p>
          )}
          <p className="max-w-xs text-lg text-muted-foreground">
            {players.length > 1
              ? "A colocação define a pista. Sigam quando a mesa estiver pronta."
              : "A colocação define a pista."}
          </p>
        </div>
      )}
    </div>
  );
}

function CorScreen() {
  const eu = useEu();
  const confirmFragment = useParty((s) => s.confirmFragment);
  const players = useParty((s) => s.players);
  const room = useParty((s) => s.room);
  const f = fragmentoDoNucleo(eu?.nucleo);
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

/* Estava declarado DENTRO de DeducaoScreen. A cada render o React via um
   tipo de componente novo, desmontava o <select> e montava outro — no
   iPhone o seletor nativo fechava sozinho no instante em que a pessoa
   escolhia, e a ficha ficava impossível de preencher. */
function CampoFichaSelect({
  label,
  opts,
  valor,
  meu,
   travado,
  dono,
  onEscolhe,
  onOuvi,
}: {
  label: string;
  opts: { id: string; label: string }[];
  valor: string | null;
  meu: boolean;
  travado: boolean;
  dono: number;
  onEscolhe: (v: string | null) => void;
  onOuvi: () => void;
}) {
  const frag = fragmentoDoNucleo(dono);
  return (
    <label className="block space-y-1">
      <span className="text-base uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </span>
      {meu ? (
        <select
          className="field-depth h-11 w-full rounded-md px-3"
          value={valor ?? ""}
          disabled={travado}
          onChange={(e) => onEscolhe(e.target.value || null)}
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
          onClick={onOuvi}
        >
          A casa deu isso ao fragmento {frag?.cor ?? dono}. Quando a mesa falar, toca aqui.
        </button>
      )}
    </label>
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

  return (
    <div className="space-y-4 px-5 pb-28 pt-6">
      <h2 className="font-serif text-3xl">Quem foi?</h2>
      <p className="text-lg text-fog">
        Três linhas. A tua, tu marcas. As outras, a mesa fala.
      </p>
      {(
        [
          ["Suspeito", "suspectId", suspeitos],
          ["O que fez", "actionId", DEDUCAO.acoes],
          ["A prova", "proofId", DEDUCAO.provas],
        ] as [string, CampoFicha, { id: string; label: string }[]][]
      ).map(([label, field, opts]) => (
        <CampoFichaSelect
          key={field}
          label={label}
          opts={opts}
          valor={d[field]}
          meu={meus.includes(field) || !!ouvi[field]}
          travado={!!submittedAt}
          dono={nucleoDoCampo(field, nNucleos)}
          onEscolhe={(v) => setDeduction({ ...d, [field]: v })}
          onOuvi={() => setOuvi((o) => ({ ...o, [field]: true }))}
        />
      ))}
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
  const nav = useNavigate();
  const leave = useParty((s) => s.leave);
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
      {/* Um <Link to="/"> aqui nao voltava: a raiz ve que a mesa ainda esta
          aberta e devolve para /play na hora. E preciso encerrar primeiro. */}
      <button
        type="button"
        className="block min-h-11 w-full text-center text-lg text-accent"
        onClick={() => {
          leave();
          void nav({ to: "/" });
        }}
      >
        Voltar ao início
      </button>
    </div>
  );
}

/* Recarregar a pagina no meio da noite zerava o estado e a pessoa caia numa
   tela dizendo que a mesa nem tinha sido aberta. A aba guarda o codigo; aqui
   ela volta sozinha, sem reescrever o proprio jogador. */
function MesaFechada() {
  const restore = useParty((s) => s.restore);
  const [tentando, setTentando] = useState(true);
  useEffect(() => {
    let vivo = true;
    void restore().then((ok) => {
      if (vivo && !ok) setTentando(false);
    });
    return () => {
      vivo = false;
    };
  }, [restore]);
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 px-6 text-center">
      <MosaicMark className="size-8 text-primary" />
      <p className="text-lg text-fog">
        {tentando ? "Voltando para a mesa…" : "A mesa ainda não foi aberta."}
      </p>
      {!tentando && (
        <Link to="/" className="text-lg text-accent">
          Voltar
        </Link>
      )}
    </div>
  );
}

/* A escuta do Firestore caindo era indistinguivel de o jogo ter travado. */
function AvisoSemRede() {
  const offline = useParty((s) => s.offline);
  if (!offline) return null;
  return (
    <div className="fixed inset-x-0 top-0 z-50 bg-destructive/90 px-4 py-2 text-center text-base text-white">
      Sem ligação com a mesa. A reconectar…
    </div>
  );
}

export function PartyApp() {
  const mode = useParty((s) => s.mode);
  const fase = useParty((s) =>
    s.mode === "local" ? s.localFase : s.room?.fase || "sala",
  ) as V3Phase | "sala" | "comodo";
  const leave = useParty((s) => s.leave);
  const [moduleOverlay, setModuleOverlay] = useState(false);
  const ultimaMsg = useRef(0);

  useEffect(() => {
    function onModuleUi(ev: MessageEvent) {
      if (ev.origin !== window.location.origin) return;
      const d = ev.data as { mosaico?: string; open?: boolean } | null;
      if (!d || d.mosaico !== "ui-overlay") return;
      ultimaMsg.current = Date.now();
      setModuleOverlay(Boolean(d.open));
    }
    window.addEventListener("message", onModuleUi);
    return () => window.removeEventListener("message", onModuleUi);
  }, []);

  /* O modulo repete o estado a cada 2 s. Se pararmos de ouvir, a mensagem se
     perdeu ou o iframe recarregou - e continuar escondendo o cronometro, o
     "Sair" e o "Seguir" deixaria a fase sem nenhuma saida visivel. */
  useEffect(() => {
    if (!moduleOverlay) return;
    const t = window.setInterval(() => {
      if (Date.now() - ultimaMsg.current > 6000) setModuleOverlay(false);
    }, 1000);
    return () => window.clearInterval(t);
  }, [moduleOverlay]);

  useEffect(() => {
    setModuleOverlay(false);
  }, [fase]);

  if (mode === "idle") return <MesaFechada />;

  const hideChrome = fase === "cor" || LANTERN_FASES.includes(fase);

  return (
    <div className="relative min-h-dvh bg-background">
      <AvisoSemRede />
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
      <FaseRelogio oculto={moduleOverlay} />
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
      <HostBar coberto={moduleOverlay} />
    </div>
  );
}

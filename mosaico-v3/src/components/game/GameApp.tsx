import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { TileCard } from "@/components/game/TileCard";
import {
  GAPS,
  KIND_LABEL,
  PIECE_KEYS,
  STORY,
  SUSPECTS,
  TILES,
  TILE_BY_ID,
  TRUTH,
} from "@/lib/game/case";
import { ACTIONS, MOTIVES, PROOFS, score, useGame } from "@/lib/game/store";
import { cn } from "@/lib/utils";

function Shell({
  kicker,
  title,
  children,
  footer,
}: {
  kicker: string;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const coins = useGame((s) => s.coins);
  const phase = useGame((s) => s.phase);
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-4 pb-8 pt-5 sm:max-w-2xl">
      <header className="mb-5 flex items-end justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-brass">{kicker}</p>
          <h2 className="mt-1 font-display text-2xl leading-tight text-fg sm:text-3xl">{title}</h2>
        </div>
        {phase !== "title" && phase !== "reveal" && (
          <p className="font-display text-lg tabular-nums text-brass">{coins} moedas</p>
        )}
      </header>
      <div className="flex-1">{children}</div>
      {footer && <div className="mt-6">{footer}</div>}
    </div>
  );
}

function Title() {
  const go = useGame((s) => s.go);
  return (
    <div className="relative min-h-dvh overflow-hidden bg-bg">
      <img
        src="/tiles/carta-costa.jpg"
        alt=""
        className="absolute inset-0 h-full w-full object-cover opacity-35"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/80 to-bg/40" />
      <div className="relative mx-auto flex min-h-dvh max-w-lg flex-col justify-end px-5 pb-10 pt-16">
        <p className="text-[11px] uppercase tracking-[0.42em] text-brass">Versão 3 · quebra-cabeça</p>
        <h1 className="mt-3 font-display text-6xl leading-[0.9] text-fg">MOSAICO</h1>
        <p className="mt-4 max-w-sm text-base text-muted">
          Cada pista é uma peça. Ninguém vê o quadro inteiro — até encaixar.
        </p>
        <div className="mt-8 space-y-3">
          <Button className="w-full" variant="brass" onClick={() => go("brief")}>
            Jogar A Casa da Costa
          </Button>
          <p className="text-center text-xs text-subtle">
            Versão 2 é A Noite · esta é a edição em peças
          </p>
        </div>
      </div>
    </div>
  );
}

function Brief() {
  const go = useGame((s) => s.go);
  return (
    <Shell
      kicker="MOSAICO · versão 3"
      title="A Casa da Costa"
      footer={
        <Button className="w-full" onClick={() => go("story")}>
          Começar a história que pula
        </Button>
      }
    >
      <p className="text-muted leading-relaxed">
        Você não lê o caso. Você o monta. Cada carta chega partida em quatro.
        Só a mesa completa o quadro.
      </p>
      <ul className="mt-6 space-y-3 text-sm text-muted">
        <li className="border-l-2 border-brass/50 pl-3">Encaixe os quatro fragmentos de cada carta.</li>
        <li className="border-l-2 border-brass/50 pl-3">O mercado vende peças cegas. O mosaico pede a ordem da noite.</li>
        <li className="border-l-2 border-brass/50 pl-3">A revelação não acaba no nome.</li>
      </ul>
    </Shell>
  );
}

function Story() {
  const i = useGame((s) => s.storyIndex);
  const next = useGame((s) => s.nextStory);
  const card = STORY[i];
  return (
    <Shell
      kicker={`Fase 0 · ${i + 1} / 3`}
      title={card.title}
      footer={
        <Button className="w-full" onClick={next}>
          {i >= 2 ? "Receber a carta" : "Próximo fragmento"}
        </Button>
      }
    >
      <p className="font-display text-xl leading-snug text-fg">{card.body}</p>
    </Shell>
  );
}

function Assemble() {
  const order = useGame((s) => s.assembleOrder);
  const pick = useGame((s) => s.assemblePick);
  const pickAssemble = useGame((s) => s.pickAssemble);
  const id = useGame((s) => s.assembleId);
  const queue = useGame((s) => s.assembleQueue);
  const tile = TILE_BY_ID[id];
  return (
    <Shell kicker={`Peça · ${queue.length + 1} nesta mesa`} title={tile.title}>
      <p className="mb-1 text-[10px] uppercase tracking-[0.18em] text-brass">{KIND_LABEL[tile.kind]}</p>
      <p className="mb-4 text-sm text-muted">Toque duas partes para trocá-las. A carta só entra no mosaico inteira.</p>
      <div className="mx-auto grid max-w-[280px] grid-cols-2 gap-1 rounded-md border border-brass/40 bg-raised p-1">
        {order.map((key, i) => (
          <button
            key={`${key}-${i}`}
            type="button"
            onClick={() => pickAssemble(i)}
            className={cn(
              "overflow-hidden rounded-sm ring-2 ring-transparent",
              pick === i && "ring-brass",
            )}
            data-piece={key}
            data-slot={i}
          >
            <img
              src={`/tiles/${id}-${key}.jpg`}
              alt=""
              className="aspect-[2/3] w-full object-cover"
            />
          </button>
        ))}
      </div>
      <p className="mt-4 text-center text-xs uppercase tracking-[0.2em] text-subtle">
        {PIECE_KEYS.every((k, i) => order[i] === k) ? "Encaixe" : "Ainda fragmentada"}
      </p>
    </Shell>
  );
}

function Hand() {
  const owned = useGame((s) => s.owned);
  const classified = useGame((s) => s.classified);
  const classify = useGame((s) => s.classify);
  const go = useGame((s) => s.go);
  const tiles = TILES.filter((t) => owned.includes(t.id));
  const ready = tiles.length > 0 && tiles.every((t) => classified[t.id]);
  return (
    <Shell
      kicker="Fase 1 · Fragmentação"
      title="O que você tem"
      footer={
        <Button className="w-full" disabled={!ready} onClick={() => go("hyp1")}>
          Registrar hipótese I
        </Button>
      }
    >
      <p className="mb-4 text-sm text-muted">Leia e toque para classificar. Boatos exigem confirmação visual.</p>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {tiles.map((t) => (
          <TileCard
            key={t.id}
            tile={t}
            selected={!!classified[t.id]}
            onClick={() => classify(t.id)}
            badge={classified[t.id] ? KIND_LABEL[t.kind] : "Toque para selar"}
          />
        ))}
      </div>
      <div className="mt-5 space-y-3">
        {tiles.map((t) => (
          <article key={t.id} className="rounded-lg border border-border bg-surface p-4">
            <p className="text-[10px] uppercase tracking-[0.18em] text-brass">{KIND_LABEL[t.kind]}</p>
            <p className="mt-1 font-display text-lg">{t.title}</p>
            <p className="mt-2 text-sm leading-relaxed text-muted">{t.text}</p>
          </article>
        ))}
        <article className="rounded-lg border border-dashed border-brass/40 bg-surface p-4">
          <p className="text-[10px] uppercase tracking-[0.18em] text-brass">Boato</p>
          <p className="mt-1 font-display text-lg">O jardim às oito</p>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            «A sobrinha foi vista no jardim ontem às oito, com uma máquina fotográfica.» Informação não confirmada.
          </p>
        </article>
      </div>
    </Shell>
  );
}

function Hyp1() {
  const hyp1 = useGame((s) => s.hyp1);
  const setS = useGame((s) => s.setHyp1Suspect);
  const setG = useGame((s) => s.setHyp1Gap);
  const go = useGame((s) => s.go);
  return (
    <Shell
      kicker="Fase 2 · Hipótese I"
      title="Ainda é fraca"
      footer={
        <Button
          className="w-full"
          disabled={hyp1.suspects.length < 1 || !hyp1.gap}
          onClick={() => go("market")}
        >
          Ir ao mercado cego
        </Button>
      }
    >
      <p className="mb-3 text-sm text-muted">Até duas suspeitas. Uma lacuna.</p>
      <div className="grid grid-cols-2 gap-2">
        {SUSPECTS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setS(s.id)}
            className={cn(
              "rounded-md border px-3 py-3 text-left",
              hyp1.suspects.includes(s.id) ? "border-brass bg-raised" : "border-border bg-surface",
            )}
          >
            <p className="font-display text-base">{s.name}</p>
            <p className="text-xs text-subtle">{s.role}</p>
          </button>
        ))}
      </div>
      <p className="mb-2 mt-5 text-xs uppercase tracking-[0.16em] text-subtle">Lacuna crítica</p>
      <div className="space-y-2">
        {GAPS.map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => setG(g)}
            className={cn(
              "w-full rounded-md border px-3 py-2.5 text-left text-sm",
              hyp1.gap === g ? "border-brass bg-raised" : "border-border bg-surface text-muted",
            )}
          >
            {g}
          </button>
        ))}
      </div>
    </Shell>
  );
}

function Market() {
  const lots = useGame((s) => s.marketLots);
  const owned = useGame((s) => s.owned);
  const buy = useGame((s) => s.buyLot);
  const skip = useGame((s) => s.skipMarket);
  const round = useGame((s) => s.marketRound);
  const coins = useGame((s) => s.coins);
  return (
    <Shell
      kicker={`Fase 3 · Mercado · rodada ${round + 1} / 2`}
      title="Você compra possibilidades"
      footer={
        <Button className="w-full" variant="ghost" onClick={skip}>
          Encerrar mercado e montar mosaico
        </Button>
      }
    >
      <p className="mb-4 text-sm text-muted">O tipo aparece. O conteúdo, não. Dois lances — o resto o núcleo completa.</p>
      <div className="space-y-3">
        {lots.map((lot) => {
          const taken = owned.includes(lot.tileId);
          return (
            <div
              key={lot.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface px-4 py-3"
            >
              <div>
                <p className="font-display text-lg">{lot.kindLabel}</p>
                <p className="text-xs text-subtle">{lot.cost} moedas · conteúdo oculto</p>
              </div>
              <Button
                variant="brass"
                disabled={taken || coins < lot.cost}
                onClick={() => buy(lot.id)}
              >
                {taken ? "Comprado" : "Lance"}
              </Button>
            </div>
          );
        })}
      </div>
    </Shell>
  );
}

function Mosaic() {
  const owned = useGame((s) => s.owned);
  const mosaic = useGame((s) => s.mosaic);
  const selected = useGame((s) => s.selectedTile);
  const select = useGame((s) => s.selectTile);
  const place = useGame((s) => s.placeMosaic);
  const go = useGame((s) => s.go);
  const placed = mosaic.filter(Boolean).length;
  const complete = TILES.every((t, i) => mosaic[i] === t.id);
  const unused = owned.filter((id) => !mosaic.includes(id));
  return (
    <Shell
      kicker="Fase 4 · Mosaico coletivo"
      title="Cinco peças, uma noite"
      footer={
        <Button className="w-full" disabled={placed < 5} onClick={() => go("hyp2")}>
          {complete ? "O quadro fecha" : "Concluir mesmo assim"}
        </Button>
      }
    >
      <p className="mb-3 text-sm text-muted">Toque uma peça, depois o vão. A ordem é a da noite.</p>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-3">
        {TILES.map((slot, i) => {
          const id = mosaic[i];
          const tile = id ? TILE_BY_ID[id] : null;
          return (
            <button
              key={slot.id}
              type="button"
              onClick={() => place(i)}
              className={cn(
                "w-[120px] shrink-0 overflow-hidden rounded-md border",
                selected ? "border-brass" : "border-border",
              )}
            >
              {tile ? (
                <img src={`/tiles/${tile.id}.jpg`} alt={tile.title} className="aspect-[2/3] w-full object-cover" />
              ) : (
                <div className="flex aspect-[2/3] items-end bg-raised p-2">
                  <p className="text-[10px] uppercase leading-tight tracking-[0.12em] text-subtle">
                    {slot.slotPrompt}
                  </p>
                </div>
              )}
            </button>
          );
        })}
      </div>
      <p className="mb-2 mt-2 text-xs uppercase tracking-[0.16em] text-subtle">Sua mesa</p>
      <div className="flex gap-2 overflow-x-auto pb-2">
        {unused.map((id) => (
          <TileCard
            key={id}
            tile={TILE_BY_ID[id]}
            selected={selected === id}
            onClick={() => select(selected === id ? null : id)}
          />
        ))}
      </div>
      {complete && (
        <p className="mt-3 text-sm text-brass">Encaixe correto. A carta do núcleo fecha em primeiro.</p>
      )}
    </Shell>
  );
}

function Hyp2() {
  const deduce = useGame((s) => s.deduce);
  const setDeduce = useGame((s) => s.setDeduce);
  const go = useGame((s) => s.go);
  return (
    <Shell
      kicker="Fase 5 · Hipótese II"
      title="Agora com relações"
      footer={
        <Button className="w-full" disabled={!deduce.suspect} onClick={() => go("last")}>
          Última ação
        </Button>
      }
    >
      <p className="mb-3 text-sm text-muted">Revise o suspeito principal. Ainda não é a dedução final.</p>
      <div className="grid grid-cols-2 gap-2">
        {SUSPECTS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setDeduce({ suspect: s.id })}
            className={cn(
              "rounded-md border px-3 py-3 text-left",
              deduce.suspect === s.id ? "border-brass bg-raised" : "border-border bg-surface",
            )}
          >
            <p className="font-display text-base">{s.name}</p>
            <p className="text-xs text-subtle">{s.role}</p>
          </button>
        ))}
      </div>
    </Shell>
  );
}

function Last() {
  const owned = useGame((s) => s.owned);
  const verified = useGame((s) => s.verified);
  const verify = useGame((s) => s.verifyTile);
  const go = useGame((s) => s.go);
  return (
    <Shell
      kicker="Fase 6 · Última ação"
      title="Verificar uma peça"
      footer={
        <Button className="w-full" disabled={!verified} onClick={() => go("deduce")}>
          Dedução final
        </Button>
      }
    >
      <p className="mb-4 text-sm text-muted">O selo diz só a categoria verdadeira — não o texto novo.</p>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {owned.map((id) => {
          const t = TILE_BY_ID[id];
          return (
            <div key={id} className="shrink-0">
              <TileCard tile={t} selected={verified === id} onClick={() => verify(id)} />
              {verified === id && (
                <p className="mt-2 text-center text-[10px] uppercase tracking-[0.16em] text-brass">
                  Confirmado: {KIND_LABEL[t.kind]}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </Shell>
  );
}

function OptionList({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string | null;
  onChange: (v: string) => void;
}) {
  return (
    <div className="mb-5">
      <p className="mb-2 text-xs uppercase tracking-[0.16em] text-subtle">{label}</p>
      <div className="space-y-2">
        {options.map((o) => (
          <button
            key={o}
            type="button"
            onClick={() => onChange(o)}
            className={cn(
              "w-full rounded-md border px-3 py-2.5 text-left text-sm leading-snug",
              value === o ? "border-brass bg-raised" : "border-border bg-surface text-muted",
            )}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

function Deduce() {
  const d = useGame((s) => s.deduce);
  const set = useGame((s) => s.setDeduce);
  const submit = useGame((s) => s.submitDeduce);
  const ready = d.suspect && d.motive && d.action && d.proof && d.gap;
  return (
    <Shell
      kicker="Fase 7 · Dedução final"
      title="Uma posição"
      footer={
        <Button className="w-full" disabled={!ready} onClick={submit}>
          Registrar solução
        </Button>
      }
    >
      <p className="mb-4 text-sm text-muted">Campos fechados. Sem texto livre.</p>
      <div className="mb-5 grid grid-cols-2 gap-2">
        {SUSPECTS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => set({ suspect: s.id })}
            className={cn(
              "rounded-md border px-3 py-3 text-left",
              d.suspect === s.id ? "border-brass bg-raised" : "border-border bg-surface",
            )}
          >
            <p className="font-display text-base">{s.name}</p>
            <p className="text-xs text-subtle">{s.role}</p>
          </button>
        ))}
      </div>
      <OptionList label="Motivo" options={MOTIVES} value={d.motive} onChange={(v) => set({ motive: v })} />
      <OptionList label="Ação decisiva" options={ACTIONS} value={d.action} onChange={(v) => set({ action: v })} />
      <OptionList label="Prova-chave" options={PROOFS} value={d.proof} onChange={(v) => set({ proof: v })} />
      <OptionList label="Lacuna resolvida" options={GAPS} value={d.gap} onChange={(v) => set({ gap: v })} />
    </Shell>
  );
}

function Reveal() {
  const s = useGame();
  const sc = score(s);
  const name = SUSPECTS.find((x) => x.id === TRUTH.suspect)?.name;
  const guessed = SUSPECTS.find((x) => x.id === s.deduce.suspect)?.name;
  return (
    <div className="mx-auto min-h-dvh max-w-lg px-4 py-8 sm:max-w-2xl">
      <p className="text-[10px] uppercase tracking-[0.28em] text-brass">Fase 8 · Revelação</p>
      <h2 className="mt-2 font-display text-3xl text-fg">A noite, em ordem</h2>

      <div className="-mx-4 mt-5 flex gap-2 overflow-x-auto px-4 pb-2">
        {TILES.map((t) => (
          <img
            key={t.id}
            src={`/tiles/${t.id}.jpg`}
            alt={t.title}
            className="h-44 w-auto rounded-md border border-brass/40 object-cover"
          />
        ))}
      </div>

      <section className="mt-6 space-y-3 text-sm leading-relaxed text-muted">
        <p>
          Às <span className="text-fg">21:14</span> a casa apagou. Nuno Pires — o caseiro que
          consertara a fechadura — pegou a chave da gaveta, desceu a escada do espelho e abriu a
          trava marcada na carta. O testamento saiu da sala do cofre.
        </p>
        <p>
          A polaroid «ontem — 8» é Íris no jardim, na véspera. Não é o autor. O recorte AMES não é
          o crime: é a pele do cofre.
        </p>
      </section>

      <section className="mt-8 rounded-lg border border-border bg-surface p-4">
        <p className="text-[10px] uppercase tracking-[0.18em] text-subtle">Você registrou</p>
        <p className="mt-1 font-display text-2xl">{guessed ?? "—"}</p>
        <p className="mt-1 text-sm text-muted">
          {sc.hit ? "O nome está certo." : `A espinha aponta ${name}. O universo não muda.`}
        </p>
      </section>

      <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
        {[
          ["Tempo", sc.time],
          ["Qualidade", sc.quality],
          ["Cooperação", sc.coop],
          ["Economia", sc.econ],
        ].map(([k, v]) => (
          <div key={k} className="rounded-md border border-border bg-raised px-3 py-3">
            <p className="text-[10px] uppercase tracking-[0.16em] text-subtle">{k}</p>
            <p className="font-display text-2xl tabular-nums text-fg">{v}</p>
          </div>
        ))}
      </div>
      <p className="mt-3 font-display text-4xl tabular-nums text-brass">{sc.total}</p>

      <div className="mt-8 space-y-3">
        <article className="rounded-lg border border-brass/30 bg-raised p-4">
          <p className="text-[10px] uppercase tracking-[0.18em] text-brass">Desfecho</p>
          <p className="mt-1 text-sm leading-relaxed text-muted">
            {sc.hit
              ? "Helena lê o testamento em voz alta. Nuno é afastado. Íris guarda a polaroid — ontem às oito continua sendo só ontem."
              : "A mesa acusou outro nome. Nuno permanece na casa. A trava marcada enferruja em silêncio."}
          </p>
        </article>
        {!sc.mosaicOk && (
          <article className="rounded-lg border border-border bg-surface p-4">
            <p className="text-[10px] uppercase tracking-[0.18em] text-subtle">A carta incompleta</p>
            <p className="mt-1 text-sm text-muted">
              O mosaico não fechou na ordem da noite. A cooperação vale pouco — o quadro ficou torto.
            </p>
          </article>
        )}
      </div>

      <Button className="mt-8 w-full" variant="ghost" onClick={() => s.reset()}>
        Jogar de novo
      </Button>
    </div>
  );
}

const PHASES = {
  title: Title,
  brief: Brief,
  story: Story,
  assemble: Assemble,
  hand: Hand,
  hyp1: Hyp1,
  market: Market,
  mosaic: Mosaic,
  hyp2: Hyp2,
  last: Last,
  deduce: Deduce,
  reveal: Reveal,
} as const;

export function GameApp() {
  const phase = useGame((s) => s.phase);
  const View = PHASES[phase];
  return (
    <main className="min-h-dvh bg-bg text-fg">
      <View />
    </main>
  );
}

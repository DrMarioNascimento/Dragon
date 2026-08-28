import { Button } from "@/components/ui/button";
import {
  ACTIONS,
  CARTA_TILES,
  CHARACTERS,
  CLUE_BY_ID,
  EXPLANATIONS,
  GAPS,
  KIND_LABEL,
  LEFTOVER_BUY,
  MOTIVES,
  PROOFS,
  REVEAL_SLIDES,
  ROLE_LABEL,
  ROOMS,
  STORY,
  SUSPECTS,
  TRUTH,
} from "@/lib/mosaico/case";
import { viewingPlayer } from "@/lib/mosaico/engine";
import { playOnce, stopVoice } from "@/lib/mosaico/sound";
import { useGame } from "@/lib/mosaico/store";
import type { ClueKind, Match, PlayerState } from "@/lib/mosaico/types";
import { Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Choice, ClueCard, KindSeal, cluesFrom } from "./clues";
import { Tip } from "./shell";

function Footer({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <Button className="w-full" size="lg" onClick={onClick} disabled={disabled}>
      {label}
    </Button>
  );
}

export function StoryPhase({ match }: { match: Match }) {
  const dispatch = useGame((s) => s.dispatch);
  const me = viewingPlayer(match);
  const cards = STORY[me.characterId] ?? [];
  const [i, setI] = useState(0);
  const card = cards[i];
  return (
    <div className="stagger-in">
      <Tip id="story">Cada um recebe um trecho diferente. Leia o seu — o resto da mesa não vê.</Tip>
      {card && (
        <article className="rounded-xl border border-border bg-card/80 p-5">
          <p className="text-base uppercase tracking-[0.22em] text-accent">{card.kicker}</p>
          <p className="mt-4 font-serif text-2xl leading-snug text-foreground">{card.text}</p>
        </article>
      )}
      <div className="mt-6 flex gap-2">
        {i < cards.length - 1 ? (
          <Button className="flex-1" size="lg" onClick={() => setI(i + 1)}>
            Continuar
          </Button>
        ) : (
          <Button
            className="flex-1"
            size="lg"
            onClick={() => dispatch({ type: "STORY_DONE", playerId: me.id })}
          >
            Concluir
          </Button>
        )}
      </div>
    </div>
  );
}

export function StoryVotePhase({ match }: { match: Match }) {
  const dispatch = useGame((s) => s.dispatch);
  const me = viewingPlayer(match);
  const [pick, setPick] = useState<string | null>(me.storyVote);
  const others = match.players.filter((p) => p.id !== me.id);
  return (
    <div className="space-y-3">
      <Tip id="storyVote">Quem mais contribuiu para o clima e a diversão? Um voto. Sem votar em si.</Tip>
      <h2 className="font-serif text-2xl">O clima da mesa</h2>
      {others.map((p) => {
        const c = CHARACTERS.find((x) => x.id === p.id)!;
        return (
          <Choice
            key={p.id}
            selected={pick === p.id}
            label={c.title}
            hint={c.name}
            onClick={() => setPick(p.id)}
          />
        );
      })}
      <div className="pt-4">
        <Footer
          label="Votar"
          disabled={!pick}
          onClick={() => pick && dispatch({ type: "STORY_VOTE", playerId: me.id, targetId: pick })}
        />
      </div>
    </div>
  );
}

export function FragmentPhase({ match }: { match: Match }) {
  const dispatch = useGame((s) => s.dispatch);
  const me = viewingPlayer(match);
  const clues = cluesFrom(me.clueIds);
  return (
    <div className="space-y-3">
      <Tip id="frag">Seus fragmentos. Ninguém mais os vê ainda. Classifique: pilar, conector, contexto, boato.</Tip>
      <h2 className="font-serif text-2xl">Fragmentação</h2>
      <p className="text-lg text-muted-foreground">
        {clues.length} peças na sua mão. Leia com calma.
      </p>
      {clues.map((c) => (
        <ClueCard key={c.id} clue={c} />
      ))}
      <div className="pt-2">
        <Footer label="Concluir" onClick={() => dispatch({ type: "FRAGMENT_DONE", playerId: me.id })} />
      </div>
    </div>
  );
}

function HypoFields({
  match,
  which,
}: {
  match: Match;
  which: 1 | 2;
}) {
  const dispatch = useGame((s) => s.dispatch);
  const me = viewingPlayer(match);
  const current = which === 1 ? me.hypo1 : me.hypo2;
  const [suspects, setSuspects] = useState<string[]>(current.suspects);
  const [gapId, setGapId] = useState<string | null>(which === 1 ? null : current.gapId);
  const [explanationId, setExplanationId] = useState<string | null>(current.explanationId);

  function toggleSuspect(id: string) {
    setSuspects((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  }

  const ready =
    suspects.length === 2 && explanationId && (which === 1 || gapId);

  return (
    <div className="space-y-4">
      <Tip id={`hypo${which}`}>
        {which === 1
          ? "Primeira hipótese, fraca de propósito. Duas suspeitas e uma explicação."
          : "Agora com o mosaico: revise, troque, fortaleça."}
      </Tip>
      <h2 className="font-serif text-2xl">{which === 1 ? "Hipótese I" : "Hipótese II"}</h2>

      <section className="space-y-2">
        <h3 className="text-base uppercase tracking-[0.18em] text-muted-foreground">
          Duas suspeitas · {suspects.length}/2
        </h3>
        {SUSPECTS.map((o) => (
          <Choice
            key={o.id}
            selected={suspects.includes(o.id)}
            label={o.label}
            hint={o.hint}
            onClick={() => toggleSuspect(o.id)}
          />
        ))}
      </section>

      {which === 2 && (
        <section className="space-y-2">
          <h3 className="text-base uppercase tracking-[0.18em] text-muted-foreground">
            Lacuna crítica
          </h3>
          {GAPS.map((o) => (
            <Choice
              key={o.id}
              selected={gapId === o.id}
              label={o.label}
              hint={o.hint}
              onClick={() => setGapId(o.id)}
            />
          ))}
        </section>
      )}

      <section className="space-y-2">
        <h3 className="text-base uppercase tracking-[0.18em] text-muted-foreground">
          Explicação provisória
        </h3>
        {EXPLANATIONS.map((o) => (
          <Choice
            key={o.id}
            selected={explanationId === o.id}
            label={o.label}
            onClick={() => setExplanationId(o.id)}
          />
        ))}
      </section>

      <Footer
        label="Registrar hipótese"
        disabled={!ready}
        onClick={() => {
          dispatch({
            type: "SET_HYPO",
            playerId: me.id,
            which,
            hypo: { suspects, gapId, explanationId },
          });
          dispatch({ type: "HYPO_DONE", playerId: me.id });
        }}
      />
    </div>
  );
}

export function Hypo1Phase({ match }: { match: Match }) {
  return <HypoFields match={match} which={1} />;
}
export function Hypo2Phase({ match }: { match: Match }) {
  return <HypoFields match={match} which={2} />;
}

export function MarketPhase({ match }: { match: Match }) {
  const dispatch = useGame((s) => s.dispatch);
  const me = viewingPlayer(match);
  const round = match.phase === "market1" ? 1 : 2;
  const lots = match.lots.filter((l) => l.round === round);
  const [lotId, setLotId] = useState<string | null>(null);
  const [amount, setAmount] = useState<number | null>(null);
  const remain = match.marketUntil ? Math.max(0, match.marketUntil - Date.now()) : 0;
  const secs = Math.ceil(remain / 1000);
  const already = me.phaseDone;

  return (
    <div className="space-y-3">
      <Tip id="market">Você vê o tipo, não o conteúdo. O maior lance leva o lote. Um lance por rodada.</Tip>
      <div className="flex items-end justify-between">
        <h2 className="font-serif text-2xl">Mercado cego · {round}/2</h2>
        <p className="tabular-nums text-lg text-accent">{secs}s</p>
      </div>
      {already ? (
        <p className="text-lg text-fog">Lance enviado. A mesa resolve quando todos jogarem.</p>
      ) : (
        <>
          {lots.map((lot) => (
            <button
              key={lot.id}
              type="button"
              onClick={() => setLotId(lot.id)}
              className={`w-full rounded-xl border p-4 text-left ${
                lotId === lot.id ? "border-accent bg-accent/10" : "border-border bg-card"
              }`}
            >
              <KindSeal kind={lot.kind} />
              <p className="mt-2 font-serif text-xl">Lote {KIND_LABEL[lot.kind].toLowerCase()}</p>
              <p className="text-base text-muted-foreground">Conteúdo oculto até o lance.</p>
            </button>
          ))}
          <div className="flex flex-wrap gap-2 pt-2">
            {[1, 2, 3, 4, 5, 6, 8].map((n) => (
              <button
                key={n}
                type="button"
                disabled={n > me.coins}
                onClick={() => setAmount(n)}
                className={`min-h-11 min-w-11 rounded-md border px-3 tabular-nums ${
                  amount === n ? "border-accent bg-accent text-primary-foreground" : "border-border"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => dispatch({ type: "PASS_BID", playerId: me.id })}
            >
              Passar
            </Button>
            <Button
              className="flex-1"
              disabled={!lotId || !amount}
              onClick={() =>
                lotId &&
                amount &&
                dispatch({ type: "BID", playerId: me.id, lotId, amount })
              }
            >
              Lançar
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

export function NegotiatePhase({ match }: { match: Match }) {
  const dispatch = useGame((s) => s.dispatch);
  const me = viewingPlayer(match);
  const myClues = cluesFrom(me.clueIds);
  const [give, setGive] = useState<string | null>(null);
  const [toId, setToId] = useState<string | null>(null);
  const [want, setWant] = useState<ClueKind>("conector");
  const kinds: ClueKind[] = ["pilar", "conector", "contexto", "ambiguidade"];
  const myTrades = match.trades.filter((t) => t.fromId === me.id || t.toId === me.id);
  const won = match.lots.filter((l) => match.lotWinners[l.id] === me.id);

  return (
    <div className="space-y-3">
      <Tip id="neg">Prometeu, cumpriu. A troca é automática quando os dois aceitam.</Tip>
      <h2 className="font-serif text-2xl">Negociação vinculada</h2>
      {won.length > 0 && (
        <div className="space-y-2 rounded-xl border border-accent/30 bg-accent/5 p-3">
          <p className="text-base uppercase tracking-[0.18em] text-accent">Lotes que você levou</p>
          {won.map((l) => {
            const c = CLUE_BY_ID[l.clueId];
            return c ? <ClueCard key={l.id} clue={c} /> : null;
          })}
        </div>
      )}
      <p className="text-lg text-muted-foreground">Ofereça um fragmento. Peça um tipo — não um conteúdo.</p>

      <h3 className="pt-2 text-base uppercase tracking-[0.18em] text-muted-foreground">Oferecer</h3>
      {myClues.map((c) => (
        <ClueCard key={c.id} clue={c} selected={give === c.id} onSelect={() => setGive(c.id)} />
      ))}

      <h3 className="pt-2 text-base uppercase tracking-[0.18em] text-muted-foreground">Com</h3>
      {match.players
        .filter((p) => p.id !== me.id)
        .map((p) => {
          const c = CHARACTERS.find((x) => x.id === p.id)!;
          return (
            <Choice
              key={p.id}
              selected={toId === p.id}
              label={c.title}
              hint={ROLE_LABEL[c.role]}
              onClick={() => setToId(p.id)}
            />
          );
        })}

      <h3 className="pt-2 text-base uppercase tracking-[0.18em] text-muted-foreground">Quero um</h3>
      <div className="flex flex-wrap gap-2">
        {kinds.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setWant(k)}
            className={`rounded-full border px-3 py-2 text-base uppercase tracking-[0.14em] ${
              want === k ? "border-accent text-accent" : "border-border text-muted-foreground"
            }`}
          >
            {KIND_LABEL[k]}
          </button>
        ))}
      </div>

      <Button
        variant="soft"
        className="w-full"
        disabled={!give || !toId}
        onClick={() =>
          give &&
          toId &&
          dispatch({
            type: "OFFER_TRADE",
            playerId: me.id,
            toId,
            giveClueId: give,
            wantKind: want,
          })
        }
      >
        Oferecer troca
      </Button>

      {myTrades.length > 0 && (
        <ul className="space-y-2 text-lg text-fog">
          {myTrades.map((t) => (
            <li key={t.id} className="rounded-md border border-border px-3 py-2">
              {t.status === "done" ? "Vínculo cumprido." : t.status === "declined" ? "Recusada." : "Pendente."}{" "}
              {CLUE_BY_ID[t.giveClueId]?.title}
            </li>
          ))}
        </ul>
      )}

      <Footer label="Concluir negociação" onClick={() => dispatch({ type: "NEGOTIATE_DONE", playerId: me.id })} />
    </div>
  );
}

export function MosaicPhase({ match }: { match: Match }) {
  const dispatch = useGame((s) => s.dispatch);
  const me = viewingPlayer(match);
  const mine = cluesFrom(me.clueIds);
  const [sel, setSel] = useState<string[]>(me.mosaicSubmitted);
  const [boatoWarn, setBoatoWarn] = useState(false);
  const nucleus = match.nuclei.find((n) => n.memberIds.includes(me.id))!;
  const byRoom = useMemo(() => {
    const map: Record<string, typeof match.mosaicPublic> = {};
    for (const item of match.mosaicPublic) {
      const room = CLUE_BY_ID[item.clueId]?.room ?? "sala";
      map[room] = map[room] ? [...map[room], item] : [item];
    }
    return map;
  }, [match.mosaicPublic]);

  function toggle(id: string) {
    setSel((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  }

  function share() {
    const hasBoato = sel.some((id) => CLUE_BY_ID[id]?.kind === "boato");
    if (hasBoato && !boatoWarn) {
      setBoatoWarn(true);
      return;
    }
    dispatch({ type: "SUBMIT_MOSAIC", playerId: me.id, clueIds: sel });
    setBoatoWarn(false);
  }

  function submitCarta() {
    dispatch({ type: "SUBMIT_CARTA", nucleusId: nucleus.id });
  }

  const unusedTiles = CARTA_TILES.filter((t) => !nucleus.carta.includes(t.id));

  return (
    <div className="space-y-5">
      <Tip id="mosaic">Envie até 3 peças ao mosaico. Depois monte a carta do núcleo: a ordem da noite.</Tip>
      <h2 className="font-serif text-2xl">Mosaico coletivo</h2>
      <p className="text-lg text-muted-foreground">Núcleo {nucleus.id === "alfa" ? "Alfa" : "Beta"} · até 3 envios</p>

      {boatoWarn && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-lg">
          Você está enviando um BOATO — informação não confirmada. Confirma?
          <div className="mt-2 flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setBoatoWarn(false)}>
              Voltar
            </Button>
            <Button size="sm" onClick={share}>
              Confirmar envio
            </Button>
          </div>
        </div>
      )}

      {mine.map((c) => (
        <ClueCard
          key={c.id}
          clue={c}
          selected={sel.includes(c.id)}
          onSelect={() => toggle(c.id)}
        />
      ))}
      <Button variant="soft" className="w-full" onClick={share}>
        Enviar ao mosaico
      </Button>

      <section>
        <h3 className="mb-2 font-serif text-xl">A casa</h3>
        <div className="grid grid-cols-2 gap-2">
          {ROOMS.map((r) => (
            <div key={r.id} className="rounded-lg border border-border bg-card/70 p-2">
              <p className="text-lg uppercase tracking-[0.16em] text-muted-foreground">{r.label}</p>
              <div className="mt-1 space-y-1">
                {(byRoom[r.id] ?? []).map((item) => (
                  <p key={item.clueId + item.playerId} className="text-base text-fog">
                    {CLUE_BY_ID[item.clueId]?.mosaicLabel}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-2">
        <h3 className="font-serif text-xl">A carta da noite</h3>
        <p className="text-lg text-muted-foreground">Toque um fragmento, depois o espaço na linha do tempo.</p>
        <ol className="space-y-2">
          {nucleus.carta.map((id, slot) => (
            <li key={slot}>
              <button
                type="button"
                onClick={() =>
                  dispatch({
                    type: "PLACE_CARTA",
                    nucleusId: nucleus.id,
                    slot,
                    tileId: null,
                  })
                }
                className="flex w-full items-center gap-3 rounded-lg border border-border bg-card px-3 py-3 text-left"
              >
                <span className="tabular-nums text-accent">{slot + 1}</span>
                <span className="text-lg">
                  {id ? CARTA_TILES.find((t) => t.id === id)?.label : "Vazio"}
                </span>
              </button>
            </li>
          ))}
        </ol>
        <div className="flex flex-wrap gap-2">
          {unusedTiles.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                dispatch({
                  type: "PLACE_CARTA",
                  nucleusId: nucleus.id,
                  slot: -1,
                  tileId: t.id,
                });
              }}
              className="rounded-md border border-border px-3 py-2 text-left text-base text-fog"
            >
              {t.label}
            </button>
          ))}
        </div>
        {nucleus.correct && (
          <p className="flex items-center gap-2 text-lg text-accent">
            <Check className="size-4" /> Carta montada. O núcleo encaixa.
          </p>
        )}
        {nucleus.attempts > 0 && !nucleus.correct && (
          <p className="text-lg text-muted-foreground">A montagem não encaixa. O relógio segue.</p>
        )}
        <Button variant="outline" className="w-full" onClick={submitCarta} disabled={nucleus.correct}>
          Verificar carta
        </Button>
      </section>

      <Footer
        label="Concluir mosaico"
        onClick={() => dispatch({ type: "MOSAIC_DONE", playerId: me.id })}
      />
    </div>
  );
}

export function CoopVotePhase({ match }: { match: Match }) {
  const dispatch = useGame((s) => s.dispatch);
  const me = viewingPlayer(match);
  const n = match.nuclei.find((x) => x.memberIds.includes(me.id))!;
  const others = n.memberIds.filter((id) => id !== me.id);
  const [pick, setPick] = useState<string | null>(null);
  if (others.length === 1) {
    return (
      <div className="space-y-4">
        <p className="text-lg text-fog">Núcleo de dois: a votação é dispensada. Cinco pontos para cada.</p>
        <Footer
          label="Seguir"
          onClick={() =>
            dispatch({ type: "COOP_VOTE", playerId: me.id, targetId: others[0] })
          }
        />
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <h2 className="font-serif text-2xl">Quem mais colaborou?</h2>
      <p className="text-lg text-muted-foreground">Voto secreto, só no seu núcleo. Sem votar em si.</p>
      {others.map((id) => {
        const c = CHARACTERS.find((x) => x.id === id)!;
        return (
          <Choice
            key={id}
            selected={pick === id}
            label={c.title}
            hint={c.name}
            onClick={() => setPick(id)}
          />
        );
      })}
      <Footer
        label="Votar"
        disabled={!pick}
        onClick={() => pick && dispatch({ type: "COOP_VOTE", playerId: me.id, targetId: pick })}
      />
    </div>
  );
}

export function LastActionPhase({ match }: { match: Match }) {
  const dispatch = useGame((s) => s.dispatch);
  const me = viewingPlayer(match);
  const [kind, setKind] = useState<PlayerState["lastActionKind"]>(null);
  const [payload, setPayload] = useState<string | null>(null);
  const mine = cluesFrom(me.clueIds);
  const verifyTargets = mine.filter((c) => c.kind === "boato" || c.kind === "ambiguidade");

  if (me.lastActionDone) {
    const v = Object.entries(me.verified).pop();
    const clue = v ? CLUE_BY_ID[v[0]] : null;
    return (
      <div className="space-y-4">
        <h2 className="font-serif text-2xl">Última ação feita</h2>
        {clue && v && (
          <p className="text-fog">
            {clue.title}: {v[1] ? "confirma." : "não se sustenta."}
          </p>
        )}
        <p className="text-lg text-muted-foreground">Aguardando a mesa.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Tip id="last">Uma última oportunidade: comprar, trocar, verificar ou descartar.</Tip>
      <h2 className="font-serif text-2xl">Última ação</h2>
      <div className="grid grid-cols-2 gap-2">
        {(["comprar", "trocar", "verificar", "descartar"] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => {
              setKind(k);
              setPayload(null);
            }}
            className={`rounded-lg border px-3 py-4 capitalize ${
              kind === k ? "border-accent bg-accent/10" : "border-border bg-card"
            }`}
          >
            {k}
          </button>
        ))}
      </div>

      {kind === "comprar" && (
        <div className="space-y-2">
          <p className="text-lg text-muted-foreground">3 moedas. Você vê só o tipo.</p>
          {LEFTOVER_BUY.map((item) => (
            <Choice
              key={item.clueId}
              selected={payload === item.clueId}
              label={KIND_LABEL[item.kind]}
              hint="Conteúdo revelado após a compra"
              onClick={() => setPayload(item.clueId)}
            />
          ))}
        </div>
      )}
      {kind === "verificar" && (
        <div className="space-y-2">
          {verifyTargets.length === 0 && (
            <p className="text-lg text-muted-foreground">Nenhum boato ou ambiguidade na mão.</p>
          )}
          {verifyTargets.map((c) => (
            <ClueCard
              key={c.id}
              clue={c}
              selected={payload === c.id}
              onSelect={() => setPayload(c.id)}
            />
          ))}
        </div>
      )}
      {kind === "descartar" &&
        mine.map((c) => (
          <ClueCard key={c.id} clue={c} selected={payload === c.id} onSelect={() => setPayload(c.id)} />
        ))}
      {kind === "trocar" && (
        <div className="space-y-2">
          <p className="text-lg text-muted-foreground">
            Escolha com quem. O sistema troca seu fragmento por um pilar ou conector deles.
          </p>
          {mine.slice(0, 1).map((c) => (
            <p key={c.id} className="text-base text-fog">
              Você oferece: {c.title}
            </p>
          ))}
          {match.players
            .filter((p) => p.id !== me.id)
            .map((p) => {
              const c = CHARACTERS.find((x) => x.id === p.id)!;
              const value = `${p.id}::${mine[0]?.id ?? ""}`;
              return (
                <Choice
                  key={p.id}
                  selected={payload === value}
                  label={c.title}
                  onClick={() => setPayload(value)}
                />
              );
            })}
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => dispatch({ type: "LAST_DONE", playerId: me.id })}
        >
          Passar
        </Button>
        <Button
          className="flex-1"
          disabled={!kind || (kind !== "comprar" && !payload) || (kind === "comprar" && !payload)}
          onClick={() =>
            kind &&
            dispatch({
              type: "LAST_ACTION",
              playerId: me.id,
              kind,
              payload: payload ?? undefined,
            })
          }
        >
          Executar
        </Button>
      </div>
    </div>
  );
}

export function DeductionPhase({ match }: { match: Match }) {
  const dispatch = useGame((s) => s.dispatch);
  const me = viewingPlayer(match);
  const d = me.deduction;
  const mine = cluesFrom(me.clueIds);

  function set<K extends keyof typeof d>(key: K, value: (typeof d)[K]) {
    dispatch({ type: "SET_DEDUCTION", playerId: me.id, deduction: { [key]: value } });
  }

  const ready = d.suspectId && d.motiveId && d.actionId && d.proofId && d.gapId;

  return (
    <div className="space-y-4">
      <Tip id="ded">Solução individual. Ninguém vê a sua até a revelação. Sem campo livre — só escolha.</Tip>
      <h2 className="font-serif text-2xl">Dedução final</h2>

      <section className="space-y-2">
        <h3 className="text-base uppercase tracking-[0.18em] text-muted-foreground">Suspeito principal</h3>
        {SUSPECTS.map((o) => (
          <Choice key={o.id} selected={d.suspectId === o.id} label={o.label} hint={o.hint} onClick={() => set("suspectId", o.id)} />
        ))}
      </section>
      <section className="space-y-2">
        <h3 className="text-base uppercase tracking-[0.18em] text-muted-foreground">Motivo</h3>
        {MOTIVES.map((o) => (
          <Choice key={o.id} selected={d.motiveId === o.id} label={o.label} hint={o.hint} onClick={() => set("motiveId", o.id)} />
        ))}
      </section>
      <section className="space-y-2">
        <h3 className="text-base uppercase tracking-[0.18em] text-muted-foreground">Ação decisiva</h3>
        {ACTIONS.map((o) => (
          <Choice key={o.id} selected={d.actionId === o.id} label={o.label} hint={o.hint} onClick={() => set("actionId", o.id)} />
        ))}
      </section>
      <section className="space-y-2">
        <h3 className="text-base uppercase tracking-[0.18em] text-muted-foreground">Prova-chave</h3>
        {PROOFS.map((o) => (
          <Choice key={o.id} selected={d.proofId === o.id} label={o.label} hint={o.hint} onClick={() => set("proofId", o.id)} />
        ))}
      </section>
      <section className="space-y-2">
        <h3 className="text-base uppercase tracking-[0.18em] text-muted-foreground">Lacuna resolvida</h3>
        {GAPS.map((o) => (
          <Choice key={o.id} selected={d.gapId === o.id} label={o.label} hint={o.hint} onClick={() => set("gapId", o.id)} />
        ))}
      </section>
      <section className="space-y-2">
        <h3 className="text-base uppercase tracking-[0.18em] text-muted-foreground">Pistas usadas</h3>
        {mine.map((c) => {
          const on = d.usedClueIds.includes(c.id);
          return (
            <ClueCard
              key={c.id}
              clue={c}
              selected={on}
              onSelect={() =>
                set(
                  "usedClueIds",
                  on ? d.usedClueIds.filter((x) => x !== c.id) : [...d.usedClueIds, c.id],
                )
              }
            />
          );
        })}
      </section>

      <Footer
        label="Registrar solução"
        disabled={!ready}
        onClick={() => dispatch({ type: "SUBMIT_DEDUCTION", playerId: me.id })}
      />
    </div>
  );
}

export function RevealPhase({ match }: { match: Match }) {
  const dispatch = useGame((s) => s.dispatch);
  const me = viewingPlayer(match);
  const step = match.revealStep;
  const slide = REVEAL_SLIDES[step];
  const d = me.deduction;

  if (step === 7) {
    const ok = d.suspectId === TRUTH.suspectId;
    return (
      <div className="space-y-4">
        <p className="text-base uppercase tracking-[0.22em] text-accent">A sua solução</p>
        <h2 className="font-serif text-3xl">{ok ? "Você viu o Morador." : "A casa desviou o olhar."}</h2>
        <ul className="space-y-2 text-lg text-fog">
          <li>Suspeito: {SUSPECTS.find((s) => s.id === d.suspectId)?.label}</li>
          <li>Motivo: {MOTIVES.find((s) => s.id === d.motiveId)?.label}</li>
          <li>Ação: {ACTIONS.find((s) => s.id === d.actionId)?.label}</li>
        </ul>
        <Footer label="Ver o placar" onClick={() => dispatch({ type: "REVEAL_NEXT" })} />
      </div>
    );
  }

  if (!slide) {
    return <Footer label="Placar" onClick={() => dispatch({ type: "REVEAL_NEXT" })} />;
  }

  return (
    <div className="space-y-5">
      <p className="text-base uppercase tracking-[0.22em] text-accent">{slide.kicker}</p>
      <h2 className="font-serif text-3xl leading-tight">{slide.title}</h2>
      <p className="font-serif text-xl leading-relaxed text-fog">{slide.body}</p>
      <Footer label={step < 6 ? "Continuar" : "Minha solução"} onClick={() => dispatch({ type: "REVEAL_NEXT" })} />
    </div>
  );
}

export function ScorePhase({ match }: { match: Match }) {
  const reset = useGame((s) => s.reset);
  const rows = match.scores ?? [];
  const winner = rows[0];
  const wch = CHARACTERS.find((c) => c.id === winner?.playerId);

  useEffect(() => {
    playOnce("/audio/encerramento.mp3", 0.45);
    return () => stopVoice();
  }, []);

  return (
    <div className="space-y-5 pb-8">
      <p className="text-base uppercase tracking-[0.22em] text-accent">Placar final</p>
      <h2 className="font-serif text-4xl leading-none">{wch?.title}</h2>
      <p className="text-fog">{wch?.name} · {winner?.total} pontos</p>

      <ol className="space-y-2">
        {rows.map((r, i) => {
          const c = CHARACTERS.find((x) => x.id === r.playerId)!;
          return (
            <li
              key={r.playerId}
              className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-3"
            >
              <div>
                <p className="text-lg">
                  {i + 1}. {c.title}
                </p>
                <p className="text-base text-muted-foreground">
                  {r.acertou ? "Acertou o suspeito" : "Errou o suspeito"} · T{r.tempo} Q{r.qualidade} C
                  {r.coopColetiva + r.coopVoto} E{r.economia} P{r.performance}
                </p>
              </div>
              <span className="tabular-nums font-medium text-accent">{r.total}</span>
            </li>
          );
        })}
      </ol>

      <p className="font-serif text-lg italic text-fog">
        Foi o Morador. Foi o cofre. Foi a porta. E foi a água.
      </p>

      <div className="flex flex-col gap-2">
        <Button size="lg" onClick={() => reset()}>
          Nova partida
        </Button>
        <Link
          to="/"
          className="inline-flex h-11 min-h-11 items-center justify-center rounded-md border border-border text-lg"
          onClick={() => reset()}
        >
          Encerrar
        </Link>
      </div>
    </div>
  );
}

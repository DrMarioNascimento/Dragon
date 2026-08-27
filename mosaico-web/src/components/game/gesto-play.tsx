import { Button } from "@/components/ui/button";
import { useParty } from "@/lib/mosaico/party";
import { cn } from "@/lib/utils";
import { useState } from "react";

function seat() {
  const uid = useParty((s) => s.uid);
  const players = useParty((s) => s.players);
  const i = Math.max(0, players.findIndex((p) => p.id === uid));
  return { i, n: players.length, nome: players[i]?.nome || "tu" };
}

export function PalimpsestoPlay() {
  const pistas = useParty((s) => s.pistas);
  const done = useParty((s) => s.markPista);
  const [on, setOn] = useState(false);
  const { i, n } = seat();
  const janela = !!pistas.janela;
  const solo = n <= 1;
  const baixo = solo || i % 2 === 0;

  function empilhar() {
    setOn(true);
    done("palimpsesto");
  }

  if (!solo) {
    return (
      <div className="space-y-4 px-5 pb-28 pt-6">
        <p className="text-[11px] uppercase tracking-[0.22em] text-accent">Empilha os vidros.</p>
        <h2 className="font-serif text-3xl">{baixo ? "Tu ficas em baixo" : "Tu ficas em cima"}</h2>
        <p className="text-sm text-fog">
          {baixo
            ? "Põe o telefone na mesa, ecrã para cima. O outro empilha no teu."
            : "Põe o teu ecrã em cima do outro. A frase só existe nos dois."}
        </p>
        <div className="box-depth mx-auto min-h-44 max-w-sm rounded-2xl px-4 py-8 text-center">
          {baixo ? (
            <p className="font-serif text-xl leading-7 text-primary">
              {janela ? "ELIAS" : "· · ·"}
              <br />
              · · · · ·
              <br />
              · · · · ·
            </p>
          ) : (
            <p className="font-serif text-xl leading-7 text-fog">
              {on ? "baixou o disjuntor" : "lanterna — ecrã escuro até empilhar"}
            </p>
          )}
        </div>
        <p className="text-center text-sm text-muted-foreground">
          {janela ? "A janela deu a primeira palavra." : "A janela ainda não falou."}
        </p>
        <Button className="w-full" size="lg" onClick={empilhar} disabled={!janela}>
          {on ? "Empilhado. Digam baixo o que leram." : "Empilhei"}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 px-5 pb-28 pt-6">
      <p className="text-[11px] uppercase tracking-[0.22em] text-accent">Empilha os vidros.</p>
      <h2 className="font-serif text-3xl">Palimpsesto</h2>
      <p className="text-sm text-fog">
        {janela
          ? "A janela deixou a primeira palavra. Empilha para o resto."
          : "Primeiro a janela. Sem ela, a carta não tem nome."}
      </p>
      <div className="relative mx-auto h-56 w-full max-w-sm">
        <div
          className={cn(
            "box-depth absolute left-4 top-2 h-44 w-40 rounded-2xl p-3 transition-all duration-500",
            on && "left-10 opacity-40",
          )}
        >
          <p className="font-serif text-sm leading-6 text-fog">
            {janela ? "ELIAS" : "· · · ·"} · · · · O
            <br />· · BAIXOU · ·
            <br />· DISJUNTOR ·
          </p>
        </div>
        <div
          className={cn(
            "box-depth absolute right-4 top-6 h-44 w-40 rounded-2xl p-3 transition-all duration-500",
            on ? "right-10 top-2 ring-4 ring-primary/30" : "",
          )}
        >
          {on ? (
            <p className="pt-6 text-center font-serif text-xl leading-7 text-primary">
              Elias baixou
              <br />
              o disjuntor
            </p>
          ) : (
            <p className="pt-10 text-center text-sm text-muted-foreground">Lanterna</p>
          )}
        </div>
      </div>
      <Button className="w-full" size="lg" disabled={!janela} onClick={empilhar}>
        {on ? "A frase atravessou" : "Empilhar os vidros"}
      </Button>
    </div>
  );
}

export function EspelhoPlay() {
  const pistas = useParty((s) => s.pistas);
  const done = useParty((s) => s.markPista);
  const [shown, setShown] = useState(false);
  const { i, n } = seat();
  const cofre = !!pistas.sala || !!pistas.salaescura;
  const solo = n <= 1;
  const mostra = solo || i % 2 === 0;

  function mostrar() {
    setShown(true);
    done("espelho");
  }

  if (!solo) {
    return (
      <div className="space-y-4 px-5 pb-28 pt-6">
        <p className="text-[11px] uppercase tracking-[0.22em] text-accent">Mostra. Não leias.</p>
        <h2 className="font-serif text-3xl">{mostra ? "Mostra o ecrã" : "Lê no outro"}</h2>
        <p className="text-sm text-fog">
          {mostra
            ? "Não leias em voz alta. Vira o telefone para o vizinho."
            : "Olha o ecrã do outro. Lê tu a frase."}
        </p>
        <div className="box-depth rounded-lg px-4 py-8 text-center">
          {mostra ? (
            <p className="font-serif text-2xl leading-8 text-primary" style={{ transform: "scaleX(-1)" }}>
              {cofre ? (
                <>
                  a marca na trava
                  <br />
                  é de Elias
                </>
              ) : (
                "· · ·"
              )}
            </p>
          ) : (
            <p className="font-serif text-lg text-fog">O teu ecrã está vazio de propósito.</p>
          )}
        </div>
        <Button className="w-full" size="lg" disabled={!cofre} onClick={mostrar}>
          {mostra ? "Mostrei" : "Li no outro telefone"}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 px-5 pb-28 pt-6">
      <p className="text-[11px] uppercase tracking-[0.22em] text-accent">Mostra. Não leias.</p>
      <h2 className="font-serif text-3xl">O espelho</h2>
      <p className="text-sm text-fog">
        {cofre
          ? "O cofre deixou a marca. Está ao contrário — o vizinho lê."
          : "O cofre ainda não falou. A sala às escuras vem primeiro."}
      </p>
      <div className="box-depth rounded-lg px-4 py-8 text-center">
        <p
          className="font-serif text-2xl leading-8 text-primary"
          style={{ transform: shown ? "none" : "scaleX(-1)" }}
        >
          {cofre ? (
            <>
              a marca na trava
              <br />
              é de Elias
            </>
          ) : (
            "· · ·"
          )}
        </p>
      </div>
      <Button className="w-full" size="lg" disabled={!cofre} onClick={mostrar}>
        {shown ? "Lido pelo outro lado" : "Mostrei ao vizinho"}
      </Button>
    </div>
  );
}

const ROOMS = ["Sala", "Corredor", "Cofre"] as const;

export function PlantaPlay() {
  const pistas = useParty((s) => s.pistas);
  const done = useParty((s) => s.markPista);
  const [path, setPath] = useState<string[]>([]);
  const [here, setHere] = useState(false);
  const { i, n } = seat();
  const frase = !!pistas.palimpsesto;
  const solo = n <= 1;
  const mine = ROOMS[i % 3];
  const ok = path.length === 3 && path.every((x, k) => x === ROOMS[k]);

  function tap(name: string) {
    if (!frase) return;
    const expect = ROOMS[path.length];
    if (name !== expect) {
      setPath(name === "Sala" ? ["Sala"] : []);
      return;
    }
    const next = [...path, name];
    setPath(next);
    if (next.length === 3) done("planta");
  }

  if (!solo) {
    return (
      <div className="space-y-4 px-5 pb-28 pt-6">
        <p className="text-[11px] uppercase tracking-[0.22em] text-accent">A mesa é a casa.</p>
        <h2 className="font-serif text-3xl">O teu cômodo é {mine}</h2>
        <p className="text-sm text-fog">
          {frase
            ? "Elias baixou o disjuntor e passou por aqui. Encosta o teu telefone no sítio certo da mesa."
            : "A frase da pilha ainda não veio. Sem ela, o caminho não acende."}
        </p>
        <div className="box-depth flex h-40 items-end justify-center rounded-2xl pb-4 font-serif text-2xl text-primary">
          {mine}
        </div>
        <Button
          className="w-full"
          size="lg"
          disabled={!frase}
          onClick={() => {
            setHere(true);
            done("planta");
          }}
        >
          {here ? "Estou no sítio" : `Pus o telefone na ${mine}`}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 px-5 pb-28 pt-6">
      <p className="text-[11px] uppercase tracking-[0.22em] text-accent">A mesa é a casa.</p>
      <h2 className="font-serif text-3xl">A planta</h2>
      <p className="text-sm text-fog">
        {frase
          ? "A frase disse o caminho. Toca na ordem: Sala, Corredor, Cofre."
          : "Empilha primeiro. A planta espera a frase."}
      </p>
      <div className="flex items-end justify-center gap-2">
        {ROOMS.map((name, k) => {
          const lit = path[k] === name || ok;
          return (
            <button
              key={name}
              type="button"
              onClick={() => tap(name)}
              className={cn(
                "flex h-36 flex-1 flex-col items-center justify-end rounded-2xl pb-3 font-serif text-lg",
                lit ? "btn-depth" : "box-depth text-fog",
              )}
            >
              {name}
            </button>
          );
        })}
      </div>
      <p className="text-center text-sm text-muted-foreground">
        {ok ? "O caminho acendeu." : path.length ? path.join(" → ") : "Toca os cômodos."}
      </p>
    </div>
  );
}

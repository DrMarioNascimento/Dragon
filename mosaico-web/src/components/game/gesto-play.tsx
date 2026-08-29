import { Button } from "@/components/ui/button";
import { tituloPapelNaMesa } from "@/lib/mosaico/arquetipo";
import { useParty } from "@/lib/mosaico/party";
import { cn } from "@/lib/utils";
import { useState } from "react";

/* Lê da store: é um hook, e o nome tem de dizer isso. */
function useAssento() {
  const uid = useParty((s) => s.uid);
  const players = useParty((s) => s.players);
  const i = Math.max(0, players.findIndex((p) => p.id === uid));
  return { i, n: players.length, nome: players[i]?.nome || "você", players };
}

export function PalimpsestoPlay() {
  const pistas = useParty((s) => s.pistas);
  const done = useParty((s) => s.markPista);
  const [on, setOn] = useState(false);
  const [papel, setPapel] = useState<"baixo" | "cima">("baixo");
  const { i, n, players } = useAssento();
  const janela = !!pistas.janela;
  const solo = n <= 1;
  const baixo = solo ? papel === "baixo" : i % 2 === 0;
  const morador = tituloPapelNaMesa("elias", players);

  function empilhar() {
    setOn(true);
    done("palimpsesto");
  }

  return (
    <div className="space-y-4 px-5 pb-28 pt-6">
      <h2 className="font-serif text-3xl">{baixo ? "Você fica embaixo" : "Você fica em cima"}</h2>
      <p className="text-lg text-fog">
        {solo
          ? "No ensaio o mesmo telefone faz os dois. Um depois do outro."
          : baixo
            ? "Coloca o celular na mesa, tela pra cima. O outro empilha no seu."
            : "Põe a sua tela em cima da outra. A frase só existe nos dois."}
      </p>
      <div className="box-depth mx-auto min-h-44 max-w-sm rounded-2xl px-4 py-8 text-center">
        {baixo ? (
          <p className="font-serif text-xl leading-7 text-primary">
            {janela ? morador.toUpperCase() : "· · ·"}
            <br />
            · · · · ·
            <br />
            · · · · ·
          </p>
        ) : on ? (
          <p className="font-serif text-xl leading-7 text-primary">
            {morador} baixou
            <br />
            o disjuntor
          </p>
        ) : (
          <p className="font-serif text-xl leading-7 text-fog">lanterna — tela escura até empilhar</p>
        )}
      </div>
      {solo && papel === "baixo" && !on && (
        <Button type="button" variant="outline" className="w-full" onClick={() => setPapel("cima")}>
          Agora o outro telefone
        </Button>
      )}
      <Button className="w-full" size="lg" onClick={empilhar} disabled={!janela || (solo && papel === "baixo")}>
        {on ? "Empilhado. A frase fechou." : "Empilhei"}
      </Button>
    </div>
  );
}

export function EspelhoPlay() {
  const pistas = useParty((s) => s.pistas);
  const done = useParty((s) => s.markPista);
  const [shown, setShown] = useState(false);
  const [papel, setPapel] = useState<"mostra" | "le">("mostra");
  const { i, n, players } = useAssento();
  const cofre = !!pistas.sala || !!pistas.salaescura;
  const solo = n <= 1;
  const mostra = solo ? papel === "mostra" : i % 2 === 0;
  const morador = tituloPapelNaMesa("elias", players);

  function mostrar() {
    setShown(true);
    done("espelho");
  }

  return (
    <div className="space-y-4 px-5 pb-28 pt-6">
      <h2 className="font-serif text-3xl">{mostra ? "Mostra a tela" : "Lê no outro"}</h2>
      <p className="text-lg text-fog">
        {solo
          ? "No ensaio: primeiro você mostra (ao contrário). Depois vira o papel e lê."
          : mostra
            ? "Não leia em voz alta. Vira o celular pro vizinho."
            : "Olha a tela do outro. Você lê a frase."}
      </p>
      <div className="box-depth rounded-lg px-4 py-8 text-center">
        {mostra ? (
          <p className="font-serif text-2xl leading-8 text-primary" style={{ transform: "scaleX(-1)" }}>
            {cofre ? (
              <>
                a marca na trava
                <br />
                é de {morador}
              </>
            ) : (
              "· · ·"
            )}
          </p>
        ) : shown ? (
          <p className="font-serif text-2xl leading-8 text-primary">
            a marca na trava
            <br />
            é de {morador}
          </p>
        ) : (
          <p className="font-serif text-lg text-fog">A sua tela está vazia de propósito.</p>
        )}
      </div>
      {solo && papel === "mostra" && !shown && (
        <Button type="button" variant="outline" className="w-full" onClick={() => setPapel("le")}>
          Agora o outro telefone
        </Button>
      )}
      <Button className="w-full" size="lg" disabled={!cofre} onClick={mostrar}>
        {mostra ? "Mostrei" : shown ? "Li no outro telefone" : "Li no outro telefone"}
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
  const { i, n, players } = useAssento();
  const frase = !!pistas.palimpsesto;
  const solo = n <= 1;
  const mine = ROOMS[i % 3];
  const ok = path.length === 3 && path.every((x, k) => x === ROOMS[k]);
  const morador = tituloPapelNaMesa("elias", players);

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
        <h2 className="font-serif text-3xl">Seu cômodo é {mine}</h2>
        <p className="text-lg text-fog">
          {frase
            ? `${morador} baixou o disjuntor e passou por aqui. Encosta o celular no lugar certo da mesa.`
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
          {here ? "Estou no lugar" : `Coloquei o celular na ${mine}`}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 px-5 pb-28 pt-6">
      <h2 className="font-serif text-3xl">A planta</h2>
      <p className="text-lg text-fog">
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
      <p className="text-center text-lg text-muted-foreground">
        {ok ? "O caminho acendeu." : path.length ? path.join(" → ") : "Toca os cômodos."}
      </p>
    </div>
  );
}

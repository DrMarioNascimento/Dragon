import { MEDIA } from "@/lib/mosaico/assets";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

type Beat = "apart" | "snap" | "join" | "letter";

/* Caminho comecado em "/" sai do site: no Pages o MOSAICO mora em
   /Dragon/v2/, e a foto dava 404. Tudo o que e servido junto passa a
   pendurar-se na base. */
const SRC = `${MEDIA}capa-vertical.jpg`;

/* A demonstração mostrava as seis cartas de `v3.ts`, que eram do caso antigo —
   o cofre arrombado, a névoa convidada. Saíram junto com o arquivo. Estas seis
   são a mesma linha do tempo que A Noite monta a partir do banco em
   v1/casos/casa-da-costa.json: F22, F21, F23, F02, F25 e F08.

   Ficam inline porque aqui é ilustração de abertura, não jogo: puxar o banco
   por fetch só para animar uma carta pagaria uma requisição por visita. Ao
   mexer no banco, confira se ainda batem. */
const CARTAS_DEMO = [
  { id: "f22", hora: "21:02", txt: "Alguém já estava no vão do sótão quando o primeiro carro parou." },
  { id: "f21", hora: "21:19", txt: "Seis chegadas em fila. E nenhuma antes das 21h02." },
  { id: "f23", hora: "21:21", txt: "O quarto degrau rangeu sob peso. O grupo inteiro estava na sala." },
  { id: "f02", hora: "21:24", txt: "Cozinha e corredor sem poeira. O resto da casa tem cinco meses." },
  { id: "f25", hora: "21:29", txt: "A luz cai. Dois minutos e dois segundos de escuro." },
  { id: "f08", hora: "21:31", txt: "A secretária reinicia e diz um nome que não é de nenhum dos seis." },
] as const;

export function CartaDemo({ onBack }: { onBack?: () => void }) {
  const [beat, setBeat] = useState<Beat>("apart");
  const [run, setRun] = useState(0);

  useEffect(() => {
    setBeat("apart");
    const a = window.setTimeout(() => setBeat("snap"), 700);
    const b = window.setTimeout(() => setBeat("join"), 1800);
    const c = window.setTimeout(() => setBeat("letter"), 3200);
    return () => {
      window.clearTimeout(a);
      window.clearTimeout(b);
      window.clearTimeout(c);
    };
  }, [run]);

  return (
    <div className="flex flex-col gap-5">
      <header className="text-center">
        <p className="text-base uppercase tracking-[0.22em] text-accent">Encosta.</p>
        <h2 className="mt-1 font-serif text-3xl">A carta na mesa</h2>
        <p className="mt-2 text-lg text-fog">
          {beat === "apart" && "Dois telefones. Cada um, uma faixa do desenho."}
          {beat === "snap" && "As peças sentam no próprio vidro."}
          {beat === "join" && "Encostam. O recorte fecha."}
          {beat === "letter" && "A imagem atravessou a fresta. As horas aparecem."}
        </p>
      </header>

      <div
        className="relative mx-auto flex h-[min(70vh,480px)] w-full max-w-lg items-center justify-center"
        data-beat={beat}
      >
        <Phone
          side="left"
          beat={beat}
          label="Névoa"
          pieces={[0, 1, 2]}
        />
        <Phone
          side="right"
          beat={beat}
          label="Tempestade"
          pieces={[3, 4, 5]}
        />
      </div>

      {beat === "letter" && (
        <ol className="stagger-in space-y-1.5 px-1">
          {CARTAS_DEMO.map((c) => (
            <li key={c.id} className="text-base leading-snug text-fog">
              <span className="font-serif text-primary">{c.hora}</span>
              {" · "}
              {c.txt}
            </li>
          ))}
        </ol>
      )}

      <div className="flex gap-2">
        <Button className="flex-1" variant="soft" onClick={() => setRun((n) => n + 1)}>
          De novo
        </Button>
        {onBack && (
          <Button className="flex-1" variant="ghost" onClick={onBack}>
            Voltar
          </Button>
        )}
      </div>
    </div>
  );
}

function Phone({
  side,
  beat,
  label,
  pieces,
}: {
  side: "left" | "right";
  beat: Beat;
  label: string;
  pieces: number[];
}) {
  const join = beat === "join" || beat === "letter";
  const snap = beat !== "apart";
  return (
    <div
      className={cn(
        "relative h-full w-[42%] overflow-hidden rounded-[1.4rem] border-2 border-primary/50 bg-background shadow-[var(--shadow-border)] transition-transform duration-700 ease-out",
        side === "left" && !join && "-translate-x-4 -rotate-2",
        side === "right" && !join && "translate-x-4 rotate-2",
        join && "translate-x-0 rotate-0",
        side === "left" && join && "rounded-r-sm border-r-0",
        side === "right" && join && "rounded-l-sm border-l-0",
      )}
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${SRC})`,
          backgroundSize: "200% 100%",
          backgroundPosition: side === "left" ? "left center" : "right center",
        }}
      />
      <div className="absolute inset-0 bg-background/20" />
      {pieces.map((i, n) => (
        <div
          key={i}
          className={cn(
            "absolute left-[8%] right-[8%] overflow-hidden rounded-sm border border-primary/40 shadow-md transition-all duration-500",
            !snap && "opacity-80",
          )}
          style={{
            top: snap ? `${10 + n * 28}%` : `${6 + n * 30 + (side === "left" ? -4 : 5)}%`,
            height: "26%",
            transform: snap ? "rotate(0deg)" : `rotate(${side === "left" ? -8 + n * 3 : 7 - n * 2}deg)`,
            backgroundImage: `url(${SRC})`,
            backgroundSize: "200% 400%",
            backgroundPosition: `${side === "left" ? "0%" : "100%"} ${n * 50}%`,
          }}
        />
      ))}
      <p className="absolute bottom-2 left-0 right-0 text-center text-lg uppercase tracking-[0.18em] text-primary">
        {label}
      </p>
      {beat === "letter" && (
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
      )}
    </div>
  );
}

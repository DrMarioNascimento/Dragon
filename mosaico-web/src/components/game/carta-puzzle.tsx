import { Button } from "@/components/ui/button";
import { NOITE_CARTAS, ORDEM_NOITE } from "@/lib/mosaico/v3";
import { cn } from "@/lib/utils";
import { useMemo, useState } from "react";

/** Recorte entre duas horas. Só encaixa se o vizinho tiver o mesmo nome. */
const CORTE: Record<string, { esq: string | null; dir: string | null }> = {
  c03: { esq: null, dir: "onda" },
  c07: { esq: "onda", dir: "dente" },
  c12: { esq: "dente", dir: "fresta" },
  c14: { esq: "fresta", dir: "gota" },
  c20: { esq: "gota", dir: "farol" },
  c29: { esq: "farol", dir: null },
};

const MARCA: Record<string, [boolean, boolean, boolean]> = {
  onda: [true, false, true],
  dente: [false, true, false],
  fresta: [true, true, false],
  gota: [false, true, true],
  farol: [true, false, false],
};

function Edge({ kind, side }: { kind: string | null; side: "esq" | "dir" }) {
  if (!kind) {
    return (
      <div className="flex h-3 items-center justify-center">
        <span className="h-px w-16 bg-primary/40" />
      </div>
    );
  }
  const bits = MARCA[kind] ?? [true, true, true];
  return (
    <div
      className="flex h-3 items-center justify-center gap-2"
      aria-label={`Corte ${kind}, ${side === "esq" ? "cima" : "baixo"}`}
    >
      {bits.map((on, i) => (
        <span
          key={i}
          className={cn(
            "size-2 rounded-full",
            on ? "bg-primary" : "bg-primary/20",
          )}
        />
      ))}
    </div>
  );
}

function Peca({
  id,
  selected,
  match,
  onClick,
}: {
  id: string;
  selected?: boolean;
  match?: "ok" | "nao" | null;
  onClick: () => void;
}) {
  const c = NOITE_CARTAS.find((x) => x.id === id);
  const corte = CORTE[id];
  if (!c || !corte) return null;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full px-4 py-3 text-left shadow-[var(--shadow-border)] transition-colors",
        selected ? "bg-primary/10" : "bg-card",
        match === "ok" && "shadow-[0_0_0_1px_rgba(232,194,122,0.7)]",
        match === "nao" && "shadow-[0_0_0_1px_rgba(196,92,74,0.7)]",
      )}
    >
      <Edge kind={corte.esq} side="esq" />
      <p className="font-serif text-lg text-primary">{c.hora}</p>
      <p className="mt-1 text-sm leading-snug text-fog">{c.txt}</p>
      <Edge kind={corte.dir} side="dir" />
    </button>
  );
}

function encaixa(a: string, b: string) {
  return CORTE[a]?.dir != null && CORTE[a].dir === CORTE[b]?.esq;
}

export function CartaPuzzle({
  mine,
}: {
  /** Peças neste telefone. Vazio = as seis (ensaio). */
  mine?: string[];
}) {
  const mao = useMemo(() => mine && mine.length ? mine : [...ORDEM_NOITE], [mine]);
  const [fila, setFila] = useState<string[]>([]);
  const [envio, setEnvio] = useState<"ok" | "nao" | null>(null);
  const resto = mao.filter((id) => !fila.includes(id));

  function matchAt(i: number): "ok" | "nao" | null {
    if (i === 0 || !fila[i - 1] || !fila[i]) return null;
    return encaixa(fila[i - 1], fila[i]) ? "ok" : "nao";
  }

  const completa = fila.length === mao.length;
  const ordemBoa =
    completa &&
    fila.every((id, i) => {
      if (i === 0) return CORTE[id]?.esq == null;
      return encaixa(fila[i - 1], id);
    }) &&
    CORTE[fila[fila.length - 1]]?.dir == null;

  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed text-fog">
        Cada peça tem um recorte. O vizinho que fecha o seu recorte está em
        outro telefone — ou nesta pilha, no ensaio. De cima para baixo é da
        esquerda para a direita na mesa.
      </p>

      <div className="space-y-0">
        {fila.length === 0 && (
          <p className="rounded-md border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
            Toque numa peça para começar a carta.
          </p>
        )}
        {fila.map((id, i) => (
          <Peca
            key={id}
            id={id}
            selected
            match={matchAt(i)}
            onClick={() => {
              setEnvio(null);
              setFila(fila.filter((x) => x !== id));
            }}
          />
        ))}
      </div>

      {resto.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            Peças neste telefone
          </p>
          {resto.map((id) => (
            <Peca
              key={id}
              id={id}
              onClick={() => {
                setEnvio(null);
                setFila([...fila, id]);
              }}
            />
          ))}
        </div>
      )}

      <Button
        className="w-full"
        size="lg"
        disabled={!completa || envio === "ok"}
        onClick={() => setEnvio(ordemBoa ? "ok" : "nao")}
      >
        Encostar a carta
      </Button>
      {envio === "ok" && (
        <p className="text-center font-serif text-lg italic text-primary">
          A imagem atravessou a fresta.
        </p>
      )}
      {envio === "nao" && (
        <p className="text-center font-serif text-lg italic text-destructive">
          O recorte não fecha. Olha o vizinho.
        </p>
      )}
    </div>
  );
}

import { Button } from "@/components/ui/button";
import {
  FOTO_IDS,
  ORDEM_NOITE,
  pecasDoPapel,
  type FotoId,
  type PapelFoto,
} from "@/lib/mosaico/v3";
import { cn } from "@/lib/utils";
import { useMemo, useRef, useState } from "react";

export type { FotoId, PapelFoto };

export const FOTOS: Record<
  FotoId,
  {
    src: string;
    tarja: string;
    onde: string;
    achado: string;
    data: string;
    lado: "top" | "bottom";
  }
> = {
  agenda: {
    src: "/media/foto-agenda.jpg",
    tarja: "/media/tarja-agenda.jpg",
    onde: "Escrivaninha. A agenda da jornalista.",
    achado: "Ontem a herdeira estava no jardim. Alguém já estava na janela.",
    data: "ontem  21:14",
    lado: "bottom",
  },
  gaveta: {
    src: "/media/foto-gaveta.jpg",
    tarja: "/media/tarja-gaveta.jpg",
    onde: "Gaveta aberta. Retrato da família.",
    achado: "Quem mora na casa já estava na porta — fora do retrato.",
    data: "Verão 1987",
    lado: "bottom",
  },
  farol: {
    src: "/media/foto-farol.jpg",
    tarja: "/media/tarja-farol.jpg",
    onde: "Jornal dobrado. Recorte da trava.",
    achado: "Duas marcas na trava. O recorte é de 27 de agosto.",
    data: "27 AGO",
    lado: "top",
  },
  noite: {
    src: "/media/foto-noite.jpg",
    tarja: "/media/tarja-noite.jpg",
    onde: "Quadro caído. A escada da casa.",
    achado: "O quarto degrau. A moldura diz Costa, 1979.",
    data: "COSTA  1979",
    lado: "bottom",
  },
};

export { FOTO_IDS };

type Tab = -1 | 0 | 1;

type Piece = {
  id: string;
  col: number;
  row: number;
  tabs: { t: Tab; r: Tab; b: Tab; l: Tab };
};

function tabsFor(col: number, row: number, cols: number, rows: number) {
  const t: Tab = row === 0 ? 0 : ((col + row) % 2 === 0 ? 1 : -1);
  const l: Tab = col === 0 ? 0 : ((col + row) % 2 === 0 ? -1 : 1);
  const r: Tab = col === cols - 1 ? 0 : (-l as Tab);
  const b: Tab = row === rows - 1 ? 0 : (-t as Tab);
  return { t, r, b, l };
}

function bump(
  x: number,
  y: number,
  dx: number,
  dy: number,
  tab: Tab,
  nx: number,
  ny: number,
) {
  if (tab === 0) return `L ${x + dx} ${y + dy}`;
  const s = tab;
  const px = nx * 0.32 * s;
  const py = ny * 0.32 * s;
  const cx = x + dx / 2;
  const cy = y + dy / 2;
  return [
    `L ${x + dx * 0.38} ${y + dy * 0.38}`,
    `Q ${cx + px} ${cy + py} ${x + dx * 0.62} ${y + dy * 0.62}`,
    `L ${x + dx} ${y + dy}`,
  ].join(" ");
}

function piecePath(tabs: Piece["tabs"]) {
  const { t, r, b, l } = tabs;
  return [
    "M 0 0",
    bump(0, 0, 1, 0, t, 0, -1),
    bump(1, 0, 0, 1, r, 1, 0),
    bump(1, 1, -1, 0, b, 0, 1),
    bump(0, 1, 0, -1, l, -1, 0),
    "Z",
  ].join(" ");
}

function build(cols: number, rows: number): Piece[] {
  return ORDEM_NOITE.map((id, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    return { id, col, row, tabs: tabsFor(col, row, cols, rows) };
  });
}

type Pos = { x: number; y: number; slot: number | null };

export function CartaPuzzle({
  mine,
  phones = 1,
  foto = "agenda",
  papel,
  onComplete,
}: {
  mine?: string[];
  phones?: number;
  foto?: FotoId;
  papel?: PapelFoto;
  onComplete?: () => void;
}) {
  const papelEfetivo: PapelFoto =
    papel ?? (phones <= 1 ? "full" : phones === 2 ? "esq" : "full");
  if (papelEfetivo === "tarja") {
    return <TarjaPuzzle foto={foto} onComplete={onComplete} />;
  }
  const mao = mine && mine.length ? mine : pecasDoPapel(papelEfetivo);
  const gridCols = 2;
  const gridRows = 3;
  const all = useMemo(() => build(gridCols, gridRows), [gridCols, gridRows]);
  const mineSet = useMemo(() => new Set(mao), [mao]);
  const img = FOTOS[foto];

  const boardRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<Record<string, Pos>>(() => {
    const start: Record<string, Pos> = {};
    mao.forEach((id, i) => {
      start[id] = { x: 10 + (i % 2) * 40, y: 68 + Math.floor(i / 2) * 14, slot: null };
    });
    return start;
  });
  const [drag, setDrag] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [tried, setTried] = useState(false);

  const placed = mao.filter((id) => pos[id]?.slot != null).length;
  const correct = mao.every((id) => {
    const p = all.find((x) => x.id === id);
    return p && pos[id]?.slot === p.row * gridCols + p.col;
  });

  function clientToPct(ev: React.PointerEvent) {
    const box = boardRef.current;
    if (!box) return { x: 0, y: 0 };
    const r = box.getBoundingClientRect();
    return {
      x: ((ev.clientX - r.left) / r.width) * 100,
      y: ((ev.clientY - r.top) / r.height) * 100,
    };
  }

  function onDown(id: string, ev: React.PointerEvent) {
    ev.currentTarget.setPointerCapture(ev.pointerId);
    setDrag(id);
    setTried(false);
  }

  function onMove(ev: React.PointerEvent) {
    if (!drag) return;
    const { x, y } = clientToPct(ev);
    setPos((prev) => ({ ...prev, [drag]: { ...prev[drag], x: x - 8, y: y - 8, slot: null } }));
  }

  function onUp(ev: React.PointerEvent) {
    if (!drag) return;
    const { x, y } = clientToPct(ev);
    const cellW = 100 / gridCols;
    const cellH = 62 / gridRows;
    const col = Math.max(0, Math.min(gridCols - 1, Math.floor(x / cellW)));
    const row = Math.max(0, Math.min(gridRows - 1, Math.floor(y / cellH)));
    const inBoard = y < 64;
    const slot = inBoard ? row * gridCols + col : null;
    const snap = inBoard
      ? { x: col * cellW + 0.4, y: row * cellH + 0.4, slot }
      : { x: pos[drag].x, y: pos[drag].y, slot: null };
    setPos((prev) => ({ ...prev, [drag]: snap }));
    setDrag(null);
  }

  const cellW = `${100 / gridCols}%`;
  const cellH = `${62 / gridRows}%`;

  return (
    <div className="space-y-3">
      <p className="text-lg leading-relaxed text-fog">
        {img.onde}{" "}
        {mao.length < 6
          ? "Monta as tuas peças. As que faltam estão no outro telefone."
          : "Quebra-cabeça de mesa: dente e buraco. Arrasta."}
      </p>

      <div
        ref={boardRef}
        className="box-depth relative aspect-[2/3] w-full touch-none overflow-hidden rounded-lg"
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      >
        {/* slots */}
        {all.map((p) => {
          const minePiece = mineSet.has(p.id);
          return (
            <div
              key={`s-${p.id}`}
              className={cn(
                "absolute box-border",
                minePiece ? "border border-dashed border-primary/20" : "bg-background/50",
              )}
              style={{
                left: `${(p.col / gridCols) * 100}%`,
                top: `${(p.row / gridRows) * 62}%`,
                width: cellW,
                height: cellH,
              }}
            >
              {!minePiece && (
                <svg viewBox="0 0 1 1" className="h-full w-full overflow-visible">
                  <path
                    d={piecePath(p.tabs)}
                    fill="none"
                    stroke="rgba(168,184,196,0.45)"
                    strokeWidth="0.04"
                    strokeDasharray="0.06 0.05"
                  />
                </svg>
              )}
            </div>
          );
        })}

        {all.map((p) => {
          if (!mineSet.has(p.id)) return null;
          const here = pos[p.id];
          if (!here) return null;
          const w = 100 / gridCols;
          const h = 62 / gridRows;
          return (
            <div
              key={p.id}
              className="absolute z-10 cursor-grab active:cursor-grabbing"
              style={{
                left: `${here.x}%`,
                top: `${here.y}%`,
                width: `${w}%`,
                height: `${h}%`,
                zIndex: drag === p.id ? 20 : 10,
              }}
              onPointerDown={(e) => onDown(p.id, e)}
            >
              <svg
                viewBox={`${p.col} ${p.row} 1 1`}
                className="h-full w-full overflow-visible drop-shadow-md"
              >
                <defs>
                  <clipPath id={`clip-${foto}-${p.id}`}>
                    <path
                      d={piecePath(p.tabs)}
                      transform={`translate(${p.col} ${p.row})`}
                    />
                  </clipPath>
                </defs>
                <image
                  href={img.src}
                  x={0}
                  y={0}
                  width={gridCols}
                  height={gridRows}
                  preserveAspectRatio="xMidYMid slice"
                  clipPath={`url(#clip-${foto}-${p.id})`}
                />
                <path
                  d={piecePath(p.tabs)}
                  transform={`translate(${p.col} ${p.row})`}
                  fill="none"
                  stroke="rgba(232,194,122,0.95)"
                  strokeWidth="0.045"
                />
              </svg>
            </div>
          );
        })}
      </div>

      <p className="text-center text-base uppercase tracking-[0.16em] text-muted-foreground">
        {placed} de {mao.length} no lugar
      </p>

      <Button
        className="w-full"
        size="lg"
        disabled={placed < mao.length}
        onClick={() => {
          setTried(true);
          if (correct) {
            setDone(true);
            onComplete?.();
          }
        }}
      >
        Encaixar
      </Button>
      {tried && !correct && (
        <p className="text-center font-serif text-lg italic text-destructive">
          O recorte não fecha. Vira a peça no lugar certo.
        </p>
      )}
      {done && correct && (
        <p className="text-center font-serif text-lg italic text-primary">
          {img.achado}
        </p>
      )}
    </div>
  );
}

function TarjaPuzzle({
  foto,
  onComplete,
}: {
  foto: FotoId;
  onComplete?: () => void;
}) {
  const img = FOTOS[foto];
  const cima = img.lado === "top";
  const ids = ["c03", "c07"] as const;
  const [slot, setSlot] = useState<Record<string, number | null>>({
    c03: null,
    c07: null,
  });
  const [drag, setDrag] = useState<string | null>(null);
  const [pos, setPos] = useState<Record<string, { x: number; y: number }>>({
    c03: { x: 8, y: 72 },
    c07: { x: 52, y: 72 },
  });
  const [tried, setTried] = useState(false);
  const [done, setDone] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const ok = slot.c03 === 0 && slot.c07 === 1;

  function pct(ev: React.PointerEvent) {
    const r = box.current!.getBoundingClientRect();
    return {
      x: ((ev.clientX - r.left) / r.width) * 100,
      y: ((ev.clientY - r.top) / r.height) * 100,
    };
  }

  return (
    <div className="space-y-3">
      <p className="text-lg text-fog">
        A casa te deu a tarja — hora ou data. Encaixa {cima ? "em cima" : "em baixo"} da foto dos outros dois.
      </p>
      <div
        ref={box}
        className="box-depth relative aspect-[2/3] w-full touch-none overflow-hidden rounded-lg"
        onPointerMove={(e) => {
          if (!drag) return;
          const p = pct(e);
          setPos((s) => ({ ...s, [drag]: { x: p.x - 20, y: p.y - 6 } }));
        }}
        onPointerUp={(e) => {
          if (!drag) return;
          const p = pct(e);
          const band = cima ? p.y < 22 : p.y > 78;
          const col = p.x < 50 ? 0 : 1;
          setSlot((s) => ({ ...s, [drag]: band ? col : null }));
          if (band) {
            setPos((s) => ({
              ...s,
              [drag]: {
                x: col * 50,
                y: cima ? 2 : 84,
              },
            }));
          }
          setDrag(null);
        }}
      >
        <img
          src={img.src}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-35"
        />
        <div
          className="absolute left-1 right-1 h-[16%] border border-dashed border-primary/50"
          style={{ top: cima ? "2%" : "auto", bottom: cima ? "auto" : "2%" }}
        />
        {ids.map((id, i) => (
          <div
            key={id}
            className="absolute z-10 h-[16%] w-[48%] cursor-grab overflow-hidden rounded-sm shadow-md active:cursor-grabbing"
            style={{ left: `${pos[id].x}%`, top: `${pos[id].y}%` }}
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              setDrag(id);
            }}
          >
            <img
              src={img.tarja}
              alt=""
              className="absolute max-w-none"
              style={{
                width: "208%",
                height: "100%",
                left: i === 0 ? "0%" : "-100%",
                objectFit: "cover",
              }}
            />
          </div>
        ))}
      </div>
      <Button
        className="w-full"
        size="lg"
        onClick={() => {
          setTried(true);
          if (ok) {
            setDone(true);
            onComplete?.();
          }
        }}
      >
        Encaixar a tarja
      </Button>
      {tried && !ok && (
        <p className="text-center font-serif italic text-destructive">
          A data não fecha. Encosta na faixa.
        </p>
      )}
      {done && ok && (
        <p className="text-center font-serif text-lg italic text-primary">
          {img.data} — {img.achado}
        </p>
      )}
    </div>
  );
}

import { Button } from "@/components/ui/button";
import { NOITE_CARTAS, ORDEM_NOITE } from "@/lib/mosaico/v3";
import { cn } from "@/lib/utils";
import { useMemo, useRef, useState } from "react";

const SRC = "/media/capa-vertical.jpg";
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
  const px = nx * 0.2 * s;
  const py = ny * 0.2 * s;
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

export function CartaPuzzle({ mine, phones = 1 }: { mine?: string[]; phones?: number }) {
  const mao = mine && mine.length ? mine : [...ORDEM_NOITE];
  const gridCols = phones === 2 ? 2 : 3;
  const gridRows = phones === 2 ? 3 : 2;
  const all = useMemo(() => build(gridCols, gridRows), [gridCols, gridRows]);
  const mineSet = useMemo(() => new Set(mao), [mao]);

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
      <p className="text-sm leading-relaxed text-fog">
        {mao.length < 6
          ? "Este telefone tem as peças de uma faixa. Encosta o vidro no do vizinho — o desenho só fecha junto."
          : "Arrasta as peças para o desenho. O recorte clássico encaixa, como um quebra-cabeça na mesa."}
      </p>

      <div
        ref={boardRef}
        className="box-depth relative aspect-[3/4] w-full touch-none overflow-hidden rounded-lg"
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
                "absolute box-border border border-dashed",
                minePiece ? "border-primary/25" : "border-fog/20 bg-background/40",
              )}
              style={{
                left: `${(p.col / gridCols) * 100}%`,
                top: `${(p.row / gridRows) * 62}%`,
                width: cellW,
                height: cellH,
              }}
            />
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
                  <clipPath id={`clip-${p.id}`}>
                    <path
                      d={piecePath(p.tabs)}
                      transform={`translate(${p.col} ${p.row})`}
                    />
                  </clipPath>
                </defs>
                <image
                  href={SRC}
                  x={0}
                  y={0}
                  width={gridCols}
                  height={gridRows}
                  preserveAspectRatio="xMidYMid slice"
                  clipPath={`url(#clip-${p.id})`}
                />
                <path
                  d={piecePath(p.tabs)}
                  transform={`translate(${p.col} ${p.row})`}
                  fill="none"
                  stroke="rgba(232,194,122,0.75)"
                  strokeWidth="0.03"
                />
              </svg>
            </div>
          );
        })}

        {correct && done && (
          <div className="absolute inset-x-0 bottom-0 z-30 bg-gradient-to-t from-background via-background/90 to-transparent px-3 pb-3 pt-10">
            {NOITE_CARTAS.map((c) => (
              <p key={c.id} className="text-[11px] leading-snug text-fog">
                <span className="text-primary">{c.hora}</span> {c.txt}
              </p>
            ))}
          </div>
        )}
      </div>

      <p className="text-center text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
        {placed} de {mao.length} no lugar
      </p>

      <Button
        className="w-full"
        size="lg"
        disabled={placed < mao.length}
        onClick={() => {
          setTried(true);
          if (correct) setDone(true);
        }}
      >
        Encostar a carta
      </Button>
      {tried && !correct && (
        <p className="text-center font-serif text-lg italic text-destructive">
          O recorte não fecha. Vira a peça no lugar certo.
        </p>
      )}
      {done && correct && (
        <p className="text-center font-serif text-lg italic text-primary">
          A imagem atravessou a fresta.
        </p>
      )}
    </div>
  );
}

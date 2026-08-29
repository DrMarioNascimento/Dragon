import { KIND_LABEL, type Tile } from "@/lib/game/case";
import { cn } from "@/lib/utils";

export function TileCard({
  tile,
  selected,
  dim,
  onClick,
  badge,
}: {
  tile: Tile;
  selected?: boolean;
  dim?: boolean;
  onClick?: () => void;
  badge?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative w-[148px] shrink-0 overflow-hidden rounded-md border bg-raised text-left shadow-[0_12px_40px_rgba(0,0,0,0.45)] transition-transform duration-200",
        selected ? "border-brass scale-[1.02]" : "border-border",
        dim && "opacity-40",
      )}
    >
      <div className="relative aspect-[2/3] overflow-hidden">
        <img
          src={`/tiles/${tile.id}.jpg`}
          alt={tile.title}
          className="h-full w-full object-cover"
          draggable={false}
        />
        <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-brass/40" />
      </div>
      <div className="space-y-1 border-t border-border px-2.5 py-2">
        <p className="text-[10px] uppercase tracking-[0.18em] text-brass">
          {badge ?? KIND_LABEL[tile.kind]}
        </p>
        <p className="font-display text-sm leading-tight text-fg">{tile.title}</p>
      </div>
    </button>
  );
}

import { KIND_LABEL, CLUE_BY_ID, ROOMS } from "@/lib/mosaico/case";
import type { Clue, ClueKind } from "@/lib/mosaico/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const KIND_CLASS: Record<ClueKind, string> = {
  pilar: "border-accent/50 text-accent",
  conector: "border-cold/50 text-cold",
  contexto: "border-fog/40 text-fog",
  ambiguidade: "border-muted-foreground/40 text-muted-foreground",
  boato: "border-destructive/60 text-destructive",
};

export function KindSeal({ kind }: { kind: ClueKind }) {
  return (
    <Badge className={cn("border", KIND_CLASS[kind])}>{KIND_LABEL[kind]}</Badge>
  );
}

export function ClueCard({
  clue,
  selected,
  dimmed,
  onSelect,
  verified,
}: {
  clue: Clue;
  selected?: boolean;
  dimmed?: boolean;
  onSelect?: () => void;
  verified?: boolean | null;
}) {
  const room = ROOMS.find((r) => r.id === clue.room)?.label;
  const Comp = onSelect ? "button" : "article";
  return (
    <Comp
      type={onSelect ? "button" : undefined}
      onClick={onSelect}
      className={cn(
        "w-full rounded-xl border p-4 text-left transition-[border-color,background-color] duration-150",
        selected ? "border-accent bg-accent/10" : "border-border bg-card",
        dimmed && "opacity-50",
      )}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <KindSeal kind={clue.kind} />
        <span className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          {room}
        </span>
      </div>
      <h3 className="font-serif text-xl leading-snug text-foreground">{clue.title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-fog">{clue.body}</p>
      {verified != null && (
        <p className="mt-2 text-xs uppercase tracking-[0.14em] text-accent">
          {verified ? "Confirmado pela casa" : "Não se sustenta"}
        </p>
      )}
    </Comp>
  );
}

export function cluesFrom(ids: string[]): Clue[] {
  return ids.map((id) => CLUE_BY_ID[id]).filter(Boolean);
}

export function Choice({
  selected,
  label,
  hint,
  onClick,
  disabled,
}: {
  selected?: boolean;
  label: string;
  hint?: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "w-full rounded-lg border px-4 py-3 text-left transition-[border-color,background-color] duration-150",
        selected ? "border-accent bg-accent/10" : "border-border bg-card hover:border-fog/40",
      )}
    >
      <div className="text-sm font-medium text-foreground">{label}</div>
      {hint && <div className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{hint}</div>}
    </button>
  );
}

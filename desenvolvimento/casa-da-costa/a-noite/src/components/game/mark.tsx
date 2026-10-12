import { cn } from "@/lib/utils";

export function MosaicMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="32"
      height="32"
      className={cn("size-8 shrink-0", className)}
      aria-hidden
    >
      <rect x="1" y="1" width="10" height="10" rx="1.2" fill="currentColor" opacity="0.95" />
      <rect x="13" y="1" width="10" height="7" rx="1.2" fill="currentColor" opacity="0.5" />
      <rect x="1" y="13" width="7" height="10" rx="1.2" fill="currentColor" opacity="0.38" />
      <rect x="10" y="10" width="13" height="13" rx="1.2" fill="currentColor" opacity="0.72" />
    </svg>
  );
}

import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "brass" | "quiet";
};

export function Button({ className, variant = "primary", ...props }: Props) {
  return (
    <button
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium tracking-wide transition-opacity duration-150 disabled:cursor-not-allowed disabled:opacity-40",
        variant === "primary" && "bg-fg text-bg hover:opacity-90",
        variant === "brass" && "bg-brass text-bg hover:opacity-90",
        variant === "ghost" && "border border-border bg-transparent text-fg hover:bg-raised",
        variant === "quiet" && "text-muted hover:text-fg",
        className,
      )}
      {...props}
    />
  );
}

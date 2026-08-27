import { cva, type VariantProps } from "class-variance-authority";
import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-medium transition-[opacity,transform,background-color,border-color,box-shadow] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40 active:enabled:scale-[0.96]",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:opacity-90",
        outline:
          "border border-border bg-transparent text-foreground shadow-[var(--shadow-border)] hover:bg-muted",
        ghost: "text-fog hover:bg-muted hover:text-foreground",
        soft:
          "border border-accent/40 bg-accent/10 text-accent hover:bg-accent/18",
      },
      size: {
        default: "h-11 min-h-11 rounded-md px-5 text-sm",
        lg: "h-12 min-h-12 rounded-lg px-6 text-sm tracking-wide",
        sm: "h-9 min-h-9 rounded-sm px-3 text-xs",
        icon: "size-11 min-h-11 rounded-md",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  ),
);
Button.displayName = "Button";

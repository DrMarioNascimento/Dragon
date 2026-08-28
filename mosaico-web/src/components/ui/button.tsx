import { cva, type VariantProps } from "class-variance-authority";
import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-medium transition-[transform,box-shadow,background-color,opacity] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40",
  {
    variants: {
      variant: {
        default: "btn-depth",
        outline: "btn-depth-outline",
        ghost: "text-fog hover:bg-muted hover:text-foreground",
        soft: "btn-depth-soft",
      },
      size: {
        default: "h-12 min-h-12 rounded-md px-5 text-base",
        lg: "h-14 min-h-14 rounded-lg px-6 text-lg tracking-wide",
        sm: "h-11 min-h-11 rounded-sm px-3 text-base",
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

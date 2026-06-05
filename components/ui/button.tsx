"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 disabled:opacity-40 disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        default: "bg-zinc-200 text-zinc-950 hover:bg-white focus-visible:ring-zinc-300",
        primary: "bg-emerald-500 text-zinc-950 hover:bg-emerald-400 focus-visible:ring-emerald-400",
        danger: "bg-red-500 text-white hover:bg-red-400 focus-visible:ring-red-400",
        warning: "bg-amber-500 text-zinc-950 hover:bg-amber-400 focus-visible:ring-amber-400",
        outline: "border border-zinc-700 bg-transparent text-zinc-200 hover:bg-zinc-900 focus-visible:ring-zinc-500",
        ghost: "bg-transparent text-zinc-300 hover:bg-zinc-900 focus-visible:ring-zinc-500",
        secondary: "bg-zinc-800 text-zinc-100 hover:bg-zinc-700 focus-visible:ring-zinc-500",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-14 px-6 text-base",
        xl: "h-20 px-6 text-xl",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };

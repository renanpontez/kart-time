import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider",
  {
    variants: {
      variant: {
        default: "border-zinc-700 bg-zinc-900 text-zinc-300",
        ok: "border-emerald-700 bg-emerald-950 text-emerald-300",
        warn: "border-amber-700 bg-amber-950 text-amber-300",
        danger: "border-red-700 bg-red-950 text-red-300",
        outline: "border-zinc-600 text-zinc-300",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

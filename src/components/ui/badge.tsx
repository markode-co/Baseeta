import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-blue-100 text-blue-700",
        secondary: "bg-slate-100 text-slate-700",
        success: "bg-green-100 text-green-700",
        warning: "bg-amber-100 text-amber-700",
        danger: "bg-red-100 text-red-700",
        outline: "border border-slate-200 text-slate-700",
        pending: "bg-amber-100 text-amber-700",
        preparing: "bg-blue-100 text-blue-700",
        ready: "bg-green-100 text-green-700",
        completed: "bg-slate-100 text-slate-600",
        cancelled: "bg-red-100 text-red-700",
        available: "bg-green-100 text-green-700",
        occupied: "bg-red-100 text-red-700",
        reserved: "bg-amber-100 text-amber-700",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };

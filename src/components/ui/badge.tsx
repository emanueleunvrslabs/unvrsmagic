import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 backdrop-blur-[40px] saturate-[1.3] shadow-[inset_0_1px_0_0_hsla(0,0%,100%,0.2)]",
  {
    variants: {
      variant: {
        default: "border-white/20 bg-white/10 text-white hover:bg-white/15",
        secondary: "border-white/15 bg-white/5 text-white/80 hover:bg-white/10",
        destructive: "border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20",
        outline: "border-white/15 bg-transparent text-white/80 hover:bg-white/5",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };

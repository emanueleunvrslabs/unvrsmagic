import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 backdrop-blur-base",
  {
    variants: {
      variant: {
        default: "bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 hover:border-primary/30 shadow-l1 hover:shadow-l2",
        destructive: "bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20 hover:border-destructive/30 shadow-l1 hover:shadow-l2",
        outline: "border border-border/50 bg-background/30 hover:bg-background/50 hover:border-border shadow-l1",
        secondary: "bg-secondary/50 text-secondary-foreground border border-border/30 hover:bg-secondary/70 hover:border-border/50 shadow-l1",
        ghost: "bg-transparent hover:bg-muted/30 border border-transparent hover:border-border/20",
        link: "text-primary underline-offset-4 hover:underline bg-transparent border-transparent",
      },
      size: {
        default: "h-10 px-4 py-2 rounded-[18px]",
        sm: "h-9 px-3 rounded-[14px]",
        lg: "h-11 px-8 rounded-[22px]",
        icon: "h-10 w-10 rounded-[18px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };

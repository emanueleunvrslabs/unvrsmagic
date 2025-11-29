import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 backdrop-blur-[15px]",
  {
    variants: {
      variant: {
        default: "bg-white/5 text-primary border border-white/10 shadow-[inset_0_0_20px_rgba(255,255,255,0.1),inset_0_0_5px_rgba(255,255,255,0.15),0_5px_5px_rgba(0,0,0,0.164)] hover:bg-white/10",
        destructive: "bg-white/5 text-destructive border border-white/10 shadow-[inset_0_0_20px_rgba(255,255,255,0.1),inset_0_0_5px_rgba(255,255,255,0.15),0_5px_5px_rgba(0,0,0,0.164)] hover:bg-destructive/10",
        outline: "bg-white/5 border border-white/10 shadow-[inset_0_0_20px_rgba(255,255,255,0.1),inset_0_0_5px_rgba(255,255,255,0.15),0_5px_5px_rgba(0,0,0,0.164)] hover:bg-white/10",
        secondary: "bg-white/5 text-secondary-foreground border border-white/10 shadow-[inset_0_0_20px_rgba(255,255,255,0.1),inset_0_0_5px_rgba(255,255,255,0.15),0_5px_5px_rgba(0,0,0,0.164)] hover:bg-white/10",
        ghost: "bg-transparent hover:bg-white/5 border border-transparent hover:border-white/10",
        link: "text-primary underline-offset-4 hover:underline bg-transparent border-transparent",
      },
      size: {
        default: "h-10 px-4 py-2 rounded-2xl",
        sm: "h-9 px-3 rounded-2xl",
        lg: "h-11 px-8 rounded-2xl",
        icon: "h-10 w-10 rounded-2xl",
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

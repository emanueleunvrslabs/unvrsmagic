import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-xl px-4 py-2 text-base text-white ring-offset-background transition-all md:text-sm",
          "border border-white/15 bg-white/5 backdrop-blur-[40px] saturate-[1.3]",
          "shadow-[inset_0_1px_0_0_hsla(0,0%,100%,0.1),inset_0_-1px_0_0_hsla(0,0%,100%,0.05)]",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
          "placeholder:text-white/40",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/30 focus-visible:border-white/25",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };

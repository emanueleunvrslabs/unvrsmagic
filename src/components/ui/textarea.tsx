import * as React from "react";

import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-xl px-4 py-3 text-sm text-white ring-offset-background transition-all",
        "border border-white/15 bg-white/5 backdrop-blur-[40px] saturate-[1.3]",
        "shadow-[inset_0_1px_0_0_hsla(0,0%,100%,0.1),inset_0_-1px_0_0_hsla(0,0%,100%,0.05)]",
        "placeholder:text-white/40",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/30 focus-visible:border-white/25",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };

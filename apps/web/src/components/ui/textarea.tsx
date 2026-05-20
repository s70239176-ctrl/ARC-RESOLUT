import * as React from "react";
import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn("min-h-28 w-full resize-none rounded-lg border border-white/12 bg-[#071735] px-3 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-ring", className)}
    {...props}
  />
));
Textarea.displayName = "Textarea";

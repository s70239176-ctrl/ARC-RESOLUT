import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn("h-11 w-full rounded-lg border border-white/12 bg-[#071735] px-3 text-sm text-white outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-ring", className)}
    {...props}
  />
));
Input.displayName = "Input";

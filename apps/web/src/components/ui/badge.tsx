import { cn } from "@/lib/utils";

export function Badge({ className, children }: { className?: string; children: React.ReactNode }) {
  return <span className={cn("inline-flex items-center rounded-full border border-white/12 bg-white/8 px-2.5 py-1 text-xs font-medium text-white/82", className)}>{children}</span>;
}

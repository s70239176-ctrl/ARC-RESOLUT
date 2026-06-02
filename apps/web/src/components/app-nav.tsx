"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Home" },
  { href: "/cases", label: "Cases" },
  { href: "/join", label: "Join" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/contracts/new", label: "Create" },
  { href: "/docs", label: "Docs" },
  { href: "/wallet", label: "Wallet" },
  { href: "/agent", label: "Agents" }
] as const;

export function AppNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#061127]/78 shadow-[0_16px_60px_rgba(14,32,75,0.35)] backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="relative h-10 w-10 overflow-hidden rounded-xl border border-white/20 bg-white shadow-[0_12px_30px_rgba(0,89,255,0.25)]">
            <Image src="/brand/arc-resolut-logo.jpg" alt="Arc Resolut logo" fill sizes="40px" className="object-cover" priority />
          </div>
          <span className="font-display text-lg font-semibold text-white">Arc Resolut</span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/[0.07] hover:text-white",
                  active && "bg-white/[0.09] text-white"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <Button asChild size="sm" className="hidden md:inline-flex">
          <Link href="/contracts/new">New Contract</Link>
        </Button>
        <Button asChild size="sm" variant="outline" className="md:hidden">
          <Link href="/dashboard">
            <Menu className="h-4 w-4" />
            Menu
          </Link>
        </Button>
      </div>
    </header>
  );
}

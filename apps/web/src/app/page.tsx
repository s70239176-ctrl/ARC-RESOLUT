import Link from "next/link";
import { ArrowRight, Bot, CircleDollarSign, Gavel, ShieldCheck, Sparkles, WalletCards } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { logoDispute } from "@/lib/seed-data";
import { usd } from "@/lib/utils";
import { HomeWalletConnect } from "@/components/home-wallet-connect";
import type { LucideIcon } from "lucide-react";

const stats = [
  ["Escrow volume", "$2.8M test USDC"],
  ["Median verdict", "48 sec"],
  ["Agent actions", "128k"],
  ["Nanofees", "$0.000001"]
];

const featureRows: Array<[string, LucideIcon, string]> = [
  ["Agent Wallet Escrow", WalletCards, "Programmable Circle wallet holds USDC"],
  ["LLM Jury", Bot, "3-model consensus with confidence scoring"],
  ["Autonomous Payout", CircleDollarSign, "Gateway-powered nanopayment fees"]
];

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="mesh-line pointer-events-none absolute inset-0" />
      <section className="mx-auto flex min-h-[92vh] max-w-7xl flex-col px-4 py-5 sm:px-6 lg:px-8">
        <nav className="z-10 flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 backdrop-blur-xl">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Gavel className="h-5 w-5" />
            </div>
            <span className="font-display text-lg font-semibold">Circle Court</span>
          </Link>
          <div className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/contracts/new">Create</Link>
            <Link href="/wallet">Wallet</Link>
            <Link href="/agent">Agents</Link>
          </div>
          <Button asChild size="sm">
            <Link href="/dashboard">Enter Court</Link>
          </Button>
        </nav>

        <div className="z-10 grid flex-1 items-center gap-8 py-12 lg:grid-cols-[1.02fr_0.98fr]">
          <div className="max-w-3xl">
            <Badge className="mb-5 border-primary/30 bg-primary/10 text-blue-100">Arc Testnet - Circle Agent Stack - LLM Jury</Badge>
            <h1 className="font-display text-5xl font-semibold leading-[1.02] text-white sm:text-6xl lg:text-7xl">
              Autonomous escrow for humans and agents.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
              Create natural-language contracts, lock USDC in Circle Agent Wallets, resolve disputes with multi-model jury consensus, and release payouts through Circle Gateway nanopayments.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/contracts/new">
                  Create intelligent contract <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/disputes/logo-dispute-001">View live dispute</Link>
              </Button>
            </div>
            <HomeWalletConnect />
            <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {stats.map(([label, value]) => (
                <div key={label} className="rounded-xl border border-white/10 bg-white/[0.045] p-4">
                  <div className="text-sm text-muted-foreground">{label}</div>
                  <div className="mt-1 font-display text-lg font-semibold text-white">{value}</div>
                </div>
              ))}
            </div>
          </div>

          <Card className="relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-800 via-primary to-blue-200" />
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-xl">{logoDispute.title}</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">Verdict preview with evidence and autonomous payout rails.</p>
                </div>
                <Badge>{usd(logoDispute.amountUsdc)} escrow</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                {logoDispute.evidence.map((item) => (
                  <div key={item.name} className="rounded-xl border border-white/10 bg-black/20 p-2">
                    <img src={item.image} alt={item.name} className="aspect-square w-full rounded-lg object-cover" />
                  </div>
                ))}
              </div>
              <div className="mt-6 grid gap-3">
                {featureRows.map(([title, Icon, copy]) => (
                  <div key={String(title)} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.045] p-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/12 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">{title}</div>
                      <div className="text-xs text-muted-foreground">{copy}</div>
                    </div>
                    <Sparkles className="ml-auto h-4 w-4 animate-consensus-pulse text-primary" />
                  </div>
                ))}
              </div>
              <div className="mt-6 rounded-xl border border-primary/20 bg-primary/10 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                  <ShieldCheck className="h-4 w-4" /> Confidence {Math.round(logoDispute.verdict.confidence * 100)}%
                </div>
                <p className="mt-2 text-sm leading-6 text-white/78">{logoDispute.verdict.reasoning}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HomeWalletConnect } from "@/components/home-wallet-connect";
import { HomeVerdictHistory, HomeVerdictPanel } from "@/components/home-verdicts";
import { HomeStats } from "@/components/home-stats";

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="mesh-line pointer-events-none absolute inset-0" />
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl flex-col px-4 py-5 sm:px-6 lg:px-8">
        <div className="z-10 grid flex-1 items-center gap-8 py-12 lg:grid-cols-[1.02fr_0.98fr]">
          <div className="max-w-3xl">
            <Badge className="mb-5 border-primary/30 bg-primary/10 text-blue-100">Arc Resolut - Arc Testnet - LLM Jury</Badge>
            <h1 className="font-display text-5xl font-semibold leading-[1.02] text-white sm:text-6xl lg:text-7xl">
              Agent escrow resolved by consensus.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
              Create natural-language agreements, fund them with testnet USDC, let a multi-model jury produce one consensus verdict, then submit it on-chain so winners can claim real escrowed funds.
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
            <HomeStats />
          </div>

          <HomeVerdictPanel />
        </div>
      </section>
      <HomeVerdictHistory />
    </main>
  );
}

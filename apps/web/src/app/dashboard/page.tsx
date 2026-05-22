import Link from "next/link";
import { Bot, FileText, Scale, WalletCards } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ContractsList } from "@/components/contracts-list";

const items = [
  { label: "Active escrows", value: "18", icon: FileText },
  { label: "Jury confidence", value: "91.4%", icon: Scale },
  { label: "Agent wallet balance", value: "1,250 USDC", icon: WalletCards },
  { label: "Automations", value: "42", icon: Bot }
];

export default function DashboardPage() {
  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <Header />
      <div className="mt-8 grid gap-4 md:grid-cols-4">
        {items.map((item) => (
          <Card key={item.label}>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/12 text-primary">
                <item.icon className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">{item.label}</div>
                <div className="font-display text-2xl font-semibold text-white">{item.value}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.75fr]">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>My Contracts / Disputes</CardTitle>
              <Button asChild size="sm" variant="outline">
                <Link href="/contracts/new">New Contract</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ContractsList />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Payout Flow</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative overflow-hidden rounded-xl border border-white/10 bg-black/30 p-5">
              <div className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-primary/25 to-transparent animate-payout-flow" />
              <div className="relative space-y-4">
                {["Escrow funded", "Jury consensus", "Appeal window", "Gateway nanopayments"].map((step, index) => (
                  <div key={step} className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">{index + 1}</div>
                    <span className="text-sm text-white/86">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function Header() {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <Badge>Circle Court Ops</Badge>
        <h1 className="mt-3 font-display text-4xl font-semibold text-white">Dispute dashboard</h1>
      </div>
      <div className="flex gap-3">
        <Button asChild variant="outline"><Link href="/wallet">Wallet</Link></Button>
        <Button asChild><Link href="/agent">Command Center</Link></Button>
      </div>
    </header>
  );
}

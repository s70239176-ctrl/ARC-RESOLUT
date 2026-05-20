"use client";

import { useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ExternalLink, RefreshCw, WalletCards } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function WalletPage() {
  const [wallet, setWallet] = useState<Record<string, unknown> | null>(null);

  async function connectAgentWallet() {
    const response = await fetch("/api/wallets/connect", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ subjectId: "northstar-labs" })
    });
    setWallet(await response.json());
  }

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <Badge>Arc Testnet portfolio</Badge>
      <h1 className="mt-4 font-display text-4xl font-semibold text-white">Wallet / Portfolio</h1>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Human wallet</CardTitle>
          </CardHeader>
          <CardContent>
            <ConnectButton />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Circle Agent Wallet</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={connectAgentWallet}>
              <WalletCards className="h-4 w-4" /> Connect Wallet
            </Button>
            {wallet ? <pre className="overflow-auto rounded-xl bg-black/40 p-4 text-xs text-primary">{JSON.stringify(wallet, null, 2)}</pre> : null}
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild variant="outline">
                <a href={process.env.NEXT_PUBLIC_CIRCLE_FAUCET_URL ?? "https://faucet.circle.com"} target="_blank" rel="noreferrer">
                  Request Test USDC <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
              <Button variant="secondary">
                <RefreshCw className="h-4 w-4" /> Refresh balances
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

"use client";

import { useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ExternalLink, WalletCards } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function HomeWalletConnect() {
  const [wallet, setWallet] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);

  async function connectAgentWallet() {
    setLoading(true);
    const response = await fetch("/api/wallets/connect", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ subjectId: "landing-user" })
    });
    setWallet(await response.json());
    setLoading(false);
  }

  const walletPayload = wallet?.wallet;
  const address =
    walletPayload && typeof walletPayload === "object" && "address" in walletPayload
      ? String(walletPayload.address)
      : null;

  return (
    <Card className="mt-6 border-primary/20 bg-[#071735]/70">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <WalletCards className="h-4 w-4 text-primary" />
            Connect Wallet
          </CardTitle>
          <Badge className="border-blue-300/20 bg-blue-500/10 text-blue-100">Arc Testnet</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-white/10 bg-[#0a1d42] p-3">
          <ConnectButton />
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button onClick={connectAgentWallet} disabled={loading} variant="secondary">
            <WalletCards className="h-4 w-4" />
            {loading ? "Linking Agent Wallet..." : "Create / Link Agent Wallet"}
          </Button>
          <Button asChild variant="outline">
            <a href={process.env.NEXT_PUBLIC_CIRCLE_FAUCET_URL ?? "https://faucet.circle.com"} target="_blank" rel="noreferrer">
              Request Test USDC <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </div>
        {address ? (
          <div className="break-all rounded-lg border border-primary/20 bg-primary/10 p-3 text-xs text-blue-100">
            Agent Wallet: {address}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, ExternalLink, FileText, WalletCards } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usd } from "@/lib/utils";
import type { ContractSummary } from "@/lib/contracts/types";
import { readRecentContracts } from "@/components/contracts-list";
import { ResolveDisputeButton } from "@/components/resolve-dispute-button";
import { AgreementActions } from "@/components/agreement-actions";

type ContractDetailResponse = { contract?: ContractSummary; error?: string };

export function ContractDetailClient({ id }: { id: string }) {
  const [contract, setContract] = useState<ContractSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const response = await fetch(`/api/contracts/${id}`, { cache: "no-store" });
        const data = (await response.json()) as ContractDetailResponse;
        if (data.contract) {
          setContract(data.contract);
          return;
        }
      } catch {
        // Browser local fallback below.
      } finally {
        const localContract = readRecentContracts().find((item) => item.id === id);
        setContract((current) => current ?? localContract ?? null);
        setLoading(false);
      }
    }

    void load();
  }, [id]);

  if (loading) {
    return (
      <main className="mx-auto min-h-screen max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-xl border border-white/10 bg-white/[0.045] p-6 text-sm text-muted-foreground">Loading contract...</div>
      </main>
    );
  }

  if (!contract) {
    return (
      <main className="mx-auto min-h-screen max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle>Contract not found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">This contract was not found in the database or your browser’s recent funded contracts.</p>
            <Button asChild className="mt-4">
              <Link href="/dashboard">Back to dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  const explorer = process.env.NEXT_PUBLIC_ARC_EXPLORER ?? "https://testnet.arcscan.app";
  const isAddress = /^0x[a-fA-F0-9]{40}$/.test(contract.escrowWallet);

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <Button asChild variant="ghost" className="mb-6">
        <Link href="/dashboard">
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>
      </Button>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Badge>{contract.status}</Badge>
          <h1 className="mt-4 font-display text-4xl font-semibold text-white">{contract.title}</h1>
          <p className="mt-3 text-muted-foreground">{contract.claimant} vs {contract.respondent}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.045] p-4 text-right">
          <div className="text-sm text-muted-foreground">Escrow amount</div>
          <div className="font-display text-2xl font-semibold text-white">{usd(contract.amountUsdc)}</div>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Contract terms
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm leading-7 text-white/82">{contract.terms ?? "No terms were saved for this contract."}</p>
          </CardContent>
        </Card>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <WalletCards className="h-5 w-5 text-primary" />
                On-chain escrow
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Escrow contract</div>
                <div className="mt-2 break-all rounded-lg border border-white/10 bg-[#071735] p-3 text-sm text-blue-100">{contract.escrowWallet}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Terms hash</div>
                <div className="mt-2 break-all rounded-lg border border-white/10 bg-[#071735] p-3 text-xs text-blue-100">{contract.termsHash}</div>
              </div>
              {isAddress ? (
                <Button asChild variant="outline">
                  <a href={`${explorer}/address/${contract.escrowWallet}`} target="_blank" rel="noreferrer">
                    View on ArcScan <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              ) : null}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Agreement actions</CardTitle>
              <p className="text-sm text-muted-foreground">Accept, propose or confirm outcomes, raise disputes, submit evidence, and claim funds after resolution.</p>
            </CardHeader>
            <CardContent>
              <AgreementActions agreementAddress={contract.escrowWallet} agentA={contract.claimant} agentB={contract.respondent} amountUsdc={contract.amountUsdc} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>AI jury bridge</CardTitle>
              <p className="text-sm text-muted-foreground">Run the LLM jury on this contract’s terms, amount, participants, and evidence. The jury returns consensus, confidence, validator votes, and payout intents.</p>
            </CardHeader>
            <CardContent>
              <ResolveDisputeButton
                disputeId={contract.id}
                contract={{
                  title: contract.title,
                  terms: contract.terms ?? "",
                  amountUsdc: contract.amountUsdc,
                  claimant: contract.claimant,
                  respondent: contract.respondent,
                  escrowWallet: contract.escrowWallet,
                  termsHash: contract.termsHash
                }}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}

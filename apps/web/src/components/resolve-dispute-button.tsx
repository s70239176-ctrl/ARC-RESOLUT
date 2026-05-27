"use client";

import { useState } from "react";
import { Gavel, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VerdictCard } from "@/components/verdict-card";
import { saveConcludedVerdict, type ConcludedVerdict } from "@/lib/verdicts";

type ContractDisputeContext = {
  title: string;
  terms: string;
  amountUsdc: string;
  claimant: string;
  respondent: string;
  escrowWallet: string;
  termsHash: string;
};

export function ResolveDisputeButton({ disputeId, contract }: { disputeId: string; contract?: ContractDisputeContext }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ConcludedVerdict | null>(null);

  async function resolve() {
    setLoading(true);
    const response = await fetch(`/api/disputes/${disputeId}/resolve`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ actor: "dashboard-operator", contract })
    });
    const data = await response.json();
    if (data.verdict) {
      const concluded: ConcludedVerdict = {
        disputeId,
        contractTitle: contract?.title ?? disputeId,
        amountUsdc: contract?.amountUsdc ?? "0",
        verdictId: data.verdict.verdictId,
        decision: data.verdict.decision,
        confidence: data.verdict.confidence,
        reasoning: data.verdict.reasoning,
        appealWindowHours: data.verdict.appealWindowHours,
        juryModels: data.verdict.juryModels ?? [],
        payouts: data.verdict.payouts ?? [],
        createdAt: new Date().toISOString()
      };
      saveConcludedVerdict(concluded);
      setResult(concluded);
    }
    setLoading(false);
  }

  return (
    <div className="space-y-3">
      <Button onClick={resolve} disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Gavel className="h-4 w-4" />}
        {loading ? "Jury active..." : "Resolve dispute"}
      </Button>
      {result ? <VerdictCard verdict={result} /> : null}
    </div>
  );
}

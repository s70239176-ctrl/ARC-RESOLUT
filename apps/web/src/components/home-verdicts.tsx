"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bot, CircleDollarSign, ShieldCheck, Sparkles, WalletCards } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { VerdictCard } from "@/components/verdict-card";
import { readConcludedVerdicts, type ConcludedVerdict } from "@/lib/verdicts";
import { logoDispute } from "@/lib/seed-data";
import { usd } from "@/lib/utils";

const seedVerdict: ConcludedVerdict = {
  disputeId: logoDispute.id,
  contractTitle: logoDispute.title,
  amountUsdc: logoDispute.amountUsdc,
  verdictId: "seed-verdict-logo-dispute",
  decision: logoDispute.verdict.decision,
  confidence: logoDispute.verdict.confidence,
  reasoning: logoDispute.verdict.reasoning,
  appealWindowHours: 24,
  juryModels: logoDispute.validators.map((validator) => validator.model),
  validatorVotes: logoDispute.validators.map((validator) => ({
    model: validator.model,
    decision: validator.vote,
    confidence: validator.confidence,
    rationale: validator.rationale,
    feeUsdc: validator.fee
  })),
  evidence: logoDispute.evidence.map((item) => ({
    name: item.name,
    image: item.image,
    caption: item.caption,
    type: item.type
  })),
  payouts: logoDispute.verdict.payout.map((payout) => ({
    to: payout.recipient,
    amountUsdc: payout.amount,
    memo: "seed-payout"
  })),
  createdAt: new Date(0).toISOString()
};

const featureRows = [
  ["Agent Wallet Escrow", WalletCards, "Programmable Circle wallet holds USDC"],
  ["LLM Jury", Bot, "Unified consensus with confidence scoring"],
  ["Autonomous Payout", CircleDollarSign, "Claimable outcome after verdict"]
] as const;

export function HomeVerdictPanel() {
  const [verdicts, setVerdicts] = useState<ConcludedVerdict[]>([]);

  useEffect(() => {
    setVerdicts(readConcludedVerdicts());
  }, []);

  const latest = verdicts[0];

  if (latest) {
    return <VerdictCard verdict={latest} />;
  }

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-800 via-primary to-blue-200" />
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle className="text-xl">{logoDispute.title}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">Example verdict preview. Your concluded verdicts replace this panel automatically.</p>
          </div>
          <Badge>{usd(logoDispute.amountUsdc)} escrow</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3">
          {logoDispute.evidence.map((item) => (
            <div key={item.name} className="group overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-blue-950 via-slate-950 to-cyan-950 p-2">
              <div className="relative aspect-square overflow-hidden rounded-lg bg-black/30">
                <img src={item.image} alt={item.name} className="h-full w-full object-cover opacity-95 transition duration-300 group-hover:scale-105" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                  <div className="truncate text-xs font-semibold text-white">{item.name}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 grid gap-3">
          {featureRows.map(([title, Icon, copy]) => (
            <div key={title} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.045] p-3">
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
  );
}

export function HomeVerdictHistory() {
  const [verdicts, setVerdicts] = useState<ConcludedVerdict[]>([]);

  useEffect(() => {
    setVerdicts(readConcludedVerdicts());
  }, []);

  const items = verdicts.length > 0 ? verdicts : [seedVerdict];

  return (
    <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Badge>Concluded disputes</Badge>
          <h2 className="mt-3 font-display text-3xl font-semibold text-white">Recent consensus verdicts</h2>
        </div>
        <Link href="/cases" className="text-sm font-medium text-blue-100 hover:text-white">
          View all cases
        </Link>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {items.map((verdict) => (
          <VerdictCard key={verdict.verdictId} verdict={verdict} compact />
        ))}
      </div>
    </section>
  );
}

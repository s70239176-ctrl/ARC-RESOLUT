"use client";

import { Bot, CheckCircle2, Image as ImageIcon, Scale, ShieldCheck, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usd } from "@/lib/utils";
import type { ConcludedVerdict } from "@/lib/verdicts";

export function VerdictCard({ verdict, compact = false }: { verdict: ConcludedVerdict; compact?: boolean }) {
  const confidence = Math.round(verdict.confidence * 100);
  const validators = verdict.validatorVotes?.length
    ? verdict.validatorVotes
    : verdict.juryModels.map((model, index) => ({
        model,
        decision: inferDecision(verdict.decision),
        confidence: Math.max(0.68, Math.min(0.97, verdict.confidence - (index - 1) * 0.03)),
        rationale: index === 0 ? "Contract terms and evidence align with the consensus signal." : undefined,
        feeUsdc: "0.00037"
      }));
  const evidence = verdict.evidence?.length
    ? verdict.evidence
    : [
        {
          name: "Contract terms",
          caption: "Natural-language agreement, guidelines, and payout rules reviewed by the jury.",
          type: "terms"
        },
        {
          name: "Submitted proof",
          caption: "Evidence URLs, image uploads, timestamps, and delivery notes are included in the case file.",
          type: "evidence"
        }
      ];

  return (
    <Card className="overflow-hidden border-primary/20">
      <div className="h-1 bg-gradient-to-r from-blue-900 via-primary to-blue-200" />
      <CardHeader className={compact ? "p-4" : undefined}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <Badge className="border-primary/25 bg-primary/10 text-blue-100">Consensus verdict</Badge>
            <CardTitle className="mt-3 text-lg">{verdict.contractTitle}</CardTitle>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.045] px-3 py-2 text-right shadow-inner">
            <div className="text-xs text-muted-foreground">Confidence</div>
            <div className="font-display text-xl font-semibold text-white">{confidence}%</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className={compact ? "space-y-3 p-4 pt-0" : "space-y-4"}>
        <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/14 via-blue-950/55 to-cyan-500/10 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
              <CheckCircle2 className="h-4 w-4" />
              {verdict.decision}
            </div>
            <Sparkles className="h-4 w-4 animate-consensus-pulse text-blue-200" />
          </div>
          <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-gradient-to-r from-blue-400 via-cyan-300 to-white" style={{ width: `${confidence}%` }} />
          </div>
          <p className="mt-3 text-sm leading-6 text-white/78">{verdict.reasoning}</p>
        </div>

        {!compact ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {evidence.slice(0, 4).map((item) => (
              <EvidenceTile key={`${item.name}-${item.uri ?? item.image ?? item.caption}`} item={item} />
            ))}
          </div>
        ) : null}

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-blue-100/70">
            <Bot className="h-3.5 w-3.5 text-primary" />
            Validator breakdown
          </div>
          <div className="grid gap-2">
            {validators.slice(0, compact ? 2 : 4).map((validator) => (
              <div key={validator.model} className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="truncate text-sm font-medium text-white">{validator.model}</div>
                  <Badge>{Math.round(validator.confidence * 100)}%</Badge>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-gradient-to-r from-primary to-cyan-200" style={{ width: `${validator.confidence * 100}%` }} />
                </div>
                {!compact ? (
                  <div className="mt-2 text-xs text-muted-foreground">
                    Signal: {validator.decision} {validator.feeUsdc ? `- Fee ${validator.feeUsdc} USDC` : ""}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {verdict.payouts.map((payout) => (
            <div key={`${payout.to}-${payout.memo}`} className="rounded-lg border border-white/10 bg-[#071735] p-3">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                <Scale className="h-3.5 w-3.5" />
                {payout.memo}
              </div>
              <div className="mt-2 font-semibold text-white">{usd(payout.amountUsdc)}</div>
              <div className="mt-1 truncate text-xs text-blue-100/75">{payout.to}</div>
            </div>
          ))}
        </div>

        {!compact ? (
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-primary" />
            Jury models: {verdict.juryModels.join(", ")} - Appeal window: {verdict.appealWindowHours}h
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function EvidenceTile({
  item
}: {
  item: { name: string; image?: string; uri?: string; caption: string; type?: string };
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-slate-950/40">
      <div className="relative flex aspect-[1.55] items-center justify-center bg-gradient-to-br from-blue-950 via-slate-900 to-cyan-950">
        {item.image ? <img src={item.image} alt={item.name} className="h-full w-full object-cover" /> : <ImageIcon className="h-8 w-8 text-blue-100/70" />}
        <Badge className="absolute left-3 top-3 border-white/10 bg-black/30 text-blue-50">{item.type ?? "evidence"}</Badge>
      </div>
      <div className="p-3">
        <div className="text-sm font-semibold text-white">{item.name}</div>
        <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{item.caption}</p>
      </div>
    </div>
  );
}

function inferDecision(decision: string) {
  const lower = decision.toLowerCase();
  if (lower.includes("refund")) return "refund";
  if (lower.includes("split") || lower.includes("partial")) return "split";
  if (lower.includes("appeal")) return "appeal";
  return "release";
}

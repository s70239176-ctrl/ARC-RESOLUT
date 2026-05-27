"use client";

import { CheckCircle2, Scale, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usd } from "@/lib/utils";
import type { ConcludedVerdict } from "@/lib/verdicts";

export function VerdictCard({ verdict, compact = false }: { verdict: ConcludedVerdict; compact?: boolean }) {
  return (
    <Card className="overflow-hidden border-primary/20">
      <div className="h-1 bg-gradient-to-r from-blue-900 via-primary to-blue-200" />
      <CardHeader className={compact ? "p-4" : undefined}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <Badge className="border-primary/25 bg-primary/10 text-blue-100">Consensus verdict</Badge>
            <CardTitle className="mt-3 text-lg">{verdict.contractTitle}</CardTitle>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.045] px-3 py-2 text-right">
            <div className="text-xs text-muted-foreground">Confidence</div>
            <div className="font-display text-xl font-semibold text-white">{Math.round(verdict.confidence * 100)}%</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className={compact ? "space-y-3 p-4 pt-0" : "space-y-4"}>
        <div className="rounded-xl border border-primary/20 bg-primary/10 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-primary">
            <CheckCircle2 className="h-4 w-4" />
            {verdict.decision}
          </div>
          <p className="mt-2 text-sm leading-6 text-white/78">{verdict.reasoning}</p>
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
            Jury models: {verdict.juryModels.join(", ")} • Appeal window: {verdict.appealWindowHours}h
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

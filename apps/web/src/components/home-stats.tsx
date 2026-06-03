"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, BadgeCheck, CircleDollarSign, Scale } from "lucide-react";
import { readRecentContracts } from "@/components/contracts-list";
import { readConcludedVerdicts, type ConcludedVerdict } from "@/lib/verdicts";
import { logoDispute } from "@/lib/seed-data";
import { usd } from "@/lib/utils";

export function HomeStats() {
  const [verdicts, setVerdicts] = useState<ConcludedVerdict[]>([]);
  const [contracts, setContracts] = useState<ReturnType<typeof readRecentContracts>>([]);

  useEffect(() => {
    setVerdicts(readConcludedVerdicts());
    setContracts(readRecentContracts());
  }, []);

  const stats = useMemo(() => {
    const localEscrow = contracts.reduce((sum, contract) => sum + Number(contract.amountUsdc || 0), Number(logoDispute.amountUsdc));
    const confidenceSource = verdicts.length ? verdicts : [{ confidence: logoDispute.verdict.confidence }];
    const avgConfidence =
      confidenceSource.reduce((sum, verdict) => sum + verdict.confidence, 0) / Math.max(1, confidenceSource.length);
    const claimable = verdicts.reduce((sum, verdict) => sum + verdict.payouts.length, logoDispute.verdict.payout.length);

    return [
      { label: "Tracked escrow", value: usd(localEscrow.toFixed(2)), icon: CircleDollarSign },
      { label: "Agreements", value: String(Math.max(contracts.length, 1)), icon: Scale },
      { label: "Avg confidence", value: `${Math.round(avgConfidence * 100)}%`, icon: BadgeCheck },
      { label: "Claim paths", value: String(claimable), icon: Activity }
    ];
  }, [contracts, verdicts]);

  return (
    <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map(({ label, value, icon: Icon }) => (
        <div key={label} className="rounded-xl border border-white/10 bg-white/[0.045] p-4 shadow-[0_18px_45px_rgba(0,0,0,0.18)]">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm text-muted-foreground">{label}</div>
            <Icon className="h-4 w-4 text-primary" />
          </div>
          <div className="mt-2 font-display text-lg font-semibold text-white">{value}</div>
        </div>
      ))}
    </div>
  );
}

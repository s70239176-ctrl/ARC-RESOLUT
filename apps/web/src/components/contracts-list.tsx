"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usd } from "@/lib/utils";
import type { ContractSummary } from "@/lib/contracts/types";

const localKey = "circle-court:recent-contracts";

export function saveRecentContract(contract: ContractSummary) {
  if (typeof window === "undefined") return;
  const current = readRecentContracts();
  const next = [contract, ...current.filter((item) => item.id !== contract.id)].slice(0, 20);
  window.localStorage.setItem(localKey, JSON.stringify(next));
}

export function readRecentContracts(): ContractSummary[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(localKey) ?? "[]") as ContractSummary[];
  } catch {
    return [];
  }
}

export function ContractsList() {
  const [contracts, setContracts] = useState<ContractSummary[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const localContracts = readRecentContracts();
    try {
      const response = await fetch("/api/contracts", { cache: "no-store" });
      const data = (await response.json()) as { contracts?: ContractSummary[] };
      const remoteContracts = data.contracts ?? [];
      const merged = [...localContracts, ...remoteContracts].filter(
        (contract, index, all) => all.findIndex((item) => item.id === contract.id) === index
      );
      setContracts(merged);
    } catch {
      setContracts(localContracts);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const empty = useMemo(() => !loading && contracts.length === 0, [contracts.length, loading]);

  if (empty) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.045] p-5">
        <div className="font-semibold text-white">No contracts yet</div>
        <p className="mt-2 text-sm text-muted-foreground">Create and fund your first escrow, then it will appear here automatically.</p>
        <Button asChild className="mt-4" size="sm">
          <Link href="/contracts/new">Create Contract</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button onClick={load} size="sm" variant="outline" disabled={loading}>
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>
      {contracts.map((item) => (
        <Link
          key={item.id}
          href={`/contracts/${item.id}`}
          className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.045] p-4 transition hover:bg-white/[0.075]"
        >
          <div className="min-w-0">
            <div className="truncate font-semibold text-white">{item.title}</div>
            <div className="mt-1 truncate text-sm text-muted-foreground">
              {item.claimant} vs {item.respondent}
            </div>
            <div className="mt-2 text-xs text-blue-100/75">{item.escrowWallet}</div>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <div className="hidden text-right sm:block">
              <div className="font-semibold text-white">{usd(item.amountUsdc)}</div>
              <Badge>{item.status}</Badge>
            </div>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </Link>
      ))}
    </div>
  );
}

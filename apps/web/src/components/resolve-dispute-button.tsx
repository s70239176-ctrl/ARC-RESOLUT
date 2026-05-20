"use client";

import { useState } from "react";
import { Gavel, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ResolveDisputeButton({ disputeId }: { disputeId: string }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);

  async function resolve() {
    setLoading(true);
    const response = await fetch(`/api/disputes/${disputeId}/resolve`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ actor: "dashboard-operator" })
    });
    setResult(await response.json());
    setLoading(false);
  }

  return (
    <div className="space-y-3">
      <Button onClick={resolve} disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Gavel className="h-4 w-4" />}
        {loading ? "Resolving..." : "Resolve dispute"}
      </Button>
      {result ? (
        <pre className="max-h-64 overflow-auto rounded-xl border border-white/10 bg-black/50 p-4 text-xs text-primary">
          {JSON.stringify(result, null, 2)}
        </pre>
      ) : null}
    </div>
  );
}

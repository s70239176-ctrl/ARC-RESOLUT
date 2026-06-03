"use client";

import { useState } from "react";
import { Gavel, Loader2, ShieldCheck } from "lucide-react";
import { isAddress, keccak256, parseUnits, stringToHex } from "viem";
import { useAccount, useSwitchChain, useWriteContract } from "wagmi";
import { Button } from "@/components/ui/button";
import { VerdictCard } from "@/components/verdict-card";
import { agreementAbi } from "@/lib/contracts/abis";
import { saveConcludedVerdict, type ConcludedVerdict } from "@/lib/verdicts";
import { arcTestnet } from "@/components/providers";

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
  const { address, chainId } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  const [loading, setLoading] = useState(false);
  const [submittingVerdict, setSubmittingVerdict] = useState(false);
  const [bridgeStatus, setBridgeStatus] = useState("");
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
        validatorVotes: data.verdict.validatorVotes ?? [],
        evidence: Array.isArray(data.evidence) ? data.evidence : [],
        payouts: data.verdict.payouts ?? [],
        createdAt: new Date().toISOString()
      };
      saveConcludedVerdict(concluded);
      setResult(concluded);
    }
    setLoading(false);
  }

  async function submitVerdictOnChain() {
    if (!contract || !result) return;
    try {
      if (!address) throw new Error("Connect the jury bridge wallet first.");
      if (!isAddress(contract.escrowWallet)) throw new Error("Agreement address is missing or invalid.");
      if (!isAddress(contract.claimant) || !isAddress(contract.respondent)) throw new Error("Agreement parties must be wallet addresses.");
      setSubmittingVerdict(true);
      setBridgeStatus("Preparing on-chain jury verdict...");
      if (chainId !== arcTestnet.id) {
        await switchChainAsync({ chainId: arcTestnet.id });
      }

      const payouts = calculatePayouts(result, contract);
      const winner =
        payouts.agentAAmount > payouts.agentBAmount
          ? (contract.claimant as `0x${string}`)
          : payouts.agentBAmount > payouts.agentAAmount
            ? (contract.respondent as `0x${string}`)
            : "0x0000000000000000000000000000000000000000";
      const verdictHash = keccak256(stringToHex(`${result.verdictId}:${result.decision}:${result.reasoning}`));

      const hash = await writeContractAsync({
        address: contract.escrowWallet as `0x${string}`,
        abi: agreementAbi,
        functionName: "submitJuryVerdict",
        args: [verdictHash, winner, payouts.agentAAmount, payouts.agentBAmount, result.verdictId],
        chainId: arcTestnet.id
      });
      setBridgeStatus(`Verdict submitted on-chain: ${hash}. Winner can now claim funds.`);
    } catch (error) {
      setBridgeStatus(error instanceof Error ? error.message : "Could not submit verdict on-chain.");
    } finally {
      setSubmittingVerdict(false);
    }
  }

  return (
    <div className="space-y-3">
      <Button onClick={resolve} disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Gavel className="h-4 w-4" />}
        {loading ? "Jury active..." : "Resolve dispute"}
      </Button>
      {result ? (
        <div className="space-y-3">
          <VerdictCard verdict={result} />
          <div className="rounded-xl border border-blue-300/15 bg-blue-950/45 p-4">
            <div className="text-sm font-semibold text-white">On-chain release</div>
            <p className="mt-1 text-sm text-blue-100/75">
              Submit this consensus verdict to the agreement contract. After the transaction lands, the winning party uses Claim funds to withdraw escrowed testnet USDC.
            </p>
            <Button className="mt-3" onClick={submitVerdictOnChain} disabled={submittingVerdict || !contract}>
              {submittingVerdict ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              {submittingVerdict ? "Submitting verdict..." : "Submit verdict on-chain"}
            </Button>
            {bridgeStatus ? <p className="mt-3 break-words text-sm text-blue-100/80">{bridgeStatus}</p> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function calculatePayouts(verdict: ConcludedVerdict, contract: ContractDisputeContext) {
  let agentAAmount = 0n;
  let agentBAmount = 0n;

  for (const payout of verdict.payouts) {
    const to = payout.to.toLowerCase();
    if (to.includes("claimant") || to === contract.claimant.toLowerCase()) {
      agentAAmount += parseUnits(payout.amountUsdc, 6);
    }
    if (to.includes("respondent") || to === contract.respondent.toLowerCase()) {
      agentBAmount += parseUnits(payout.amountUsdc, 6);
    }
  }

  if (agentAAmount === 0n && agentBAmount === 0n) {
    const decision = verdict.decision.toLowerCase();
    const total = parseUnits(contract.amountUsdc, 6);
    if (decision.includes("refund")) {
      agentAAmount = total;
    } else if (decision.includes("split")) {
      agentAAmount = total / 2n;
      agentBAmount = total - agentAAmount;
    } else {
      agentBAmount = total;
    }
  }

  return { agentAAmount, agentBAmount };
}

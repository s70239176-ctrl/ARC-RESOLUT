"use client";

import { useState } from "react";
import { CheckCircle2, FileUp, Gavel, HandCoins, Scale } from "lucide-react";
import { isAddress, keccak256, parseUnits, stringToHex } from "viem";
import { useAccount, useSwitchChain, useWriteContract } from "wagmi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { agreementAbi } from "@/lib/contracts/abis";
import { arcTestnet } from "@/components/providers";

type AgreementActionsProps = {
  agreementAddress: string;
  agentA: string;
  agentB: string;
  amountUsdc: string;
};

export function AgreementActions({ agreementAddress, agentA, agentB, amountUsdc }: AgreementActionsProps) {
  const { address, chainId } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  const [status, setStatus] = useState("Ready.");
  const [proposal, setProposal] = useState({
    winner: agentB,
    agentAAmount: "0",
    agentBAmount: amountUsdc,
    uri: ""
  });
  const [confirmProposer, setConfirmProposer] = useState(agentA);
  const [disputeUri, setDisputeUri] = useState("");
  const [evidenceUri, setEvidenceUri] = useState("");

  const canTransact = isAddress(agreementAddress);

  async function ensureArc() {
    if (chainId !== arcTestnet.id) {
      await switchChainAsync({ chainId: arcTestnet.id });
    }
  }

  async function run(label: string, action: () => Promise<`0x${string}`>) {
    try {
      if (!address) throw new Error("Connect your wallet first.");
      if (!canTransact) throw new Error("Agreement address is not a valid contract address.");
      setStatus(`${label}...`);
      await ensureArc();
      const hash = await action();
      setStatus(`${label} submitted: ${hash}`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Transaction failed.");
    }
  }

  const agreement = agreementAddress as `0x${string}`;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-blue-300/15 bg-[#071735] p-4 text-sm text-blue-100">{status}</div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Button
          variant="secondary"
          onClick={() =>
            run("Accepting agreement", () =>
              writeContractAsync({ address: agreement, abi: agreementAbi, functionName: "acceptAgreement", chainId: arcTestnet.id })
            )
          }
        >
          <CheckCircle2 className="h-4 w-4" />
          Agent B accept
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            run("Claiming funds", () =>
              writeContractAsync({ address: agreement, abi: agreementAbi, functionName: "claimFunds", chainId: arcTestnet.id })
            )
          }
        >
          <HandCoins className="h-4 w-4" />
          Claim funds
        </Button>
      </div>

      <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.045] p-4">
        <div className="font-semibold text-white">Propose outcome</div>
        <Input value={proposal.winner} onChange={(event) => setProposal({ ...proposal, winner: event.target.value })} placeholder="Winner address or 0x000..." />
        <div className="grid gap-3 sm:grid-cols-2">
          <Input value={proposal.agentAAmount} onChange={(event) => setProposal({ ...proposal, agentAAmount: event.target.value })} placeholder="Agent A USDC" />
          <Input value={proposal.agentBAmount} onChange={(event) => setProposal({ ...proposal, agentBAmount: event.target.value })} placeholder="Agent B USDC" />
        </div>
        <Input value={proposal.uri} onChange={(event) => setProposal({ ...proposal, uri: event.target.value })} placeholder="Outcome URI, JSON URL, or note" />
        <Button
          onClick={() =>
            run("Proposing outcome", () => {
              const outcomeHash = keccak256(
                stringToHex(`${proposal.winner}:${proposal.agentAAmount}:${proposal.agentBAmount}:${proposal.uri}`)
              );
              return writeContractAsync({
                address: agreement,
                abi: agreementAbi,
                functionName: "proposeOutcome",
                args: [
                  outcomeHash,
                  proposal.winner as `0x${string}`,
                  parseUnits(proposal.agentAAmount, 6),
                  parseUnits(proposal.agentBAmount, 6),
                  proposal.uri || "inline://outcome"
                ],
                chainId: arcTestnet.id
              });
            })
          }
        >
          <Scale className="h-4 w-4" />
          Propose
        </Button>
      </div>

      <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.045] p-4">
        <div className="font-semibold text-white">Confirm matching outcome</div>
        <Input value={confirmProposer} onChange={(event) => setConfirmProposer(event.target.value)} placeholder="Proposer address" />
        <Button
          variant="secondary"
          onClick={() =>
            run("Confirming outcome", () =>
              writeContractAsync({
                address: agreement,
                abi: agreementAbi,
                functionName: "confirmOutcome",
                args: [confirmProposer as `0x${string}`],
                chainId: arcTestnet.id
              })
            )
          }
        >
          Confirm
        </Button>
      </div>

      <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.045] p-4">
        <div className="font-semibold text-white">Dispute and evidence</div>
        <Textarea value={disputeUri} onChange={(event) => setDisputeUri(event.target.value)} placeholder="Dispute reason URI or short reason" />
        <Button
          variant="outline"
          onClick={() =>
            run("Raising dispute", () =>
              writeContractAsync({
                address: agreement,
                abi: agreementAbi,
                functionName: "raiseDispute",
                args: [disputeUri || "inline://dispute-reason"],
                chainId: arcTestnet.id
              })
            )
          }
        >
          <Gavel className="h-4 w-4" />
          Raise dispute
        </Button>
        <Input value={evidenceUri} onChange={(event) => setEvidenceUri(event.target.value)} placeholder="Evidence URI, JSON URL, or IPFS CID" />
        <Button
          variant="secondary"
          onClick={() =>
            run("Submitting evidence", () =>
              writeContractAsync({
                address: agreement,
                abi: agreementAbi,
                functionName: "submitEvidence",
                args: [evidenceUri || "inline://evidence"],
                chainId: arcTestnet.id
              })
            )
          }
        >
          <FileUp className="h-4 w-4" />
          Submit evidence
        </Button>
      </div>
    </div>
  );
}

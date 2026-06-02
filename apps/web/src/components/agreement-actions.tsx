"use client";

import { useState } from "react";
import { CheckCircle2, FileImage, FileUp, Gavel, HandCoins, Scale } from "lucide-react";
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
  const [evidenceImage, setEvidenceImage] = useState<{ name: string; preview: string } | null>(null);

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

  function uploadEvidenceImage(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setStatus("Please choose an image evidence file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const preview = String(reader.result);
      const evidenceId = `browser-image://${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
      setEvidenceImage({ name: file.name, preview });
      setEvidenceUri(evidenceId);
      try {
        const saved = JSON.parse(window.localStorage.getItem("arc-resolut:evidence-images") ?? "[]") as Array<unknown>;
        window.localStorage.setItem(
          "arc-resolut:evidence-images",
          JSON.stringify([{ evidenceId, name: file.name, preview, createdAt: new Date().toISOString() }, ...saved].slice(0, 20))
        );
      } catch {
        setStatus("Image preview loaded. Browser storage was unavailable, but you can still submit the evidence URI.");
      }
    };
    reader.readAsDataURL(file);
  }

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
        <p className="text-sm text-blue-100/70">
          First raise a dispute with a short reason or JSON/IPFS link. Then upload screenshots or supporting images and submit the generated evidence reference on-chain.
        </p>
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
        <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-blue-200/25 bg-blue-950/30 p-5 text-center transition hover:border-blue-200/45 hover:bg-blue-900/30">
          <FileImage className="h-6 w-6 text-blue-200" />
          <span className="mt-2 text-sm font-medium text-white">Upload image evidence</span>
          <span className="mt-1 text-xs text-blue-100/60">PNG, JPG, or WebP screenshots and delivery proofs</span>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="sr-only"
            onChange={(event) => uploadEvidenceImage(event.target.files?.[0] ?? null)}
          />
        </label>
        {evidenceImage ? (
          <div className="overflow-hidden rounded-xl border border-white/10 bg-slate-950/45">
            <img src={evidenceImage.preview} alt={evidenceImage.name} className="max-h-72 w-full object-contain" />
            <div className="border-t border-white/10 px-3 py-2 text-xs text-blue-100/70">{evidenceImage.name}</div>
          </div>
        ) : null}
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

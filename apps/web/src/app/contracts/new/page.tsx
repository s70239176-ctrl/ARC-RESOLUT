"use client";

import { useState } from "react";
import { Bot, CircleDollarSign, FileJson, Send, WalletCards } from "lucide-react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { decodeEventLog, isAddress, parseUnits } from "viem";
import { useAccount, usePublicClient, useSwitchChain, useWriteContract } from "wagmi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { arcTestnet } from "@/components/providers";
import { erc20Abi, escrowAbi, registryAbi } from "@/lib/contracts/abis";

export default function NewContractPage() {
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState("Connect your wallet and describe the contract.");
  const { address, isConnected, chainId } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient({ chainId: arcTestnet.id });

  const registryAddress = process.env.NEXT_PUBLIC_ESCROW_REGISTRY_ADDRESS as `0x${string}` | undefined;
  const usdcAddress = process.env.NEXT_PUBLIC_USDC_ADDRESS as `0x${string}` | undefined;

  async function createContract(formData: FormData) {
    setResult(null);
    setLoading(true);
    try {
      if (!address || !isConnected) throw new Error("Connect your wallet before creating an escrow.");
      if (!registryAddress || !isAddress(registryAddress)) throw new Error("Set NEXT_PUBLIC_ESCROW_REGISTRY_ADDRESS before funding live escrows.");
      if (!usdcAddress || !isAddress(usdcAddress)) throw new Error("Set NEXT_PUBLIC_USDC_ADDRESS before funding live escrows.");
      if (!publicClient) throw new Error("Arc Testnet RPC client is not ready.");
      if (chainId !== arcTestnet.id) {
        setPhase("Switching wallet to Arc Testnet...");
        await switchChainAsync({ chainId: arcTestnet.id });
      }

      const metadataFile = formData.get("metadataFile");
      const metadataJson =
        metadataFile instanceof File && metadataFile.size > 0
          ? await metadataFile.text()
          : "";
      if (metadataJson) JSON.parse(metadataJson);

      const payload = {
        subjectId: String(formData.get("subjectId") ?? ""),
        counterparty: String(formData.get("counterparty") ?? ""),
        payerAddress: address,
        payeeAddress: String(formData.get("payeeAddress") ?? ""),
        amountUsdc: String(formData.get("amountUsdc") ?? ""),
        terms: String(formData.get("terms") ?? ""),
        metadataJson: metadataJson || undefined,
        metadataFileName: metadataFile instanceof File ? metadataFile.name : undefined
      };

      if (!isAddress(payload.payeeAddress)) throw new Error("Enter a valid counterparty wallet address.");

      setPhase("Preparing contract terms and audit record...");
      const response = await fetch("/api/contracts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload)
      });
      const prepared = await response.json();
      if (!response.ok) throw new Error(prepared.error ?? "Unable to prepare escrow.");

      const escrow = prepared.escrow as {
        amountUsdc: string;
        termsHash: `0x${string}`;
        metadataUri: string;
        payeeAddress: `0x${string}`;
      };
      const amount = parseUnits(escrow.amountUsdc, 6);

      setPhase("Creating escrow contract on Arc Testnet...");
      const createHash = await writeContractAsync({
        address: registryAddress,
        abi: registryAbi,
        functionName: "createEscrow",
        args: [address, escrow.payeeAddress, amount, escrow.termsHash, escrow.metadataUri],
        chainId: arcTestnet.id
      });
      const createReceipt = await publicClient.waitForTransactionReceipt({ hash: createHash });
      const escrowAddress = createReceipt.logs.reduce<`0x${string}` | null>((found, log) => {
        if (found || log.address.toLowerCase() !== registryAddress.toLowerCase()) return found;
        try {
          const decoded = decodeEventLog({ abi: registryAbi, data: log.data, topics: log.topics });
          return decoded.eventName === "EscrowCreated" ? decoded.args.escrow : null;
        } catch {
          return null;
        }
      }, null);
      if (!escrowAddress) throw new Error("EscrowCreated event was not found in the registry transaction.");

      setPhase("Approving USDC for the escrow contract...");
      const approveHash = await writeContractAsync({
        address: usdcAddress,
        abi: erc20Abi,
        functionName: "approve",
        args: [escrowAddress, amount],
        chainId: arcTestnet.id
      });
      await publicClient.waitForTransactionReceipt({ hash: approveHash });

      setPhase("Funding escrow from your wallet...");
      const fundHash = await writeContractAsync({
        address: escrowAddress,
        abi: escrowAbi,
        functionName: "fund",
        chainId: arcTestnet.id
      });
      await publicClient.waitForTransactionReceipt({ hash: fundHash });

      setPhase("Escrow funded on Arc Testnet.");
      setResult({ ...prepared, onchain: { escrowAddress, createHash, approveHash, fundHash, status: "funded" } });
    } catch (error) {
      setPhase(error instanceof Error ? error.message : "Escrow creation failed.");
      setResult({ error: error instanceof Error ? error.message : "Unknown error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <Badge>Natural-language escrow</Badge>
      <h1 className="mt-4 font-display text-4xl font-semibold text-white">Create Intelligent Contract</h1>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
        Describe the deal in plain English. Circle Court turns your brief into an Agent Wallet escrow and uses the same terms as evidence if a dispute is opened.
      </p>
      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.7fr]">
        <Card>
          <CardHeader>
            <CardTitle>Contract brief</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createContract} className="space-y-4">
              <div className="rounded-xl border border-blue-300/15 bg-[#071735] p-3">
                <ConnectButton />
              </div>
              <FieldGuide
                label="Your identity"
                help="Enter the human, team, or agent ID that should appear in Circle Court audit logs."
              >
                <Input name="subjectId" placeholder="Example: northstar-labs or agent-42" />
              </FieldGuide>
              <FieldGuide
                label="Counterparty name"
                help="Enter a readable name for the other participant. This is for dashboards and evidence records."
              >
                <Input name="counterparty" placeholder="Example: PixelForge Agent" />
              </FieldGuide>
              <FieldGuide
                label="Counterparty wallet address"
                help="Enter the wallet that will receive funds if the contract is released or partially paid out."
              >
                <Input name="payeeAddress" placeholder="0x..." />
              </FieldGuide>
              <FieldGuide
                label="Escrow amount"
                help="Set the testnet USDC amount. Your connected wallet will approve and fund this amount on Arc Testnet."
              >
                <Input name="amountUsdc" placeholder="Example: 10.00" />
              </FieldGuide>
              <FieldGuide
                label="Contract instructions"
                help="Write the agreement clearly: deliverables, deadline, acceptance criteria, evidence rules, and how funds should split if the jury finds partial performance."
              >
                <Textarea
                  name="terms"
                  placeholder="Describe the agreement, acceptance criteria, evidence standards, and payout policy."
                />
              </FieldGuide>
              <FieldGuide
                label="Upload contract JSON"
                help="Optional: upload a JSON file with structured terms, milestones, evidence links, model policy, or payout rules. It is hashed into the terms record."
              >
                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-blue-300/30 bg-[#071735] p-4 text-sm text-blue-100 transition hover:bg-[#0b1f49]">
                  <FileJson className="h-5 w-5 text-primary" />
                  <span>Choose a .json file</span>
                  <input name="metadataFile" type="file" accept="application/json,.json" className="sr-only" />
                </label>
              </FieldGuide>
              <Button disabled={loading} size="lg">
                <Send className="h-4 w-4" /> {loading ? "Funding escrow..." : "Create and fund escrow"}
              </Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Circle Agent Stack</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              [WalletCards, "Uses your connected wallet as the escrow payer"],
              [CircleDollarSign, "Approves and transfers testnet USDC on Arc"],
              [Bot, "Prepares programmatic agent API access"]
            ].map(([Icon, text]) => (
              <div key={String(text)} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.045] p-3">
                <Icon className="h-5 w-5 text-primary" />
                <span className="text-sm text-white/82">{String(text)}</span>
              </div>
            ))}
            <div className="rounded-xl border border-blue-300/15 bg-[#071735] p-4 text-sm text-blue-100">
              {phase}
            </div>
            {result ? (
              <pre className="max-h-80 overflow-auto rounded-xl bg-black/40 p-4 text-xs text-primary">{JSON.stringify(result, null, 2)}</pre>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function FieldGuide({ label, help, children }: { label: string; help: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="block text-sm font-semibold text-white">{label}</span>
      <span className="block text-xs leading-5 text-muted-foreground">{help}</span>
      {children}
    </label>
  );
}

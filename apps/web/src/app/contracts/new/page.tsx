"use client";

import { useEffect, useState } from "react";
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
import { erc20Abi, registryAbi } from "@/lib/contracts/abis";
import { saveRecentContract } from "@/components/contracts-list";

export default function NewContractPage() {
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState("Connect your wallet and describe the contract.");
  const [metadataFileName, setMetadataFileName] = useState("");
  const { address, isConnected, chainId } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient({ chainId: arcTestnet.id });

  const [chainConfig, setChainConfig] = useState({
    registryAddress: process.env.NEXT_PUBLIC_ESCROW_REGISTRY_ADDRESS ?? "",
    usdcAddress: process.env.NEXT_PUBLIC_USDC_ADDRESS ?? ""
  });

  useEffect(() => {
    async function loadConfig() {
      try {
        const response = await fetch("/api/config", { cache: "no-store" });
        const config = (await response.json()) as { escrowRegistryAddress?: string; usdcAddress?: string };
        setChainConfig({
          registryAddress: config.escrowRegistryAddress || process.env.NEXT_PUBLIC_ESCROW_REGISTRY_ADDRESS || "",
          usdcAddress: config.usdcAddress || process.env.NEXT_PUBLIC_USDC_ADDRESS || ""
        });
      } catch {
        // Build-time NEXT_PUBLIC values remain as fallback.
      }
    }

    void loadConfig();
  }, []);

  async function createContract(formData: FormData) {
    setResult(null);
    setLoading(true);
    try {
      if (!address || !isConnected) throw new Error("Connect your wallet before creating an escrow.");
      const registryAddress = chainConfig.registryAddress as `0x${string}`;
      const usdcAddress = chainConfig.usdcAddress as `0x${string}`;
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
      if (metadataJson) {
        try {
          JSON.parse(metadataJson);
        } catch {
          throw new Error("The uploaded contract JSON is invalid. Please upload a valid .json file.");
        }
      }

      const payload = {
        subjectId: String(formData.get("subjectId") ?? ""),
        counterparty: String(formData.get("counterparty") ?? ""),
        payerAddress: address,
        payeeAddress: String(formData.get("payeeAddress") ?? ""),
        amountUsdc: String(formData.get("amountUsdc") ?? ""),
        terms: String(formData.get("terms") ?? ""),
        guidelines: String(formData.get("guidelines") ?? ""),
        evidenceRules: String(formData.get("evidenceRules") ?? ""),
        joinDeadlineHours: String(formData.get("joinDeadlineHours") ?? "72"),
        evidenceWindowHours: String(formData.get("evidenceWindowHours") ?? "48"),
        agentAEvidenceDefinition: String(formData.get("agentAEvidenceDefinition") ?? ""),
        agentBEvidenceDefinition: String(formData.get("agentBEvidenceDefinition") ?? ""),
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
        guidelinesHash: `0x${string}`;
        evidenceRulesHash: `0x${string}`;
        joinDeadlineSeconds: string;
        evidenceWindowSeconds: string;
        metadataUri: string;
        payeeAddress: `0x${string}`;
      };
      const amount = parseUnits(escrow.amountUsdc, 6);

      setPhase("Approving USDC for the agreement factory...");
      const approveHash = await writeContractAsync({
        address: usdcAddress,
        abi: erc20Abi,
        functionName: "approve",
        args: [registryAddress, amount],
        chainId: arcTestnet.id
      });
      await publicClient.waitForTransactionReceipt({ hash: approveHash });

      setPhase("Creating agreement and escrowing USDC through the factory...");
      const createHash = await writeContractAsync({
        address: registryAddress,
        abi: registryAbi,
        functionName: "createAgreement",
        args: [
          escrow.payeeAddress,
          amount,
          BigInt(escrow.joinDeadlineSeconds),
          BigInt(escrow.evidenceWindowSeconds),
          escrow.termsHash,
          escrow.guidelinesHash,
          escrow.evidenceRulesHash,
          escrow.metadataUri
        ],
        chainId: arcTestnet.id
      });
      const createReceipt = await publicClient.waitForTransactionReceipt({ hash: createHash });
      const agreementAddress = createReceipt.logs.reduce<`0x${string}` | null>((found, log) => {
        if (found || log.address.toLowerCase() !== registryAddress.toLowerCase()) return found;
        try {
          const decoded = decodeEventLog({ abi: registryAbi, data: log.data, topics: log.topics });
          return decoded.eventName === "AgreementCreated" ? decoded.args.agreement : null;
        } catch {
          return null;
        }
      }, null);
      if (!agreementAddress) throw new Error("AgreementCreated event was not found in the factory transaction.");

      await fetch(`/api/contracts/${prepared.contractId}/funded`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          escrowAddress: agreementAddress,
          createHash,
          approveHash,
          fundHash: createHash,
          actor: address
        })
      }).catch(() => null);

      saveRecentContract({
        id: prepared.contractId,
        title: `Escrow with ${payload.counterparty}`,
        status: "funded",
        claimant: address,
        respondent: payload.payeeAddress,
        amountUsdc: payload.amountUsdc,
        escrowWallet: agreementAddress,
        termsHash: escrow.termsHash,
        terms: [
          `Agreement statement:\n${payload.terms}`,
          `Resolution guidelines:\n${payload.guidelines}`,
          `Evidence rules:\n${payload.evidenceRules}`,
          `Agent A evidence definition:\n${payload.agentAEvidenceDefinition}`,
          `Agent B evidence definition:\n${payload.agentBEvidenceDefinition}`,
          `Join deadline hours:\n${payload.joinDeadlineHours}`,
          `Evidence window hours:\n${payload.evidenceWindowHours}`
        ].join("\n\n"),
        createdAt: new Date().toISOString()
      });

      setPhase("Agreement deployed and escrow funded on Arc Testnet.");
      setResult({ ...prepared, onchain: { agreementAddress, createHash, approveHash, status: "funded" } });
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
              <div className="grid gap-4 sm:grid-cols-2">
                <FieldGuide
                  label="Agent B join deadline"
                  help="How many hours Agent B has to accept the agreement after funding."
                >
                  <Input name="joinDeadlineHours" placeholder="72" defaultValue="72" />
                </FieldGuide>
                <FieldGuide
                  label="Evidence window"
                  help="How many hours parties have to submit evidence after a dispute is raised."
                >
                  <Input name="evidenceWindowHours" placeholder="48" defaultValue="48" />
                </FieldGuide>
              </div>
              <FieldGuide
                label="Agreement statement"
                help="Write the core agreement: deliverables, deadline, price, parties, and acceptance criteria."
              >
                <Textarea
                  name="terms"
                  placeholder="Describe the agreement, acceptance criteria, evidence standards, and payout policy."
                />
              </FieldGuide>
              <FieldGuide
                label="Resolution guidelines"
                help="Tell agents and the jury how to evaluate success, partial work, refunds, deadlines, and acceptable settlement outcomes."
              >
                <Textarea name="guidelines" placeholder="Example: if delivery is usable but late, release 70%; if no delivery, refund Agent A." />
              </FieldGuide>
              <FieldGuide
                label="Evidence rules"
                help="Define what evidence both agents may submit if there is a dispute: files, URLs, signed messages, screenshots, commits, invoices, or model logs."
              >
                <Textarea name="evidenceRules" placeholder="Example: accept dated files, GitHub commits, signed delivery receipts, and model output logs." />
              </FieldGuide>
              <div className="grid gap-4 lg:grid-cols-2">
                <FieldGuide
                  label="Agent A evidence definition"
                  help="Define what Agent A must provide if they claim non-performance, late delivery, or refund eligibility."
                >
                  <Textarea name="agentAEvidenceDefinition" placeholder="Example: original brief, payment receipt, rejection notes, screenshots, timestamps." />
                </FieldGuide>
                <FieldGuide
                  label="Agent B evidence definition"
                  help="Define what Agent B must provide if they claim completion, delivery, or release eligibility."
                >
                  <Textarea name="agentBEvidenceDefinition" placeholder="Example: delivery URL, files, signed handoff, logs, acceptance messages." />
                </FieldGuide>
              </div>
              <FieldGuide
                label="Upload contract JSON"
                help="Optional: upload a JSON file with structured terms, milestones, evidence links, model policy, or payout rules. It is hashed into the terms record."
              >
                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-blue-300/30 bg-[#071735] p-4 text-sm text-blue-100 transition hover:bg-[#0b1f49]">
                  <FileJson className="h-5 w-5 text-primary" />
                  <span>{metadataFileName || "Choose a .json file"}</span>
                  <input
                    name="metadataFile"
                    type="file"
                    accept="application/json,.json"
                    className="sr-only"
                    onChange={(event) => setMetadataFileName(event.target.files?.[0]?.name ?? "")}
                  />
                </label>
                {metadataFileName ? <div className="text-xs text-blue-100/75">Attached: {metadataFileName}</div> : null}
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

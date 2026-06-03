import { NextResponse } from "next/server";
import { buildConsensus } from "@/lib/llm/consensus";
import { logoDispute } from "@/lib/seed-data";
import { audit } from "@/lib/security/audit";
import { getClientKey, rateLimit } from "@/lib/security/rate-limit";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const limited = rateLimit(`resolve:${getClientKey(request)}`);
  if (!limited.ok) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const contract = body.contract ?? (await loadContract(id));
  const amountUsdc = contract?.amountUsdc ?? logoDispute.amountUsdc;
  const submittedEvidence = Array.isArray(body.evidence) ? body.evidence : [];
  const disputeNarrative = JSON.stringify({
    dispute: id,
    contract: contract ?? logoDispute,
    evidence: submittedEvidence,
    juryInstruction:
      "Evaluate whether the contract terms were satisfied. Return a fair release, refund, split, or appeal recommendation with confidence and payout rationale."
  });
  const verdict = await buildConsensus(disputeNarrative, amountUsdc);
  const bridgeInstruction = {
    mode: "onchain_jury_verdict",
    agreement: contract?.escrowWallet,
    action: "submitJuryVerdict",
    nextStep: "After the jury bridge submits the verdict, the winning party calls claimFunds() to release escrowed USDC."
  };
  const auditDigest = await audit("dispute.resolve", body.actor ?? "agent", { disputeId: id, verdict, bridgeInstruction });

  return NextResponse.json({ verdict, evidence: submittedEvidence, bridgeInstruction, auditDigest });
}

async function loadContract(id: string) {
  if (id === logoDispute.id) {
    return {
      title: logoDispute.title,
      terms: logoDispute.summary,
      amountUsdc: logoDispute.amountUsdc,
      claimant: logoDispute.claimant,
      respondent: logoDispute.respondent,
      escrowWallet: logoDispute.escrowWallet,
      termsHash: "0xseededlogodispute"
    };
  }

  try {
    const { prisma } = await import("@/lib/db");
    const contract = await prisma.contract.findUnique({ where: { id } });
    if (!contract) return null;
    return {
      title: contract.title,
      terms: contract.terms,
      amountUsdc: contract.amountUsdc.toString(),
      claimant: contract.claimant,
      respondent: contract.respondent,
      escrowWallet: contract.escrowWallet,
      termsHash: contract.termsHash
    };
  } catch {
    return null;
  }
}

import { NextResponse } from "next/server";
import { buildConsensus } from "@/lib/llm/consensus";
import { circleAgentStack } from "@/lib/circle/agent-stack";
import { logoDispute } from "@/lib/seed-data";
import { audit } from "@/lib/security/audit";
import { getClientKey, rateLimit } from "@/lib/security/rate-limit";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const limited = rateLimit(`resolve:${getClientKey(request)}`);
  if (!limited.ok) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const disputeNarrative = JSON.stringify({ dispute: id, seed: logoDispute, evidence: body.evidence ?? [] });
  const verdict = await buildConsensus(disputeNarrative, logoDispute.amountUsdc);
  const payout = await circleAgentStack.executePayouts(verdict.payouts);
  const auditDigest = await audit("dispute.resolve", body.actor ?? "agent", { disputeId: id, verdict, payout });

  return NextResponse.json({ verdict, payout, auditDigest });
}

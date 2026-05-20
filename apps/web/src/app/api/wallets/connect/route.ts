import { NextResponse } from "next/server";
import { z } from "zod";
import { circleAgentStack } from "@/lib/circle/agent-stack";
import { audit } from "@/lib/security/audit";
import { getClientKey, rateLimit } from "@/lib/security/rate-limit";

const schema = z.object({
  subjectId: z.string().min(2)
});

export async function POST(request: Request) {
  const limited = rateLimit(`wallet:${getClientKey(request)}`);
  if (!limited.ok) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  const body = schema.parse(await request.json());
  const wallet = await circleAgentStack.createOrLinkAgentWallet(body.subjectId);
  const digest = await audit("wallet.connect", body.subjectId, { walletId: wallet.id, address: wallet.address });

  return NextResponse.json({ wallet, auditDigest: digest });
}

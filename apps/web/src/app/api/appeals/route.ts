import { NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { audit } from "@/lib/security/audit";
import { getClientKey, rateLimit } from "@/lib/security/rate-limit";

const schema = z.object({
  disputeId: z.string().min(3),
  actor: z.string().min(2),
  reason: z.string().min(20),
  stakeUsdc: z.string().default("25.00")
});

export async function POST(request: Request) {
  const limited = rateLimit(`appeal:${getClientKey(request)}`);
  if (!limited.ok) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  const body = schema.parse(await request.json());
  const auditDigest = await audit("appeal.create", body.actor, body);
  return NextResponse.json({
    appealId: `appeal_${crypto.randomUUID()}`,
    status: "queued_for_expanded_jury",
    auditDigest
  });
}

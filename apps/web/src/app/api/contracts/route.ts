import { NextResponse } from "next/server";
import { z } from "zod";
import { circleAgentStack } from "@/lib/circle/agent-stack";
import { audit } from "@/lib/security/audit";
import { getClientKey, rateLimit } from "@/lib/security/rate-limit";

const schema = z.object({
  subjectId: z.string().min(2),
  counterparty: z.string().min(2),
  payerAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  payeeAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  amountUsdc: z.string().regex(/^\d+(\.\d{1,6})?$/),
  terms: z.string().min(20),
  metadataJson: z.string().optional(),
  metadataFileName: z.string().optional()
});

export async function POST(request: Request) {
  const limited = rateLimit(`contract:${getClientKey(request)}`);
  if (!limited.ok) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  const body = schema.parse(await request.json());
  const escrow = await circleAgentStack.prepareUserFundedEscrow(body);

  let contractId = escrow.escrowId;
  try {
    const { prisma } = await import("@/lib/db");
    const contract = await prisma.contract.create({
      data: {
        id: escrow.escrowId,
        title: `Escrow with ${body.counterparty}`,
        terms: body.terms,
        amountUsdc: body.amountUsdc,
        status: escrow.status,
        claimant: body.payerAddress,
        respondent: body.payeeAddress,
        escrowWallet: escrow.payerAddress,
        termsHash: escrow.termsHash
      }
    });
    contractId = contract.id;
  } catch {
    // Local preview works before Postgres is provisioned.
  }

  const auditDigest = await audit("contract.create", body.subjectId, { contractId, escrow });
  return NextResponse.json({ contractId, escrow, auditDigest });
}

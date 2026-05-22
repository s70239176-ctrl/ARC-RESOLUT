import { NextResponse } from "next/server";
import { z } from "zod";
import { circleAgentStack } from "@/lib/circle/agent-stack";
import { audit } from "@/lib/security/audit";
import { getClientKey, rateLimit } from "@/lib/security/rate-limit";
import { logoDispute } from "@/lib/seed-data";

const schema = z.object({
  subjectId: z.string().min(2),
  counterparty: z.string().min(2),
  payerAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  payeeAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  amountUsdc: z.string().regex(/^\d+(\.\d{1,6})?$/),
  terms: z.string().min(20),
  guidelines: z.string().min(5),
  evidenceRules: z.string().min(5),
  joinDeadlineHours: z.string().regex(/^\d+$/).default("72"),
  evidenceWindowHours: z.string().regex(/^\d+$/).default("48"),
  agentAEvidenceDefinition: z.string().optional(),
  agentBEvidenceDefinition: z.string().optional(),
  metadataJson: z.string().optional(),
  metadataFileName: z.string().optional()
});

type ContractRow = {
  id: string;
  title: string;
  status: string;
  claimant: string;
  respondent: string;
  amountUsdc: { toString(): string };
  escrowWallet: string;
  termsHash: string;
  terms: string;
  createdAt: Date;
};

export async function GET() {
  try {
    const { prisma } = await import("@/lib/db");
    const contracts = await prisma.contract.findMany({
      orderBy: { createdAt: "desc" },
      take: 50
    });

    return NextResponse.json({
      contracts: (contracts as ContractRow[]).map((contract) => ({
        id: contract.id,
        title: contract.title,
        status: contract.status,
        claimant: contract.claimant,
        respondent: contract.respondent,
        amountUsdc: contract.amountUsdc.toString(),
        escrowWallet: contract.escrowWallet,
        termsHash: contract.termsHash,
        terms: contract.terms,
        createdAt: contract.createdAt.toISOString()
      }))
    });
  } catch {
    return NextResponse.json({
      contracts: [
        {
          id: "logo-dispute-001",
          title: logoDispute.title,
          status: logoDispute.status,
          claimant: logoDispute.claimant,
          respondent: logoDispute.respondent,
          amountUsdc: logoDispute.amountUsdc,
          escrowWallet: logoDispute.escrowWallet,
          termsHash: "0xseededlogodispute",
          terms: logoDispute.summary
        }
      ]
    });
  }
}

export async function POST(request: Request) {
  const limited = rateLimit(`contract:${getClientKey(request)}`);
  if (!limited.ok) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  const body = schema.parse(await request.json());
  const escrow = await circleAgentStack.prepareUserFundedEscrow(body);
  const fullTerms = [
    `Agreement statement:\n${body.terms}`,
    `Resolution guidelines:\n${body.guidelines}`,
    `Evidence rules:\n${body.evidenceRules}`,
    `Agent A evidence definition:\n${body.agentAEvidenceDefinition ?? "Not specified"}`,
    `Agent B evidence definition:\n${body.agentBEvidenceDefinition ?? "Not specified"}`,
    `Join deadline hours:\n${body.joinDeadlineHours}`,
    `Evidence window hours:\n${body.evidenceWindowHours}`
  ].join("\n\n");

  let contractId = escrow.escrowId;
  try {
    const { prisma } = await import("@/lib/db");
    const contract = await prisma.contract.create({
      data: {
        id: escrow.escrowId,
        title: `Escrow with ${body.counterparty}`,
        terms: fullTerms,
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

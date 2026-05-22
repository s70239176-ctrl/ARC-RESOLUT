import { NextResponse } from "next/server";
import { z } from "zod";
import { audit } from "@/lib/security/audit";

const schema = z.object({
  escrowAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  createHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
  approveHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
  fundHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
  actor: z.string().optional()
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = schema.parse(await request.json());

  try {
    const { prisma } = await import("@/lib/db");
    await prisma.contract.update({
      where: { id },
      data: {
        status: "funded",
        escrowWallet: body.escrowAddress
      }
    });
  } catch {
    // Local mode can still use browser-local recent contracts.
  }

  const auditDigest = await audit("contract.funded", body.actor ?? "wallet-user", { contractId: id, ...body });
  return NextResponse.json({ ok: true, auditDigest });
}

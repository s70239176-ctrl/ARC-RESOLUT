import { NextResponse } from "next/server";
import { logoDispute } from "@/lib/seed-data";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (id === logoDispute.id) {
    return NextResponse.json({
      contract: {
        id,
        title: logoDispute.title,
        status: logoDispute.status,
        claimant: logoDispute.claimant,
        respondent: logoDispute.respondent,
        amountUsdc: logoDispute.amountUsdc,
        escrowWallet: logoDispute.escrowWallet,
        termsHash: "0xseededlogodispute",
        terms: logoDispute.summary
      }
    });
  }

  try {
    const { prisma } = await import("@/lib/db");
    const contract = await prisma.contract.findUnique({ where: { id } });
    if (!contract) return NextResponse.json({ error: "not_found" }, { status: 404 });

    return NextResponse.json({
      contract: {
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
      }
    });
  } catch {
    return NextResponse.json({ error: "database_unavailable" }, { status: 503 });
  }
}

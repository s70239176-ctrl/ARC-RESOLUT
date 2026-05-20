import { PrismaClient } from "@prisma/client";
import { logoDispute } from "../src/lib/seed-data";

const prisma = new PrismaClient();

async function main() {
  await prisma.contract.upsert({
    where: { id: "contract-logo-001" },
    create: {
      id: "contract-logo-001",
      title: "AI Logo Design Escrow",
      terms:
        "PixelForge Agent will deliver three premium fintech logo concepts for Northstar Labs. Concepts must feel enterprise-grade, trustworthy, and suitable for AI payment infrastructure.",
      amountUsdc: logoDispute.amountUsdc,
      status: "in_dispute",
      claimant: logoDispute.claimant,
      respondent: logoDispute.respondent,
      escrowWallet: logoDispute.escrowWallet,
      termsHash: "0xseededlogodispute",
      disputes: {
        create: {
          id: logoDispute.id,
          title: logoDispute.title,
          status: logoDispute.status,
          summary: logoDispute.summary,
          evidence: logoDispute.evidence,
          verdict: logoDispute.verdict
        }
      }
    },
    update: {
      status: "in_dispute"
    }
  });
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });

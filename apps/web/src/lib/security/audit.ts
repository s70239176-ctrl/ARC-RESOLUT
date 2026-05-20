import crypto from "crypto";
import { env } from "@/lib/env";

export async function audit(event: string, actor: string, payload: Record<string, unknown>) {
  const body = JSON.stringify({ event, actor, payload, at: new Date().toISOString() });
  const digest = crypto.createHmac("sha256", env.AUDIT_HMAC_SECRET).update(body).digest("hex");

  try {
    const { prisma } = await import("@/lib/db");
    await prisma.auditLog.create({
      data: { event, actor, payload, digest }
    });
  } catch {
    console.info("[audit]", event, actor, digest, payload);
  }

  return digest;
}

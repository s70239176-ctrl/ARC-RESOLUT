import { NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { env } from "@/lib/env";
import { circleAgentStack } from "@/lib/circle/agent-stack";
import { audit } from "@/lib/security/audit";
import { getClientKey, rateLimit } from "@/lib/security/rate-limit";

const schema = z.object({
  command: z.string().min(5),
  subjectId: z.string().default("external-agent")
});

function authorized(request: Request) {
  const auth = request.headers.get("authorization") ?? "";
  return auth === `Bearer ${env.AGENT_API_KEY}`;
}

export async function POST(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const limited = rateLimit(`agent:${getClientKey(request)}`);
  if (!limited.ok) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  const body = schema.parse(await request.json());
  const command = body.command.trim();
  let result: unknown;

  if (command.startsWith("circle wallet create")) {
    result = await circleAgentStack.createOrLinkAgentWallet(body.subjectId);
  } else if (command.startsWith("circle wallet list")) {
    result = { wallets: [await circleAgentStack.createOrLinkAgentWallet(body.subjectId)] };
  } else if (command.startsWith("circle gateway balance")) {
    const address = command.match(/--address\s+(\S+)/)?.[1] ?? "agent-wallet";
    result = await circleAgentStack.getGatewayBalance(address);
  } else if (command.startsWith("circle gateway deposit")) {
    const amountUsdc = command.match(/--amount\s+(\S+)/)?.[1] ?? "0.5";
    const address = command.match(/--address\s+(\S+)/)?.[1] ?? "agent-wallet";
    result = { id: `gateway_deposit_${crypto.randomUUID()}`, address, amountUsdc, chain: env.CIRCLE_CHAIN, status: "submitted_or_simulated" };
  } else if (command.startsWith("circle payment nanopay")) {
    const to = command.match(/--to\s+(\S+)/)?.[1] ?? "recipient-agent";
    const amountUsdc = command.match(/--amount\s+(\S+)/)?.[1] ?? "0.000001";
    const memo = command.match(/--memo\s+(\S+)/)?.[1] ?? "agent-action";
    result = await circleAgentStack.nanopay({ to, amountUsdc, memo });
  } else {
    return NextResponse.json({ error: "unsupported_command", supported: ["wallet create", "wallet list", "gateway balance", "gateway deposit", "payment nanopay"] }, { status: 400 });
  }

  const auditDigest = await audit("agent.command", body.subjectId, { command, result });
  return NextResponse.json({ command, result, auditDigest });
}

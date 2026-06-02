import crypto from "crypto";
import { env } from "@/lib/env";

export type AgentWallet = {
  id: string;
  address: string;
  chain: string;
  balanceUsdc: string;
  gatewayBalanceUsdc: string;
  policy: {
    perTxLimitUsdc: string;
    allowlistedContracts: string[];
  };
};

export type NanopaymentIntent = {
  id: string;
  to: string;
  amountUsdc: string;
  memo: string;
  status: "simulated" | "submitted";
};

function deterministicAddress(seed: string) {
  return `0x${crypto.createHash("sha256").update(seed).digest("hex").slice(0, 40)}`;
}

async function circleFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${env.CIRCLE_API_BASE}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${env.CIRCLE_API_KEY}`,
      "x-request-id": crypto.randomUUID(),
      ...(init.headers ?? {})
    }
  });

  if (!response.ok) {
    throw new Error(`Circle API ${response.status}: ${await response.text()}`);
  }

  return response.json() as Promise<T>;
}

export class CircleAgentStack {
  async createOrLinkAgentWallet(subjectId: string): Promise<AgentWallet> {
    if (env.CIRCLE_MOCK || !env.CIRCLE_API_KEY) {
      return {
        id: `mock-wallet-${subjectId}`,
        address: deterministicAddress(`arc-resolut:${subjectId}`),
        chain: env.CIRCLE_CHAIN,
        balanceUsdc: "1250.000000",
        gatewayBalanceUsdc: "2.500000",
        policy: {
          perTxLimitUsdc: "2500",
          allowlistedContracts: [env.ESCROW_REGISTRY_ADDRESS ?? "pending-registry"]
        }
      };
    }

    const payload = {
      idempotencyKey: crypto.randomUUID(),
      blockchains: [env.CIRCLE_CHAIN],
      entitySecretCiphertext: env.CIRCLE_ENTITY_SECRET_CIPHERTEXT,
      walletSetId: env.CIRCLE_WALLET_SET_ID,
      accountType: "SCA",
      metadata: [{ name: "circleCourtSubjectId", value: subjectId }]
    };

    const result = await circleFetch<{ data: { wallets: Array<{ id: string; address: string }> } }>("/developer/wallets", {
      method: "POST",
      body: JSON.stringify(payload)
    });

    const wallet = result.data.wallets[0];
    return {
      id: wallet.id,
      address: wallet.address,
      chain: env.CIRCLE_CHAIN,
      balanceUsdc: "0",
      gatewayBalanceUsdc: "0",
      policy: {
        perTxLimitUsdc: "2500",
        allowlistedContracts: [env.ESCROW_REGISTRY_ADDRESS ?? "pending-registry"]
      }
    };
  }

  async getGatewayBalance(address: string) {
    if (env.CIRCLE_MOCK) {
      return { address, chain: env.CIRCLE_CHAIN, balanceUsdc: "2.500000" };
    }

    return circleFetch<{ data: { balance: string } }>(`/gateway/balances?address=${address}&chain=${env.CIRCLE_CHAIN}`);
  }

  async createEscrow(params: { subjectId: string; amountUsdc: string; counterparty: string; terms: string }) {
    const wallet = await this.createOrLinkAgentWallet(params.subjectId);
    return {
      escrowId: `escrow_${crypto.randomUUID()}`,
      agentWallet: wallet,
      amountUsdc: params.amountUsdc,
      counterparty: params.counterparty,
      termsHash: `0x${crypto.createHash("sha256").update(params.terms).digest("hex")}`,
      status: env.CIRCLE_MOCK ? "simulated_funded" : "funding_pending"
    };
  }

  async prepareUserFundedEscrow(params: {
    subjectId: string;
    amountUsdc: string;
    counterparty: string;
    payerAddress: string;
    payeeAddress: string;
    terms: string;
    guidelines: string;
    evidenceRules: string;
    joinDeadlineHours: string;
    evidenceWindowHours: string;
    agentAEvidenceDefinition?: string;
    agentBEvidenceDefinition?: string;
    metadataJson?: string;
    metadataFileName?: string;
  }) {
    const wallet = await this.createOrLinkAgentWallet(params.subjectId);
    const statementSource = JSON.stringify({ terms: params.terms, metadataJson: params.metadataJson ?? null });
    const guidelinesSource = JSON.stringify({ guidelines: params.guidelines, joinDeadlineHours: params.joinDeadlineHours });
    const evidenceSource = JSON.stringify({
      evidenceRules: params.evidenceRules,
      evidenceWindowHours: params.evidenceWindowHours,
      agentAEvidenceDefinition: params.agentAEvidenceDefinition ?? null,
      agentBEvidenceDefinition: params.agentBEvidenceDefinition ?? null
    });

    return {
      escrowId: `escrow_${crypto.randomUUID()}`,
      agentWallet: wallet,
      payerAddress: params.payerAddress,
      payeeAddress: params.payeeAddress,
      amountUsdc: params.amountUsdc,
      joinDeadlineSeconds: String(Number(params.joinDeadlineHours) * 3600),
      evidenceWindowSeconds: String(Number(params.evidenceWindowHours) * 3600),
      counterparty: params.counterparty,
      termsHash: `0x${crypto.createHash("sha256").update(statementSource).digest("hex")}`,
      guidelinesHash: `0x${crypto.createHash("sha256").update(guidelinesSource).digest("hex")}`,
      evidenceRulesHash: `0x${crypto.createHash("sha256").update(evidenceSource).digest("hex")}`,
      metadataUri: params.metadataFileName ? `json-upload://${params.metadataFileName}` : "inline-json://contract-terms",
      metadataJson: params.metadataJson ? JSON.parse(params.metadataJson) : null,
      status: "awaiting_user_wallet_funding",
      fundingMode: "connected_wallet_onchain"
    };
  }

  async nanopay(params: { fromWalletId?: string; to: string; amountUsdc: string; memo: string }): Promise<NanopaymentIntent> {
    if (env.CIRCLE_MOCK) {
      return {
        id: `nano_${crypto.randomUUID()}`,
        to: params.to,
        amountUsdc: params.amountUsdc,
        memo: params.memo,
        status: "simulated"
      };
    }

    const result = await circleFetch<{ data: { id: string } }>("/gateway/nanopayments", {
      method: "POST",
      body: JSON.stringify({
        chain: env.CIRCLE_CHAIN,
        recipient: params.to,
        amount: params.amountUsdc,
        currency: "USDC",
        memo: params.memo,
        walletId: params.fromWalletId
      })
    });

    return {
      id: result.data.id,
      to: params.to,
      amountUsdc: params.amountUsdc,
      memo: params.memo,
      status: "submitted"
    };
  }

  async executePayouts(payouts: Array<{ to: string; amountUsdc: string; memo: string }>) {
    const protocolFee = await this.nanopay({
      to: "arc-resolut-protocol",
      amountUsdc: "0.000001",
      memo: "protocol-fee"
    });

    const transfers = await Promise.all(payouts.map((payout) => this.nanopay(payout)));
    return { protocolFee, transfers };
  }
}

export const circleAgentStack = new CircleAgentStack();

import crypto from "crypto";
import { env } from "@/lib/env";

export type JuryVote = {
  model: string;
  decision: "release" | "refund" | "split" | "appeal";
  confidence: number;
  rationale: string;
  feeUsdc: string;
};

export type ConsensusVerdict = {
  verdictId: string;
  decision: string;
  confidence: number;
  juryModels: string[];
  consensus: {
    winningSignal: JuryVote["decision"];
    agreement: string;
    rationale: string;
  };
  payouts: Array<{ to: string; amountUsdc: string; memo: string }>;
  reasoning: string;
  appealWindowHours: number;
};

async function askModel(model: string, dispute: string): Promise<JuryVote> {
  if (!env.LITELLM_API_KEY || env.LITELLM_API_KEY === "sk-local") {
    const hash = crypto.createHash("sha256").update(`${model}:${dispute}`).digest()[0];
    const decision = hash % 3 === 0 ? "split" : "release";
    return {
      model,
      decision,
      confidence: decision === "split" ? 0.86 : 0.79,
      rationale: decision === "split" ? "Quality mismatch is material but delivery has usable value." : "Delivery substantially satisfies the escrow brief.",
      feeUsdc: "0.00037"
    };
  }

  const response = await fetch(`${env.LITELLM_BASE_URL}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${env.LITELLM_API_KEY}`
    },
    body: JSON.stringify({
      model,
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are a neutral escrow juror. Return JSON with decision release|refund|split|appeal, confidence 0-1, rationale."
        },
        { role: "user", content: dispute }
      ]
    })
  });

  const json = await response.json();
  const parsed = JSON.parse(json.choices[0].message.content);
  return {
    model,
    decision: parsed.decision,
    confidence: Number(parsed.confidence),
    rationale: parsed.rationale,
    feeUsdc: "0.00037"
  };
}

export async function buildConsensus(dispute: string, escrowAmountUsdc: string): Promise<ConsensusVerdict> {
  const models = env.JURY_MODELS.split(",").map((model) => model.trim()).filter(Boolean);
  const votes = await Promise.all(models.map((model) => askModel(model, dispute)));
  const confidence = votes.reduce((sum, vote) => sum + vote.confidence, 0) / votes.length;
  const tally = votes.reduce<Record<JuryVote["decision"], number>>(
    (acc, vote) => {
      acc[vote.decision] += 1;
      return acc;
    },
    { release: 0, refund: 0, split: 0, appeal: 0 }
  );
  const winningSignal = (Object.entries(tally).sort((a, b) => b[1] - a[1])[0][0] ?? "split") as JuryVote["decision"];
  const amount = Number(escrowAmountUsdc);
  const decisionMap: Record<JuryVote["decision"], string> = {
    release: "Release escrow to respondent by LLM jury consensus",
    refund: "Refund escrow to claimant by LLM jury consensus",
    split: "Split escrow by LLM jury consensus",
    appeal: "Escalate for appeal by LLM jury consensus"
  };
  const payoutsBySignal: Record<JuryVote["decision"], Array<{ to: string; amountUsdc: string; memo: string }>> = {
    release: [{ to: "respondent-agent-wallet", amountUsdc: amount.toFixed(6), memo: "jury-release" }],
    refund: [{ to: "claimant-agent-wallet", amountUsdc: amount.toFixed(6), memo: "jury-refund" }],
    split: [
      { to: "claimant-agent-wallet", amountUsdc: (amount * 0.4).toFixed(6), memo: "jury-award-claimant" },
      { to: "respondent-agent-wallet", amountUsdc: (amount * 0.6).toFixed(6), memo: "jury-award-respondent" }
    ],
    appeal: [
      { to: "claimant-agent-wallet", amountUsdc: (amount * 0.5).toFixed(6), memo: "appeal-hold-claimant" },
      { to: "respondent-agent-wallet", amountUsdc: (amount * 0.5).toFixed(6), memo: "appeal-hold-respondent" }
    ]
  };
  const supportingVotes = votes.filter((vote) => vote.decision === winningSignal);
  const rationale =
    supportingVotes.length > 0
      ? supportingVotes.map((vote) => vote.rationale).join(" ")
      : votes.map((vote) => vote.rationale).join(" ");
  const agreement = `${tally[winningSignal]} of ${votes.length} jurors aligned on ${winningSignal}.`;

  return {
    verdictId: `verdict_${crypto.randomUUID()}`,
    decision: decisionMap[winningSignal],
    confidence,
    juryModels: votes.map((vote) => vote.model),
    consensus: {
      winningSignal,
      agreement,
      rationale
    },
    payouts: payoutsBySignal[winningSignal],
    reasoning: `${agreement} ${rationale}`,
    appealWindowHours: confidence < 0.82 ? 72 : 24
  };
}

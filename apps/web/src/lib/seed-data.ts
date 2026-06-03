export const logoDispute = {
  id: "logo-dispute-001",
  title: "AI Logo Design Dispute",
  status: "in_jury_review",
  amountUsdc: "750.00",
  claimant: "Northstar Labs",
  respondent: "PixelForge Agent",
  escrowWallet: "0xA11CEc0ur700000000000000000000000000001",
  summary:
    "Northstar Labs claims the delivered AI logo set missed the agreed enterprise fintech tone. PixelForge Agent argues all three generated concepts met the natural-language brief.",
  evidence: [
    {
      name: "Aurora Ledger",
      image: "/seed/logos/aurora-ledger.svg",
      type: "delivery",
      caption: "Premium geometric mark with ledger-line motif and Arc-native colorway."
    },
    {
      name: "Northstar Circuit",
      image: "/seed/logos/northstar-circuit.svg",
      type: "delivery",
      caption: "Star-and-route symbol optimized for autonomous agent marketplace usage."
    },
    {
      name: "Signal Vault",
      image: "/seed/logos/signal-vault.svg",
      type: "delivery",
      caption: "Secure vault monogram with AI signal rings and high-contrast lockup."
    }
  ],
  validators: [
    {
      model: "gpt-4.1",
      vote: "partial_refund",
      confidence: 0.88,
      fee: "0.00042",
      rationale: "The logos are usable but fall short of the agreed enterprise fintech finish."
    },
    {
      model: "claude-3-7-sonnet",
      vote: "partial_refund",
      confidence: 0.84,
      fee: "0.00039",
      rationale: "Evidence supports delivery, though brand polish and acceptance criteria are only partially met."
    },
    {
      model: "gemini-2.5-pro",
      vote: "release_60_percent",
      confidence: 0.79,
      fee: "0.00036",
      rationale: "A majority release is fair because all three concepts were delivered with some quality mismatch."
    }
  ],
  verdict: {
    decision: "Partial refund to claimant",
    confidence: 0.84,
    payout: [
      { recipient: "Northstar Labs", amount: "300.00" },
      { recipient: "PixelForge Agent", amount: "450.00" }
    ],
    reasoning:
      "The jury found functional compliance but weaker evidence of enterprise polish than specified. A 40/60 claimant/respondent split preserves payment for delivered work while compensating quality mismatch."
  }
};

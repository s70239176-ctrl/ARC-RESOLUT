import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().optional(),
  AGENT_API_KEY: z.string().default("dev-agent-key"),
  AUDIT_HMAC_SECRET: z.string().default("dev-audit-secret"),
  RATE_LIMIT_MAX: z.coerce.number().default(80),
  RATE_LIMIT_WINDOW_SECONDS: z.coerce.number().default(60),
  LITELLM_BASE_URL: z.string().default("http://localhost:4000"),
  LITELLM_API_KEY: z.string().default("sk-local"),
  JURY_MODELS: z.string().default("openai/gpt-4.1,anthropic/claude-3-7-sonnet,google/gemini-2.5-pro"),
  CIRCLE_API_KEY: z.string().default(""),
  CIRCLE_WALLET_SET_ID: z.string().default(""),
  CIRCLE_ENTITY_SECRET_CIPHERTEXT: z.string().default(""),
  CIRCLE_API_BASE: z.string().default("https://api.circle.com/v1/w3s"),
  CIRCLE_CHAIN: z.string().default("ARC-TESTNET"),
  CIRCLE_USDC_TOKEN_ID: z.string().default("USDC"),
  CIRCLE_MOCK: z.coerce.boolean().default(true),
  NEXT_PUBLIC_CIRCLE_FAUCET_URL: z.string().default("https://faucet.circle.com"),
  ESCROW_REGISTRY_ADDRESS: z.string().optional()
});

export const env = envSchema.parse(process.env);

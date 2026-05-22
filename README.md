# Circle Court

Circle Court is an agent-native decentralized dispute resolution platform for Arc Testnet. Humans and AI agents create natural-language escrow contracts, hold USDC in Circle Agent Wallets, resolve disputes through LLM jury consensus, and execute protocol fees plus payouts through Circle Agent Stack primitives.

## Full Monorepo Project Structure

```txt
circle-court/
  apps/web/                  Next.js 15 App Router app, API routes, Prisma schema
  packages/contracts/        Solidity escrow and registry contracts, Hardhat deploy scripts
  Dockerfile                 Railway-ready production image
  railway.json               Railway service config
  .env.example               Arc, Circle, LiteLLM, Postgres, security envs
```

Important paths:

- `apps/web/src/lib/circle/agent-stack.ts`: Circle Agent Wallet, escrow, Gateway nanopayment adapter.
- `apps/web/src/lib/llm/consensus.ts`: multi-model LiteLLM jury engine.
- `apps/web/src/app/api/agent/command/route.ts`: Circle CLI-style agent command endpoint.
- `apps/web/src/app/api/contracts/route.ts`: intelligent escrow creation API.
- `apps/web/src/app/api/disputes/[id]/resolve/route.ts`: verdict and autonomous payout API.
- `packages/contracts/contracts/CircleCourtAgreement.sol`: per-agreement lifecycle contract.
- `packages/contracts/contracts/CircleCourtRegistry.sol`: agreement factory and metadata anchor.
- `packages/contracts/scripts/deploy-arc.ts`: Arc Testnet deployment.

## Railway Deployment Guide

1. Create a Railway project with a PostgreSQL service.
2. Add a web service from this repository and use the included `Dockerfile`.
3. Set the environment variables from `.env.example`.
4. Keep `CIRCLE_MOCK=true` for first deploy verification, then set `CIRCLE_MOCK=false` after Circle credentials are configured.
5. Run the database migration from Railway shell:

```bash
pnpm --filter @circle-court/web prisma migrate deploy
pnpm --filter @circle-court/web seed
```

Required Railway variables:

```txt
DATABASE_URL
NEXT_PUBLIC_APP_URL
NEXT_PUBLIC_ARC_RPC_URL=https://rpc.testnet.arc.network
NEXT_PUBLIC_ARC_CHAIN_ID=5042002
NEXT_PUBLIC_ARC_EXPLORER=https://testnet.arcscan.app
NEXT_PUBLIC_CIRCLE_FAUCET_URL=https://faucet.circle.com
NEXT_PUBLIC_ESCROW_REGISTRY_ADDRESS
NEXT_PUBLIC_USDC_ADDRESS
AGENT_API_KEY
AUDIT_HMAC_SECRET
LITELLM_BASE_URL
LITELLM_API_KEY
JURY_MODELS
CIRCLE_API_KEY
CIRCLE_WALLET_SET_ID
CIRCLE_ENTITY_SECRET_CIPHERTEXT
CIRCLE_API_BASE=https://api.circle.com/v1/w3s
CIRCLE_CHAIN=ARC-TESTNET
CIRCLE_MOCK=false
ESCROW_REGISTRY_ADDRESS
USDC_ADDRESS
```

For live escrow funding, `NEXT_PUBLIC_ESCROW_REGISTRY_ADDRESS` and `NEXT_PUBLIC_USDC_ADDRESS` must be set. The frontend uses these addresses to let the connected wallet:

1. Approve testnet USDC to the `CircleCourtRegistry` factory.
2. Create and fund an agreement through `CircleCourtRegistry.createAgreement`.
3. Let Agent B call `acceptAgreement()`, then resolve by matching outcomes or AI jury.

This path is not simulated. It requires the payer wallet to be on Arc Testnet and funded from the Circle faucet.

Arc Testnet config:

```txt
RPC: https://rpc.testnet.arc.network
WebSocket: wss://rpc.testnet.arc.network
Chain ID: 5042002
Currency: USDC
Explorer: https://testnet.arcscan.app
Faucet: https://faucet.circle.com
```

## Wallet Integration Setup

Circle Court treats “Connect Wallet” as Agent A or Agent B’s wallet. Agent A approves USDC to the factory, calls `createAgreement`, and the registry deploys a funded agreement contract. Agent B later calls `acceptAgreement()`.

Circle Agent Wallets still power the agent side of the platform: wallet creation/linking, autonomous releases, audit identities, and programmatic command execution. The user-funded escrow path avoids fake balances and requires real Arc Testnet USDC.

1. Configure Circle Wallets API credentials in Railway.
2. Set `CIRCLE_CHAIN=ARC-TESTNET`.
3. Keep user wallets in Circle developer-controlled or agent-wallet mode.
4. Configure spending policy allowlists in Circle Console for deployed agreement and registry contracts.
5. Use `/api/wallets/connect` from the UI or other agents.
6. Use `/api/agent/command` for Circle CLI-style commands:

```json
{
  "command": "circle wallet create --type agent --testnet --chain ARC-TESTNET",
  "subjectId": "user_123"
}
```

Supported agent commands include:

- `circle wallet create --type agent --testnet`
- `circle wallet list --chain ARC-TESTNET --type agent`
- `circle gateway balance --address 0x... --chain ARC-TESTNET`
- `circle gateway deposit --amount 1 --address 0x... --chain ARC-TESTNET --method direct`
- `circle payment nanopay --to 0x... --amount 0.000001 --memo jury-fee`

## Professional shadcn/Tailwind Theme

The theme is in `apps/web/tailwind.config.ts` and `apps/web/src/app/globals.css`. It uses a dark fintech palette, glass surfaces, teal/blue accents, Inter/Satoshi-compatible font stacks, Radix/shadcn primitives, and reduced-motion-safe animations for consensus, verdict reveal, and payout progress.

## Local Run

```bash
cp .env.example .env
pnpm install
pnpm --filter @circle-court/web prisma migrate dev
pnpm seed
pnpm dev
```

Open `http://localhost:3000`.

## Test Flows

1. Connect Wallet: connects the payer wallet on Arc Testnet.
2. Request Test USDC: opens Circle Faucet for Arc Testnet funding.
3. Create Intelligent Contract: submit natural language terms, optional JSON metadata, counterparty wallet, and escrow amount.
4. Fund Escrow: the app approves USDC to the registry and calls `createAgreement`, which deploys the agreement and escrows funds.
5. Open AI Logo Design Dispute: inspect evidence, validator breakdown, confidence, and appeal window.
6. Resolve Dispute: calls LiteLLM jury consensus, records audit log, and executes Circle Agent Stack payout intents.
7. Agent Command Center: submit CLI-style commands with `Authorization: Bearer $AGENT_API_KEY`.

## Railway One-Click Notes

Railway builds with Docker. Add Postgres, set the env vars, deploy, run migrations, then seed. For production, keep Circle wallet policies narrow: allow escrow/registry contracts, cap per-transaction USDC, and rotate `AGENT_API_KEY` plus `AUDIT_HMAC_SECRET`.

## Sources Checked

- Arc Testnet RPC, chain ID, explorer, faucet: https://docs.arc.io/arc/references/rpc-endpoints
- Circle CLI Agent Stack command pattern: https://developers.circle.com/agent-stack/circle-cli/command-reference
- Circle Wallets API wallet creation fields and `ARC-TESTNET`: https://developers.circle.com/api-reference/wallets/developer-controlled-wallets/create-wallet
- Circle Nanopayments/Gateway model: https://www.circle.com/blog/circle-nanopayments-launches-on-testnet-as-the-core-primitive-for-agentic-economic-activity

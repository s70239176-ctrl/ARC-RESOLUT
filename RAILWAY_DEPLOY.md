# Railway Deploy Checklist

## 1. Deploy Contracts To Arc Testnet

Fund your deployer wallet with Arc Testnet USDC from the Circle faucet, then deploy:

```bash
cp .env.example .env
ARC_DEPLOYER_PRIVATE_KEY=0x...
USDC_ADDRESS=0x...
pnpm --filter @circle-court/contracts deploy:arc
```

Copy the deployed `CircleCourtRegistry` address.

## 2. Create Railway Services

Create a Railway project with:

- Web service from this repo
- PostgreSQL service

Railway will use the included `Dockerfile` and `railway.json`.

## 3. Set Required Env Vars

```txt
DATABASE_URL=${{Postgres.DATABASE_URL}}
NEXT_PUBLIC_APP_URL=https://YOUR-RAILWAY-DOMAIN
NEXT_PUBLIC_ARC_RPC_URL=https://rpc.testnet.arc.network
NEXT_PUBLIC_ARC_CHAIN_ID=5042002
NEXT_PUBLIC_ARC_EXPLORER=https://testnet.arcscan.app
NEXT_PUBLIC_CIRCLE_FAUCET_URL=https://faucet.circle.com
NEXT_PUBLIC_ESCROW_REGISTRY_ADDRESS=0x...
NEXT_PUBLIC_USDC_ADDRESS=0x...
AGENT_API_KEY=replace-with-long-random-secret
AUDIT_HMAC_SECRET=replace-with-32-byte-secret
LITELLM_BASE_URL=https://YOUR-LITELLM-ENDPOINT
LITELLM_API_KEY=...
JURY_MODELS=openai/gpt-4.1,anthropic/claude-3-7-sonnet,google/gemini-2.5-pro
CIRCLE_API_KEY=...
CIRCLE_WALLET_SET_ID=...
CIRCLE_ENTITY_SECRET_CIPHERTEXT=...
CIRCLE_API_BASE=https://api.circle.com/v1/w3s
CIRCLE_CHAIN=ARC-TESTNET
CIRCLE_MOCK=false
ESCROW_REGISTRY_ADDRESS=0x...
USDC_ADDRESS=0x...
```

## 4. Run Database Commands

From the Railway shell:

```bash
pnpm --filter @circle-court/web prisma migrate deploy
pnpm --filter @circle-court/web seed
```

## 5. Verify Live Funding

1. Open the Railway URL.
2. Connect a wallet.
3. Switch to Arc Testnet.
4. Use the faucet to fund testnet USDC.
5. Create a contract with a counterparty wallet address.
6. Confirm the registry transaction, USDC approval, and escrow funding transaction.

The escrow is funded from the connected wallet. It is not a simulation.

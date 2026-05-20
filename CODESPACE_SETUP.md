# Circle Court Codespace Setup

This repo is ready to unpack into GitHub Codespaces.

## Option A: Upload The Archive

1. Create a blank GitHub Codespace or open any existing Codespace terminal.
2. Upload `circle-court-codespace.tar.gz` into the Codespace.
3. Run:

```bash
mkdir circle-court
tar -xzf circle-court-codespace.tar.gz -C circle-court
cd circle-court
bash scripts/setup-codespace.sh
pnpm dev
```

Open the forwarded port `3000`.

## Option B: Push As A GitHub Repo

From your local machine:

```bash
git init
git add .
git commit -m "Initial Circle Court app"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/circle-court.git
git push -u origin main
```

Then click **Code -> Codespaces -> Create codespace on main**.

## Environment

The setup script copies `.env.example` to `.env`. For local demo mode, keep:

```txt
CIRCLE_MOCK=true
AGENT_API_KEY=dev-agent-key
```

For Railway or live Circle integration, set:

```txt
DATABASE_URL
CIRCLE_API_KEY
CIRCLE_WALLET_SET_ID
CIRCLE_ENTITY_SECRET_CIPHERTEXT
CIRCLE_MOCK=false
LITELLM_BASE_URL
LITELLM_API_KEY
ESCROW_REGISTRY_ADDRESS
USDC_ADDRESS
```

Arc Testnet defaults are already included:

```txt
NEXT_PUBLIC_ARC_RPC_URL=https://rpc.testnet.arc.network
NEXT_PUBLIC_ARC_CHAIN_ID=5042002
NEXT_PUBLIC_CIRCLE_FAUCET_URL=https://faucet.circle.com
```

## Codespace Commands

```bash
pnpm dev
pnpm build
pnpm seed
pnpm --filter @circle-court/contracts build
pnpm --filter @circle-court/contracts test
```

## Notes

- The app runs in Circle mock mode until credentials are supplied.
- Prisma generation runs during setup, but migrations need a real Postgres `DATABASE_URL`.
- The devcontainer auto-runs `scripts/setup-codespace.sh` when Codespaces creates the environment.

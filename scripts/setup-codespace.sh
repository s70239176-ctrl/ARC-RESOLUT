#!/usr/bin/env bash
set -euo pipefail

echo "==> Circle Court Codespace setup"

corepack enable
corepack prepare pnpm@9.15.4 --activate

if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env from .env.example"
fi

pnpm install
pnpm --filter @circle-court/web prisma:generate

cat <<'NEXT_STEPS'

Circle Court is ready.

Common commands:
  pnpm dev
  pnpm build
  pnpm --filter @circle-court/contracts test
  pnpm --filter @circle-court/contracts deploy:arc

Open:
  http://localhost:3000

For a fully local database, add a Postgres service or paste your Railway DATABASE_URL into .env.
NEXT_STEPS

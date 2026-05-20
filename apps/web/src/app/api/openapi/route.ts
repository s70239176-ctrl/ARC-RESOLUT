import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    openapi: "3.1.0",
    info: {
      title: "Circle Court Agent API",
      version: "0.1.0",
      description: "Programmatic endpoints for agent-native escrow, wallet, jury, appeal, and Circle CLI-style actions."
    },
    servers: [{ url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000" }],
    paths: {
      "/api/wallets/connect": {
        post: {
          summary: "Create or link a Circle Agent Wallet",
          requestBody: { required: true },
          responses: { "200": { description: "Agent wallet and audit digest" } }
        }
      },
      "/api/contracts": {
        post: {
          summary: "Prepare a natural-language escrow for connected-wallet funding",
          description: "Returns terms hash and metadata URI. The client then creates the escrow on the deployed registry, approves USDC, and calls fund() from the payer wallet.",
          responses: { "200": { description: "Escrow funding intent, terms hash, metadata URI, and audit digest" } }
        }
      },
      "/api/disputes/{id}/resolve": {
        post: {
          summary: "Run LLM jury consensus and execute Circle Agent Stack payout intents",
          responses: { "200": { description: "Verdict, payouts, and audit digest" } }
        }
      },
      "/api/appeals": {
        post: {
          summary: "Open an appeal with stake and expanded jury review",
          responses: { "200": { description: "Appeal record" } }
        }
      },
      "/api/agent/command": {
        post: {
          summary: "Execute Circle CLI-style commands for external agents",
          security: [{ bearerAuth: [] }],
          responses: { "200": { description: "Command result and audit digest" } }
        }
      }
    },
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer" }
      }
    }
  });
}

import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    ok: true,
    service: "circle-court",
    arc: {
      chainId: 5042002,
      rpc: process.env.NEXT_PUBLIC_ARC_RPC_URL ?? "https://rpc.testnet.arc.network"
    },
    contracts: {
      registryConfigured: Boolean(process.env.NEXT_PUBLIC_ESCROW_REGISTRY_ADDRESS ?? process.env.ESCROW_REGISTRY_ADDRESS),
      usdcConfigured: Boolean(process.env.NEXT_PUBLIC_USDC_ADDRESS ?? process.env.USDC_ADDRESS)
    }
  });
}

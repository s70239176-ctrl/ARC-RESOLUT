import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    arcRpcUrl: process.env.NEXT_PUBLIC_ARC_RPC_URL ?? "https://rpc.testnet.arc.network",
    arcChainId: Number(process.env.NEXT_PUBLIC_ARC_CHAIN_ID ?? 5042002),
    arcExplorer: process.env.NEXT_PUBLIC_ARC_EXPLORER ?? "https://testnet.arcscan.app",
    circleFaucetUrl: process.env.NEXT_PUBLIC_CIRCLE_FAUCET_URL ?? "https://faucet.circle.com",
    escrowRegistryAddress: process.env.NEXT_PUBLIC_ESCROW_REGISTRY_ADDRESS ?? process.env.ESCROW_REGISTRY_ADDRESS ?? "",
    usdcAddress: process.env.NEXT_PUBLIC_USDC_ADDRESS ?? process.env.USDC_ADDRESS ?? ""
  });
}

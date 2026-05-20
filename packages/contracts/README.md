# Circle Court Contracts

Contracts are configured for Arc Testnet:

```txt
RPC: https://rpc.testnet.arc.network
Chain ID: 5042002
Gas token: USDC
Explorer: https://testnet.arcscan.app
```

Deploy:

```bash
ARC_DEPLOYER_PRIVATE_KEY=0x...
USDC_ADDRESS=0x...
pnpm --filter @circle-court/contracts deploy:arc
```

`CircleCourtRegistry` creates owned escrow vaults. In production, set the registry owner to a policy-controlled Circle Agent Wallet or a timelocked operational multisig and allowlist registry/escrow interactions in Circle Agent Wallet policy.

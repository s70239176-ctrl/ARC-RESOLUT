import "@nomicfoundation/hardhat-toolbox";
import "dotenv/config";
import { HardhatUserConfig } from "hardhat/config";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 500
      }
    }
  },
  networks: {
    arcTestnet: {
      url: process.env.ARC_RPC_URL ?? "https://rpc.testnet.arc.network",
      chainId: 5042002,
      accounts: process.env.ARC_DEPLOYER_PRIVATE_KEY ? [process.env.ARC_DEPLOYER_PRIVATE_KEY] : []
    }
  }
};

export default config;

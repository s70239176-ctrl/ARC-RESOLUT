import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  const usdc = process.env.USDC_ADDRESS;

  if (!usdc || usdc === "0x0000000000000000000000000000000000000000") {
    throw new Error("Set USDC_ADDRESS for Arc Testnet before deploying.");
  }

  console.log("Deploying CircleCourtRegistry to Arc Testnet with:", deployer.address);
  const Registry = await ethers.getContractFactory("CircleCourtRegistry");
  const registry = await Registry.deploy(deployer.address, usdc);
  await registry.waitForDeployment();

  console.log("CircleCourtRegistry:", await registry.getAddress());
  console.log("ArcScan:", `https://testnet.arcscan.app/address/${await registry.getAddress()}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

import { expect } from "chai";
import { ethers } from "hardhat";

describe("Circle Court escrow", function () {
  async function deployFixture() {
    const [owner, payer, payee, claimant] = await ethers.getSigners();
    const MockUsdc = await ethers.getContractFactory("MockUSDC");
    const usdc = await MockUsdc.deploy();
    await usdc.waitForDeployment();

    const Registry = await ethers.getContractFactory("CircleCourtRegistry");
    const registry = await Registry.deploy(owner.address, await usdc.getAddress());
    await registry.waitForDeployment();

    const amount = ethers.parseUnits("750", 6);
    await usdc.mint(payer.address, amount);
    await registry.connect(payer).createEscrow(payer.address, payee.address, amount, ethers.id("terms"), "ipfs://terms");
    const record = await registry.escrows(0);
    const escrow = await ethers.getContractAt("CircleCourtEscrow", record.escrow);
    await usdc.connect(payer).approve(record.escrow, amount);

    return { owner, payer, payee, claimant, usdc, registry, escrow, amount };
  }

  it("funds and resolves with an exact split", async function () {
    const { claimant, payer, payee, usdc, registry, escrow, amount } = await deployFixture();

    await expect(escrow.connect(payer).fund()).to.emit(escrow, "Funded");
    await expect(escrow.connect(payer).openDispute("ipfs://evidence")).to.emit(escrow, "Disputed");

    const claimantAward = ethers.parseUnits("300", 6);
    const payeeAward = amount - claimantAward;
    await expect(
      registry.resolveEscrow(0, ethers.id("verdict"), [
        { recipient: claimant.address, amount: claimantAward },
        { recipient: payee.address, amount: payeeAward }
      ])
    ).to.emit(escrow, "Resolved");

    expect(await usdc.balanceOf(claimant.address)).to.equal(claimantAward);
    expect(await usdc.balanceOf(payee.address)).to.equal(payeeAward);
  });
});

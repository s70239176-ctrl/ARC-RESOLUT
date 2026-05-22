import { expect } from "chai";
import { ethers } from "hardhat";

describe("Circle Court agreement", function () {
  async function deployFixture() {
    const [owner, agentA, agentB, juryBridge] = await ethers.getSigners();
    const MockUsdc = await ethers.getContractFactory("MockUSDC");
    const usdc = await MockUsdc.deploy();
    await usdc.waitForDeployment();

    const Registry = await ethers.getContractFactory("CircleCourtRegistry");
    const registry = await Registry.deploy(owner.address, await usdc.getAddress(), juryBridge.address);
    await registry.waitForDeployment();

    const amount = ethers.parseUnits("750", 6);
    await usdc.mint(agentA.address, amount);
    await usdc.connect(agentA).approve(await registry.getAddress(), amount);

    await registry
      .connect(agentA)
      .createAgreement(agentB.address, amount, 0, 0, ethers.id("statement"), ethers.id("guidelines"), ethers.id("evidence-rules"), "ipfs://agreement");
    const record = await registry.agreements(0);
    const agreement = await ethers.getContractAt("CircleCourtAgreement", record.agreement);

    return { owner, agentA, agentB, juryBridge, usdc, registry, agreement, amount };
  }

  it("accepts and resolves instantly when both agents match outcomes", async function () {
    const { agentA, agentB, usdc, agreement, amount } = await deployFixture();

    await expect(agreement.connect(agentB).acceptAgreement()).to.emit(agreement, "AgreementAccepted");

    const agentAAmount = ethers.parseUnits("250", 6);
    const agentBAmount = amount - agentAAmount;
    const outcomeHash = ethers.id("split-250-500");

    await expect(agreement.connect(agentA).proposeOutcome(outcomeHash, agentB.address, agentAAmount, agentBAmount, "ipfs://outcome-a")).to.emit(
      agreement,
      "OutcomeProposed"
    );
    await expect(agreement.connect(agentB).proposeOutcome(outcomeHash, agentB.address, agentAAmount, agentBAmount, "ipfs://outcome-b")).to.emit(
      agreement,
      "OutcomeConfirmed"
    );

    await agreement.connect(agentA).claimFunds();
    await agreement.connect(agentB).claimFunds();
    expect(await usdc.balanceOf(agentA.address)).to.equal(agentAAmount);
    expect(await usdc.balanceOf(agentB.address)).to.equal(agentBAmount);
  });

  it("lets the jury bridge resolve a disputed agreement and parties claim", async function () {
    const { agentA, agentB, juryBridge, usdc, agreement, amount } = await deployFixture();

    await agreement.connect(agentB).acceptAgreement();
    await expect(agreement.connect(agentA).raiseDispute("ipfs://reason")).to.emit(agreement, "DisputeRaised");
    await expect(agreement.connect(agentA).submitEvidence("ipfs://agent-a-evidence")).to.emit(agreement, "EvidenceSubmitted");
    await expect(agreement.connect(agentB).submitEvidence("ipfs://agent-b-evidence")).to.emit(agreement, "EvidenceSubmitted");

    const agentAAmount = ethers.parseUnits("300", 6);
    const agentBAmount = amount - agentAAmount;
    await expect(agreement.connect(juryBridge).submitJuryVerdict(ethers.id("jury-verdict"), agentB.address, agentAAmount, agentBAmount, "ipfs://verdict")).to.emit(
      agreement,
      "JuryVerdictSubmitted"
    );

    await agreement.connect(agentA).claimFunds();
    await agreement.connect(agentB).claimFunds();
    expect(await usdc.balanceOf(agentA.address)).to.equal(agentAAmount);
    expect(await usdc.balanceOf(agentB.address)).to.equal(agentBAmount);
  });
});

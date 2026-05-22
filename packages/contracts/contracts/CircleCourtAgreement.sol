// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract CircleCourtAgreement is ReentrancyGuard {
    using SafeERC20 for IERC20;

    enum Status {
        Created,
        Funded,
        Accepted,
        OutcomeProposed,
        Disputed,
        JuryResolved,
        Resolved,
        Claimed
    }

    struct Outcome {
        bytes32 outcomeHash;
        address winner;
        uint256 agentAAmount;
        uint256 agentBAmount;
        string uri;
        bool exists;
    }

    IERC20 public immutable usdc;
    address public immutable factory;
    address public immutable agentA;
    address public immutable agentB;
    address public immutable juryBridge;
    uint256 public immutable escrowAmount;
    uint256 public immutable joinDeadlineAt;
    uint256 public immutable evidenceWindow;
    bytes32 public immutable statementHash;
    bytes32 public immutable guidelinesHash;
    bytes32 public immutable evidenceRulesHash;
    string public metadataUri;
    Status public status;
    uint256 public disputeRaisedAt;

    mapping(address => Outcome) public outcomes;
    mapping(address => uint256) public claimable;
    mapping(address => bool) public claimed;
    bytes32 public finalOutcomeHash;
    bytes32 public juryVerdictHash;

    event EscrowFunded(address indexed agentA, uint256 amount);
    event AgreementAccepted(address indexed agentB);
    event OutcomeProposed(address indexed proposer, bytes32 indexed outcomeHash, address winner, uint256 agentAAmount, uint256 agentBAmount, string uri);
    event OutcomeConfirmed(address indexed confirmer, address indexed proposer, bytes32 indexed outcomeHash);
    event DisputeRaised(address indexed actor, string reasonUri);
    event EvidenceSubmitted(address indexed actor, string evidenceUri);
    event JuryVerdictSubmitted(bytes32 indexed verdictHash, address winner, uint256 agentAAmount, uint256 agentBAmount, string uri);
    event FundsClaimed(address indexed claimant, uint256 amount);

    modifier onlyFactory() {
        require(msg.sender == factory, "ONLY_FACTORY");
        _;
    }

    modifier onlyParty() {
        require(msg.sender == agentA || msg.sender == agentB, "ONLY_PARTY");
        _;
    }

    constructor(
        address usdc_,
        address factory_,
        address agentA_,
        address agentB_,
        address juryBridge_,
        uint256 escrowAmount_,
        uint256 joinDeadlineSeconds_,
        uint256 evidenceWindowSeconds_,
        bytes32 statementHash_,
        bytes32 guidelinesHash_,
        bytes32 evidenceRulesHash_,
        string memory metadataUri_
    ) {
        require(usdc_ != address(0), "USDC_REQUIRED");
        require(factory_ != address(0), "FACTORY_REQUIRED");
        require(agentA_ != address(0) && agentB_ != address(0), "PARTY_REQUIRED");
        require(juryBridge_ != address(0), "BRIDGE_REQUIRED");
        require(escrowAmount_ > 0, "AMOUNT_REQUIRED");

        usdc = IERC20(usdc_);
        factory = factory_;
        agentA = agentA_;
        agentB = agentB_;
        juryBridge = juryBridge_;
        escrowAmount = escrowAmount_;
        joinDeadlineAt = joinDeadlineSeconds_ == 0 ? 0 : block.timestamp + joinDeadlineSeconds_;
        evidenceWindow = evidenceWindowSeconds_;
        statementHash = statementHash_;
        guidelinesHash = guidelinesHash_;
        evidenceRulesHash = evidenceRulesHash_;
        metadataUri = metadataUri_;
        status = Status.Created;
    }

    function markEscrowFunded() external onlyFactory {
        require(status == Status.Created, "INVALID_STATUS");
        require(usdc.balanceOf(address(this)) >= escrowAmount, "NOT_FUNDED");
        status = Status.Funded;
        emit EscrowFunded(agentA, escrowAmount);
    }

    function acceptAgreement() external {
        require(msg.sender == agentB, "ONLY_AGENT_B");
        require(status == Status.Funded, "INVALID_STATUS");
        require(joinDeadlineAt == 0 || block.timestamp <= joinDeadlineAt, "JOIN_DEADLINE_PASSED");
        status = Status.Accepted;
        emit AgreementAccepted(msg.sender);
    }

    function proposeOutcome(bytes32 outcomeHash, address winner, uint256 agentAAmount, uint256 agentBAmount, string calldata uri) external onlyParty {
        require(status == Status.Accepted || status == Status.OutcomeProposed, "INVALID_STATUS");
        require(agentAAmount + agentBAmount == escrowAmount, "PAYOUT_MISMATCH");
        require(winner == agentA || winner == agentB || winner == address(0), "BAD_WINNER");

        outcomes[msg.sender] = Outcome({
            outcomeHash: outcomeHash,
            winner: winner,
            agentAAmount: agentAAmount,
            agentBAmount: agentBAmount,
            uri: uri,
            exists: true
        });

        address other = msg.sender == agentA ? agentB : agentA;
        if (outcomes[other].exists && outcomes[other].outcomeHash == outcomeHash) {
            _resolve(outcomeHash, agentAAmount, agentBAmount);
            emit OutcomeConfirmed(msg.sender, other, outcomeHash);
        } else {
            status = Status.OutcomeProposed;
        }

        emit OutcomeProposed(msg.sender, outcomeHash, winner, agentAAmount, agentBAmount, uri);
    }

    function confirmOutcome(address proposer) external onlyParty {
        require(proposer == agentA || proposer == agentB, "BAD_PROPOSER");
        require(proposer != msg.sender, "CANNOT_CONFIRM_SELF");
        require(status == Status.OutcomeProposed, "INVALID_STATUS");
        Outcome memory proposed = outcomes[proposer];
        require(proposed.exists, "NO_OUTCOME");
        _resolve(proposed.outcomeHash, proposed.agentAAmount, proposed.agentBAmount);
        emit OutcomeConfirmed(msg.sender, proposer, proposed.outcomeHash);
    }

    function raiseDispute(string calldata reasonUri) external onlyParty {
        require(status == Status.Accepted || status == Status.OutcomeProposed, "INVALID_STATUS");
        disputeRaisedAt = block.timestamp;
        status = Status.Disputed;
        emit DisputeRaised(msg.sender, reasonUri);
    }

    function submitEvidence(string calldata evidenceUri) external onlyParty {
        require(status == Status.Disputed, "NOT_DISPUTED");
        require(evidenceWindow == 0 || block.timestamp <= disputeRaisedAt + evidenceWindow, "EVIDENCE_DEADLINE_PASSED");
        emit EvidenceSubmitted(msg.sender, evidenceUri);
    }

    function submitJuryVerdict(bytes32 verdictHash, address winner, uint256 agentAAmount, uint256 agentBAmount, string calldata uri) external {
        require(msg.sender == juryBridge, "ONLY_JURY_BRIDGE");
        require(status == Status.Disputed, "NOT_DISPUTED");
        require(agentAAmount + agentBAmount == escrowAmount, "PAYOUT_MISMATCH");
        require(winner == agentA || winner == agentB || winner == address(0), "BAD_WINNER");
        juryVerdictHash = verdictHash;
        claimable[agentA] = agentAAmount;
        claimable[agentB] = agentBAmount;
        status = Status.JuryResolved;
        emit JuryVerdictSubmitted(verdictHash, winner, agentAAmount, agentBAmount, uri);
    }

    function claimFunds() external nonReentrant onlyParty {
        require(status == Status.Resolved || status == Status.JuryResolved, "NOT_RESOLVED");
        require(!claimed[msg.sender], "ALREADY_CLAIMED");
        uint256 amount = claimable[msg.sender];
        require(amount > 0, "NOTHING_TO_CLAIM");
        claimed[msg.sender] = true;
        usdc.safeTransfer(msg.sender, amount);
        if (claimed[agentA] || claimable[agentA] == 0) {
            if (claimed[agentB] || claimable[agentB] == 0) {
                status = Status.Claimed;
            }
        }
        emit FundsClaimed(msg.sender, amount);
    }

    function _resolve(bytes32 outcomeHash, uint256 agentAAmount, uint256 agentBAmount) internal {
        require(agentAAmount + agentBAmount == escrowAmount, "PAYOUT_MISMATCH");
        finalOutcomeHash = outcomeHash;
        claimable[agentA] = agentAAmount;
        claimable[agentB] = agentBAmount;
        status = Status.Resolved;
    }
}

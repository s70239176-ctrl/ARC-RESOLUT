// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {CircleCourtAgreement} from "./CircleCourtAgreement.sol";

contract CircleCourtRegistry is Ownable {
    using SafeERC20 for IERC20;

    struct AgreementRecord {
        address agreement;
        address agentA;
        address agentB;
        uint256 amount;
        uint256 joinDeadlineSeconds;
        uint256 evidenceWindowSeconds;
        bytes32 statementHash;
        bytes32 guidelinesHash;
        bytes32 evidenceRulesHash;
        string metadataUri;
        uint256 createdAt;
    }

    IERC20 public immutable usdc;
    address public juryBridge;
    AgreementRecord[] public agreements;

    event AgreementCreated(
        uint256 indexed id,
        address indexed agreement,
        address indexed agentA,
        address agentB,
        uint256 amount,
        uint256 joinDeadlineSeconds,
        uint256 evidenceWindowSeconds,
        bytes32 statementHash,
        bytes32 guidelinesHash,
        bytes32 evidenceRulesHash,
        string metadataUri
    );
    event JuryBridgeUpdated(address indexed juryBridge);

    constructor(address owner_, address usdc_, address juryBridge_) Ownable(owner_) {
        require(usdc_ != address(0), "USDC_REQUIRED");
        require(juryBridge_ != address(0), "BRIDGE_REQUIRED");
        usdc = IERC20(usdc_);
        juryBridge = juryBridge_;
    }

    function setJuryBridge(address juryBridge_) external onlyOwner {
        require(juryBridge_ != address(0), "BRIDGE_REQUIRED");
        juryBridge = juryBridge_;
        emit JuryBridgeUpdated(juryBridge_);
    }

    function createAgreement(
        address agentB,
        uint256 amount,
        uint256 joinDeadlineSeconds,
        uint256 evidenceWindowSeconds,
        bytes32 statementHash,
        bytes32 guidelinesHash,
        bytes32 evidenceRulesHash,
        string calldata metadataUri
    ) external returns (address agreement) {
        require(agentB != address(0), "AGENT_B_REQUIRED");
        require(msg.sender != agentB, "PARTIES_MUST_DIFFER");
        require(amount > 0, "AMOUNT_REQUIRED");

        agreement = address(new CircleCourtAgreement(
            address(usdc),
            address(this),
            msg.sender,
            agentB,
            juryBridge,
            amount,
            joinDeadlineSeconds,
            evidenceWindowSeconds,
            statementHash,
            guidelinesHash,
            evidenceRulesHash,
            metadataUri
        ));

        usdc.safeTransferFrom(msg.sender, agreement, amount);
        CircleCourtAgreement(agreement).markEscrowFunded();

        agreements.push(AgreementRecord({
            agreement: agreement,
            agentA: msg.sender,
            agentB: agentB,
            amount: amount,
            joinDeadlineSeconds: joinDeadlineSeconds,
            evidenceWindowSeconds: evidenceWindowSeconds,
            statementHash: statementHash,
            guidelinesHash: guidelinesHash,
            evidenceRulesHash: evidenceRulesHash,
            metadataUri: metadataUri,
            createdAt: block.timestamp
        }));

        emit AgreementCreated(agreements.length - 1, agreement, msg.sender, agentB, amount, joinDeadlineSeconds, evidenceWindowSeconds, statementHash, guidelinesHash, evidenceRulesHash, metadataUri);
    }

    function agreementCount() external view returns (uint256) {
        return agreements.length;
    }
}

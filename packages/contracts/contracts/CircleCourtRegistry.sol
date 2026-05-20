// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {CircleCourtEscrow} from "./CircleCourtEscrow.sol";

contract CircleCourtRegistry is Ownable {
    struct EscrowRecord {
        address escrow;
        address payer;
        address payee;
        uint256 amount;
        bytes32 termsHash;
        string metadataUri;
        uint256 createdAt;
    }

    address public immutable usdc;
    EscrowRecord[] public escrows;

    event EscrowCreated(uint256 indexed id, address indexed escrow, address indexed payer, address payee, uint256 amount, bytes32 termsHash, string metadataUri);

    constructor(address owner_, address usdc_) Ownable(owner_) {
        require(usdc_ != address(0), "USDC_REQUIRED");
        usdc = usdc_;
    }

    function createEscrow(address payer, address payee, uint256 amount, bytes32 termsHash, string calldata metadataUri) external returns (address escrow) {
        require(msg.sender == payer, "PAYER_MUST_CREATE");
        escrow = address(new CircleCourtEscrow(address(this), usdc, payer, payee, amount, termsHash));
        escrows.push(EscrowRecord({
            escrow: escrow,
            payer: payer,
            payee: payee,
            amount: amount,
            termsHash: termsHash,
            metadataUri: metadataUri,
            createdAt: block.timestamp
        }));
        emit EscrowCreated(escrows.length - 1, escrow, payer, payee, amount, termsHash, metadataUri);
    }

    function resolveEscrow(uint256 id, bytes32 verdictHash, CircleCourtEscrow.Payout[] calldata payouts) external onlyOwner {
        require(id < escrows.length, "ESCROW_NOT_FOUND");
        CircleCourtEscrow(escrows[id].escrow).resolve(verdictHash, payouts);
    }

    function escrowCount() external view returns (uint256) {
        return escrows.length;
    }
}

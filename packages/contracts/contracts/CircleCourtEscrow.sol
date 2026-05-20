// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract CircleCourtEscrow is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    enum Status {
        Created,
        Funded,
        Disputed,
        Resolved,
        Appealed,
        Cancelled
    }

    struct Payout {
        address recipient;
        uint256 amount;
    }

    IERC20 public immutable usdc;
    address public immutable payer;
    address public immutable payee;
    uint256 public immutable amount;
    bytes32 public immutable termsHash;
    Status public status;
    bytes32 public verdictHash;

    event Funded(address indexed payer, uint256 amount);
    event Disputed(address indexed actor, string evidenceUri);
    event Appealed(address indexed actor, string reasonUri);
    event Resolved(bytes32 indexed verdictHash, Payout[] payouts);
    event Cancelled(address indexed actor);

    constructor(address owner_, address usdc_, address payer_, address payee_, uint256 amount_, bytes32 termsHash_) Ownable(owner_) {
        require(usdc_ != address(0), "USDC_REQUIRED");
        require(payer_ != address(0) && payee_ != address(0), "PARTY_REQUIRED");
        require(amount_ > 0, "AMOUNT_REQUIRED");
        usdc = IERC20(usdc_);
        payer = payer_;
        payee = payee_;
        amount = amount_;
        termsHash = termsHash_;
        status = Status.Created;
    }

    function fund() external nonReentrant {
        require(status == Status.Created, "INVALID_STATUS");
        usdc.safeTransferFrom(msg.sender, address(this), amount);
        status = Status.Funded;
        emit Funded(msg.sender, amount);
    }

    function openDispute(string calldata evidenceUri) external {
        require(msg.sender == payer || msg.sender == payee || msg.sender == owner(), "NOT_PARTY");
        require(status == Status.Funded, "INVALID_STATUS");
        status = Status.Disputed;
        emit Disputed(msg.sender, evidenceUri);
    }

    function appeal(string calldata reasonUri) external {
        require(msg.sender == payer || msg.sender == payee, "NOT_PARTY");
        require(status == Status.Resolved, "NOT_RESOLVED");
        status = Status.Appealed;
        emit Appealed(msg.sender, reasonUri);
    }

    function resolve(bytes32 verdictHash_, Payout[] calldata payouts) external onlyOwner nonReentrant {
        require(status == Status.Funded || status == Status.Disputed || status == Status.Appealed, "INVALID_STATUS");
        uint256 total;
        for (uint256 i = 0; i < payouts.length; i++) {
            require(payouts[i].recipient != address(0), "BAD_RECIPIENT");
            total += payouts[i].amount;
        }
        require(total == usdc.balanceOf(address(this)), "PAYOUT_MISMATCH");
        verdictHash = verdictHash_;
        status = Status.Resolved;
        for (uint256 i = 0; i < payouts.length; i++) {
            usdc.safeTransfer(payouts[i].recipient, payouts[i].amount);
        }
        emit Resolved(verdictHash_, payouts);
    }

    function cancel() external onlyOwner {
        require(status == Status.Created, "INVALID_STATUS");
        status = Status.Cancelled;
        emit Cancelled(msg.sender);
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Commits a digest before execution and records later receipt digests.
/// No service-completion claim is inferred from these commitments.
contract DealRegistry {
    struct Deal {
        address proposer;
        address counterparty;
        uint64 proposedBlock;
        uint64 agreedBlock;
        bool agreed;
    }

    mapping(bytes32 => Deal) public deals;
    mapping(bytes32 => bytes32[]) private receiptDigests;

    event AgreementProposed(bytes32 indexed agreementHash, address indexed proposer, address indexed counterparty);
    event AgreementAccepted(bytes32 indexed agreementHash, address indexed counterparty);
    event ReceiptRecorded(bytes32 indexed agreementHash, bytes32 indexed receiptHash, address indexed submitter);

    function propose(bytes32 agreementHash, address counterparty) external {
        require(agreementHash != bytes32(0), "empty hash");
        require(counterparty != address(0) && counterparty != msg.sender, "invalid counterparty");
        require(deals[agreementHash].proposer == address(0), "already proposed");
        deals[agreementHash] = Deal(msg.sender, counterparty, uint64(block.number), 0, false);
        emit AgreementProposed(agreementHash, msg.sender, counterparty);
    }

    function accept(bytes32 agreementHash) external {
        Deal storage deal = deals[agreementHash];
        require(deal.counterparty == msg.sender, "not counterparty");
        require(!deal.agreed, "already agreed");
        deal.agreed = true;
        deal.agreedBlock = uint64(block.number);
        emit AgreementAccepted(agreementHash, msg.sender);
    }

    function recordReceipt(bytes32 agreementHash, bytes32 receiptHash) external {
        Deal storage deal = deals[agreementHash];
        require(deal.agreed, "agreement not accepted");
        require(msg.sender == deal.proposer || msg.sender == deal.counterparty, "not a party");
        require(receiptHash != bytes32(0), "empty receipt hash");
        receiptDigests[agreementHash].push(receiptHash);
        emit ReceiptRecorded(agreementHash, receiptHash, msg.sender);
    }

    function receiptCount(bytes32 agreementHash) external view returns (uint256) {
        return receiptDigests[agreementHash].length;
    }

    function receiptAt(bytes32 agreementHash, uint256 index) external view returns (bytes32) {
        return receiptDigests[agreementHash][index];
    }
}

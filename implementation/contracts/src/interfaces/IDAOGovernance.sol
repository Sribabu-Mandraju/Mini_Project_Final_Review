// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ICampaign} from "./ICampaign.sol";
interface IDAOGovernance {
    enum ProposalState {
        Active,
        Passed,
        Rejected,
        Executed
    }

    struct Proposal {
        uint256 id;
        address proposer;
        string campaignTitle;
        string campaignMetadata;
        uint256 fundsRequested;
        uint32 endTime; //proposal stays in active upto endTime
        uint8 forVotes;
        uint8 againstVotes;
        ProposalState state;
    }

    event ProposalCreated(uint256 proposalId, address proposer);
    event Voted(uint256 indexed proposalId, address voter, bool support);
    event ProposalPassed(uint256 indexed proposalId);
    event ProposalExecuted(uint256 indexed proposalId, address campaignAddress);

    event DAOMemberAdded(address member);
    event DAOMemberRemoved(address member);

    function createProposal(string memory campaignTitle, string memory metadata, uint256 fundsRequested)
        external
        returns (uint256);
    function vote(uint256 proposalId, bool support) external;
    function getProposal(uint256 proposalId) external view returns (Proposal memory);
    function hasVoted(uint256 proposalId, address voter) external view returns (bool);
    function extecuteProposal(
        uint256 proposalId,
        ICampaign.CampaignDetails calldata details,
        uint32 donationPeriod,
        uint32 registrationPeriod,
        uint32 waitingPeriod,
        uint32 distributionPeriod
    ) external;
    function isProposalPassed(uint256 proposalId) external view returns (bool);
    function setFundEscrow(address fundEscrowAddress) external;
    function addDAOMember(address _member) external;
    function removeDAOMember(address _member) external;
}

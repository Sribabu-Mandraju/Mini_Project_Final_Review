// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IDAOGovernance} from "./interfaces/IDAOGovernance.sol";
import {IDisasterReliefFactory} from "./interfaces/IDisasterReliefFactory.sol";
import {IEscrow} from "./interfaces/IEscrow.sol";
import {ICampaign} from "./interfaces/ICampaign.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract DAOGovernance is IDAOGovernance, Ownable {
    mapping(address => bool) public isDAOMember;
    address[] public daoMembers;

    uint256 private _nextProposalId;

    mapping(uint256 => Proposal) private _proposals; //mapping from proposalId to Proposal details
    mapping(uint256 => mapping(address => bool)) private _hasVoted;

    // governance parameters
    uint32 public votingPeriod = 2 days;

    IDisasterReliefFactory public disasterReliefFactory;
    IEscrow public fundEscrow;

    address public operator; //handles the fund management in case if there is not enough fund in the escrow

    modifier onlyOperator() {
        require(msg.sender == operator, "Unauthorized");
        _;
    }

    modifier onlyDAOMember() {
        require(isDAOMember[msg.sender], "Unauthorized");
        _;
    }

    constructor(address initialOwner, address _operator) Ownable(initialOwner) {
        require(_operator != address(0), "zero address");
        operator = _operator;
    }

    function setDisasterReliefFactory(address _factory) external onlyOwner {
        require(_factory != address(0), "zero address");
        disasterReliefFactory = IDisasterReliefFactory(_factory);
    }

    function setFundEscrow(address _escrow) external override onlyOwner {
        require(_escrow != address(0), "zero address");
        fundEscrow = IEscrow(_escrow);
    }

    function addDAOMember(address member) external override onlyOwner {
        if (isDAOMember[member]) {
            revert("Members Exists");
        }
        isDAOMember[member] = true;
        daoMembers.push(member);
        emit DAOMemberAdded(member);
    }

    function removeDAOMember(address member) external override onlyOwner {
        if (!isDAOMember[member]) {
            revert("Members Doesn't Exists");
        }
        isDAOMember[member] = false;
        _deleteMember(member);

        emit DAOMemberRemoved(member);
    }

    function _deleteMember(address member) internal {
        uint256 len = daoMembers.length;
        uint256 index = 0;
        for (uint256 i = 0; i < len; i++) {
            if (daoMembers[i] == member) {
                index = i;
                break;
            }
        }
        //swap logic
        daoMembers[index] = daoMembers[len - 1];
        daoMembers.pop();
    }

    function createProposal(string memory _campaignTitle, string memory metadata, uint256 _fundsRequested)
        external
        override
        onlyDAOMember
        returns (uint256)
    {
        uint256 _id = ++_nextProposalId;

        _proposals[_id] = Proposal({
            id: _id,
            proposer: msg.sender,
            campaignTitle: _campaignTitle,
            campaignMetadata: metadata,
            fundsRequested: _fundsRequested,
            endTime: uint32(block.timestamp) + votingPeriod,
            forVotes: 0,
            againstVotes: 0,
            state: ProposalState.Active
        });

        emit ProposalCreated(_id, msg.sender);
        return _id;
    }

    function vote(uint256 proposalId, bool support) external override onlyDAOMember {
        Proposal storage proposal = _proposals[proposalId];
        require(proposal.state == ProposalState.Active, "Proposal Not Active");
        require(block.timestamp < proposal.endTime, "Voting period has ended");
        require(!_hasVoted[proposalId][msg.sender], "Already voted");

        _hasVoted[proposalId][msg.sender] = true;

        if (support) {
            proposal.forVotes++;

            if (checkProposalPassed(proposalId)) {
                proposal.state = ProposalState.Passed;
                emit ProposalPassed(proposalId);
            }
        } else {
            proposal.againstVotes++;
        }
        emit Voted(proposalId, msg.sender, support);
    }

    // trusted operator needs to view the campaignMetadata in the corresponding proposal in offchain and then needs to call this functions in a trusted manner.
    function extecuteProposal(
        uint256 proposalId,
        ICampaign.CampaignDetails calldata details,
        uint32 donationPeriod,
        uint32 registrationPeriod,
        uint32 waitingPeriod,
        uint32 distributionPeriod
    ) external override onlyOperator {
        Proposal storage proposal = _proposals[proposalId];
        require(proposal.state == ProposalState.Passed, "Proposal does not exist");

        address campaign = disasterReliefFactory.deployCampaign(details, donationPeriod, registrationPeriod, waitingPeriod, distributionPeriod);
        uint256 escrowBalance = fundEscrow.getBalance();
        require(escrowBalance>= proposal.fundsRequested, "Insufficient funds in escrow");
        proposal.state = ProposalState.Executed;
        fundEscrow.allocateFunds(campaign, proposal.fundsRequested);
        emit ProposalExecuted(proposalId, campaign);
    }

    function checkProposalPassed(uint256 proposalId) internal view returns (bool) {
        Proposal memory proposal = _proposals[proposalId];
        require(proposal.state == ProposalState.Active, "Proposal is Not Active");
        // check the for Vote count is satisfied
        if (proposal.forVotes >= calculateRequiredVotes()) {
            return true;
        } else if (proposal.againstVotes >= calculateRequiredVotes()) {
            //check for proposal rejection
            proposal.state = ProposalState.Rejected;
            return false;
        }
        return false;
    }

    function isProposalPassed(uint256 proposalId) external view override returns (bool) {
        return checkProposalPassed(proposalId);
    }

    // Atleast 60% of the totalMembers should vote
    function calculateRequiredVotes() internal view returns (uint256 votes) {
        uint256 totalMembers = daoMembers.length;
        return (60 * totalMembers + 99) / 100;
    }

    function getProposal(uint256 proposalId) external view override returns (Proposal memory) {
        if (_proposals[proposalId].id == 0) {
            revert("Proposal Doesn't exist");
        }
        return _proposals[proposalId];
    }

    function hasVoted(uint256 proposalId, address voter) external view returns (bool) {
        return _hasVoted[proposalId][voter];
    }

}

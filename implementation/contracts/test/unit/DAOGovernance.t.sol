// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";

import {DAOGovernance} from "../../src/DAOGovernance.sol";
import {IDAOGovernance} from "../../src/interfaces/IDAOGovernance.sol";
import {ICampaign} from "../../src/interfaces/ICampaign.sol";

contract DAOGovernanceUnitTest is Test {
    struct CampaignDetails {
        uint256 campaignId;
        string title;
        string descriptionURI; //URI on ipfs that maps details about campaign
        uint32[] pincodes; //eligible pincodes of campaign
        CampaignState state;
    }

    enum CampaignState {
        Donation,
        Registration,
        Waiting,
        Distribution,
        Closed
    }

    address internal owner = makeAddr("owner");
    address internal operator = makeAddr("operator");
    address internal member1 = makeAddr("member1");
    address internal member2 = makeAddr("member2");
    address internal outsider = makeAddr("outsider");

    DAOGovernance internal dao;

    function setUp() public {
        vm.prank(owner);
        dao = new DAOGovernance(owner, operator);

        vm.startPrank(owner);
        dao.addDAOMember(member1);
        dao.addDAOMember(member2);
        vm.stopPrank();
    }

    function testOnlyDaoMemberCanCreateProposal() public {
        vm.prank(outsider);
        vm.expectRevert("Unauthorized");
        dao.createProposal("x", "ipfs://x", 100_000000);

        vm.prank(member1);
        uint256 id = dao.createProposal("x", "ipfs://x", 100_000000);
        assertEq(id, 1);
    }

    function testVoteAndPassProposal() public {
        vm.prank(member1);
        uint256 id = dao.createProposal("x", "ipfs://x", 100_000000);

        vm.prank(member1);
        dao.vote(id, true);
        vm.prank(member2);
        dao.vote(id, true);

        IDAOGovernance.Proposal memory proposal = dao.getProposal(id);
        assertEq(
            uint256(proposal.state),
            uint256(IDAOGovernance.ProposalState.Passed)
        );
        assertEq(proposal.forVotes, 2);
    }

    function testCannotVoteTwice() public {
        vm.prank(member1);
        uint256 id = dao.createProposal("x", "ipfs://x", 100_000000);

        vm.startPrank(member1);
        dao.vote(id, true);
        vm.expectRevert("Already voted");
        dao.vote(id, true);
        vm.stopPrank();
    }

    // function testCreateCampaign() public {
    //     address operator = 0x30217A8C17EF5571639948D118D086c73f823058;

    //     vm.startPrank(operator);

    //     DAOGovernance daoGovernance = DAOGovernance(
    //         0xC0Ba65508DdBd3f0eC2BC8068Df083eCf5664260
    //     );

    //     uint256 proposalId = 1;

    //     uint32[] memory pincodes=new uint32[](3);
    //     pincodes[0] = 521101;
    //     pincodes[1] = 521107;
    //     pincodes[2] = 521110;

    //     ICampaign.CampaignDetails memory details = ICampaign.CampaignDetails({
    //         campaignId: 1,
    //         title: "Hudhuth",
    //         descriptionURI: "ipfs://QmXmkmq3aZmvVro9XCwstW8vuXHvQZZg9jJRNAB19aNVBR",
    //         pincodes: pincodes,
    //         state: ICampaign.CampaignState.Donation
    //     });

    //     uint32 donationPeriod = 7 days;
    //     uint32 registrationPeriod = 5 days;
    //     uint32 waitingPeriod = 2 days;
    //     uint32 distributionPeriod = 5 days;

    //     daoGovernance.extecuteProposal(
    //         proposalId,
    //         details,
    //         donationPeriod,
    //         registrationPeriod,
    //         waitingPeriod,
    //         distributionPeriod
    //     );

    //     vm.stopPrank();
    // }
}

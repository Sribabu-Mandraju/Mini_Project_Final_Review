// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";

import {Campaign} from "../../src/Campaign.sol";
import {CampaignDonorBadge} from "../../src/CampaignDonorBadge.sol";
import {DAOGovernance} from "../../src/DAOGovernance.sol";
import {DisasterReliefFactory} from "../../src/DisasterReliefFactory.sol";
import {Escrow} from "../../src/Escrow.sol";
import {GeneralDonorBadge} from "../../src/GeneralDonorBadge.sol";
import {ICampaign} from "../../src/interfaces/ICampaign.sol";
import {TestUSDC, TestAnonAadhaar} from "../helpers/TestMocks.sol";

contract ApplicationIntegrationTest is Test {
    address internal owner = makeAddr("owner");
    address internal operator = makeAddr("operator");
    address internal daoMember1 = makeAddr("daoMember1");
    address internal daoMember2 = makeAddr("daoMember2");
    address internal donor = makeAddr("donor");
    address internal victim = makeAddr("victim");

    TestUSDC internal usdc;
    TestAnonAadhaar internal anon;
    GeneralDonorBadge internal generalBadge;
    CampaignDonorBadge internal campaignBadge;
    DAOGovernance internal dao;
    DisasterReliefFactory internal factory;
    Escrow internal escrow;

    function setUp() public {
        usdc = new TestUSDC();
        anon = new TestAnonAadhaar();

        vm.prank(owner);
        generalBadge = new GeneralDonorBadge(owner);
        vm.prank(owner);
        campaignBadge = new CampaignDonorBadge(owner);
        vm.prank(owner);
        dao = new DAOGovernance(owner, operator);
        vm.prank(owner);
        factory = new DisasterReliefFactory(owner, address(dao), address(anon), address(usdc), address(campaignBadge));
        escrow = new Escrow(address(factory), address(generalBadge), address(dao), address(usdc));

        vm.startPrank(owner);
        dao.setDisasterReliefFactory(address(factory));
        dao.setFundEscrow(address(escrow));
        dao.addDAOMember(daoMember1);
        dao.addDAOMember(daoMember2);
        generalBadge.updateEscrow(address(escrow));
        campaignBadge.updateFactory(address(factory));
        vm.stopPrank();

        usdc.mint(donor, 1_000_000_000);
        vm.prank(donor);
        usdc.approve(address(escrow), type(uint256).max);
    }

    function testEndToEndDonationRegistrationClaim() public {
        vm.prank(donor);
        escrow.donate(300_000000);

        vm.prank(address(dao));
        factory.deployCampaign(_details(), 1, 100, 100, 100);
        address campaignAddr = factory.campaigns(0);
        Campaign campaign = Campaign(campaignAddr);

        vm.prank(address(dao));
        escrow.allocateFunds(campaignAddr, 100_000000);

        vm.prank(donor);
        usdc.approve(campaignAddr, type(uint256).max);
        vm.prank(donor);
        campaign.donate(20_000000);

        vm.warp(block.timestamp + 2);
        uint256[4] memory reveal = [uint256(0), uint256(0), uint256(560001), uint256(0)];
        uint256[8] memory proof;
        uint256 signal = uint256(uint160(victim));

        vm.prank(victim);
        campaign.registerAsVictim(1, 2, block.timestamp, signal, reveal, proof);
        vm.prank(victim);
        campaign.claimFund();

        assertEq(usdc.balanceOf(victim), 20_000000);
    }

    function testDaoProposalFlowExecutesCampaignAndAllocatesFunds() public {
        vm.prank(donor);
        escrow.donate(300_000000);

        vm.prank(daoMember1);
        uint256 proposalId = dao.createProposal("Flood", "ipfs://proposal", 100_000000);
        vm.prank(daoMember1);
        dao.vote(proposalId, true);
        vm.prank(daoMember2);
        dao.vote(proposalId, true);

        vm.prank(operator);
        dao.extecuteProposal(proposalId, _details(), 1, 100, 100, 100);

        address campaign = factory.campaigns(0);
        assertTrue(factory.isCampaign(campaign));
        assertEq(usdc.balanceOf(campaign), 100_000000);
    }

    function _details() internal pure returns (ICampaign.CampaignDetails memory details) {
        uint32[] memory pincodes = new uint32[](1);
        pincodes[0] = 560001;
        details = ICampaign.CampaignDetails({
            campaignId: 1,
            title: "Flood Relief",
            descriptionURI: "ipfs://campaign",
            pincodes: pincodes,
            state: ICampaign.CampaignState.Donation
        });
    }
}

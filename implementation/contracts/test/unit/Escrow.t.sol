// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";

import {Escrow} from "../../src/Escrow.sol";
import {DisasterReliefFactory} from "../../src/DisasterReliefFactory.sol";
import {CampaignDonorBadge} from "../../src/CampaignDonorBadge.sol";
import {GeneralDonorBadge} from "../../src/GeneralDonorBadge.sol";
import {DAOGovernance} from "../../src/DAOGovernance.sol";
import {ICampaign} from "../../src/interfaces/ICampaign.sol";
import {TestUSDC, TestAnonAadhaar} from "../helpers/TestMocks.sol";

contract EscrowUnitTest is Test {
    uint256 internal constant TEN_USDC = 10_000000;

    address internal owner = makeAddr("owner");
    address internal operator = makeAddr("operator");
    address internal donor = makeAddr("donor");
    address internal outsider = makeAddr("outsider");

    TestUSDC internal usdc;
    TestAnonAadhaar internal anon;
    DAOGovernance internal dao;
    CampaignDonorBadge internal campaignBadge;
    GeneralDonorBadge internal generalBadge;
    DisasterReliefFactory internal factory;
    Escrow internal escrow;

    function setUp() public {
        usdc = new TestUSDC();
        anon = new TestAnonAadhaar();

        vm.prank(owner);
        dao = new DAOGovernance(owner, operator);

        vm.prank(owner);
        campaignBadge = new CampaignDonorBadge(owner);

        vm.prank(owner);
        generalBadge = new GeneralDonorBadge(owner);

        vm.prank(owner);
        factory = new DisasterReliefFactory(owner, address(dao), address(anon), address(usdc), address(campaignBadge));

        escrow = new Escrow(address(factory), address(generalBadge), address(dao), address(usdc));

        usdc.mint(donor, 1_000_000_000);
        vm.prank(donor);
        usdc.approve(address(escrow), type(uint256).max);
    }

    function testDonate() public {
        vm.prank(donor);
        escrow.donate(TEN_USDC);
        assertEq(escrow.getBalance(), TEN_USDC);
        assertEq(escrow.totalReceived(), TEN_USDC);
    }

    function testDonateBelowMinimumReverts() public {
        vm.prank(donor);
        vm.expectRevert("Insufficient Amount");
        escrow.donate(TEN_USDC - 1);
    }

    function testAllocateOnlyDao() public {
        vm.prank(outsider);
        vm.expectRevert("Unauthorized");
        escrow.allocateFunds(makeAddr("campaign"), TEN_USDC);
    }

    function testAllocateToValidCampaign() public {
        ICampaign.CampaignDetails memory details = _details();
        vm.prank(address(dao));
        factory.deployCampaign(details, 1 days, 1 days, 1 days, 1 days);
        address campaign = factory.campaigns(0);

        vm.prank(donor);
        escrow.donate(100_000000);

        vm.prank(address(dao));
        escrow.allocateFunds(campaign, 40_000000);

        assertEq(usdc.balanceOf(campaign), 40_000000);
        assertEq(escrow.totalAllocated(), 40_000000);
    }

    function _details() internal pure returns (ICampaign.CampaignDetails memory details) {
        uint32[] memory pincodes = new uint32[](1);
        pincodes[0] = 560001;
        details = ICampaign.CampaignDetails({
            campaignId: 1,
            title: "title",
            descriptionURI: "ipfs://x",
            pincodes: pincodes,
            state: ICampaign.CampaignState.Donation
        });
    }
}

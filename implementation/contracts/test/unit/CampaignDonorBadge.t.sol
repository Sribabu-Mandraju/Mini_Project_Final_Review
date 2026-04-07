// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";

import {CampaignDonorBadge} from "../../src/CampaignDonorBadge.sol";
import {DisasterReliefFactory} from "../../src/DisasterReliefFactory.sol";
import {ICampaign} from "../../src/interfaces/ICampaign.sol";
import {DAOGovernance} from "../../src/DAOGovernance.sol";
import {TestUSDC, TestAnonAadhaar} from "../helpers/TestMocks.sol";

contract CampaignDonorBadgeUnitTest is Test {
    address internal owner = makeAddr("owner");
    address internal operator = makeAddr("operator");
    address internal daoAddr;
    address internal recipient = makeAddr("recipient");

    TestUSDC internal usdc;
    TestAnonAadhaar internal anon;
    DAOGovernance internal dao;
    CampaignDonorBadge internal badge;
    DisasterReliefFactory internal factory;

    function setUp() public {
        usdc = new TestUSDC();
        anon = new TestAnonAadhaar();

        vm.prank(owner);
        dao = new DAOGovernance(owner, operator);
        daoAddr = address(dao);

        vm.prank(owner);
        badge = new CampaignDonorBadge(owner);

        vm.prank(owner);
        factory = new DisasterReliefFactory(owner, daoAddr, address(anon), address(usdc), address(badge));

        vm.prank(owner);
        badge.updateFactory(address(factory));
    }

    function testMintOnlyCampaign() public {
        vm.expectRevert("Unauthorized");
        badge.mint(recipient);

        ICampaign.CampaignDetails memory details = _details();
        vm.prank(daoAddr);
        factory.deployCampaign(details, 1 days, 1 days, 1 days, 1 days);
        address campaign = factory.campaigns(0);

        vm.prank(campaign);
        uint256 tokenId = badge.mint(recipient);
        assertEq(tokenId, 1);
        assertEq(badge.ownerOf(1), recipient);
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

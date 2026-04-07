// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";

import {DisasterReliefFactory} from "../../src/DisasterReliefFactory.sol";
import {CampaignDonorBadge} from "../../src/CampaignDonorBadge.sol";
import {DAOGovernance} from "../../src/DAOGovernance.sol";
import {ICampaign} from "../../src/interfaces/ICampaign.sol";
import {TestUSDC, TestAnonAadhaar} from "../helpers/TestMocks.sol";

contract DisasterReliefFactoryUnitTest is Test {
    address internal owner = makeAddr("owner");
    address internal operator = makeAddr("operator");
    address internal outsider = makeAddr("outsider");

    TestUSDC internal usdc;
    TestAnonAadhaar internal anon;
    CampaignDonorBadge internal badge;
    DAOGovernance internal dao;
    DisasterReliefFactory internal factory;

    function setUp() public {
        usdc = new TestUSDC();
        anon = new TestAnonAadhaar();

        vm.prank(owner);
        dao = new DAOGovernance(owner, operator);

        vm.prank(owner);
        badge = new CampaignDonorBadge(owner);

        vm.prank(owner);
        factory = new DisasterReliefFactory(owner, address(dao), address(anon), address(usdc), address(badge));

        vm.prank(owner);
        badge.updateFactory(address(factory));
    }

    function testDeployCampaignOnlyDao() public {
        vm.prank(outsider);
        vm.expectRevert("Unauthorized");
        factory.deployCampaign(_details(), 1 days, 1 days, 1 days, 1 days);
    }

    function testDeployCampaignRegistersCampaign() public {
        vm.prank(address(dao));
        address returned = factory.deployCampaign(_details(), 1 days, 1 days, 1 days, 1 days);

        address deployed = factory.campaigns(0);
        assertTrue(factory.isCampaign(deployed));
        assertEq(returned, deployed);
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

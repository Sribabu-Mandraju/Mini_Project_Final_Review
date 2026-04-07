// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {GeneralDonorBadge} from "../../src/GeneralDonorBadge.sol";

contract GeneralDonorBadgeUnitTest is Test {
    address internal owner = makeAddr("owner");
    address internal escrow = makeAddr("escrow");
    address internal user = makeAddr("user");

    GeneralDonorBadge internal badge;

    function setUp() public {
        vm.prank(owner);
        badge = new GeneralDonorBadge(owner);
    }

    function testUpdateEscrowOnlyOwner() public {
        vm.prank(user);
        vm.expectRevert();
        badge.updateEscrow(escrow);

        vm.prank(owner);
        badge.updateEscrow(escrow);
        assertEq(badge.escrow(), escrow);
    }

    function testMintOnlyEscrow() public {
        vm.expectRevert("Unauthorized");
        badge.mint(user);

        vm.prank(owner);
        badge.updateEscrow(escrow);

        vm.prank(escrow);
        uint256 tokenId = badge.mint(user);
        assertEq(tokenId, 1);
        assertEq(badge.ownerOf(1), user);
    }
}

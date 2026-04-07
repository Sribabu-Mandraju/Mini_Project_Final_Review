// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script,console} from "forge-std/Script.sol";
import {Test} from "forge-std/Test.sol";
import {Escrow} from "../src/Escrow.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract AddFunds is Script {
    function run() external {
        vm.startBroadcast();
        Escrow escrow = Escrow(0x394563F080363F34E5B70afa16d369d18bf36545);
        IERC20(0x036CbD53842c5426634e7929541eC2318f3dCF7e).approve(0x394563F080363F34E5B70afa16d369d18bf36545,20000000);
        escrow.donate(20000000);
        vm.stopBroadcast();
    }
}
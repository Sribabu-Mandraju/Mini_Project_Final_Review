// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {Verifier} from "../../src/Verifier.sol";

contract VerifierUnitTest is Test {
    function testVerifyProofWithDummyInputsReturnsFalse() public {
        Verifier verifier = new Verifier();

        uint256[2] memory pA;
        uint256[2][2] memory pB;
        uint256[2] memory pC;
        uint256[9] memory pubSignals;

        bool ok = verifier.verifyProof(pA, pB, pC, pubSignals);
        assertFalse(ok);
    }
}

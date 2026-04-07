// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {AnonAadhaar} from "../../src/AnonAadhaar.sol";
import {TestGroth16Verifier} from "../helpers/TestMocks.sol";

contract AnonAadhaarUnitTest is Test {
    function testVerifyAnonAadhaarProofWithExpectedPublicInputs() public {
        TestGroth16Verifier verifier = new TestGroth16Verifier();
        uint256 pubKeyHash = 101;
        AnonAadhaar anon = new AnonAadhaar(address(verifier), pubKeyHash);

        uint256 nullifierSeed = 1;
        uint256 nullifier = 2;
        uint256 timestamp = 3;
        uint256 signal = 4;
        uint256[4] memory reveal = [uint256(11), uint256(22), uint256(33), uint256(44)];
        uint256[8] memory proof = [uint256(1), 2, 3, 4, 5, 6, 7, 8];

        uint256 signalHash = uint256(keccak256(abi.encodePacked(signal))) >> 3;
        uint256[9] memory expected = [
            pubKeyHash,
            nullifier,
            timestamp,
            reveal[0],
            reveal[1],
            reveal[2],
            reveal[3],
            nullifierSeed,
            signalHash
        ];
        verifier.setExpectedPublicInputs(expected);

        bool ok = anon.verifyAnonAadhaarProof(nullifierSeed, nullifier, timestamp, signal, reveal, proof);
        assertTrue(ok);
    }
}

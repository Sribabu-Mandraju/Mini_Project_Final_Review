// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IAnonAadhaar} from "../../src/interfaces/IAnonAadhaar.sol";
import {IAnonAadhaarGroth16Verifier} from "../../src/interfaces/IAnonAadhaarGroth16Verifier.sol";

contract TestUSDC is ERC20 {
    uint8 private immutable _tokenDecimals;

    constructor() ERC20("TestUSDC", "USDC") {
        _tokenDecimals = 6;
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    function decimals() public view override returns (uint8) {
        return _tokenDecimals;
    }
}

contract TestAnonAadhaar is IAnonAadhaar {
    bool public shouldVerify = true;

    function setShouldVerify(bool value) external {
        shouldVerify = value;
    }

    function verifyAnonAadhaarProof(
        uint256,
        uint256,
        uint256,
        uint256,
        uint256[4] memory,
        uint256[8] memory
    ) external view returns (bool) {
        return shouldVerify;
    }
}

contract TestGroth16Verifier is IAnonAadhaarGroth16Verifier {
    bool public shouldVerify = true;
    uint256[9] public expectedPublicInputs;

    function setShouldVerify(bool value) external {
        shouldVerify = value;
    }

    function setExpectedPublicInputs(uint256[9] calldata inputs) external {
        expectedPublicInputs = inputs;
    }

    function verifyProof(
        uint256[2] calldata _pA,
        uint256[2][2] calldata _pB,
        uint256[2] calldata _pC,
        uint256[9] calldata publicInputs
    ) external view returns (bool) {
        _pA;
        _pB;
        _pC;
        if (!shouldVerify) {
            return false;
        }
        for (uint256 i = 0; i < 9; i++) {
            if (publicInputs[i] != expectedPublicInputs[i]) {
                return false;
            }
        }
        return true;
    }
}

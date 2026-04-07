// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import {AnonAadhaar} from "../src/AnonAadhaar.sol";
import {Campaign} from "../src/Campaign.sol";
import {CampaignDonorBadge} from "../src/CampaignDonorBadge.sol";
import {DAOGovernance} from "../src/DAOGovernance.sol";
import {DisasterReliefFactory} from "../src/DisasterReliefFactory.sol";
import {Escrow} from "../src/Escrow.sol";
import {GeneralDonorBadge} from "../src/GeneralDonorBadge.sol";
import {ICampaign} from "../src/interfaces/ICampaign.sol";
import {IDAOGovernance} from "../src/interfaces/IDAOGovernance.sol";
import {IAnonAadhaar} from "../src/interfaces/IAnonAadhaar.sol";
import {
    IAnonAadhaarGroth16Verifier
} from "../src/interfaces/IAnonAadhaarGroth16Verifier.sol";

contract MockUSDC is ERC20 {
    uint8 private immutable _tokenDecimals;

    constructor() ERC20("MockUSDC", "USDC") {
        _tokenDecimals = 6;
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    function decimals() public view override returns (uint8) {
        return _tokenDecimals;
    }
}

contract MockAnonAadhaar is IAnonAadhaar {
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

contract MockGroth16Verifier is IAnonAadhaarGroth16Verifier {
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

contract Testing is Test {
    uint256 internal constant TEN_USDC = 10_000000;
    uint256 internal constant ONE_HUNDRED_USDC = 100_000000;

    address internal owner = makeAddr("owner");
    address internal operator = makeAddr("operator");
    address internal daoMember1 = makeAddr("daoMember1");
    address internal daoMember2 = makeAddr("daoMember2");
    address internal donor = makeAddr("donor");
    address internal victim = makeAddr("victim");
    address internal outsider = makeAddr("outsider");

    MockUSDC internal usdc;
    MockAnonAadhaar internal mockAnon;
    GeneralDonorBadge internal generalBadge;
    CampaignDonorBadge internal campaignBadge;
    DAOGovernance internal dao;
    DisasterReliefFactory internal factory;
    Escrow internal escrow;

    function setUp() public {
        usdc = new MockUSDC();
        mockAnon = new MockAnonAadhaar();

        vm.prank(owner);
        generalBadge = new GeneralDonorBadge(owner);

        vm.prank(owner);
        campaignBadge = new CampaignDonorBadge(owner);

        vm.prank(owner);
        dao = new DAOGovernance(owner, operator);

        vm.prank(owner);
        factory = new DisasterReliefFactory(
            owner,
            address(dao),
            address(mockAnon),
            address(usdc),
            address(campaignBadge)
        );

        escrow = new Escrow(
            address(factory),
            address(generalBadge),
            address(dao),
            address(usdc)
        );

        vm.startPrank(owner);
        dao.setDisasterReliefFactory(address(factory));
        dao.setFundEscrow(address(escrow));
        dao.addDAOMember(daoMember1);
        dao.addDAOMember(daoMember2);
        generalBadge.updateEscrow(address(escrow));
        campaignBadge.updateFactory(address(factory));
        vm.stopPrank();

        usdc.mint(donor, 1_000_000_000);
        usdc.mint(outsider, 1_000_000_000);
        usdc.mint(victim, 1_000_000_000);

        vm.prank(donor);
        usdc.approve(address(escrow), type(uint256).max);
    }

    // function testAllocateFundsToContract() public {
    //     vm.prank(donor);
    //     escrow.donate(20e6);
    //     vm.prank(daoMember1);
    //    uint256 pId = dao.createProposal("hello", "", 10e6);

    //    vm.prank(daoMember1);
    //    dao.vote(pId, true);
    //    vm.prank(daoMember2);
    //    dao.vote(pId, true);

    //    uint32[] memory pincodes = new uint32[](1);
    //    pincodes[0] = 517342;
    //    vm.prank(operator);
    //    dao.extecuteProposal(
    //        pId,
    //        ICampaign.CampaignDetails({
    //            campaignId: pId,
    //            title: "",
    //            descriptionURI: "", //URI on ipfs that maps details about campaign
    //            pincodes: pincodes, //eligible pincodes of campaign
    //            state: ICampaign.CampaignState.Donation
    //        }),
    //        uint32(1 minutes),
    //        uint32(1 minutes),
    //        uint32(1 minutes),
    //        uint32(1 minutes)
    //    );

    //     address campaign = factory.campaigns(0);
    //     assertTrue(factory.isCampaign(campaign));
    //     assertEq(usdc.balanceOf(campaign), 10e6);

    //     vm.warp(block.timestamp + 2 minutes);

    //     vm.prank(victim);
    //     uint256 nullifierSeed = 0;
    //     uint256 nullifier = 0;
    //     uint256 timestamp = block.timestamp;
    //     uint256 signal = uint256(uint160(victim));

    //     uint256[4] memory revealArray;
    //     revealArray[2] = 517342;

    //     uint256[8] memory groth16Proof;

    //     Campaign(campaign).registerAsVictim(
    //         nullifierSeed,
    //         nullifier,
    //         timestamp,
    //         signal,
    //         revealArray,
    //         groth16Proof
    //     );

    //     vm.warp(block.timestamp + 10 minutes);
    //     Campaign(campaign).claimFund();




       
    // }
}

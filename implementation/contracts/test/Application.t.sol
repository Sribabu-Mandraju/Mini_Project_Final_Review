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
import {IAnonAadhaarGroth16Verifier} from "../src/interfaces/IAnonAadhaarGroth16Verifier.sol";

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

contract ApplicationTest is Test {
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
        factory = new DisasterReliefFactory(owner, address(dao), address(mockAnon), address(usdc), address(campaignBadge));

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
        usdc.mint(outsider, 1_000_000_000);
        usdc.mint(victim, 1_000_000_000);

        vm.prank(donor);
        usdc.approve(address(escrow), type(uint256).max);
    }

    function testGeneralDonorBadgeOnlyEscrowCanMint() public {
        vm.expectRevert("Unauthorized");
        generalBadge.mint(donor);

        vm.prank(address(escrow));
        uint256 tokenId = generalBadge.mint(donor);

        assertEq(tokenId, 1);
        assertEq(generalBadge.ownerOf(tokenId), donor);
    }

    function testDAONonMemberCannotCreateProposal() public {
        vm.prank(outsider);
        vm.expectRevert("Unauthorized");
        dao.createProposal("Flood Relief", "ipfs://proposal-1", ONE_HUNDRED_USDC);
    }

    function testEscrowDonateRevertsBelowMinimum() public {
        vm.prank(donor);
        vm.expectRevert("Insufficient Amount");
        escrow.donate(TEN_USDC - 1);
    }

    function testFactoryDeployAndEscrowAllocateFromDAO() public {
        address campaignAddr = _deployCampaignViaFactory(7, 1 days, 1 days, 1 days, 1 days);

        vm.prank(donor);
        escrow.donate(500_000000);
        assertEq(escrow.getBalance(), 500_000000);

        vm.prank(address(dao));
        escrow.allocateFunds(campaignAddr, ONE_HUNDRED_USDC);

        assertEq(usdc.balanceOf(campaignAddr), ONE_HUNDRED_USDC);
        assertEq(escrow.getBalance(), 400_000000);
    }

    function testExecuteProposalDeploysCampaignAndAllocatesFunds() public {
        vm.prank(donor);
        escrow.donate(500_000000);
        uint256 proposalId = _createPassedProposal(ONE_HUNDRED_USDC);
        ICampaign.CampaignDetails memory details = _defaultCampaignDetails(1);

        vm.prank(operator);
        dao.extecuteProposal(proposalId, details, 1 days, 1 days, 1 days, 1 days);

        address campaignAddr = factory.campaigns(0);
        assertTrue(factory.isCampaign(campaignAddr));
        assertEq(usdc.balanceOf(campaignAddr), ONE_HUNDRED_USDC);
    }

    function testCampaignDonationMintsCampaignBadge() public {
        address campaignAddr = _deployCampaignViaFactory(11, 100, 100, 100, 100);
        Campaign campaign = Campaign(campaignAddr);

        vm.prank(donor);
        usdc.approve(campaignAddr, type(uint256).max);

        vm.prank(donor);
        campaign.donate(20_000000);

        assertEq(campaign.totalFunds(), 20_000000);
        assertEq(campaignBadge.nextTokenId(), 1);
        assertEq(campaignBadge.ownerOf(1), donor);
    }

    function testRegisterVictimWithValidProofAndPincode() public {
        address campaignAddr = _deployCampaignViaFactory(12, 1, 100, 100, 100);
        Campaign campaign = Campaign(campaignAddr);

        vm.warp(block.timestamp + 2);

        uint256[4] memory revealArray = [uint256(0), uint256(0), uint256(560001), uint256(0)];
        uint256[8] memory proof;
        uint256 signal = uint256(uint160(victim));

        vm.prank(victim);
        campaign.registerAsVictim(123, 456, block.timestamp, signal, revealArray, proof);

        assertTrue(campaign.victims(victim));
        assertEq(campaign.totalVictims(), 1);
    }

    function testRegisterVictimRejectsInvalidPincode() public {
        address campaignAddr = _deployCampaignViaFactory(13, 1, 100, 100, 100);
        Campaign campaign = Campaign(campaignAddr);
        vm.warp(block.timestamp + 2);

        uint256[4] memory revealArray = [uint256(0), uint256(0), uint256(999999), uint256(0)];
        uint256[8] memory proof;
        uint256 signal = uint256(uint160(victim));

        vm.prank(victim);
        vm.expectRevert("Invalid pincode");
        campaign.registerAsVictim(123, 456, block.timestamp, signal, revealArray, proof);
    }

    function testClaimFundTransfersAmountAndRevokesVictimStatus() public {
        address campaignAddr = _deployCampaignViaFactory(14, 1, 100, 100, 100);
        Campaign campaign = Campaign(campaignAddr);

        vm.prank(donor);
        usdc.approve(campaignAddr, type(uint256).max);
        vm.prank(donor);
        campaign.donate(50_000000);

        vm.warp(block.timestamp + 2);

        uint256[4] memory revealArray = [uint256(0), uint256(0), uint256(560001), uint256(0)];
        uint256[8] memory proof;
        uint256 signal = uint256(uint160(victim));

        vm.prank(victim);
        campaign.registerAsVictim(11, 22, block.timestamp, signal, revealArray, proof);

        uint256 balanceBefore = usdc.balanceOf(victim);
        vm.prank(victim);
        campaign.claimFund();
        uint256 balanceAfter = usdc.balanceOf(victim);

        assertEq(balanceAfter - balanceBefore, 50_000000);
        assertFalse(campaign.victims(victim));
        assertEq(campaign.distributedFunds(), 50_000000);
    }

    function testClaimFundRevertsForUnregisteredVictim() public {
        address campaignAddr = _deployCampaignViaFactory(15, 1, 100, 100, 100);
        Campaign campaign = Campaign(campaignAddr);
        vm.warp(block.timestamp + 2);

        vm.prank(victim);
        vm.expectRevert("Not a registered victim");
        campaign.claimFund();
    }

    function testCampaignStateTransitions() public {
        ICampaign.CampaignDetails memory details = _defaultCampaignDetails(777);
        Campaign standaloneCampaign = new Campaign(
            details, 10, 10, 10, 10, address(campaignBadge), address(mockAnon), address(usdc)
        );

        assertEq(uint256(standaloneCampaign.getCampaignState()), uint256(ICampaign.CampaignState.Donation));

        vm.warp(block.timestamp + 11);
        standaloneCampaign.updateState();
        assertEq(uint256(standaloneCampaign.getCampaignState()), uint256(ICampaign.CampaignState.Registration));

        vm.warp(block.timestamp + 11);
        standaloneCampaign.updateState();
        assertEq(uint256(standaloneCampaign.getCampaignState()), uint256(ICampaign.CampaignState.Waiting));

        vm.warp(block.timestamp + 11);
        standaloneCampaign.updateState();
        assertEq(uint256(standaloneCampaign.getCampaignState()), uint256(ICampaign.CampaignState.Distribution));

        vm.warp(block.timestamp + 11);
        standaloneCampaign.updateState();
        assertEq(uint256(standaloneCampaign.getCampaignState()), uint256(ICampaign.CampaignState.Closed));
    }

    function testAnonAadhaarDelegatesProofAndUsesSignalHash() public {
        MockGroth16Verifier verifier = new MockGroth16Verifier();
        uint256 publicKeyHash = 111;
        AnonAadhaar anonAadhaar = new AnonAadhaar(address(verifier), publicKeyHash);

        uint256 nullifierSeed = 10;
        uint256 nullifier = 20;
        uint256 timestamp = 30;
        uint256 signal = 40;
        uint256[4] memory revealArray = [uint256(1), uint256(2), uint256(3), uint256(4)];
        uint256[8] memory groth16Proof = [uint256(5), 6, 7, 8, 9, 10, 11, 12];
        uint256 expectedSignalHash = uint256(keccak256(abi.encodePacked(signal))) >> 3;

        uint256[9] memory expectedPublicInputs = [
            publicKeyHash,
            nullifier,
            timestamp,
            revealArray[0],
            revealArray[1],
            revealArray[2],
            revealArray[3],
            nullifierSeed,
            expectedSignalHash
        ];
        verifier.setExpectedPublicInputs(expectedPublicInputs);

        bool verified =
            anonAadhaar.verifyAnonAadhaarProof(nullifierSeed, nullifier, timestamp, signal, revealArray, groth16Proof);
        assertTrue(verified);
    }

    function _createPassedProposal(uint256 fundsRequested) internal returns (uint256 proposalId) {
        vm.prank(daoMember1);
        proposalId = dao.createProposal("Flood Relief", "ipfs://proposal-1", fundsRequested);

        vm.prank(daoMember1);
        dao.vote(proposalId, true);

        vm.prank(daoMember2);
        dao.vote(proposalId, true);
    }

    function _deployCampaignViaFactory(
        uint256 campaignId,
        uint32 donationPeriod,
        uint32 registrationPeriod,
        uint32 waitingPeriod,
        uint32 distributionPeriod
    ) internal returns (address campaignAddr) {
        ICampaign.CampaignDetails memory details = _defaultCampaignDetails(campaignId);
        vm.prank(address(dao));
        factory.deployCampaign(
            details, donationPeriod, registrationPeriod, waitingPeriod, distributionPeriod
        );
        campaignAddr = factory.campaigns(0);
    }

    function _defaultCampaignDetails(uint256 campaignId) internal pure returns (ICampaign.CampaignDetails memory details)
    {
        uint32[] memory pincodes = new uint32[](2);
        pincodes[0] = 560001;
        pincodes[1] = 560002;

        details = ICampaign.CampaignDetails({
            campaignId: campaignId,
            title: "Flood Relief",
            descriptionURI: "ipfs://campaign",
            pincodes: pincodes,
            state: ICampaign.CampaignState.Donation
        });
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";

import {Campaign} from "../../src/Campaign.sol";
import {CampaignDonorBadge} from "../../src/CampaignDonorBadge.sol";
import {DisasterReliefFactory} from "../../src/DisasterReliefFactory.sol";
import {DAOGovernance} from "../../src/DAOGovernance.sol";
import {ICampaign} from "../../src/interfaces/ICampaign.sol";
import {TestUSDC, TestAnonAadhaar} from "../helpers/TestMocks.sol";

contract CampaignUnitTest is Test {
    uint256 internal constant TEN_USDC = 10_000000;

    address internal owner = makeAddr("owner");
    address internal operator = makeAddr("operator");
    address internal donor = makeAddr("donor");
    address internal victim = makeAddr("victim");

    TestUSDC internal usdc;
    TestAnonAadhaar internal anon;
    DAOGovernance internal dao;
    CampaignDonorBadge internal badge;
    DisasterReliefFactory internal factory;
    Campaign internal campaign;

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

        vm.prank(address(dao));
        factory.deployCampaign(_details(), 100, 100, 100, 100);
        campaign = Campaign(factory.campaigns(0));

        usdc.mint(donor, 1_000_000_000);
        vm.prank(donor);
        usdc.approve(address(campaign), type(uint256).max);
    }

    function testDonate() public {
        vm.prank(donor);
        campaign.donate(20_000000);
        assertEq(campaign.totalFunds(), 20_000000);
        assertEq(badge.ownerOf(1), donor);
    }

    function testRegisterAndClaim() public {
        vm.prank(donor);
        campaign.donate(30_000000);

        vm.warp(block.timestamp + 101);
        uint256[4] memory reveal = [uint256(0), uint256(0), uint256(560001), uint256(0)];
        uint256[8] memory proof;
        uint256 signal = uint256(uint160(victim));

        vm.prank(victim);
        campaign.registerAsVictim(1, 2, block.timestamp, signal, reveal, proof);
        assertTrue(campaign.victims(victim));

        uint256 beforeBal = usdc.balanceOf(victim);
        vm.prank(victim);
        campaign.claimFund();
        assertEq(usdc.balanceOf(victim) - beforeBal, 30_000000);
    }

    function testClaimFundRevertsIfNotRegistrationState() public {
        // At initial deployment, state is Donation; autoUpdateState will keep it
        // in Donation if we don't move time past the donation end.
        vm.prank(victim);
        vm.expectRevert("Registrations Not started");
        campaign.claimFund();
    }

    function testClaimFundRevertsIfNotRegisteredVictim() public {
        // Move time so that the campaign enters Registration state
        vm.warp(block.timestamp + 101);

        vm.prank(victim);
        vm.expectRevert("Not a registered victim");
        campaign.claimFund();
    }

    function testClaimFundUpdatesDistributedFundsAndClearsVictim() public {
        // Arrange: donate and register a single victim
        vm.prank(donor);
        campaign.donate(40_000000);

        vm.warp(block.timestamp + 101);
        uint256[4] memory reveal = [uint256(0), uint256(0), uint256(560001), uint256(0)];
        uint256[8] memory proof;
        uint256 signal = uint256(uint160(victim));

        vm.prank(victim);
        campaign.registerAsVictim(1, 2, block.timestamp, signal, reveal, proof);

        // Act: victim claims funds
        uint256 beforeBal = usdc.balanceOf(victim);
        uint256 distributedBefore = campaign.distributedFunds();

        vm.prank(victim);
        campaign.claimFund();

        // Assert: call succeeded (no revert), victim flag cleared, funds and accounting updated
        assertFalse(campaign.victims(victim), "victim flag should be cleared after claim");

        uint256 afterBal = usdc.balanceOf(victim);
        uint256 expectedAmountPerVictim = 40_000000;
        assertEq(afterBal - beforeBal, expectedAmountPerVictim, "victim should receive full amountPerVictim");
        assertEq(
            campaign.distributedFunds() - distributedBefore,
            expectedAmountPerVictim,
            "distributedFunds should increase by amountPerVictim"
        );
    }

    function testStateTransitions() public {
        assertEq(uint256(campaign.getCampaignState()), uint256(ICampaign.CampaignState.Donation));

        vm.warp(block.timestamp + 101);
        campaign.updateState();
        assertEq(uint256(campaign.getCampaignState()), uint256(ICampaign.CampaignState.Registration));

        vm.warp(block.timestamp + 101);
        campaign.updateState();
        assertEq(uint256(campaign.getCampaignState()), uint256(ICampaign.CampaignState.Waiting));
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

// ─────────────────────────────────────────────────────────────────────────────
// Fork test for registerAsVictim using deployed campaign and real proof data
//
// Proof data:
//   campaignAddress: 0xa60018399d30681f14fe59c781f30315ef90260c
//   nullifierSeed  : 1234
//   nullifier      : 3026291415544681854699984108154548542265312055624350682144740770047672682867
//   timestamp      : 1759728600
//   signal         : 274778156961325787249003246699605901473094971480
//   revealArray    : [0, 0, 534406, 0]
//
// How to run:
//   export FORK_URL=<your_rpc_url>
//   forge test --match-contract RegisterAsVictimFunc -vvv
// ─────────────────────────────────────────────────────────────────────────────
contract RegisterAsVictimFunc is Test {
    // ── Deployed campaign address ────────────────────────────────────────────
    address constant CAMPAIGN_ADDR = 0xA60018399d30681F14fe59C781F30315EF90260C;

    // ── Proof constants (from provided JSON) ─────────────────────────────────
    uint256 constant NULLIFIER_SEED = 1234;
    uint256 constant NULLIFIER      = 3026291415544681854699984108154548542265312055624350682144740770047672682867;
    uint256 constant TIMESTAMP      = 1759728600;
    uint256 constant SIGNAL         = 274778156961325787249003246699605901473094971480;
    uint256 constant PINCODE        = 534406;

    // ── Derived from SIGNAL — must be the caller ────────────────────────────
    address constant VICTIM_ADDR = address(uint160(SIGNAL));

    Campaign internal campaign;

    function setUp() public {
        // Create fork from environment variable at latest block
        // Usage: export FORK_URL=<rpc_url> && forge test --match-contract RegisterAsVictimFunc -vvv
        string memory url = vm.envOr("FORK_URL", string(""));
        require(bytes(url).length > 0, "FORK_URL environment variable must be set");
        
        uint256 forkId = vm.createFork(url);
        vm.selectFork(forkId);

        campaign = Campaign(CAMPAIGN_ADDR);

        // Ensure victim has gas to send transaction
        vm.deal(VICTIM_ADDR, 1 ether);
    }

    /// @dev Returns the groth16 proof from the provided test data.
    function _proof() internal pure returns (uint256[8] memory p) {
        p[0] = 10788155633432293571914815424385220318012163458530506442836682417934520757228;
        p[1] = 12142782728928321957917132252653294347036291096134971009449084875473848363286;
        p[2] = 10221655115814223007992791678131738221638283721384959763549256404288271831034;
        p[3] = 11151961236913295371878346804662504546473986892848269159945173278682405278980;
        p[4] = 12189025027738815358656533729255122188360822707064503524052757609287078257506;
        p[5] = 14861375606020012964906245229870494702637046952110842682715153090131995610363;
        p[6] =  2201060240265416773524374459397242175090927988306286621210396195503509910446;
        p[7] = 15423515101910202741563071725075094957466332611211248075973608924376845452779;
    }

    /// @dev Returns the revealArray from the provided test data.
    function _reveal() internal pure returns (uint256[4] memory r) {
        r[0] = 0;
        r[1] = 0;
        r[2] = PINCODE; // 534406
        r[3] = 0;
    }

    /// @dev Test successful registration with real proof data.
    // function testForkRegisterAsVictim_Success() public {
    //     // Update campaign state based on fork's block.timestamp
    //     campaign.updateState();

    //     ICampaign.CampaignState state = campaign.getCampaignState();
    //     require(
    //         state == ICampaign.CampaignState.Registration,
    //         "Campaign must be in Registration state. Check campaign timing on the fork."
    //     );

    //     // Check if already registered (may happen if proof was used before)
    //     bool alreadyRegistered = campaign.victims(VICTIM_ADDR);
    //     uint256 victimsBefore = campaign.totalVictims();

    //     if (!alreadyRegistered) {
    //         vm.prank(VICTIM_ADDR);
    //         campaign.registerAsVictim(
    //             NULLIFIER_SEED,
    //             NULLIFIER,
    //             TIMESTAMP,
    //             SIGNAL,
    //             _reveal(),
    //             _proof()
    //         );

    //         assertTrue(campaign.victims(VICTIM_ADDR), "Victim should be registered");
    //         assertEq(campaign.totalVictims(), victimsBefore + 1, "totalVictims should increment");
    //     } else {
    //         assertTrue(campaign.victims(VICTIM_ADDR), "Victim already registered (proof was used before)");
    //     }
    // }

    // /// @dev Test that VictimRegistered event is emitted.
    // function testForkRegisterAsVictim_EmitsEvent() public {
    //     campaign.updateState();

    //     ICampaign.CampaignState state = campaign.getCampaignState();
    //     require(
    //         state == ICampaign.CampaignState.Registration,
    //         "Campaign must be in Registration state"
    //     );

    //     // Skip if already registered
    //     if (campaign.victims(VICTIM_ADDR)) {
    //         return;
    //     }

    //     vm.expectEmit(true, false, false, false, CAMPAIGN_ADDR);
    //     emit ICampaign.VictimRegistered(VICTIM_ADDR);

    //     vm.prank(VICTIM_ADDR);
    //     campaign.registerAsVictim(
    //         NULLIFIER_SEED,
    //         NULLIFIER,
    //         TIMESTAMP,
    //         SIGNAL,
    //         _reveal(),
    //         _proof()
    //     );
    // }

    /// @dev Test revert when campaign is not in Registration state.
    // function testForkRegisterAsVictim_RevertsIfNotRegistrationState() public {
    //     campaign.updateState();

    //     ICampaign.CampaignState state = campaign.getCampaignState();
        
    //     if (state != ICampaign.CampaignState.Registration) {
    //         vm.prank(VICTIM_ADDR);
    //         vm.expectRevert("Registrations Not started");
    //         campaign.registerAsVictim(
    //             NULLIFIER_SEED,
    //             NULLIFIER,
    //             TIMESTAMP,
    //             SIGNAL,
    //             _reveal(),
    //             _proof()
    //         );
    //     } else {
    //         // If in Registration, test double-registration revert
    //         if (!campaign.victims(VICTIM_ADDR)) {
    //             vm.prank(VICTIM_ADDR);
    //             campaign.registerAsVictim(
    //                 NULLIFIER_SEED,
    //                 NULLIFIER,
    //                 TIMESTAMP,
    //                 SIGNAL,
    //                 _reveal(),
    //                 _proof()
    //             );
    //         }

    //         vm.prank(VICTIM_ADDR);
    //         vm.expectRevert("Already Registered");
    //         campaign.registerAsVictim(
    //             NULLIFIER_SEED,
    //             NULLIFIER,
    //             TIMESTAMP,
    //             SIGNAL,
    //             _reveal(),
    //             _proof()
    //         );
    //     }
    // }

    /// @dev Test revert with invalid pincode.
    // function testForkRegisterAsVictim_RevertsIfInvalidPincode() public {
    //     campaign.updateState();

    //     ICampaign.CampaignState state = campaign.getCampaignState();
    //     require(
    //         state == ICampaign.CampaignState.Registration,
    //         "Campaign must be in Registration state"
    //     );

    //     uint256[4] memory badReveal = _reveal();
    //     badReveal[2] = 999999; // Invalid pincode

    //     vm.prank(VICTIM_ADDR);
    //     vm.expectRevert("Invalid pincode");
    //     campaign.registerAsVictim(
    //         NULLIFIER_SEED,
    //         NULLIFIER,
    //         TIMESTAMP,
    //         SIGNAL,
    //         badReveal,
    //         _proof()
    //     );
    // }
}

// ─────────────────────────────────────────────────────────────────────────────
// Fork test for claimFund using a specific deployed campaign and msg.sender
// Campaign: 0x1e06c324ffec3a896745888c210f067055929635
// Victim / msg.sender: 0x30217A8C17EF5571639948D118D086c73f823058
//
// Usage:
//   export FORK_URL=<your_rpc_url>
//   forge test --match-contract ClaimFundForkTest -vvv
// ─────────────────────────────────────────────────────────────────────────────
// contract ClaimFundForkTest is Test {
//     // Deployed campaign and victim addresses (checksummed)
//     address constant CAMPAIGN_ADDR = 0x0f5917eA685FE43995D1DDF3B0D5d4891A4fd693;
//     address constant VICTIM_ADDR   = 0x30217A8C17EF5571639948D118D086c73f823058;

//     Campaign internal campaign;

//     function setUp() public {
//         campaign = Campaign(CAMPAIGN_ADDR);

//         // Give victim some ETH for gas on the fork
//         vm.deal(VICTIM_ADDR, 1 ether);
//     }

//     /// @dev Happy-path style test: if VICTIM_ADDR is an eligible victim in
//     ///      Distribution state with sufficient funds, claimFund should succeed,
//     ///      clear the victim flag, and increase distributedFunds.
//     function testForkClaimFund_SucceedsAndClearsVictim() public {
//         // Bring campaign state up to date for this fork block
//         campaign.updateState();

//         uint256 beforeDistributed = campaign.distributedFunds();

//         vm.prank(VICTIM_ADDR);
//         bool ok = campaign.claimFund();

//         // // No revert == call succeeded, now check post-conditions
//         // assertFalse(campaign.victims(VICTIM_ADDR), "victim flag should be cleared after claim");
//         // assertGt(campaign.distributedFunds(), beforeDistributed, "distributedFunds should increase");
      
//     }
// }

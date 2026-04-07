// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IEscrow} from "./interfaces/IEscrow.sol";
import {CampaignDonorBadge} from "./CampaignDonorBadge.sol";
import {ICampaign} from "./interfaces/ICampaign.sol";
import "./interfaces/IAnonAadhaar.sol";

contract Campaign is ICampaign {
    using SafeERC20 for IERC20;

    address public immutable USDC;
    uint32 public constant MIN_DONATION = 10_000000; // 10 USDC
    address public immutable anonAadhaarVerifierAddr;
    CampaignDonorBadge public immutable donorBadge;

    CampaignDetails campaign;

    // endTimes of each  phase of the campaign
    PhaseDeadline endTimes;

    //accounting
    uint256 public totalFunds;
    uint256 public totalVictims;
    uint256 public distributedFunds; // Track funds that have already been distributed
    uint256 public amountPerVictim; // Store the calculated amount per victim

    mapping(uint32 => bool) public isValidPincode;   // pincode => valid or not
    mapping(address => bool) public victims;
    mapping(address => bool) public hasWithdrawn;

    // Automatically update state as needed before any external function is executed
    modifier autoUpdateState() {
        updateState();
        _;
    }

    constructor(
        CampaignDetails memory _details,
        uint32 _donationPeriod,
        uint32 _registrationPeriod,
        uint32 _waitingPeriod,
        uint32 _distributionPeriod,
        address _donorBadge,
        address _anonAadhaarVerifierAddr,
        address _usdc
    ) {
        require(_usdc != address(0), "zero address");
        require(_donorBadge != address(0), "zero address");
        require(_anonAadhaarVerifierAddr != address(0), "zero address");

        USDC = _usdc;
        anonAadhaarVerifierAddr = _anonAadhaarVerifierAddr;
        donorBadge = CampaignDonorBadge(_donorBadge);

        campaign.campaignId = _details.campaignId;
        campaign.title = _details.title;
        campaign.descriptionURI = _details.descriptionURI;
        
        campaign.state = _details.state;

        for (uint32 i = 0; i < _details.pincodes.length; i++) {
            isValidPincode[_details.pincodes[i]] = true;
        }

        uint32 donationEndTime = uint32(block.timestamp) + _donationPeriod;
        uint32 registrationEndTime = donationEndTime + _registrationPeriod;
        uint32 waitingEndTime = registrationEndTime + _waitingPeriod;
        uint32 distributionEndTime = waitingEndTime + _distributionPeriod;

        endTimes = PhaseDeadline({
            donation: donationEndTime,
            registration: registrationEndTime,
            waiting: waitingEndTime,
            distribution: distributionEndTime
        });
    }

    function donate(uint256 amount) external override {
        CampaignState state = campaign.state;
        require(state == CampaignState.Donation, "Invalid Status");
        require(amount >= MIN_DONATION, "Amount should >= Minimum");

        IERC20(USDC).safeTransferFrom(msg.sender, address(this), amount);
        totalFunds += amount;

        donorBadge.mint(msg.sender);
        emit DonationReceived(msg.sender, amount);
    }

    /// @param nullifierSeed: Nullifier Seed used while generating the proof.
    /// @param nullifier: Nullifier for the user's Aadhaar data.
    /// @param timestamp: Timestamp of when the QR code was signed.
    /// @param signal: signal used while generating the proof, should be equal to msg.sender.
    /// @param revealArray: Array of the values used as input for the proof generation (equal to [0, 0, 0, 0] if no field reveal were asked).
    /// @param groth16Proof: SNARK Groth16 proof.
    function registerAsVictim(
        uint256 nullifierSeed,
        uint256 nullifier,
        uint256 timestamp,
        uint256 signal,
        uint256[4] memory revealArray,
        uint256[8] memory groth16Proof
    ) external override autoUpdateState {
        CampaignState state = campaign.state;
        require(state == CampaignState.Registration, "Registrations Not started");
        require(!victims[msg.sender], "Already Registered");
        uint32 pincode = uint32(revealArray[2]);
        require(isValidPincode[pincode], "Invalid pincode");

        victims[msg.sender] = true;
        totalVictims++;

        emit VictimRegistered(msg.sender);
    }

    /// @dev Convert an address to uint256, used to check against signal.
    /// @param _addr: msg.sender address.
    /// @return Address msg.sender's address in uint256
    function addressToUint256(address _addr) private pure returns (uint256) {
        return uint256(uint160(_addr));
    }

    function claimFund() external override autoUpdateState returns (bool) {
        CampaignState state = campaign.state;

        // Allow claims any time after registrations have started, until campaign is closed
        require(
            state == CampaignState.Registration
                || state == CampaignState.Waiting
                || state == CampaignState.Distribution,
            "Registrations Not started"
        );
        require(victims[msg.sender], "Not a registered victim");

        // calculate amount per victim if not already calculated
        calculateAmountPerVictim();

        //  ensure we have enough funds
        uint256 actualBalance = IERC20(USDC).balanceOf(address(this));
        uint256 amount = amountPerVictim;
        if (amount > actualBalance) {
            emit InsufficientFund(actualBalance, amount - actualBalance);
            return false;
        }

        distributedFunds += amount;
        victims[msg.sender] = false;
        IERC20(USDC).safeTransfer(msg.sender, amount);

        emit FundsDistributed(msg.sender, amount);

        return true;
    }

    function calculateAmountPerVictim() internal {
        if (amountPerVictim == 0 && totalVictims > 0) {
            // ensuring we don't distribute more than available funds
            amountPerVictim = totalFunds / totalVictims;
            assert(amountPerVictim != 0);
        }
    }

           function updateState() public {
        CampaignState state = campaign.state;

        if (state == CampaignState.Donation && block.timestamp > endTimes.donation) {
            campaign.state = CampaignState.Registration;
            emit StateChanged(campaign.state);
        } else if (state == CampaignState.Registration && block.timestamp > endTimes.registration) {
            campaign.state = CampaignState.Waiting;
            emit StateChanged(campaign.state);
        } else if (state == CampaignState.Waiting && block.timestamp > endTimes.waiting) {
            campaign.state = CampaignState.Distribution;
            // calculate the amount per victim when entering distribution state
            calculateAmountPerVictim();
            emit StateChanged(campaign.state);
        } else if (state == CampaignState.Distribution && block.timestamp > endTimes.distribution) {
            campaign.state = CampaignState.Closed;
            emit StateChanged(campaign.state);
        }
    }

    function getCampaignDetails() external view returns (CampaignDetails memory) {
        return campaign;
    }

    function getCampaignState() external view returns (CampaignState state) {
        state = campaign.state;
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IDAOGovernance} from "./interfaces/IDAOGovernance.sol";
import {IDisasterReliefFactory} from "./interfaces/IDisasterReliefFactory.sol";
import {IEscrow} from "./interfaces/IEscrow.sol";
import {CampaignDonorBadge} from "./CampaignDonorBadge.sol";
import {Campaign} from "./Campaign.sol";
import {ICampaign} from "./interfaces/ICampaign.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract DisasterReliefFactory is IDisasterReliefFactory, Ownable {
    using SafeERC20 for IERC20;

    address public immutable USDC;

    IDAOGovernance public immutable dao;
    address public immutable anonAadhaarVerifierAddr;
    CampaignDonorBadge public immutable donorBadge;

    mapping(address => bool) public isCampaign;
    address[] public campaigns;

    constructor(address initialOwner, address _dao, address _aadharVerifier, address _usdc, address _donorBadge)
        Ownable(initialOwner)
    {
        require(
            initialOwner != address(0) && _dao != address(0) && _aadharVerifier != address(0) && _usdc != address(0)
                && _donorBadge != address(0),
            "zero address"
        );
        dao = IDAOGovernance(_dao);
        anonAadhaarVerifierAddr = _aadharVerifier;
        USDC = _usdc;
        donorBadge = CampaignDonorBadge(_donorBadge);
    }

    function deployCampaign(
        ICampaign.CampaignDetails calldata details,
        uint32 donationPeriod,
        uint32 registrationPeriod,
        uint32 waitingPeriod,
        uint32 distributionPeriod
    ) external override returns (address) {
        require(msg.sender == address(dao), "Unauthorized");

        Campaign campaign = new Campaign(
            details,
            donationPeriod,
            registrationPeriod,
            waitingPeriod,
            distributionPeriod,
            address(donorBadge),
            anonAadhaarVerifierAddr,
            USDC
        );

        isCampaign[address(campaign)] = true;
        campaigns.push(address(campaign));

        emit CampaignDeployed(address(campaign));

        return address(campaign);
    }
}

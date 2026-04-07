// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.20;

import {ICampaign} from "./ICampaign.sol";

interface IDisasterReliefFactory {
    event CampaignDeployed(address campaignAddress);

     function deployCampaign(
        ICampaign.CampaignDetails calldata details,
        uint32 donationPeriod,
        uint32 registrationPeriod,
        uint32 waitingPeriod,
        uint32 distributionPeriod
    ) external returns (address);
}

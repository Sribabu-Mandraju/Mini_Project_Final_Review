// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface ICampaign {
    

    struct CampaignDetails {
        uint256 campaignId;
        string title;
        string descriptionURI; //URI on ipfs that maps details about campaign
        uint32[] pincodes; //eligible pincodes of campaign  
        CampaignState state;
    }

    enum CampaignState {
        Donation,
        Registration,
        Waiting,
        Distribution,
        Closed
    }

    //ending times of each phase of campaign
    struct PhaseDeadline {
        uint32 donation;
        uint32 registration;
        uint32 waiting;
        uint32 distribution;
    }

    event DonationReceived(address indexed donor, uint256 amount);
    event VictimRegistered(address indexed victim);
    event FundsDistributed(address indexed victim, uint256 amount);
    event StateChanged(CampaignState newState);
    event InsufficientFund(uint256 balance, uint256 amountNeeded);

    function donate(uint256 amount) external;
    function registerAsVictim(
        uint256 nullifierSeed,
        uint256 nullifier,
        uint256 timestamp,
        uint256 signal,
        uint256[4] memory revealArray,
        uint256[8] memory groth16Proof
    ) external;
    function claimFund() external returns(bool);
}

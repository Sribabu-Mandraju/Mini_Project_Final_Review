// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script,console} from "forge-std/Script.sol";
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
import {Verifier} from "../src/Verifier.sol";

contract DeployProtocol is Script{
    CampaignDonorBadge cBadge ;
    GeneralDonorBadge gBadge;
    AnonAadhaar anonAadhar; //
    DAOGovernance dao;
    Escrow escrow;
    Verifier verifier;
    DisasterReliefFactory factory;

    address USDC = 0x036CbD53842c5426634e7929541eC2318f3dCF7e;
    address initialOwner = 0x30217A8C17EF5571639948D118D086c73f823058;
    address operator = 0x30217A8C17EF5571639948D118D086c73f823058;
    uint256 pubHash = 18063425702624337643644061197836918910810808173893535653269228433734128853484;
    function run() public{
        // vm.startBroadcast(vm.envUint("PRIVATE_KEY"));
        vm.startBroadcast();
        //badges
        cBadge = new CampaignDonorBadge(initialOwner);
        gBadge = new GeneralDonorBadge(initialOwner);

        // verifier deployment
        verifier = new Verifier();

        // dao
        dao = new DAOGovernance(initialOwner,operator);

        anonAadhar =new AnonAadhaar(address(verifier),pubHash); //@note need to deploy this publicKeyHash
        //factory
        factory = new DisasterReliefFactory(initialOwner,address(dao),address(anonAadhar),USDC,address(cBadge));

        //escrow 
        escrow = new Escrow(address(factory),address(gBadge),address(dao),USDC);

        // need to update the escrow in badges
        gBadge.updateEscrow(address(escrow));
        cBadge.updateFactory(address(factory));

        //@note need to update the uri's
        gBadge.setBaseURI("uri");
        cBadge.setBaseURI("uri");

        dao.setDisasterReliefFactory(address(factory));
        dao.setFundEscrow(address(escrow));
        vm.stopBroadcast();

        // logs
        console.log("=== Deployment Addresses ===");
        console.log("CampaignDonorBadge:", address(cBadge));
        console.log("GeneralDonorBadge:", address(gBadge));
        console.log("AnonAadhaar:", address(anonAadhar));
        console.log("Verifier:", address(verifier));
        console.log("DAOGovernance:", address(dao));
        console.log("DisasterReliefFactory:", address(factory));
        console.log("Escrow:", address(escrow));
        console.log("USDC:", USDC);
    }
}
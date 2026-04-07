// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IEscrow} from "./interfaces/IEscrow.sol";
import {GeneralDonorBadge} from "./GeneralDonorBadge.sol";
import {IDisasterReliefFactory,DisasterReliefFactory} from "./DisasterReliefFactory.sol";


contract Escrow is IEscrow {
    using SafeERC20 for IERC20;

    address public immutable USDC;
    uint32 public constant MIN_DONATION = 10_000000; // 10 USDC

    DisasterReliefFactory factory;
    GeneralDonorBadge public donorBadge;
    address public dao;

    uint256 public totalReceived;
    uint256 public totalAllocated;

    

    modifier onlyDAO() {
        require(msg.sender == dao, "Unauthorized");
        _;
    }

    constructor(address _factory, address _donorBadge, address _dao, address _usdc) {
        require(_factory != address(0), "zero address");
        require(_donorBadge != address(0), "zero address");
        require(_dao != address(0), "zero address");
        require(_usdc != address(0), "zero address");

        factory = DisasterReliefFactory(_factory);
        donorBadge = GeneralDonorBadge(_donorBadge);
        dao = _dao;
        USDC = _usdc;
        //approving the governance contract to spend USDC
        IERC20(USDC).approve(dao, type(uint256).max);
    }

    function donate(uint256 amount) external override {
        require(amount >= MIN_DONATION, "Insufficient Amount");
        IERC20(USDC).safeTransferFrom(msg.sender, address(this), amount);
        totalReceived += amount;
        emit FundsDeposited(msg.sender, amount);
    }

    function allocateFunds(address campaign, uint256 amount) external override onlyDAO {
        require(factory.isCampaign(campaign), "Invalid Campaign");
        require(amount <= getBalance(), "Insufficient funds");

        IERC20(USDC).safeTransfer(campaign, amount);
        totalAllocated += amount;
        emit FundsAllocated(campaign, amount);
    }

    function getBalance() public view override returns (uint256) {
        return IERC20(USDC).balanceOf(address(this));
    }
}

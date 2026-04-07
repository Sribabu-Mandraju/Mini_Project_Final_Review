// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {DisasterReliefFactory} from "./DisasterReliefFactory.sol";

// NFT token given as gratitude for campaign specific donors
contract CampaignDonorBadge is ERC721, Ownable {
    // tokenId counter
    uint256 private _nextTokenId;
    // disaster relief contract address that can mint token upon donations to a campaign
    DisasterReliefFactory public factory;
    // to store ipfs data
    string private _baseTokenURI;

    event FactoryAddressUpdated(address indexed previous, address indexed current);

    modifier onlyCampaign() {
        require(factory.isCampaign(msg.sender), "Unauthorized");
        _;
    }

    constructor(address initialOwner) ERC721("CampaignDonorBadge", "CDB") Ownable(initialOwner) {}

    function updateFactory(address _factory) external onlyOwner {
        require(_factory != address(0), "Zero Address");
        address prevFactory = address(factory);
        factory = DisasterReliefFactory(_factory);
        emit FactoryAddressUpdated(prevFactory, _factory);
    }

    // minted upon a donate in campaign contract
    function mint(address to) external onlyCampaign returns (uint256) {
        uint256 tokenId = ++_nextTokenId;
        _safeMint(to, tokenId);
        return tokenId;
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return _baseTokenURI;
    }

    function setBaseURI(string memory newBaseURI) external onlyOwner {
        _baseTokenURI = newBaseURI;
    }

    function nextTokenId() external view returns (uint256) {
        return _nextTokenId;
    }
}

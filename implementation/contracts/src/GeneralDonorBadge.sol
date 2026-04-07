// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

// NFT token given as gratitude for general donors
contract GeneralDonorBadge is ERC721, Ownable {
    // tokenId counter
    uint256 private _nextTokenId;
    // escrow contract address that can mint token upon donations
    address public escrow;
    // to store ipfs data
    string private _baseTokenURI;

    event EscrowAddressUpdated(address indexed previous, address indexed current);

    modifier onlyEscrow() {
        require(msg.sender == escrow, "Unauthorized");
        _;
    }

    constructor(address initialOwner) ERC721("GeneralDonorBadge", "GDB") Ownable(initialOwner) {}

    function updateEscrow(address _escrow) external onlyOwner {
        require(_escrow != address(0), "Invalid escrow address");
        address prevEscrow = escrow;
        escrow = _escrow;
        emit EscrowAddressUpdated(prevEscrow, _escrow);
    }

    // minted upon a donate in escow contract
    function mint(address to) external onlyEscrow returns (uint256) {
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

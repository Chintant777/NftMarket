// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract NFT is ERC721URIStorage{
    using Counters for Counters.Counter;

    Counters.Counter private tokenId;
    address contractAddress;

    constructor(address marketPlaceAddress) ERC721("INeuron Token", "INT"){
        contractAddress = marketPlaceAddress;
    }

    function createToken(string memory tokenURI) public returns(uint){
        tokenId.increment();
        uint currentTokenId = tokenId.current();
    
        _mint(msg.sender, currentTokenId);
        _setTokenURI(currentTokenId, tokenURI);

        setApprovalForAll(contractAddress, true);
        return currentTokenId;
    }
}
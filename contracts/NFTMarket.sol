// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract NFTMarket is ReentrancyGuard{
    using Counters for Counters.Counter;

    Counters.Counter private itemsId;
    Counters.Counter private soldItemsId;

    address payable owner;
    uint listingPrice = 0.01 ether;

    constructor(){
        owner = payable(msg.sender);
    }

    struct MarketItem {
        uint itemId;
        address nftContactAddress;
        uint tokenId;
        address payable seller;
        address payable owner;
        uint price;
        bool sold;
    }

    mapping(uint => MarketItem) idToMarketItemMapping;

    event MarketItemCreated (
        uint indexed itemId,
        address indexed nftContactAddress,
        uint indexed tokenId,
        address seller,
        address owner,
        uint price,
        bool sold
    );

    function getListingPrice() public view returns(uint){
        return listingPrice;
    }

    function getSoldItemsCount() public view returns(uint){
        return soldItemsId.current();
    }

    function getTotalItemsCount() public view returns(uint){
        return itemsId.current();
    }

    function createMarketItem(address nftContactAddress, uint tokenId, uint price)
        public payable nonReentrant
    {
        require(price > 0, "price must be greater than 0");
        require(msg.value == listingPrice, "price must be equals to listing price");

        itemsId.increment();
        uint itemId = itemsId.current();

        idToMarketItemMapping[itemId] = MarketItem(
            itemId,
            nftContactAddress,
            tokenId,
            payable(msg.sender),
            payable(address(0)),
            price,
            false
        );

        IERC721(nftContactAddress).transferFrom(msg.sender, address(this), tokenId);

        emit MarketItemCreated(
            itemId,
            nftContactAddress,
            tokenId,
            msg.sender,
            address(0),
            price,
            false
        );
    }

    function sellMarketItem(address nftContactAddress, uint itemId)
        public payable nonReentrant
    {
        MarketItem memory mItem = idToMarketItemMapping[itemId];
        uint price = mItem.price;
        
        require(price == msg.value, "Please enter same price");

        mItem.seller.transfer(msg.value);

        IERC721(nftContactAddress).transferFrom(address(this), msg.sender, mItem.tokenId);

        mItem.owner = payable(msg.sender);
        mItem.sold = true;
        soldItemsId.increment();

        idToMarketItemMapping[itemId] = mItem;

        payable(owner).transfer(listingPrice);
    }

    function fetchUnsoldMarketItems()
        public view returns(MarketItem[] memory)
    {
        uint totalItemIds = itemsId.current();
        uint totalUnsoldItems =  totalItemIds - soldItemsId.current();
        MarketItem[] memory unsoldItems = new MarketItem[](totalUnsoldItems);

        uint currentIndexOfmarketItem = 0;

        for(uint i = 0; i < totalItemIds; ){
            if(idToMarketItemMapping[i+1].owner == address(0)){
                unsoldItems[currentIndexOfmarketItem] = idToMarketItemMapping[i+1];
                currentIndexOfmarketItem += 1;
            }

            unchecked{
                i++;
            }
        }
        return unsoldItems;
    }

    function fetchOwnedNFTs() 
        public view returns(MarketItem[] memory)
    {
        uint totalItemIds = itemsId.current();
        uint ownedTotalCount = 0;
        uint currentIndex = 0;

        for(uint i = 0; i<totalItemIds; i++){
            if(idToMarketItemMapping[i+1].owner == msg.sender) {
                ownedTotalCount += 1;
            }
        }        
        
        MarketItem[] memory ownedNFTs = new MarketItem[](ownedTotalCount);

        for(uint i = 0; i<totalItemIds; i++){
            if(idToMarketItemMapping[i+1].owner == msg.sender) {
                ownedNFTs[currentIndex] = idToMarketItemMapping[i+1];
                currentIndex += 1;
            }
        }

        return ownedNFTs;
    }

    function fetchCreatedNFTs() 
        public view returns(MarketItem[] memory)
    {
        uint totalItemIds = itemsId.current();
        uint createdTotalCount = 0;
        uint currentIndex = 0;

        for(uint i = 0; i<totalItemIds; i++){
            if(idToMarketItemMapping[i+1].seller == msg.sender) {
                createdTotalCount += 1;
            }
        }        
        
        MarketItem[] memory createdNFTs = new MarketItem[](createdTotalCount);

        for(uint i = 0; i<totalItemIds; i++){
            if(idToMarketItemMapping[i+1].seller == msg.sender) {
                createdNFTs[currentIndex] = idToMarketItemMapping[i+1];
                currentIndex += 1;
            }
        }

        return createdNFTs;
    }
}
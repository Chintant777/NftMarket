const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("NFT Market Tests", function() {

    let obj = null;

    async function deployContacts() {
        const [owner, _, buyer] = await ethers.getSigners();

        const nft = await ethers.getContractFactory("NFT");
        const nftMarket = await ethers.getContractFactory("NFTMarket");

        const nftMarketContract = await nftMarket.deploy();
        await nftMarketContract.deployed();

        const nftContract = await nft.deploy(nftMarketContract.address);
        await nftContract.deployed();

        return {nftMarketContract, nftContract, owner, buyer};
    } 

    before(async () => {
        obj = await loadFixture(deployContacts);
    });

    it("Minting new NFT", async () => {
        const { nftContract, nftMarketContract, owner } = obj;

        await nftContract.createToken("https://pwskills.com/");
        
        const listingPrice = await nftMarketContract.getListingPrice();
        
        expect(await nftMarketContract.createMarketItem(nftContract.address, 1, ethers.utils.parseEther("1"), { value: listingPrice}))
            .to.emit(nftMarketContract, "MarketItemCreated")
            .withArgs(1, nftContract.address, 1, owner, ethers.utils.AddressZero, listingPrice, false);
    });

    it("Fetch Unsold NFTs", async () => {
        const { nftContract, nftMarketContract } = obj;
        await nftContract.createToken("https://pwskills.com/");

        const listingPrice = await nftMarketContract.getListingPrice();
        await nftMarketContract.createMarketItem(nftContract.address, 2, ethers.utils.parseEther("1"), { value: listingPrice});

        let items = await nftMarketContract.fetchUnsoldMarketItems();

        items = items.map(item => {
            return { "tokenId": item.tokenId, "itemId": item.itemId, "seller": item.seller, "owner": item.owner, "price": item.price, "sold": item.sold};
        });

        const totalNFTItems = await nftMarketContract.getTotalItemsCount();
        const soldNFTItems = await nftMarketContract.getSoldItemsCount();

        expect(items.length).to.equal(totalNFTItems - soldNFTItems);
    });

    it("Selling new NFT", async () => {
        const { nftContract, nftMarketContract, buyer } = obj;
        
        const beforeBalanceBuyer = await ethers.provider.getBalance(buyer.address);
        await nftMarketContract.connect(buyer).sellMarketItem(nftContract.address, 1, {value: ethers.utils.parseEther("1")});
        const afterBalanceBuyer = await ethers.provider.getBalance(buyer.address);
        
        expect(beforeBalanceBuyer).to.gt(afterBalanceBuyer);      
    });
});
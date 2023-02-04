import { ethers } from 'ethers'
import { useEffect, useState } from 'react'
import axios, { HttpStatusCode } from 'axios'
import Web3Modal from 'web3Modal'
import { nftaddress, nftmarketaddress } from '../config'

import NFT from "../artifacts/contracts/NFT.sol/NFT.json"
import NFTMarket from "../artifacts/contracts/NFTMarket.sol/NFTMarket.json"

export default function Home() {
    const [nfts, setNFts] = useState([])
    const [loadingState, setLoadingState] = useState('not-loaded')

    useEffect(() => {
        loadNFTs()
    }, [])

    async function loadNFTs() {
        const provider = new ethers.providers.JsonRpcProvider()
        const nftContract = new ethers.Contract(nftaddress, NFT.abi, provider)
        const nftMarketContract = new ethers.Contract(nftmarketaddress, NFTMarket.abi, provider)
        const data = await nftMarketContract.fetchUnsoldMarketItems()
        
        const items = await Promise.all(data.map(async i => {
            const tokenUri = await nftContract.tokenURI(i.tokenId)
            const meta = await axios.get(tokenUri)
            let price = ethers.utils.formatUnits(i.price.toString(), 'ether')
            let item = {
                price,
                tokenId: i.tokenId.toNumber(),
                itemId: i.itemId.toNumber(),
                seller: i.seller,
                owner: i.owner,
                image: meta.data.image,
                name: meta.data.name,
                description: meta.data.description
            }
            return item

        }))
        setNFts(items)
        setLoadingState('loaded')
    }

    async function buyNFT(nft) {
        const web3Modal = new Web3Modal()
        const connection = await web3Modal.connect()
        const provider = new ethers.providers.Web3Provider(connection)

        const signer = provider.getSigner()
        const contract = new ethers.Contract(nftmarketaddress, NFTMarket.abi, signer)
        const price = ethers.utils.parseUnits(nft.price.toString(), 'ether')
        const transaction = await contract.sellMarketItem(nftaddress, nft.itemId, {
            value: price
        })
        await transaction.wait()
        loadNFTs()
    }

    if (loadingState === "loaded" && !nfts.length)
        return (
            <div>
                <p className="px-10 py-10 text-2xl font-bold flex justify-center text-cyan-200">
                    There are currently no NFTs in the Marketplace.<br /> Please come back later
                </p>
            </div>
        )

    return (
        <div className="flex justify-center">
            <div className="container mx-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 pt-5">
                    {
                        nfts.map((nft, i) => (

                            <div className="w-full max-w-sm bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700" key={i}>
                                <a href="#">
                                    <img className="p-8 rounded-t-lg" src={nft.image} alt="NFT image" width="372" height="372"/>
                                </a>
                                <div className="px-5 pb-5">
                                    <a href="#">
                                        <h5 className="text-xl font-semibold tracking-tight text-gray-900 dark:text-white">{nft.name}</h5>
                                    </a>
                                    <div className="flex items-center mt-2.5 mb-5">
                                        <p className="mb-3 font-normal text-gray-700 dark:text-gray-400">{nft.description}</p>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-3xl font-bold text-gray-900 dark:text-white">{nft.price} ETH</span>
                                        <a href="#" onClick={()=>buyNFT(nft)} className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">Buy Now</a>
                                    </div>
                                </div>
                            </div>
                        ))
                    }
                </div>
            </div>
        </div>
    )
}
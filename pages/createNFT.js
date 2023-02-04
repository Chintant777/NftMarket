import { useState } from 'react'
import { BigNumber, ethers } from 'ethers'
import { create } from 'ipfs-http-client'
import { useRouter } from 'next/router'
import Web3Modal from 'web3modal'
import {
  nftaddress, nftmarketaddress
} from "../config"

import NFT from "../artifacts/contracts/NFT.sol/NFT.json"
import NFTMarket from "../artifacts/contracts/NFTMarket.sol/NFTMarket.json"

const projectId = `${process.env.NEXT_PUBLIC_PROJECT_ID}`;
const projectSecret = `${process.env.NEXT_PUBLIC_PROJECT_SECRET}`;

const auth = "Basic " + Buffer.from(projectId + ":" + projectSecret).toString("base64");
const client = create({
  host: "ipfs.infura.io",
  port: 5001,
  protocol: "https",
  headers: {
    authorization: auth
  },
});

export default function CreateItem() {
  const [fileurl, setFileUrl] = useState(null)
  const [formInput, updateFormInput] = useState({ price: "", name: "", description: "" })

  const router = useRouter()

  async function onChange(e) {
    const file = e.target.files[0];

    try {
      //converting into fileurl to save extra call of api
      const reader = new FileReader();

      reader.addEventListener("load", () => {
        setFileUrl(reader.result);
      }, false);

      reader.readAsDataURL(file);
    } catch (error) {
      console.log("error creating file, please try again:", error)
    }
  }

  async function createMarketItem() {
    const { name, description, price } = formInput;

    if (!name || !description || !price || !fileurl) return;

    const data = JSON.stringify({ name, price, description, image: fileurl });
    try {
      const addFile = await client.add(data);
      createSaleItem(`${process.env.NEXT_PUBLIC_URL}/ipfs/${addFile.path}`);
    } catch (err) {
      console.log("error occured: ", err);
    }
  }

  async function createSaleItem(url) {
    let web3Modal = new Web3Modal();
    const connnection = await web3Modal.connect();
    const provider = new ethers.providers.Web3Provider(connnection);
    const signer = provider.getSigner();

    let nftContract = new ethers.Contract(nftaddress, NFT.abi, signer);
    let transaction = await nftContract.createToken(url);
    let tx = await transaction.wait();

    let tokenId = tx.events[0].args[2];
    tokenId = tokenId.toNumber();

    const price = ethers.utils.parseUnits(formInput.price, 'ether');

    let nftMarketContract = new ethers.Contract(nftmarketaddress, NFTMarket.abi, signer)
    let listingPrice = await nftMarketContract.getListingPrice()
    listingPrice = listingPrice.toString()

    transaction = await nftMarketContract.createMarketItem(nftaddress, tokenId, price, { value: listingPrice });
    await transaction.wait();
    router.push('/');
  }

  return (
    <div className="flex justify-center">
      <div className="w-1/2 flex flex-col pb-12">
        <input placeholder="NFT Name"
          className="mt-8 border rounded p-4"
          onChange={e => updateFormInput({ ...formInput, name: e.target.value })} />

        <textarea
          placeholder="NFT Description"
          className="mt-2 border rounded p-4"
          onChange={e => updateFormInput({ ...formInput, description: e.target.value })} />


        <input
          placeholder="NFT price in ETH"
          className="mt-2 border rounded p-4"
          onChange={e => updateFormInput({ ...formInput, price: e.target.value })} />

        <input
          type="file"
          name="asset"
          className="my-3"
          onChange={onChange} />

        {
          fileurl && (
            <img className="rounded mt-4" width="350" src={fileurl} />
          )
        }
        <button onClick={createMarketItem} className="font-bold mt-4 bg-gradient-to-r from-green-400 to-blue-500 hover:from-pink-500 hover:to-yellow-500 text-white rounded p-4 shadow-lg">
          Create NFT
        </button>
      </div>
    </div>
  );

}
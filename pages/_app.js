import "../styles/globals.css"
import Link from "next/Link"

function Marketplace({Component,pageProps}){
  return(
    <div className="">
      <nav className="border-b p-6 flex justify-start items-center bg-gradient-to-b from-purple-600 to-blue-600">
        <p className="text-4xl font-bold text-cyan-200 mr-10">
          NFT Digital Art
        </p>
        <div className="">
          <Link href="/" className="mr-4 text-xl text-cyan-200">
            Home
          </Link>
          <Link href="/createNFT" className="mr-6 text-xl text-cyan-200">
            Sell Your NFTs
          </Link>
          <Link href="/myNFTs" className="mr-6 text-xl text-cyan-200">
            My NFTs
          </Link>
          <Link href="/dashboard" className="mr-6 text-xl text-cyan-200">
            Created NFTs
          </Link>
        </div>
      </nav>
      <Component{...pageProps}/>
    </div>
  )
}
export default Marketplace
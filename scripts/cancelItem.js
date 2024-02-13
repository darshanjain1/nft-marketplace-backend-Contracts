const { ethers } = require("hardhat")

const TOKEN_ID = 8
const main = async () => {
    const basicNft = await ethers.getContract('BasicNft')
    const nftMarketplace = await ethers.getContract('NftMarketplace')
    const trxResponse = await nftMarketplace.RemoveListItem(basicNft.target, TOKEN_ID)
    await trxResponse.wait(1)
}

main().catch(error => {console.log('error', error);process.exit(-1)})

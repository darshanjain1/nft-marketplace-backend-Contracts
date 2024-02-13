const { ethers } = require("hardhat");

const TOKEN_ID = 8;
const NFT_PRICE = ethers.parseUnits('0.01').toString()

const main = async () => {
    const player = (await ethers.getSigners())[1]
    const basicNft = await ethers.getContract('BasicNft')
    const nftMarketplace = await ethers.getContract('NftMarketplace', player)
    const trxResponse = await nftMarketplace.buyItem(basicNft.target, TOKEN_ID, { value: NFT_PRICE })
    await trxResponse.wait(1)
}
main().catch(error => { console.log('error', error); process.exit(-1) })
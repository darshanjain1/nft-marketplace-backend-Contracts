const { ethers } = require("hardhat")

const TOKEN_ID = 9
const NEW_PRICE = ethers.parseUnits('0.002').toString()
const main = async () => {
    const basicNft = await ethers.getContract('BasicNft')
    const nftMarketplace = await ethers.getContract('NftMarketplace')
    const trxResponse = await nftMarketplace.updateListItem(basicNft.target, TOKEN_ID, NEW_PRICE)
    await trxResponse.wait(1)

}
main().catch(error => { console.log(error), process.exit(-1) })
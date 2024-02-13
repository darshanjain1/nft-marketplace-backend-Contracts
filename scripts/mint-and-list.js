const {ethers} = require('hardhat')

const NFT_PRICE = ethers.parseunits('0.01').toString()
async function mintAndList() {
    const accounts = ethers.getSigners()
    const deployer = accounts[0]
    const player = accounts[1]
    const basicNft = await ethers.getContract("BasicNft")
    const nftMarketplace = await ethers.getContract('NftMarketplace')
    console.log('------minting nft-------')
    const tx = await basicNft.mintNft()
    const tokenId = (await tx.wait(1)).logs[1].args[0];
    console.log('-------Approving nftMarketplace the recently minted nft----')
    const approveTransactionResponse = await basicNft.approve(nftMarketplace.target, tokenId)
    await approveTransactionResponse.wait(1);
    console.log('----listing nft at marketplace----')
    const listNftTrxResponse = await nftMarketplace.listItem(basicNft.target, tokenId, NFT_PRICE)
    await listNftTrxResponse.wait(1)
}

mintAndList().catch((error) => { console.log('error', error); process.exit(-1) })
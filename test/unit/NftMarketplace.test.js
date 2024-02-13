const { network, ethers, deployments } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")
const { expect, assert } = require("chai")

!developmentChains.includes(network.name) ? describe.skip() : describe('Nft marketplace contract tests', () => {
    let basicNftContract, basicNft, nftMarketplaceContract, nftMarketplace, deployer, player
    const NFT_PRICE = ethers.parseEther('0.1')
    const TOKEN_ID = 0
    beforeEach(async () => {
        accounts = await ethers.getSigners()
        deployer = accounts[0]
        player = accounts[1]
        await deployments.fixture(['all'])
        basicNftContract = await ethers.getContract('BasicNft')
        basicNft = basicNftContract.connect(deployer)
        nftMarketplaceContract = await ethers.getContract('NftMarketplace');
        nftMarketplace = nftMarketplaceContract.connect(deployer)
        const trxResponse = await basicNft.mintNft()
        await trxResponse.wait(1)
        await basicNft.approve(nftMarketplace.target, 0)
    })

    describe('List Nft at marketplace successfully', () => {

        it('Does not allow already listed nft to be listed twice', async () => {
            await nftMarketplace.listItem(basicNft.target, 0, NFT_PRICE)
            await expect(nftMarketplace.listItem(basicNft.target, 0, NFT_PRICE)).to.be.revertedWith('NftMarketplace__AlreadyListed')
        })
        it('Only allows owner of nft to list token at marketplace', async () => {
            nftMarketplace = nftMarketplace.connect(player)
            await expect(nftMarketplace.listItem(basicNft.target, 0, NFT_PRICE)).to.be.revertedWith('NftMarketplace__OwnerOfNftToken')
        })
        it('allows to buy listed nft', async () => {
            await nftMarketplace.listItem(basicNft.target, 0, NFT_PRICE)
            let buyerNftContract = nftMarketplaceContract.connect(player);
            let tx = await buyerNftContract.buyItem(basicNft.target, 0, { value: NFT_PRICE })
            await tx.wait(1)
            let newNftOwner = await basicNft.ownerOf(TOKEN_ID)
            let updatedSellerProceeds = await nftMarketplace.getProceeds(deployer)
            await assert.equal(newNftOwner,player.address)
            await assert.equal(updatedSellerProceeds,NFT_PRICE)
        }
        )
    })
})
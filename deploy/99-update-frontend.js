const { network, ethers } = require("hardhat");
const { VERIFICATION_BLOCKS_CONFIRMATION, developmentChains, FRONT_END_LOCATION } = require('../helper-hardhat-config')
const fs = require('fs');

module.exports = async ({ deployments }) => {
    const { log } = deployments

    if (process.env.UPDATE_FRONTEND == 'true') {
        log('----updating front end ----')
        await updateContractAddresses()
        await updateAbi()
        log('---- frontend written---')
    }
}

async function updateAbi() {
    const basicNft = await ethers.getContract('BasicNft')
    const basicNftAbi = JSON.stringify(basicNft.interface.fragments)
    const nftMarketplace = await ethers.getContract('NftMarketplace')
    const nftMarketplaceAbi = JSON.stringify(nftMarketplace.interface.fragments)
    fs.writeFileSync(`${FRONT_END_LOCATION}/BasicNft.json`, basicNftAbi)
    fs.writeFileSync(`${FRONT_END_LOCATION}/NftMarketplace.json`, nftMarketplaceAbi)
}

async function updateContractAddresses() {
    const chainId = network.config.chainId
    const nftMarketplace = await ethers.getContract('NftMarketplace')
    const contractAddresses = JSON.parse(fs.readFileSync(`${FRONT_END_LOCATION}/contractAddresses.json`, 'utf8'))
    if (chainId in contractAddresses) {
        if (!contractAddresses[chainId].NftMarketplace.includes(nftMarketplace.target)){
            contractAddresses[chainId].NftMarketplace.push(nftMarketplace.target)
        }
    }
    else {
        contractAddresses[chainId] = { NftMarketplace: [nftMarketplace.target] }
    }
    fs.writeFileSync(`${FRONT_END_LOCATION}/contractAddresses.json`,JSON.stringify(contractAddresses))
}

module.exports.tags = ['all',"frontend"] 
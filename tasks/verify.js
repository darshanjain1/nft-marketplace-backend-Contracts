const { run } = require("hardhat")

module.exports = async (address, args) => {
    try {
        await run("verify:verify", {
            address,
            constructorArguments: args,
        })
    } catch (err) {
        if (err.message.toLowerCase().includes("already verified"))
            console.log("already verified")
        console.log("error in verification", err)
    }
}

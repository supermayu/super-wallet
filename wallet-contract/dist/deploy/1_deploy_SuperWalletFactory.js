"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hardhat_1 = require("hardhat");
async function main() {
    const anEntryPoint = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789";
    const swapRouter = "0xE592427A0AEce92De3Edee1F18E0157C05861564";
    const superWalletFactory = await hardhat_1.ethers.deployContract("SuperWalletFactory", [
        anEntryPoint,
        swapRouter
    ]);
    await superWalletFactory.waitForDeployment();
    console.log(`SuperWalletFactory deployed to ${superWalletFactory.target}`);
}
// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

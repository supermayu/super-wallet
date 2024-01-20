import { JsonRpcProvider, Wallet } from "ethers";
import { ethers } from "hardhat";

async function main() {

    const anEntryPoint = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789";
    const swapRouter = "0xE592427A0AEce92De3Edee1F18E0157C05861564";

    const privateKey = '21dc3b8e2bb9da2032a5f359ffc9db32c72888e2b6bea8f72994bf2b12be34e6';
    const wallet = new Wallet(privateKey, new JsonRpcProvider("https://goerli.infura.io/v3/da2029cc1bf44af29d5eabf01b7ef808"));


    const superWalletFactory = await ethers.deployContract("SuperWalletFactory", [
        anEntryPoint,
        swapRouter],
        wallet
    );

    await superWalletFactory.waitForDeployment();

    console.log(
        `SuperWalletFactory deployed to ${superWalletFactory.target}`
      );
    console.log(superWalletFactory);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
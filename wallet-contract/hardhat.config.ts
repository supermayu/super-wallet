import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";



const config: HardhatUserConfig = {
  solidity: "0.8.20",
  networks: {
    goerli: {
      url: process.env.INFURA_GOERLI_URL,
      accounts: [process.env.PRIVATE_KEY],
    }
  }
};

export default config;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("@nomicfoundation/hardhat-toolbox");
const config = {
    solidity: "0.8.20",
    networks: {
        goerli: {
            url: "https://goerli.infura.io/v3/da2029cc1bf44af29d5eabf01b7ef808",
            accounts: ["21dc3b8e2bb9da2032a5f359ffc9db32c72888e2b6bea8f72994bf2b12be34e6"],
        }
    }
};
exports.default = config;

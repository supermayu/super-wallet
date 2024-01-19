"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Create2Factory_1 = require("../src/Create2Factory");
const hardhat_1 = require("hardhat");
const chai_1 = require("chai");
const typechain_1 = require("../typechain");
describe('test Create2Factory', () => {
    let factory;
    let provider;
    if (process.env.COVERAGE != null) {
        return;
    }
    before(async () => {
        provider = hardhat_1.ethers.provider;
        factory = new Create2Factory_1.Create2Factory(provider);
    });
    it('should deploy the factory', async () => {
        (0, chai_1.expect)(await factory._isFactoryDeployed()).to.equal(false, 'factory exists before test deploy');
        await factory.deployFactory();
        (0, chai_1.expect)(await factory._isFactoryDeployed()).to.equal(true, 'factory failed to deploy');
    });
    it('should deploy to known address', async () => {
        const initCode = typechain_1.TestToken__factory.bytecode;
        const addr = Create2Factory_1.Create2Factory.getDeployedAddress(initCode, 0);
        (0, chai_1.expect)(await provider.getCode(addr).then(code => code.length)).to.equal(2);
        await factory.deploy(initCode, 0);
        (0, chai_1.expect)(await provider.getCode(addr).then(code => code.length)).to.gt(100);
    });
    it('should deploy to different address based on salt', async () => {
        const initCode = typechain_1.TestToken__factory.bytecode;
        const addr = Create2Factory_1.Create2Factory.getDeployedAddress(initCode, 123);
        (0, chai_1.expect)(await provider.getCode(addr).then(code => code.length)).to.equal(2);
        await factory.deploy(initCode, 123);
        (0, chai_1.expect)(await provider.getCode(addr).then(code => code.length)).to.gt(100);
    });
});

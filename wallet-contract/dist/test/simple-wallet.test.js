"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hardhat_1 = require("hardhat");
const chai_1 = require("chai");
const typechain_1 = require("../typechain");
const testutils_1 = require("./testutils");
const UserOp_1 = require("./UserOp");
const utils_1 = require("ethers/lib/utils");
describe('SimpleAccount', function () {
    let entryPoint;
    let accounts;
    let testUtil;
    let accountOwner;
    const ethersSigner = hardhat_1.ethers.provider.getSigner();
    before(async function () {
        entryPoint = await (0, testutils_1.deployEntryPoint)().then(e => e.address);
        accounts = await hardhat_1.ethers.provider.listAccounts();
        // ignore in geth.. this is just a sanity test. should be refactored to use a single-account mode..
        if (accounts.length < 2)
            this.skip();
        testUtil = await new typechain_1.TestUtil__factory(ethersSigner).deploy();
        accountOwner = (0, testutils_1.createAccountOwner)();
    });
    it('owner should be able to call transfer', async () => {
        const { proxy: account } = await (0, testutils_1.createAccount)(hardhat_1.ethers.provider.getSigner(), accounts[0], entryPoint);
        await ethersSigner.sendTransaction({ from: accounts[0], to: account.address, value: (0, utils_1.parseEther)('2') });
        await account.execute(accounts[2], testutils_1.ONE_ETH, '0x');
    });
    it('other account should not be able to call transfer', async () => {
        const { proxy: account } = await (0, testutils_1.createAccount)(hardhat_1.ethers.provider.getSigner(), accounts[0], entryPoint);
        await (0, chai_1.expect)(account.connect(hardhat_1.ethers.provider.getSigner(1)).execute(accounts[2], testutils_1.ONE_ETH, '0x'))
            .to.be.revertedWith('account: not Owner or EntryPoint');
    });
    it('should pack in js the same as solidity', async () => {
        const op = await (0, UserOp_1.fillUserOpDefaults)({ sender: accounts[0] });
        const encoded = (0, UserOp_1.encodeUserOp)(op);
        const packed = (0, UserOp_1.packUserOp)(op);
        (0, chai_1.expect)(await testUtil.encodeUserOp(packed)).to.equal(encoded);
    });
    describe('#executeBatch', () => {
        let account;
        let counter;
        before(async () => {
            ({ proxy: account } = await (0, testutils_1.createAccount)(ethersSigner, await ethersSigner.getAddress(), entryPoint));
            counter = await new typechain_1.TestCounter__factory(ethersSigner).deploy();
        });
        it('should allow zero value array', async () => {
            const counterJustEmit = await counter.populateTransaction.justemit().then(tx => tx.data);
            const rcpt = await account.executeBatch([counter.address, counter.address], [], [counterJustEmit, counterJustEmit]).then(async (t) => await t.wait());
            const targetLogs = await counter.queryFilter(counter.filters.CalledFrom(), rcpt.blockHash);
            (0, chai_1.expect)(targetLogs.length).to.eq(2);
        });
        it('should allow transfer value', async () => {
            const counterJustEmit = await counter.populateTransaction.justemit().then(tx => tx.data);
            const target = (0, testutils_1.createAddress)();
            await ethersSigner.sendTransaction({ from: accounts[0], to: account.address, value: (0, utils_1.parseEther)('2') });
            const rcpt = await account.executeBatch([target, counter.address], [testutils_1.ONE_ETH, 0], ['0x', counterJustEmit]).then(async (t) => await t.wait());
            (0, chai_1.expect)(await hardhat_1.ethers.provider.getBalance(target)).to.equal(testutils_1.ONE_ETH);
            const targetLogs = await counter.queryFilter(counter.filters.CalledFrom(), rcpt.blockHash);
            (0, chai_1.expect)(targetLogs.length).to.eq(1);
        });
        it('should fail with wrong array length', async () => {
            const counterJustEmit = await counter.populateTransaction.justemit().then(tx => tx.data);
            await (0, chai_1.expect)(account.executeBatch([counter.address, counter.address], [0], [counterJustEmit, counterJustEmit]))
                .to.be.revertedWith('wrong array lengths');
        });
    });
    describe('#validateUserOp', () => {
        let account;
        let userOp;
        let userOpHash;
        let preBalance;
        let expectedPay;
        const actualGasPrice = 1e9;
        // for testing directly validateUserOp, we initialize the account with EOA as entryPoint.
        let entryPointEoa;
        before(async () => {
            entryPointEoa = accounts[2];
            const epAsSigner = await hardhat_1.ethers.getSigner(entryPointEoa);
            // cant use "SimpleAccountFactory", since it attempts to increment nonce first
            const implementation = await new typechain_1.SimpleAccount__factory(ethersSigner).deploy(entryPointEoa);
            const proxy = await new typechain_1.ERC1967Proxy__factory(ethersSigner).deploy(implementation.address, '0x');
            account = typechain_1.SimpleAccount__factory.connect(proxy.address, epAsSigner);
            await ethersSigner.sendTransaction({ from: accounts[0], to: account.address, value: (0, utils_1.parseEther)('0.2') });
            const callGasLimit = 200000;
            const verificationGasLimit = 100000;
            const maxFeePerGas = 3e9;
            const chainId = await hardhat_1.ethers.provider.getNetwork().then(net => net.chainId);
            userOp = (0, UserOp_1.signUserOp)((0, UserOp_1.fillUserOpDefaults)({
                sender: account.address,
                callGasLimit,
                verificationGasLimit,
                maxFeePerGas
            }), accountOwner, entryPointEoa, chainId);
            userOpHash = await (0, UserOp_1.getUserOpHash)(userOp, entryPointEoa, chainId);
            expectedPay = actualGasPrice * (callGasLimit + verificationGasLimit);
            preBalance = await (0, testutils_1.getBalance)(account.address);
            const packedOp = (0, UserOp_1.packUserOp)(userOp);
            const ret = await account.validateUserOp(packedOp, userOpHash, expectedPay, { gasPrice: actualGasPrice });
            await ret.wait();
        });
        it('should pay', async () => {
            const postBalance = await (0, testutils_1.getBalance)(account.address);
            (0, chai_1.expect)(preBalance - postBalance).to.eql(expectedPay);
        });
        it('should return NO_SIG_VALIDATION on wrong signature', async () => {
            const userOpHash = testutils_1.HashZero;
            const packedOp = (0, UserOp_1.packUserOp)(userOp);
            const deadline = await account.callStatic.validateUserOp({ ...packedOp, nonce: 1 }, userOpHash, 0);
            (0, chai_1.expect)(deadline).to.eq(1);
        });
    });
    context('SimpleAccountFactory', () => {
        it('sanity: check deployer', async () => {
            const ownerAddr = (0, testutils_1.createAddress)();
            const deployer = await new typechain_1.SimpleAccountFactory__factory(ethersSigner).deploy(entryPoint);
            const target = await deployer.callStatic.createAccount(ownerAddr, 1234);
            (0, chai_1.expect)(await (0, testutils_1.isDeployed)(target)).to.eq(false);
            await deployer.createAccount(ownerAddr, 1234);
            (0, chai_1.expect)(await (0, testutils_1.isDeployed)(target)).to.eq(true);
        });
    });
});

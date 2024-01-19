"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hardhat_1 = require("hardhat");
const chai_1 = require("chai");
const typechain_1 = require("../typechain");
const testutils_1 = require("./testutils");
const UserOp_1 = require("./UserOp");
const ethers_1 = require("ethers");
const utils_1 = require("ethers/lib/utils");
const provider = hardhat_1.ethers.provider;
describe('EntryPointSimulations', function () {
    const ethersSigner = hardhat_1.ethers.provider.getSigner();
    let account;
    let accountOwner;
    let simpleAccountFactory;
    let entryPoint;
    let epSimulation;
    before(async function () {
        entryPoint = await (0, testutils_1.deployEntryPoint)();
        epSimulation = await new typechain_1.EntryPointSimulations__factory(provider.getSigner()).deploy();
        accountOwner = (0, testutils_1.createAccountOwner)();
        ({
            proxy: account,
            accountFactory: simpleAccountFactory
        } = await (0, testutils_1.createAccount)(ethersSigner, await accountOwner.getAddress(), entryPoint.address));
        // await checkStateDiffSupported()
    });
    describe('Simulation Contract Sanity checks', () => {
        // validate that successful simulation is always successful on real entrypoint,
        // regardless of "environment" parameters (like gaslimit)
        const addr = (0, testutils_1.createAddress)();
        // coverage skews gas checks.
        if (process.env.COVERAGE != null) {
            return;
        }
        function costInRange(simCost, epCost, message) {
            const diff = simCost.sub(epCost).toNumber();
            const max = 350;
            (0, chai_1.expect)(diff).to.be.within(0, max, `${message} cost ${simCost.toNumber()} should be (up to ${max}) above ep cost ${epCost.toNumber()}`);
        }
        it('deposit on simulation must be >= real entrypoint', async () => {
            costInRange(await epSimulation.estimateGas.depositTo(addr, { value: 1 }), await entryPoint.estimateGas.depositTo(addr, { value: 1 }), 'deposit with value');
        });
        it('deposit without value on simulation must be >= real entrypoint', async () => {
            costInRange(await epSimulation.estimateGas.depositTo(addr, { value: 0 }), await entryPoint.estimateGas.depositTo(addr, { value: 0 }), 'deposit without value');
        });
        it('eth transfer on simulation must be >= real entrypoint', async () => {
            costInRange(await provider.estimateGas({ to: epSimulation.address, value: 1 }), await provider.estimateGas({ to: entryPoint.address, value: 1 }), 'eth transfer with value');
        });
        it('eth transfer (even without value) on simulation must be >= real entrypoint', async () => {
            costInRange(await provider.estimateGas({ to: epSimulation.address, value: 0 }), await provider.estimateGas({ to: entryPoint.address, value: 0 }), 'eth transfer with value');
        });
    });
    /*
    async function checkStateDiffSupported (): Promise<void> {
      const tx: TransactionRequest = {
        to: entryPoint.address,
        data: '0x'
      }
      const stateOverride = {
        [entryPoint.address]: {
          code: '0x61030960005260206000f3'
          // 0000  61  PUSH2 0x0309  | value  777
          // 0003  60  PUSH1 0x00    | offset   0
          // 0005  52  MSTORE        |
          // 0006  60  PUSH1 0x20    | size    32
          // 0008  60  PUSH1 0x00    | offset   0
          // 000A  F3  RETURN        |
        }
      }
      const simulationResult = await ethers.provider.send('eth_call', [tx, 'latest', stateOverride])
      expect(parseInt(simulationResult, 16)).to.equal(777)
    }
  */
    describe('#simulateValidation', () => {
        const accountOwner1 = (0, testutils_1.createAccountOwner)();
        let account1;
        before(async () => {
            ({ proxy: account1 } = await (0, testutils_1.createAccount)(ethersSigner, await accountOwner1.getAddress(), entryPoint.address));
            await account.addDeposit({ value: testutils_1.ONE_ETH });
            (0, chai_1.expect)(await (0, testutils_1.getBalance)(account.address)).to.equal(0);
            (0, chai_1.expect)(await account.getDeposit()).to.eql(testutils_1.ONE_ETH);
        });
        it('should fail if validateUserOp fails', async () => {
            // using wrong nonce
            const op = await (0, UserOp_1.fillSignAndPack)({ sender: account.address, nonce: 1234 }, accountOwner, entryPoint);
            await (0, chai_1.expect)((0, UserOp_1.simulateValidation)(op, entryPoint.address)).to
                .revertedWith('AA25 invalid account nonce');
        });
        it('should report signature failure without revert', async () => {
            // (this is actually a feature of the wallet, not the entrypoint)
            // using wrong owner for account1
            // (zero gas price so that it doesn't fail on prefund)
            const op = await (0, UserOp_1.fillSignAndPack)({ sender: account1.address, maxFeePerGas: 0 }, accountOwner, entryPoint);
            const { returnInfo } = await (0, UserOp_1.simulateValidation)(op, entryPoint.address);
            (0, chai_1.expect)(returnInfo.sigFailed).to.be.true;
        });
        it('should revert if wallet not deployed (and no initCode)', async () => {
            const op = await (0, UserOp_1.fillSignAndPack)({
                sender: (0, testutils_1.createAddress)(),
                nonce: 0,
                verificationGasLimit: 1000
            }, accountOwner, entryPoint);
            await (0, chai_1.expect)((0, UserOp_1.simulateValidation)(op, entryPoint.address)).to
                .revertedWith('AA20 account not deployed');
        });
        it('should revert on oog if not enough verificationGas', async () => {
            const op = await (0, UserOp_1.fillSignAndPack)({ sender: account.address, verificationGasLimit: 1000 }, accountOwner, entryPoint);
            await (0, chai_1.expect)((0, UserOp_1.simulateValidation)(op, entryPoint.address)).to
                .revertedWith('AA23 reverted');
        });
        it('should succeed if validateUserOp succeeds', async () => {
            const op = await (0, UserOp_1.fillSignAndPack)({ sender: account1.address }, accountOwner1, entryPoint);
            await (0, testutils_1.fund)(account1);
            await (0, UserOp_1.simulateValidation)(op, entryPoint.address);
        });
        it('should return empty context if no paymaster', async () => {
            const op = await (0, UserOp_1.fillSignAndPack)({ sender: account1.address, maxFeePerGas: 0 }, accountOwner1, entryPoint);
            const { returnInfo } = await (0, UserOp_1.simulateValidation)(op, entryPoint.address);
            (0, chai_1.expect)(returnInfo.paymasterContext).to.eql('0x');
        });
        it('should return stake of sender', async () => {
            const stakeValue = ethers_1.BigNumber.from(123);
            const unstakeDelay = 3;
            const { proxy: account2 } = await (0, testutils_1.createAccount)(ethersSigner, await ethersSigner.getAddress(), entryPoint.address);
            await (0, testutils_1.fund)(account2);
            await account2.execute(entryPoint.address, stakeValue, entryPoint.interface.encodeFunctionData('addStake', [unstakeDelay]));
            const op = await (0, UserOp_1.fillSignAndPack)({ sender: account2.address }, ethersSigner, entryPoint);
            const result = await (0, UserOp_1.simulateValidation)(op, entryPoint.address);
            (0, chai_1.expect)(result.senderInfo.stake).to.equal(stakeValue);
            (0, chai_1.expect)(result.senderInfo.unstakeDelaySec).to.equal(unstakeDelay);
        });
        it('should prevent overflows: fail if any numeric value is more than 120 bits', async () => {
            const op = await (0, UserOp_1.fillSignAndPack)({
                preVerificationGas: ethers_1.BigNumber.from(2).pow(130),
                sender: account1.address
            }, accountOwner1, entryPoint);
            await (0, chai_1.expect)((0, UserOp_1.simulateValidation)(op, entryPoint.address)).to.revertedWith('gas values overflow');
        });
        it('should fail creation for wrong sender', async () => {
            const op1 = await (0, UserOp_1.fillSignAndPack)({
                initCode: (0, testutils_1.getAccountInitCode)(accountOwner1.address, simpleAccountFactory),
                sender: '0x'.padEnd(42, '1'),
                verificationGasLimit: 30e6
            }, accountOwner1, entryPoint);
            await (0, chai_1.expect)((0, UserOp_1.simulateValidation)(op1, entryPoint.address))
                .to.revertedWith('AA14 initCode must return sender');
        });
        it('should report failure on insufficient verificationGas (OOG) for creation', async () => {
            const initCode = (0, testutils_1.getAccountInitCode)(accountOwner1.address, simpleAccountFactory);
            const sender = await entryPoint.callStatic.getSenderAddress(initCode).catch(e => e.errorArgs.sender);
            const op0 = await (0, UserOp_1.fillSignAndPack)({
                initCode,
                sender,
                verificationGasLimit: 5e5,
                maxFeePerGas: 0
            }, accountOwner1, entryPoint);
            // must succeed with enough verification gas.
            await (0, UserOp_1.simulateValidation)(op0, entryPoint.address, { gas: '0xF4240' });
            const op1 = await (0, UserOp_1.fillSignAndPack)({
                initCode,
                sender,
                verificationGasLimit: 1e5,
                maxFeePerGas: 0
            }, accountOwner1, entryPoint);
            await (0, chai_1.expect)((0, UserOp_1.simulateValidation)(op1, entryPoint.address, { gas: '0xF4240' }))
                .to.revertedWith('AA13 initCode failed or OOG');
        });
        it('should succeed for creating an account', async () => {
            const sender = await (0, testutils_1.getAccountAddress)(accountOwner1.address, simpleAccountFactory);
            const op1 = await (0, UserOp_1.fillSignAndPack)({
                sender,
                initCode: (0, testutils_1.getAccountInitCode)(accountOwner1.address, simpleAccountFactory)
            }, accountOwner1, entryPoint);
            await (0, testutils_1.fund)(op1.sender);
            await (0, UserOp_1.simulateValidation)(op1, entryPoint.address);
        });
        it('should not call initCode from entrypoint', async () => {
            // a possible attack: call an account's execFromEntryPoint through initCode. This might lead to stolen funds.
            const { proxy: account } = await (0, testutils_1.createAccount)(ethersSigner, await accountOwner.getAddress(), entryPoint.address);
            const sender = (0, testutils_1.createAddress)();
            const op1 = await (0, UserOp_1.fillSignAndPack)({
                initCode: (0, utils_1.hexConcat)([
                    account.address,
                    account.interface.encodeFunctionData('execute', [sender, 0, '0x'])
                ]),
                sender
            }, accountOwner, entryPoint);
            const error = await (0, UserOp_1.simulateValidation)(op1, entryPoint.address).catch(e => e);
            (0, chai_1.expect)(error.message).to.match(/initCode failed or OOG/, error);
        });
    });
    describe('#simulateHandleOp', () => {
        it('should simulate execution', async () => {
            const accountOwner1 = (0, testutils_1.createAccountOwner)();
            const { proxy: account } = await (0, testutils_1.createAccount)(ethersSigner, await accountOwner.getAddress(), entryPoint.address);
            await (0, testutils_1.fund)(account);
            const counter = await new typechain_1.TestCounter__factory(ethersSigner).deploy();
            const count = counter.interface.encodeFunctionData('count');
            const callData = account.interface.encodeFunctionData('execute', [counter.address, 0, count]);
            // deliberately broken signature. simulate should work with it too.
            const userOp = await (0, UserOp_1.fillSignAndPack)({
                sender: account.address,
                callData
            }, accountOwner1, entryPoint);
            const ret = await (0, UserOp_1.simulateHandleOp)(userOp, counter.address, counter.interface.encodeFunctionData('counters', [account.address]), entryPoint.address);
            const [countResult] = counter.interface.decodeFunctionResult('counters', ret.targetResult);
            (0, chai_1.expect)(countResult).to.equal(1);
            (0, chai_1.expect)(ret.targetSuccess).to.be.true;
            // actual counter is zero
            (0, chai_1.expect)(await counter.counters(account.address)).to.equal(0);
        });
    });
});

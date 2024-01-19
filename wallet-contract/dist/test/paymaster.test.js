"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hardhat_1 = require("hardhat");
const chai_1 = require("chai");
const typechain_1 = require("../typechain");
const testutils_1 = require("./testutils");
const UserOp_1 = require("./UserOp");
const utils_1 = require("ethers/lib/utils");
const bytes_1 = require("@ethersproject/bytes");
describe('EntryPoint with paymaster', function () {
    let entryPoint;
    let accountOwner;
    const ethersSigner = hardhat_1.ethers.provider.getSigner();
    let account;
    const beneficiaryAddress = '0x'.padEnd(42, '1');
    let factory;
    function getAccountDeployer(entryPoint, accountOwner, _salt = 0) {
        return (0, utils_1.hexConcat)([
            factory.address,
            (0, bytes_1.hexValue)(factory.interface.encodeFunctionData('createAccount', [accountOwner, _salt]))
        ]);
    }
    before(async function () {
        this.timeout(20000);
        await (0, testutils_1.checkForGeth)();
        entryPoint = await (0, testutils_1.deployEntryPoint)();
        factory = await new typechain_1.SimpleAccountFactory__factory(ethersSigner).deploy(entryPoint.address);
        accountOwner = (0, testutils_1.createAccountOwner)();
        ({ proxy: account } = await (0, testutils_1.createAccount)(ethersSigner, await accountOwner.getAddress(), entryPoint.address, factory));
        await (0, testutils_1.fund)(account);
    });
    describe('#TokenPaymaster', () => {
        let paymaster;
        const otherAddr = (0, testutils_1.createAddress)();
        let ownerAddr;
        let pmAddr;
        before(async () => {
            paymaster = await new typechain_1.LegacyTokenPaymaster__factory(ethersSigner).deploy(factory.address, 'ttt', entryPoint.address);
            pmAddr = paymaster.address;
            ownerAddr = await ethersSigner.getAddress();
        });
        it('paymaster should revert on wrong entryPoint type', async () => {
            // account is a sample contract with supportsInterface (which is obviously not an entrypoint)
            const notEntryPoint = account;
            // a contract that has "supportsInterface" but with different interface value..
            await (0, chai_1.expect)(new typechain_1.LegacyTokenPaymaster__factory(ethersSigner).deploy(factory.address, 'ttt', notEntryPoint.address))
                .to.be.revertedWith('IEntryPoint interface mismatch');
            await (0, chai_1.expect)(new typechain_1.LegacyTokenPaymaster__factory(ethersSigner).deploy(factory.address, 'ttt', testutils_1.AddressZero))
                .to.be.revertedWith('');
        });
        it('owner should have allowance to withdraw funds', async () => {
            (0, chai_1.expect)(await paymaster.allowance(pmAddr, ownerAddr)).to.equal(hardhat_1.ethers.constants.MaxUint256);
            (0, chai_1.expect)(await paymaster.allowance(pmAddr, otherAddr)).to.equal(0);
        });
        it('should allow only NEW owner to move funds after transferOwnership', async () => {
            await paymaster.transferOwnership(otherAddr);
            (0, chai_1.expect)(await paymaster.allowance(pmAddr, otherAddr)).to.equal(hardhat_1.ethers.constants.MaxUint256);
            (0, chai_1.expect)(await paymaster.allowance(pmAddr, ownerAddr)).to.equal(0);
        });
    });
    describe('using TokenPaymaster (account pays in paymaster tokens)', () => {
        let paymaster;
        before(async () => {
            paymaster = await new typechain_1.LegacyTokenPaymaster__factory(ethersSigner).deploy(factory.address, 'tst', entryPoint.address);
            await entryPoint.depositTo(paymaster.address, { value: (0, utils_1.parseEther)('1') });
            await paymaster.addStake(1, { value: (0, utils_1.parseEther)('2') });
        });
        describe('#handleOps', () => {
            let calldata;
            before(async () => {
                const updateEntryPoint = await account.populateTransaction.withdrawDepositTo(testutils_1.AddressZero, 0).then(tx => tx.data);
                calldata = await account.populateTransaction.execute(account.address, 0, updateEntryPoint).then(tx => tx.data);
            });
            it('paymaster should reject if account doesn\'t have tokens', async () => {
                const op = await (0, UserOp_1.fillSignAndPack)({
                    sender: account.address,
                    paymaster: paymaster.address,
                    paymasterPostOpGasLimit: 3e5,
                    callData: calldata
                }, accountOwner, entryPoint);
                (0, chai_1.expect)(await entryPoint.callStatic.handleOps([op], beneficiaryAddress, {
                    gasLimit: 1e7
                }).catch(e => (0, testutils_1.decodeRevertReason)(e)))
                    .to.include('TokenPaymaster: no balance');
                (0, chai_1.expect)(await entryPoint.handleOps([op], beneficiaryAddress, {
                    gasLimit: 1e7
                }).catch(e => (0, testutils_1.decodeRevertReason)(e)))
                    .to.include('TokenPaymaster: no balance');
            });
        });
        describe('create account', () => {
            let createOp;
            let created = false;
            const beneficiaryAddress = (0, testutils_1.createAddress)();
            it('should reject if account not funded', async () => {
                const op = await (0, UserOp_1.fillSignAndPack)({
                    initCode: getAccountDeployer(entryPoint.address, accountOwner.address, 1),
                    verificationGasLimit: 1e7,
                    paymaster: paymaster.address,
                    paymasterPostOpGasLimit: 3e5
                }, accountOwner, entryPoint);
                (0, chai_1.expect)(await entryPoint.callStatic.handleOps([op], beneficiaryAddress, {
                    gasLimit: 1e7
                }).catch(e => (0, testutils_1.decodeRevertReason)(e)))
                    .to.include('TokenPaymaster: no balance');
            });
            it('should succeed to create account with tokens', async () => {
                createOp = await (0, UserOp_1.fillSignAndPack)({
                    initCode: getAccountDeployer(entryPoint.address, accountOwner.address, 3),
                    verificationGasLimit: 2e6,
                    paymaster: paymaster.address,
                    paymasterPostOpGasLimit: 3e5,
                    nonce: 0
                }, accountOwner, entryPoint);
                const preAddr = createOp.sender;
                await paymaster.mintTokens(preAddr, (0, utils_1.parseEther)('1'));
                // paymaster is the token, so no need for "approve" or any init function...
                // const snapshot = await ethers.provider.send('evm_snapshot', [])
                await (0, UserOp_1.simulateValidation)(createOp, entryPoint.address, { gasLimit: 5e6 });
                // TODO: can't do opcode banning with EntryPointSimulations (since its not on-chain) add when we can debug_traceCall
                // const [tx] = await ethers.provider.getBlock('latest').then(block => block.transactions)
                // await checkForBannedOps(tx, true)
                // await ethers.provider.send('evm_revert', [snapshot])
                const rcpt = await entryPoint.handleOps([createOp], beneficiaryAddress, {
                    gasLimit: 1e7
                }).catch((0, testutils_1.rethrow)()).then(async (tx) => await tx.wait());
                console.log('\t== create gasUsed=', rcpt.gasUsed.toString());
                await (0, testutils_1.calcGasUsage)(rcpt, entryPoint);
                created = true;
            });
            it('account should pay for its creation (in tst)', async function () {
                if (!created)
                    this.skip();
                // TODO: calculate needed payment
                const ethRedeemed = await (0, testutils_1.getBalance)(beneficiaryAddress);
                (0, chai_1.expect)(ethRedeemed).to.above(100000);
                const accountAddr = await (0, testutils_1.getAccountAddress)(accountOwner.address, factory);
                const postBalance = await (0, testutils_1.getTokenBalance)(paymaster, accountAddr);
                (0, chai_1.expect)(1e18 - postBalance).to.above(10000);
            });
            it('should reject if account already created', async function () {
                if (!created)
                    this.skip();
                await (0, chai_1.expect)(entryPoint.callStatic.handleOps([createOp], beneficiaryAddress, {
                    gasLimit: 1e7
                }).catch((0, testutils_1.rethrow)())).to.revertedWith('sender already constructed');
            });
            it('batched request should each pay for its share', async function () {
                this.timeout(20000);
                // validate context is passed correctly to postOp
                // (context is the account to pay with)
                const beneficiaryAddress = (0, testutils_1.createAddress)();
                const testCounter = await new typechain_1.TestCounter__factory(ethersSigner).deploy();
                const justEmit = testCounter.interface.encodeFunctionData('justemit');
                const execFromSingleton = account.interface.encodeFunctionData('execute', [testCounter.address, 0, justEmit]);
                const ops = [];
                const accounts = [];
                for (let i = 0; i < 4; i++) {
                    const { proxy: aAccount } = await (0, testutils_1.createAccount)(ethersSigner, await accountOwner.getAddress(), entryPoint.address);
                    await paymaster.mintTokens(aAccount.address, (0, utils_1.parseEther)('1'));
                    const op = await (0, UserOp_1.fillSignAndPack)({
                        sender: aAccount.address,
                        callData: execFromSingleton,
                        paymaster: paymaster.address,
                        paymasterPostOpGasLimit: 3e5
                    }, accountOwner, entryPoint);
                    accounts.push(aAccount);
                    ops.push(op);
                }
                const pmBalanceBefore = await paymaster.balanceOf(paymaster.address).then(b => b.toNumber());
                await entryPoint.handleOps(ops, beneficiaryAddress).then(async (tx) => tx.wait());
                const totalPaid = await paymaster.balanceOf(paymaster.address).then(b => b.toNumber()) - pmBalanceBefore;
                for (let i = 0; i < accounts.length; i++) {
                    const bal = await (0, testutils_1.getTokenBalance)(paymaster, accounts[i].address);
                    const paid = (0, utils_1.parseEther)('1').sub(bal.toString()).toNumber();
                    // roughly each account should pay 1/4th of total price, within 15%
                    // (first account pays more, for warming up..)
                    (0, chai_1.expect)(paid).to.be.closeTo(totalPaid / 4, paid * 0.15);
                }
            });
            // accounts attempt to grief paymaster: both accounts pass validatePaymasterUserOp (since they have enough balance)
            // but the execution of account1 drains account2.
            // as a result, the postOp of the paymaster reverts, and cause entire handleOp to revert.
            describe('grief attempt', () => {
                let account2;
                let approveCallData;
                before(async function () {
                    this.timeout(20000);
                    ({ proxy: account2 } = await (0, testutils_1.createAccount)(ethersSigner, await accountOwner.getAddress(), entryPoint.address));
                    await paymaster.mintTokens(account2.address, (0, utils_1.parseEther)('1'));
                    await paymaster.mintTokens(account.address, (0, utils_1.parseEther)('1'));
                    approveCallData = paymaster.interface.encodeFunctionData('approve', [account.address, hardhat_1.ethers.constants.MaxUint256]);
                    // need to call approve from account2. use paymaster for that
                    const approveOp = await (0, UserOp_1.fillSignAndPack)({
                        sender: account2.address,
                        callData: account2.interface.encodeFunctionData('execute', [paymaster.address, 0, approveCallData]),
                        paymaster: paymaster.address,
                        paymasterPostOpGasLimit: 3e5
                    }, accountOwner, entryPoint);
                    await entryPoint.handleOps([approveOp], beneficiaryAddress);
                    (0, chai_1.expect)(await paymaster.allowance(account2.address, account.address)).to.eq(hardhat_1.ethers.constants.MaxUint256);
                });
                it('griefing attempt in postOp should cause the execution part of UserOp to revert', async () => {
                    // account1 is approved to withdraw going to withdraw account2's balance
                    const account2Balance = await paymaster.balanceOf(account2.address);
                    const transferCost = (0, utils_1.parseEther)('1').sub(account2Balance);
                    const withdrawAmount = account2Balance.sub(transferCost.mul(0));
                    const withdrawTokens = paymaster.interface.encodeFunctionData('transferFrom', [account2.address, account.address, withdrawAmount]);
                    const execFromEntryPoint = account.interface.encodeFunctionData('execute', [paymaster.address, 0, withdrawTokens]);
                    const userOp1 = await (0, UserOp_1.fillSignAndPack)({
                        sender: account.address,
                        callData: execFromEntryPoint,
                        paymaster: paymaster.address,
                        paymasterPostOpGasLimit: 3e5
                    }, accountOwner, entryPoint);
                    // account2's operation is unimportant, as it is going to be reverted - but the paymaster will have to pay for it.
                    const userOp2 = await (0, UserOp_1.fillSignAndPack)({
                        sender: account2.address,
                        callData: execFromEntryPoint,
                        paymaster: paymaster.address,
                        paymasterPostOpGasLimit: 3e5,
                        callGasLimit: 1e6
                    }, accountOwner, entryPoint);
                    const rcpt = await entryPoint.handleOps([
                        userOp1,
                        userOp2
                    ], beneficiaryAddress);
                    const transferEvents = await paymaster.queryFilter(paymaster.filters.Transfer(), rcpt.blockHash);
                    const [log1, log2] = await entryPoint.queryFilter(entryPoint.filters.UserOperationEvent(), rcpt.blockHash);
                    (0, chai_1.expect)(log1.args.success).to.eq(true);
                    (0, chai_1.expect)(log2.args.success).to.eq(false);
                    (0, chai_1.expect)(transferEvents.length).to.eq(2);
                });
            });
        });
        describe('withdraw', () => {
            const withdrawAddress = (0, testutils_1.createAddress)();
            it('should fail to withdraw before unstake', async function () {
                this.timeout(20000);
                await (0, chai_1.expect)(paymaster.withdrawStake(withdrawAddress)).to.revertedWith('must call unlockStake');
            });
            it('should be able to withdraw after unstake delay', async () => {
                await paymaster.unlockStake();
                const amount = await entryPoint.getDepositInfo(paymaster.address).then(info => info.stake);
                (0, chai_1.expect)(amount).to.be.gte(testutils_1.ONE_ETH.div(2));
                await hardhat_1.ethers.provider.send('evm_mine', [Math.floor(Date.now() / 1000) + 1000]);
                await paymaster.withdrawStake(withdrawAddress);
                (0, chai_1.expect)(await hardhat_1.ethers.provider.getBalance(withdrawAddress)).to.eql(amount);
                (0, chai_1.expect)(await entryPoint.getDepositInfo(paymaster.address).then(info => info.stake)).to.eq(0);
            });
        });
    });
});

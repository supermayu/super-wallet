"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ethers_1 = require("ethers");
const utils_1 = require("ethers/lib/utils");
const chai_1 = require("chai");
const hardhat_1 = require("hardhat");
const typechain_1 = require("../../typechain");
const testutils_1 = require("../testutils");
const UserOp_1 = require("../UserOp");
const priceDenominator = ethers_1.BigNumber.from(10).pow(26);
function uniq(arr) {
    // remove items with duplicate "name" attribute
    return Object.values(arr.reduce((set, item) => ({ ...set, [item.name]: item }), {}));
}
describe('TokenPaymaster', function () {
    const minEntryPointBalance = 1e17.toString();
    const initialPriceToken = 100000000; // USD per TOK
    const initialPriceEther = 500000000; // USD per ETH
    const ethersSigner = hardhat_1.ethers.provider.getSigner();
    const beneficiaryAddress = '0x'.padEnd(42, '1');
    const testInterface = new utils_1.Interface(uniq([
        ...typechain_1.TestUniswap__factory.abi,
        ...typechain_1.TestERC20__factory.abi,
        ...typechain_1.TokenPaymaster__factory.abi,
        ...typechain_1.EntryPoint__factory.abi
    ]));
    let chainId;
    let testUniswap;
    let entryPoint;
    let accountOwner;
    let tokenOracle;
    let nativeAssetOracle;
    let account;
    let factory;
    let paymasterAddress;
    let paymaster;
    let callData;
    let token;
    let weth;
    before(async function () {
        entryPoint = await (0, testutils_1.deployEntryPoint)();
        weth = await new typechain_1.TestWrappedNativeToken__factory(ethersSigner).deploy();
        testUniswap = await new typechain_1.TestUniswap__factory(ethersSigner).deploy(weth.address);
        factory = await new typechain_1.SimpleAccountFactory__factory(ethersSigner).deploy(entryPoint.address);
        accountOwner = (0, testutils_1.createAccountOwner)();
        chainId = (await accountOwner.provider.getNetwork()).chainId;
        const { proxy } = await (0, testutils_1.createAccount)(ethersSigner, await accountOwner.getAddress(), entryPoint.address, factory);
        account = proxy;
        await (0, testutils_1.fund)(account);
        await (0, testutils_1.checkForGeth)();
        token = await new typechain_1.TestERC20__factory(ethersSigner).deploy(6);
        nativeAssetOracle = await new typechain_1.TestOracle2__factory(ethersSigner).deploy(initialPriceEther, 8);
        tokenOracle = await new typechain_1.TestOracle2__factory(ethersSigner).deploy(initialPriceToken, 8);
        await weth.deposit({ value: (0, utils_1.parseEther)('1') });
        await weth.transfer(testUniswap.address, (0, utils_1.parseEther)('1'));
        const owner = await ethersSigner.getAddress();
        const tokenPaymasterConfig = {
            priceMaxAge: 86400,
            refundPostopCost: 40000,
            minEntryPointBalance,
            priceMarkup: priceDenominator.mul(15).div(10) // +50%
        };
        const oracleHelperConfig = {
            cacheTimeToLive: 0,
            nativeOracle: nativeAssetOracle.address,
            nativeOracleReverse: false,
            priceUpdateThreshold: 200000, // +20%
            tokenOracle: tokenOracle.address,
            tokenOracleReverse: false,
            tokenToNativeOracle: false
        };
        const uniswapHelperConfig = {
            minSwapAmount: 1,
            slippage: 5,
            uniswapPoolFee: 3
        };
        paymaster = await new typechain_1.TokenPaymaster__factory(ethersSigner).deploy(token.address, entryPoint.address, weth.address, testUniswap.address, tokenPaymasterConfig, oracleHelperConfig, uniswapHelperConfig, owner);
        paymasterAddress = paymaster.address;
        await token.transfer(paymaster.address, 100);
        await paymaster.updateCachedPrice(true);
        await entryPoint.depositTo(paymaster.address, { value: (0, utils_1.parseEther)('1000') });
        await paymaster.addStake(1, { value: (0, utils_1.parseEther)('2') });
        callData = await account.populateTransaction.execute(accountOwner.address, 0, '0x').then(tx => tx.data);
    });
    it('paymaster should reject if account does not have enough tokens or allowance', async () => {
        const snapshot = await hardhat_1.ethers.provider.send('evm_snapshot', []);
        let op = await (0, UserOp_1.fillUserOp)({
            sender: account.address,
            paymaster: paymasterAddress,
            callData
        }, entryPoint);
        op = (0, UserOp_1.signUserOp)(op, accountOwner, entryPoint.address, chainId);
        const opPacked = (0, UserOp_1.packUserOp)(op);
        // await expect(
        (0, chai_1.expect)(await entryPoint.handleOps([opPacked], beneficiaryAddress, { gasLimit: 1e7 })
            .catch(e => (0, testutils_1.decodeRevertReason)(e)))
            .to.match(/FailedOpWithRevert\(0,"AA33 reverted",ERC20InsufficientAllowance/);
        await token.sudoApprove(account.address, paymaster.address, hardhat_1.ethers.constants.MaxUint256);
        (0, chai_1.expect)(await entryPoint.handleOps([opPacked], beneficiaryAddress, { gasLimit: 1e7 })
            .catch(e => (0, testutils_1.decodeRevertReason)(e)))
            .to.match(/FailedOpWithRevert\(0,"AA33 reverted",ERC20InsufficientBalance/);
        await hardhat_1.ethers.provider.send('evm_revert', [snapshot]);
    });
    it('should be able to sponsor the UserOp while charging correct amount of ERC-20 tokens', async () => {
        const snapshot = await hardhat_1.ethers.provider.send('evm_snapshot', []);
        await token.transfer(account.address, (0, utils_1.parseEther)('1'));
        await token.sudoApprove(account.address, paymaster.address, hardhat_1.ethers.constants.MaxUint256);
        let op = await (0, UserOp_1.fillUserOp)({
            sender: account.address,
            paymaster: paymasterAddress,
            paymasterVerificationGasLimit: 3e5,
            paymasterPostOpGasLimit: 3e5,
            callData
        }, entryPoint);
        op = (0, UserOp_1.signUserOp)(op, accountOwner, entryPoint.address, chainId);
        const opPacked = (0, UserOp_1.packUserOp)(op);
        // for simpler 'gasPrice()' calculation
        await hardhat_1.ethers.provider.send('hardhat_setNextBlockBaseFeePerGas', [ethers_1.utils.hexlify(op.maxFeePerGas)]);
        const tx = await entryPoint
            .handleOps([opPacked], beneficiaryAddress, {
            gasLimit: 3e7,
            maxFeePerGas: op.maxFeePerGas,
            maxPriorityFeePerGas: op.maxFeePerGas
        })
            .then(async (tx) => await tx.wait());
        const decodedLogs = tx.logs.map(it => {
            return testInterface.parseLog(it);
        });
        const preChargeTokens = decodedLogs[0].args.value;
        const refundTokens = decodedLogs[2].args.value;
        const actualTokenChargeEvents = preChargeTokens.sub(refundTokens);
        const actualTokenCharge = decodedLogs[3].args.actualTokenCharge;
        const actualTokenPrice = decodedLogs[3].args.actualTokenPrice;
        const actualGasCostPaymaster = decodedLogs[3].args.actualGasCost;
        const actualGasCostEntryPoint = decodedLogs[4].args.actualGasCost;
        const expectedTokenPrice = initialPriceToken / initialPriceEther; // ether is 5x the token => ether-per-token is 0.2
        const addedPostOpCost = ethers_1.BigNumber.from(op.maxFeePerGas).mul(40000);
        // note: as price is in ether-per-token, and we want more tokens, increasing it means dividing it by markup
        const expectedTokenPriceWithMarkup = priceDenominator
            .mul(initialPriceToken).div(initialPriceEther) // expectedTokenPrice of 0.2 as BigNumber
            .mul(10).div(15); // added 150% priceMarkup
        const expectedTokenCharge = actualGasCostPaymaster.add(addedPostOpCost).mul(priceDenominator).div(expectedTokenPriceWithMarkup);
        const postOpGasCost = actualGasCostEntryPoint.sub(actualGasCostPaymaster);
        chai_1.assert.equal(decodedLogs.length, 5);
        chai_1.assert.equal(decodedLogs[4].args.success, true);
        chai_1.assert.equal(actualTokenChargeEvents.toString(), actualTokenCharge.toString());
        chai_1.assert.equal(actualTokenChargeEvents.toString(), expectedTokenCharge.toString());
        chai_1.assert.equal(actualTokenPrice / priceDenominator, expectedTokenPrice);
        chai_1.assert.closeTo(postOpGasCost.div(tx.effectiveGasPrice).toNumber(), 50000, 20000);
        await hardhat_1.ethers.provider.send('evm_revert', [snapshot]);
    });
    it('should update cached token price if the change is above configured percentage', async function () {
        const snapshot = await hardhat_1.ethers.provider.send('evm_snapshot', []);
        await token.transfer(account.address, (0, utils_1.parseEther)('1'));
        await token.sudoApprove(account.address, paymaster.address, hardhat_1.ethers.constants.MaxUint256);
        await tokenOracle.setPrice(initialPriceToken * 5);
        await nativeAssetOracle.setPrice(initialPriceEther * 10);
        let op = await (0, UserOp_1.fillUserOp)({
            sender: account.address,
            paymaster: paymasterAddress,
            paymasterVerificationGasLimit: 3e5,
            paymasterPostOpGasLimit: 3e5,
            callData
        }, entryPoint);
        op = (0, UserOp_1.signUserOp)(op, accountOwner, entryPoint.address, chainId);
        const opPacked = (0, UserOp_1.packUserOp)(op);
        const tx = await entryPoint
            .handleOps([opPacked], beneficiaryAddress, { gasLimit: 1e7 });
        const receipt = await tx.wait();
        const block = await hardhat_1.ethers.provider.getBlock(receipt.blockHash);
        const decodedLogs = receipt.logs.map(it => {
            return testInterface.parseLog(it);
        });
        const oldExpectedPrice = priceDenominator.mul(initialPriceToken).div(initialPriceEther);
        const newExpectedPrice = oldExpectedPrice.div(2); // ether DOUBLED in price relative to token
        const actualTokenPrice = decodedLogs[4].args.actualTokenPrice;
        chai_1.assert.equal(actualTokenPrice.toString(), newExpectedPrice.toString());
        await (0, chai_1.expect)(tx).to
            .emit(paymaster, 'TokenPriceUpdated')
            .withArgs(newExpectedPrice, oldExpectedPrice, block.timestamp);
        await hardhat_1.ethers.provider.send('evm_revert', [snapshot]);
    });
    it('should use token price supplied by the client if it is better than cached', async function () {
        const snapshot = await hardhat_1.ethers.provider.send('evm_snapshot', []);
        await token.transfer(account.address, (0, utils_1.parseEther)('1'));
        await token.sudoApprove(account.address, paymaster.address, hardhat_1.ethers.constants.MaxUint256);
        const currentCachedPrice = await paymaster.cachedPrice();
        chai_1.assert.equal(currentCachedPrice / priceDenominator, 0.2);
        const overrideTokenPrice = priceDenominator.mul(132).div(1000);
        let op = await (0, UserOp_1.fillUserOp)({
            sender: account.address,
            paymaster: paymasterAddress,
            paymasterVerificationGasLimit: 3e5,
            paymasterPostOpGasLimit: 3e5,
            paymasterData: (0, utils_1.hexZeroPad)((0, utils_1.hexlify)(overrideTokenPrice), 32),
            callData
        }, entryPoint);
        op = (0, UserOp_1.signUserOp)(op, accountOwner, entryPoint.address, chainId);
        const opPacked = (0, UserOp_1.packUserOp)(op);
        // for simpler 'gasPrice()' calculation
        await hardhat_1.ethers.provider.send('hardhat_setNextBlockBaseFeePerGas', [ethers_1.utils.hexlify(op.maxFeePerGas)]);
        const tx = await entryPoint
            .handleOps([opPacked], beneficiaryAddress, {
            gasLimit: 1e7,
            maxFeePerGas: op.maxFeePerGas,
            maxPriorityFeePerGas: op.maxFeePerGas
        })
            .then(async (tx) => await tx.wait());
        const decodedLogs = tx.logs.map(it => {
            return testInterface.parseLog(it);
        });
        const preChargeTokens = decodedLogs[0].args.value;
        const requiredGas = ethers_1.BigNumber.from(op.callGasLimit).add(ethers_1.BigNumber.from(op.verificationGasLimit).add(ethers_1.BigNumber.from(op.paymasterVerificationGasLimit))).add(ethers_1.BigNumber.from(op.paymasterPostOpGasLimit)).add(op.preVerificationGas).add(40000 /*  REFUND_POSTOP_COST */);
        const requiredPrefund = requiredGas.mul(op.maxFeePerGas);
        const preChargeTokenPrice = requiredPrefund.mul(priceDenominator).div(preChargeTokens);
        // TODO: div 1e10 to hide rounding errors. look into it - 1e10 is too much.
        chai_1.assert.equal(preChargeTokenPrice.div(1e10).toString(), overrideTokenPrice.div(1e10).toString());
        await hardhat_1.ethers.provider.send('evm_revert', [snapshot]);
    });
    it('should use cached token price if the one supplied by the client is worse', async function () {
        const snapshot = await hardhat_1.ethers.provider.send('evm_snapshot', []);
        await token.transfer(account.address, (0, utils_1.parseEther)('1'));
        await token.sudoApprove(account.address, paymaster.address, hardhat_1.ethers.constants.MaxUint256);
        const currentCachedPrice = await paymaster.cachedPrice();
        chai_1.assert.equal(currentCachedPrice / priceDenominator, 0.2);
        // note: higher number is lower token price
        const overrideTokenPrice = priceDenominator.mul(50);
        let op = await (0, UserOp_1.fillUserOp)({
            sender: account.address,
            maxFeePerGas: 1000000000,
            paymaster: paymasterAddress,
            paymasterVerificationGasLimit: 3e5,
            paymasterPostOpGasLimit: 3e5,
            paymasterData: (0, utils_1.hexZeroPad)((0, utils_1.hexlify)(overrideTokenPrice), 32),
            callData
        }, entryPoint);
        op = (0, UserOp_1.signUserOp)(op, accountOwner, entryPoint.address, chainId);
        const opPacked = (0, UserOp_1.packUserOp)(op);
        // for simpler 'gasPrice()' calculation
        await hardhat_1.ethers.provider.send('hardhat_setNextBlockBaseFeePerGas', [ethers_1.utils.hexlify(op.maxFeePerGas)]);
        const tx = await entryPoint
            .handleOps([opPacked], beneficiaryAddress, {
            gasLimit: 1e7,
            maxFeePerGas: op.maxFeePerGas,
            maxPriorityFeePerGas: op.maxFeePerGas
        })
            .then(async (tx) => await tx.wait());
        const decodedLogs = tx.logs.map(it => {
            return testInterface.parseLog(it);
        });
        const preChargeTokens = decodedLogs[0].args.value;
        const requiredGas = ethers_1.BigNumber.from(op.callGasLimit).add(ethers_1.BigNumber.from(op.verificationGasLimit).add(ethers_1.BigNumber.from(op.paymasterVerificationGasLimit))).add(ethers_1.BigNumber.from(op.paymasterPostOpGasLimit)).add(op.preVerificationGas).add(40000 /*  REFUND_POSTOP_COST */);
        const requiredPrefund = requiredGas.mul(op.maxFeePerGas);
        const preChargeTokenPrice = requiredPrefund.mul(priceDenominator).div(preChargeTokens);
        chai_1.assert.equal(preChargeTokenPrice.toString(), currentCachedPrice.mul(10).div(15).toString());
        await hardhat_1.ethers.provider.send('evm_revert', [snapshot]);
    });
    it('should charge the overdraft tokens if the pre-charge ended up lower than the final transaction cost', async function () {
        const snapshot = await hardhat_1.ethers.provider.send('evm_snapshot', []);
        await token.transfer(account.address, await token.balanceOf(await ethersSigner.getAddress()));
        await token.sudoApprove(account.address, paymaster.address, hardhat_1.ethers.constants.MaxUint256);
        // Ether price increased 100 times!
        await tokenOracle.setPrice(initialPriceToken);
        await nativeAssetOracle.setPrice(initialPriceEther * 100);
        // Cannot happen too fast though
        await hardhat_1.ethers.provider.send('evm_increaseTime', [200]);
        let op = await (0, UserOp_1.fillUserOp)({
            sender: account.address,
            paymaster: paymasterAddress,
            paymasterVerificationGasLimit: 3e5,
            paymasterPostOpGasLimit: 3e5,
            callData
        }, entryPoint);
        op = (0, UserOp_1.signUserOp)(op, accountOwner, entryPoint.address, chainId);
        const opPacked = (0, UserOp_1.packUserOp)(op);
        const tx = await entryPoint
            .handleOps([opPacked], beneficiaryAddress, { gasLimit: 1e7 })
            .then(async (tx) => await tx.wait());
        const decodedLogs = tx.logs.map(it => {
            return testInterface.parseLog(it);
        });
        const preChargeTokens = decodedLogs[0].args.value;
        const overdraftTokens = decodedLogs[3].args.value;
        const actualTokenCharge = decodedLogs[4].args.actualTokenCharge;
        // Checking that both 'Transfers' are from account to Paymaster
        chai_1.assert.equal(decodedLogs[0].args.from, decodedLogs[3].args.from);
        chai_1.assert.equal(decodedLogs[0].args.to, decodedLogs[3].args.to);
        chai_1.assert.equal(preChargeTokens.add(overdraftTokens).toString(), actualTokenCharge.toString());
        const userOpSuccess = decodedLogs[5].args.success;
        chai_1.assert.equal(userOpSuccess, true);
        await hardhat_1.ethers.provider.send('evm_revert', [snapshot]);
    });
    it('should revert in the first postOp run if the pre-charge ended up lower than the final transaction cost but the client has no tokens to cover the overdraft', async function () {
        const snapshot = await hardhat_1.ethers.provider.send('evm_snapshot', []);
        // Make sure account has small amount of tokens
        await token.transfer(account.address, (0, utils_1.parseEther)('0.01'));
        await token.sudoApprove(account.address, paymaster.address, hardhat_1.ethers.constants.MaxUint256);
        // Ether price increased 100 times!
        await tokenOracle.setPrice(initialPriceToken);
        await nativeAssetOracle.setPrice(initialPriceEther * 100);
        // Cannot happen too fast though
        await hardhat_1.ethers.provider.send('evm_increaseTime', [200]);
        // Withdraw most of the tokens the account hs inside the inner transaction
        const withdrawTokensCall = await token.populateTransaction.transfer(token.address, (0, utils_1.parseEther)('0.009')).then(tx => tx.data);
        const callData = await account.populateTransaction.execute(token.address, 0, withdrawTokensCall).then(tx => tx.data);
        let op = await (0, UserOp_1.fillUserOp)({
            sender: account.address,
            paymaster: paymasterAddress,
            paymasterVerificationGasLimit: 3e5,
            paymasterPostOpGasLimit: 3e5,
            callData
        }, entryPoint);
        op = (0, UserOp_1.signUserOp)(op, accountOwner, entryPoint.address, chainId);
        const opPacked = (0, UserOp_1.packUserOp)(op);
        const tx = await entryPoint
            .handleOps([opPacked], beneficiaryAddress, { gasLimit: 1e7 })
            .then(async (tx) => await tx.wait());
        const decodedLogs = tx.logs.map(it => {
            return testInterface.parseLog(it);
        });
        console.log(decodedLogs.map((e) => ({ ev: e.name, ...(0, testutils_1.objdump)(e.args) })));
        const postOpRevertReason = (0, testutils_1.decodeRevertReason)(decodedLogs[2].args.revertReason);
        chai_1.assert.include(postOpRevertReason, 'PostOpReverted(ERC20InsufficientBalance');
        const userOpSuccess = decodedLogs[3].args.success;
        chai_1.assert.equal(userOpSuccess, false);
        chai_1.assert.equal(decodedLogs.length, 4);
        await hardhat_1.ethers.provider.send('evm_revert', [snapshot]);
    });
    it('should swap tokens for ether if it falls below configured value and deposit it', async function () {
        await token.transfer(account.address, await token.balanceOf(await ethersSigner.getAddress()));
        await token.sudoApprove(account.address, paymaster.address, hardhat_1.ethers.constants.MaxUint256);
        const depositInfo = await entryPoint.deposits(paymaster.address);
        await paymaster.withdrawTo(account.address, depositInfo.deposit);
        // deposit exactly the minimum amount so the next UserOp makes it go under
        await entryPoint.depositTo(paymaster.address, { value: minEntryPointBalance });
        let op = await (0, UserOp_1.fillUserOp)({
            sender: account.address,
            paymaster: paymasterAddress,
            paymasterVerificationGasLimit: 3e5,
            paymasterPostOpGasLimit: 3e5,
            callData
        }, entryPoint);
        op = (0, UserOp_1.signUserOp)(op, accountOwner, entryPoint.address, chainId);
        const opPacked = (0, UserOp_1.packUserOp)(op);
        const tx = await entryPoint
            .handleOps([opPacked], beneficiaryAddress, { gasLimit: 1e7 })
            .then(async (tx) => await tx.wait());
        const decodedLogs = tx.logs.map(it => {
            return testInterface.parseLog(it);
        });
        // note: it is hard to deploy Uniswap on hardhat - so stubbing it for the unit test
        chai_1.assert.equal(decodedLogs[4].name, 'StubUniswapExchangeEvent');
        chai_1.assert.equal(decodedLogs[8].name, 'Received');
        chai_1.assert.equal(decodedLogs[9].name, 'Deposited');
        const deFactoExchangeRate = decodedLogs[4].args.amountOut.toString() / decodedLogs[4].args.amountIn.toString();
        const expectedPrice = initialPriceToken / initialPriceEther;
        chai_1.assert.closeTo(deFactoExchangeRate, expectedPrice, 0.001);
    });
});

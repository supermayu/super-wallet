"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const hardhat_1 = require("hardhat");
const testutils_1 = require("../testutils");
const typechain_1 = require("../../typechain");
const ethers_1 = require("ethers");
const utils_1 = require("ethers/lib/utils");
const priceDenominator = ethers_1.BigNumber.from(10).pow(26);
const sampleResponses = {
    'LINK/USD': {
        decimals: 8,
        answer: '633170000', // Answer: $6.3090 - note: price is USD per LINK
        roundId: '110680464442257310968',
        startedAt: '1684929731',
        updatedAt: '1684929731',
        answeredInRound: '110680464442257310968'
    },
    'ETH/USD': {
        decimals: 8,
        answer: '181451000000', // Answer: $1,817.65 - USD per ETH
        roundId: '110680464442257311466',
        startedAt: '1684929347',
        updatedAt: '1684929347',
        answeredInRound: '110680464442257311466'
    },
    'LINK/ETH': {
        decimals: 18,
        answer: '3492901256673149', // Answer: Ξ0.0034929013 - the answer is exact ETH.WEI per LINK
        roundId: '73786976294838213626',
        startedAt: '1684924307',
        updatedAt: '1684924307',
        answeredInRound: '73786976294838213626'
    },
    'ETH/BTC': {
        decimals: 8,
        answer: '6810994', // ₿0.06810994
        roundId: '18446744073709566497',
        startedAt: '1684943615',
        updatedAt: '1684943615',
        answeredInRound: '18446744073709566497'
    }
};
// note: direct or reverse designations are quite arbitrary
describe('OracleHelper', function () {
    function testOracleFiguredPriceOut() {
        it('should figure out the correct price', async function () {
            await testEnv.paymaster.updateCachedPrice(true);
            const cachedPrice = await testEnv.paymaster.cachedPrice();
            const tokensPerEtherCalculated = await testEnv.paymaster.weiToToken((0, utils_1.parseEther)('1'), cachedPrice);
            chai_1.assert.equal(cachedPrice.toString(), testEnv.expectedPrice.toString(), 'price not right');
            chai_1.assert.equal(tokensPerEtherCalculated.toString(), testEnv.expectedTokensPerEtherCalculated.toString(), 'tokens amount not right');
        });
    }
    function getOracleConfig({ nativeOracleReverse, tokenOracleReverse, tokenToNativeOracle }) {
        return {
            nativeOracleReverse,
            tokenOracleReverse,
            tokenToNativeOracle,
            nativeOracle: testEnv.nativeAssetOracle.address,
            tokenOracle: testEnv.tokenOracle.address,
            cacheTimeToLive: 0,
            priceUpdateThreshold: 0
        };
    }
    // @ts-ignore
    const testEnv = {};
    let entryPoint;
    before(async function () {
        const ethersSigner = hardhat_1.ethers.provider.getSigner();
        testEnv.owner = await ethersSigner.getAddress();
        testEnv.tokenPaymasterConfig = {
            priceMaxAge: 86400,
            refundPostopCost: 40000,
            minEntryPointBalance: 0,
            priceMarkup: priceDenominator.mul(19).div(10) // 190%
        };
        testEnv.uniswapHelperConfig = {
            minSwapAmount: 1,
            slippage: 5,
            uniswapPoolFee: 3
        };
        // TODO: what do I need to do with the oracle decimals?
        testEnv.tokenOracle = await new typechain_1.TestOracle2__factory(ethersSigner).deploy(1, 0);
        testEnv.nativeAssetOracle = await new typechain_1.TestOracle2__factory(ethersSigner).deploy(1, 0);
        testEnv.token = await new typechain_1.TestERC20__factory(ethersSigner).deploy(18);
        entryPoint = await new typechain_1.EntryPoint__factory(ethersSigner).deploy();
        testEnv.paymaster = await new typechain_1.TokenPaymaster__factory(ethersSigner).deploy(testEnv.token.address, entryPoint.address, testutils_1.AddressZero, testEnv.owner, // cannot approve to AddressZero
        testEnv.tokenPaymasterConfig, getOracleConfig({
            nativeOracleReverse: false,
            tokenOracleReverse: false,
            tokenToNativeOracle: false
        }), testEnv.uniswapHelperConfig, testEnv.owner);
    });
    describe('with one-hop direct price ETH per TOKEN', function () {
        before(async function () {
            const res = sampleResponses['LINK/ETH']; // note: Chainlink Oracle names are opposite direction of 'answer'
            await testEnv.tokenOracle.setPrice(res.answer); // Ξ0.0034929013
            await testEnv.tokenOracle.setDecimals(res.decimals);
            // making sure the native asset oracle is not accessed during the calculation
            await testEnv.nativeAssetOracle.setPrice('0xfffffffffffffffffffff');
            const tokenOracleDecimalPower = ethers_1.BigNumber.from(10).pow(res.decimals);
            testEnv.expectedPrice =
                ethers_1.BigNumber.from(res.answer)
                    .mul(priceDenominator)
                    .div(tokenOracleDecimalPower)
                    .toString();
            testEnv.expectedTokensPerEtherCalculated =
                ethers_1.BigNumber
                    .from((0, utils_1.parseEther)('1'))
                    .mul(tokenOracleDecimalPower)
                    .div(res.answer)
                    .toString();
            const ethersSigner = hardhat_1.ethers.provider.getSigner();
            testEnv.paymaster = await new typechain_1.TokenPaymaster__factory(ethersSigner).deploy(testEnv.token.address, entryPoint.address, testutils_1.AddressZero, testEnv.owner, // cannot approve to AddressZero
            testEnv.tokenPaymasterConfig, getOracleConfig({
                tokenToNativeOracle: true,
                tokenOracleReverse: false,
                nativeOracleReverse: false
            }), testEnv.uniswapHelperConfig, testEnv.owner);
        });
        testOracleFiguredPriceOut();
    });
    describe('with one-hop reverse price TOKEN per ETH', function () {
        before(async function () {
            const res = sampleResponses['ETH/BTC'];
            await testEnv.tokenOracle.setPrice(res.answer); // ₿0.06810994
            await testEnv.tokenOracle.setDecimals(res.decimals);
            // making sure the native asset oracle is not accessed during the calculation
            await testEnv.nativeAssetOracle.setPrice('0xfffffffffffffffffffff');
            const tokenOracleDecimalPower = ethers_1.BigNumber.from(10).pow(res.decimals);
            testEnv.expectedPrice =
                ethers_1.BigNumber.from(priceDenominator)
                    .mul(tokenOracleDecimalPower)
                    .div(res.answer)
                    .toString();
            const expectedTokensPerEtherCalculated = ethers_1.BigNumber
                .from((0, utils_1.parseEther)('1'))
                .mul(res.answer)
                .div(tokenOracleDecimalPower)
                .toString();
            testEnv.expectedTokensPerEtherCalculated =
                ethers_1.BigNumber
                    .from((0, utils_1.parseEther)('1'))
                    .mul(priceDenominator.toString())
                    .div(testEnv.expectedPrice)
                    .toString();
            // sanity check for the price calculation - use direct price and cached-like reverse price
            chai_1.assert.equal(expectedTokensPerEtherCalculated.toString(), testEnv.expectedTokensPerEtherCalculated.toString());
            const ethersSigner = hardhat_1.ethers.provider.getSigner();
            testEnv.paymaster = await new typechain_1.TokenPaymaster__factory(ethersSigner).deploy(testEnv.token.address, entryPoint.address, testutils_1.AddressZero, testEnv.owner, // cannot approve to AddressZero
            testEnv.tokenPaymasterConfig, getOracleConfig({
                tokenToNativeOracle: true,
                tokenOracleReverse: true,
                nativeOracleReverse: false
            }), testEnv.uniswapHelperConfig, testEnv.owner);
        });
        testOracleFiguredPriceOut();
    });
    describe('with two-hops price USD-per-TOKEN and USD-per-ETH', function () {
        before(async function () {
            const resToken = sampleResponses['LINK/USD'];
            const resNative = sampleResponses['ETH/USD'];
            await testEnv.tokenOracle.setPrice(resToken.answer); // $6.3090
            await testEnv.tokenOracle.setDecimals(resToken.decimals);
            await testEnv.nativeAssetOracle.setPrice(resNative.answer); // $1,817.65
            await testEnv.nativeAssetOracle.setDecimals(resNative.decimals);
            const ethersSigner = hardhat_1.ethers.provider.getSigner();
            testEnv.paymaster = await new typechain_1.TokenPaymaster__factory(ethersSigner).deploy(testEnv.token.address, entryPoint.address, testutils_1.AddressZero, testEnv.owner, // cannot approve to AddressZero
            testEnv.tokenPaymasterConfig, getOracleConfig({
                tokenToNativeOracle: false,
                tokenOracleReverse: false,
                nativeOracleReverse: false
            }), testEnv.uniswapHelperConfig, testEnv.owner);
            // note: oracle decimals are same and cancel each other out
            testEnv.expectedPrice =
                priceDenominator
                    .mul(resToken.answer)
                    .div(resNative.answer)
                    .toString();
            testEnv.expectedTokensPerEtherCalculated =
                ethers_1.BigNumber
                    .from((0, utils_1.parseEther)('1'))
                    .mul(priceDenominator.toString())
                    .div(testEnv.expectedPrice)
                    .toString();
        });
        testOracleFiguredPriceOut();
    });
    // TODO: these oracle types are not common but we probably want to support in any case
    describe.skip('with two-hops price TOK/USD and ETH/USD', () => { });
    describe.skip('with two-hops price TOK/USD and USD/ETH', () => { });
    describe.skip('with two-hops price USD/TOK and ETH/USD', () => { });
});

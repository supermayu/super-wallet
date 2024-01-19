"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hardhat_1 = require("hardhat");
const chai_1 = require("chai");
const typechain_1 = require("../typechain");
const testutils_1 = require("./testutils");
const UserOp_1 = require("./UserOp");
const utils_1 = require("ethers/lib/utils");
const MOCK_VALID_UNTIL = '0x00000000deadbeef';
const MOCK_VALID_AFTER = '0x0000000000001234';
const MOCK_SIG = '0x1234';
describe('EntryPoint with VerifyingPaymaster', function () {
    let entryPoint;
    let accountOwner;
    const ethersSigner = hardhat_1.ethers.provider.getSigner();
    let account;
    let offchainSigner;
    let paymaster;
    before(async function () {
        this.timeout(20000);
        entryPoint = await (0, testutils_1.deployEntryPoint)();
        offchainSigner = (0, testutils_1.createAccountOwner)();
        accountOwner = (0, testutils_1.createAccountOwner)();
        paymaster = await new typechain_1.VerifyingPaymaster__factory(ethersSigner).deploy(entryPoint.address, offchainSigner.address);
        await paymaster.addStake(1, { value: (0, utils_1.parseEther)('2') });
        await entryPoint.depositTo(paymaster.address, { value: (0, utils_1.parseEther)('1') });
        ({ proxy: account } = await (0, testutils_1.createAccount)(ethersSigner, accountOwner.address, entryPoint.address));
    });
    describe('#parsePaymasterAndData', () => {
        it('should parse data properly', async () => {
            const paymasterAndData = (0, testutils_1.packPaymasterData)(paymaster.address, UserOp_1.DefaultsForUserOp.paymasterVerificationGasLimit, UserOp_1.DefaultsForUserOp.paymasterPostOpGasLimit, (0, utils_1.hexConcat)([
                utils_1.defaultAbiCoder.encode(['uint48', 'uint48'], [MOCK_VALID_UNTIL, MOCK_VALID_AFTER]), MOCK_SIG
            ]));
            console.log(paymasterAndData);
            const res = await paymaster.parsePaymasterAndData(paymasterAndData);
            // console.log('MOCK_VALID_UNTIL, MOCK_VALID_AFTER', MOCK_VALID_UNTIL, MOCK_VALID_AFTER)
            // console.log('validUntil after', res.validUntil, res.validAfter)
            // console.log('MOCK SIG', MOCK_SIG)
            // console.log('sig', res.signature)
            (0, chai_1.expect)(res.validUntil).to.be.equal(hardhat_1.ethers.BigNumber.from(MOCK_VALID_UNTIL));
            (0, chai_1.expect)(res.validAfter).to.be.equal(hardhat_1.ethers.BigNumber.from(MOCK_VALID_AFTER));
            (0, chai_1.expect)(res.signature).equal(MOCK_SIG);
        });
    });
    describe('#validatePaymasterUserOp', () => {
        it('should reject on no signature', async () => {
            const userOp = await (0, UserOp_1.fillSignAndPack)({
                sender: account.address,
                paymaster: paymaster.address,
                paymasterData: (0, utils_1.hexConcat)([utils_1.defaultAbiCoder.encode(['uint48', 'uint48'], [MOCK_VALID_UNTIL, MOCK_VALID_AFTER]), '0x1234'])
            }, accountOwner, entryPoint);
            (0, chai_1.expect)(await (0, UserOp_1.simulateValidation)(userOp, entryPoint.address)
                .catch(e => (0, testutils_1.decodeRevertReason)(e)))
                .to.include('invalid signature length in paymasterAndData');
        });
        it('should reject on invalid signature', async () => {
            const userOp = await (0, UserOp_1.fillSignAndPack)({
                sender: account.address,
                paymaster: paymaster.address,
                paymasterData: (0, utils_1.hexConcat)([utils_1.defaultAbiCoder.encode(['uint48', 'uint48'], [MOCK_VALID_UNTIL, MOCK_VALID_AFTER]), '0x' + '00'.repeat(65)])
            }, accountOwner, entryPoint);
            (0, chai_1.expect)(await (0, UserOp_1.simulateValidation)(userOp, entryPoint.address)
                .catch(e => (0, testutils_1.decodeRevertReason)(e)))
                .to.include('ECDSAInvalidSignature');
        });
        describe('with wrong signature', () => {
            let wrongSigUserOp;
            const beneficiaryAddress = (0, testutils_1.createAddress)();
            before(async () => {
                const sig = await offchainSigner.signMessage((0, utils_1.arrayify)('0xdead'));
                wrongSigUserOp = await (0, UserOp_1.fillSignAndPack)({
                    sender: account.address,
                    paymaster: paymaster.address,
                    paymasterData: (0, utils_1.hexConcat)([utils_1.defaultAbiCoder.encode(['uint48', 'uint48'], [MOCK_VALID_UNTIL, MOCK_VALID_AFTER]), sig])
                }, accountOwner, entryPoint);
            });
            it('should return signature error (no revert) on wrong signer signature', async () => {
                const ret = await (0, UserOp_1.simulateValidation)(wrongSigUserOp, entryPoint.address);
                (0, chai_1.expect)(ret.returnInfo.sigFailed).to.be.true;
            });
            it('handleOp revert on signature failure in handleOps', async () => {
                await (0, chai_1.expect)(entryPoint.estimateGas.handleOps([wrongSigUserOp], beneficiaryAddress)).to.revertedWith('AA34 signature error');
            });
        });
        it('succeed with valid signature', async () => {
            const userOp1 = await (0, UserOp_1.fillAndSign)({
                sender: account.address,
                paymaster: paymaster.address,
                paymasterData: (0, utils_1.hexConcat)([utils_1.defaultAbiCoder.encode(['uint48', 'uint48'], [MOCK_VALID_UNTIL, MOCK_VALID_AFTER]), '0x' + '00'.repeat(65)])
            }, accountOwner, entryPoint);
            const hash = await paymaster.getHash((0, UserOp_1.packUserOp)(userOp1), MOCK_VALID_UNTIL, MOCK_VALID_AFTER);
            const sig = await offchainSigner.signMessage((0, utils_1.arrayify)(hash));
            const userOp = await (0, UserOp_1.fillSignAndPack)({
                ...userOp1,
                paymaster: paymaster.address,
                paymasterData: (0, utils_1.hexConcat)([utils_1.defaultAbiCoder.encode(['uint48', 'uint48'], [MOCK_VALID_UNTIL, MOCK_VALID_AFTER]), sig])
            }, accountOwner, entryPoint);
            const res = await (0, UserOp_1.simulateValidation)(userOp, entryPoint.address);
            (0, chai_1.expect)(res.returnInfo.sigFailed).to.be.false;
            (0, chai_1.expect)(res.returnInfo.validAfter).to.be.equal(hardhat_1.ethers.BigNumber.from(MOCK_VALID_AFTER));
            (0, chai_1.expect)(res.returnInfo.validUntil).to.be.equal(hardhat_1.ethers.BigNumber.from(MOCK_VALID_UNTIL));
        });
    });
});

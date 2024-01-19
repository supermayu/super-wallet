"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const signer_1 = require("@thehubbleproject/bls/dist/signer");
const utils_1 = require("ethers/lib/utils");
const typechain_1 = require("../typechain");
const hardhat_1 = require("hardhat");
const testutils_1 = require("./testutils");
const UserOp_1 = require("./UserOp");
const chai_1 = require("chai");
const ethereumjs_util_1 = require("ethereumjs-util");
const mcl_1 = require("@thehubbleproject/bls/dist/mcl");
const bytes_1 = require("@ethersproject/bytes");
async function deployBlsAccount(ethersSigner, factoryAddr, blsSigner) {
    const factory = typechain_1.BLSAccountFactory__factory.connect(factoryAddr, ethersSigner);
    const addr = await factory.callStatic.createAccount(0, blsSigner.pubkey);
    await factory.createAccount(0, blsSigner.pubkey);
    return typechain_1.BLSAccount__factory.connect(addr, ethersSigner);
}
describe('bls account', function () {
    this.timeout(20000);
    const BLS_DOMAIN = (0, utils_1.arrayify)((0, ethereumjs_util_1.keccak256)(Buffer.from('eip4337.bls.domain')));
    const etherSigner = hardhat_1.ethers.provider.getSigner();
    let fact;
    let signer1;
    let signer2;
    let blsAgg;
    let entrypoint;
    let account1;
    let account2;
    let accountDeployer;
    before(async () => {
        entrypoint = await (0, testutils_1.deployEntryPoint)();
        const BLSOpenLib = await new typechain_1.BLSOpen__factory(hardhat_1.ethers.provider.getSigner()).deploy();
        blsAgg = await new typechain_1.BLSSignatureAggregator__factory({
            'contracts/samples/bls/lib/BLSOpen.sol:BLSOpen': BLSOpenLib.address
        }, hardhat_1.ethers.provider.getSigner()).deploy(entrypoint.address);
        await blsAgg.addStake(2, { value: testutils_1.ONE_ETH });
        fact = await signer_1.BlsSignerFactory.new();
        signer1 = fact.getSigner((0, utils_1.arrayify)(BLS_DOMAIN), '0x01');
        signer2 = fact.getSigner((0, utils_1.arrayify)(BLS_DOMAIN), '0x02');
        accountDeployer = await new typechain_1.BLSAccountFactory__factory(etherSigner).deploy(entrypoint.address, blsAgg.address);
        account1 = await deployBlsAccount(etherSigner, accountDeployer.address, signer1);
        account2 = await deployBlsAccount(etherSigner, accountDeployer.address, signer2);
    });
    it('#getTrailingPublicKey', async () => {
        const data = utils_1.defaultAbiCoder.encode(['uint[6]'], [[1, 2, 3, 4, 5, 6]]);
        const last4 = await blsAgg.getTrailingPublicKey(data);
        (0, chai_1.expect)(last4.map(x => x.toNumber())).to.eql([3, 4, 5, 6]);
    });
    it('#aggregateSignatures', async () => {
        const sig1 = signer1.sign('0x1234');
        const sig2 = signer2.sign('0x5678');
        const offChainSigResult = (0, utils_1.hexConcat)((0, signer_1.aggregate)([sig1, sig2]));
        const userOp1 = (0, UserOp_1.packUserOp)({ ...UserOp_1.DefaultsForUserOp, signature: (0, utils_1.hexConcat)(sig1) });
        const userOp2 = (0, UserOp_1.packUserOp)({ ...UserOp_1.DefaultsForUserOp, signature: (0, utils_1.hexConcat)(sig2) });
        const solidityAggResult = await blsAgg.aggregateSignatures([userOp1, userOp2]);
        (0, chai_1.expect)(solidityAggResult).to.equal(offChainSigResult);
    });
    it('#userOpToMessage', async () => {
        const userOp1 = await (0, UserOp_1.fillAndPack)({
            sender: account1.address
        }, entrypoint);
        const requestHash = await blsAgg.getUserOpHash(userOp1);
        const solPoint = await blsAgg.userOpToMessage(userOp1);
        const messagePoint = (0, mcl_1.hashToPoint)(requestHash, BLS_DOMAIN);
        (0, chai_1.expect)(`1 ${solPoint[0].toString()} ${solPoint[1].toString()}`).to.equal(messagePoint.getStr());
    });
    it('#validateUserOpSignature', async () => {
        const userOp1 = await (0, UserOp_1.fillAndPack)({
            sender: account1.address
        }, entrypoint);
        const requestHash = await blsAgg.getUserOpHash(userOp1);
        const sigParts = signer1.sign(requestHash);
        userOp1.signature = (0, utils_1.hexConcat)(sigParts);
        (0, chai_1.expect)(userOp1.signature.length).to.equal(130); // 64-byte hex value
        const verifier = new signer_1.BlsVerifier(BLS_DOMAIN);
        (0, chai_1.expect)(verifier.verify(sigParts, signer1.pubkey, requestHash)).to.equal(true);
        const ret = await blsAgg.validateUserOpSignature(userOp1);
        (0, chai_1.expect)(ret).to.equal('0x');
    });
    it('aggregated sig validation must succeed if off-chain UserOp sig succeeds', async () => {
        // regression AA-119: prevent off-chain signature success and on-chain revert.
        // "broken account" uses different public-key during construction and runtime.
        const brokenAccountFactory = await new typechain_1.BrokenBLSAccountFactory__factory(etherSigner).deploy(entrypoint.address, blsAgg.address);
        // const brokenAccountFactory = await new BLSAccountFactory__factory(etherSigner).deploy(entrypoint.address, blsAgg.address)
        const deployTx = await brokenAccountFactory.populateTransaction.createAccount(0, signer1.pubkey);
        const res = await brokenAccountFactory.provider.call(deployTx);
        const acc = brokenAccountFactory.interface.decodeFunctionResult('createAccount', res)[0];
        await (0, testutils_1.fund)(acc);
        const userOp = await (0, UserOp_1.fillAndPack)({
            sender: acc,
            initCode: (0, utils_1.hexConcat)([brokenAccountFactory.address, deployTx.data])
        }, entrypoint);
        const requestHash = await blsAgg.getUserOpHash(userOp);
        const signature = userOp.signature = (0, utils_1.hexConcat)(signer1.sign(requestHash));
        // and sig validation should fail:
        const singleOpSigCheck = await blsAgg.validateUserOpSignature(userOp).then(() => 'ok', e => e.message);
        // above account should fail on-chain:
        const beneficiary = (0, testutils_1.createAddress)();
        const handleRet = await entrypoint.callStatic.handleAggregatedOps([
            {
                userOps: [userOp],
                aggregator: blsAgg.address,
                signature
            }
        ], beneficiary).then(() => 'ok', e => e.errorName);
        (0, chai_1.expect)(`${singleOpSigCheck},${handleRet}`)
            .to.eq('ok,ok');
    });
    it('validateSignatures', async function () {
        // yes, it does take long on hardhat, but quick on geth.
        this.timeout(30000);
        const userOp1 = await (0, UserOp_1.fillAndPack)({
            sender: account1.address
        }, entrypoint);
        const requestHash = await blsAgg.getUserOpHash(userOp1);
        const sig1 = signer1.sign(requestHash);
        userOp1.signature = (0, utils_1.hexConcat)(sig1);
        const userOp2 = await (0, UserOp_1.fillAndPack)({
            sender: account2.address
        }, entrypoint);
        const requestHash2 = await blsAgg.getUserOpHash(userOp2);
        const sig2 = signer2.sign(requestHash2);
        userOp2.signature = (0, utils_1.hexConcat)(sig2);
        const aggSig = (0, signer_1.aggregate)([sig1, sig2]);
        const aggregatedSig = await blsAgg.aggregateSignatures([userOp1, userOp2]);
        (0, chai_1.expect)((0, utils_1.hexConcat)(aggSig)).to.equal(aggregatedSig);
        const pubkeys = [
            signer1.pubkey,
            signer2.pubkey
        ];
        const v = new signer_1.BlsVerifier(BLS_DOMAIN);
        // off-chain check
        const now = Date.now();
        (0, chai_1.expect)(v.verifyMultiple(aggSig, pubkeys, [requestHash, requestHash2])).to.equal(true);
        console.log('verifyMultiple (mcl code)', Date.now() - now, 'ms');
        const now2 = Date.now();
        console.log('validateSignatures gas= ', await blsAgg.estimateGas.validateSignatures([userOp1, userOp2], aggregatedSig));
        console.log('validateSignatures (on-chain)', Date.now() - now2, 'ms');
    });
    describe('#EntryPoint.simulateValidation with aggregator', () => {
        let initCode;
        let signer3;
        before(async () => {
            signer3 = fact.getSigner((0, utils_1.arrayify)(BLS_DOMAIN), '0x03');
            initCode = (0, utils_1.hexConcat)([
                accountDeployer.address,
                accountDeployer.interface.encodeFunctionData('createAccount', [0, signer3.pubkey])
            ]);
        });
        it('validate after simulation returns ValidationResultWithAggregation', async () => {
            const verifier = new signer_1.BlsVerifier(BLS_DOMAIN);
            const senderAddress = await entrypoint.callStatic.getSenderAddress(initCode).catch(e => e.errorArgs.sender);
            await (0, testutils_1.fund)(senderAddress, '0.01');
            const userOp = await (0, UserOp_1.fillAndPack)({
                sender: senderAddress,
                initCode
            }, entrypoint);
            const requestHash = await blsAgg.getUserOpHash(userOp);
            const sigParts = signer3.sign(requestHash);
            userOp.signature = (0, utils_1.hexConcat)(sigParts);
            const { aggregatorInfo } = await (0, UserOp_1.simulateValidation)(userOp, entrypoint.address);
            (0, chai_1.expect)(aggregatorInfo.aggregator).to.eq(blsAgg.address);
            (0, chai_1.expect)(aggregatorInfo.stakeInfo.stake).to.eq(testutils_1.ONE_ETH);
            (0, chai_1.expect)(aggregatorInfo.stakeInfo.unstakeDelaySec).to.eq(2);
            const [signature] = utils_1.defaultAbiCoder.decode(['bytes32[2]'], userOp.signature);
            const pubkey = (await blsAgg.getUserOpPublicKey(userOp)).map(n => (0, bytes_1.hexValue)(n)); // TODO: returns uint256[4], verify needs bytes32[4]
            const requestHash1 = await blsAgg.getUserOpHash(userOp);
            // @ts-ignore
            (0, chai_1.expect)(verifier.verify(signature, pubkey, requestHash1)).to.equal(true);
        });
    });
});

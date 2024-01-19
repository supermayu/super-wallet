"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mocha_1 = require("mocha");
const typechain_1 = require("../typechain");
const testutils_1 = require("./testutils");
const UserOp_1 = require("./UserOp");
const hardhat_1 = require("hardhat");
const utils_1 = require("ethers/lib/utils");
const chai_1 = require("chai");
describe('IAccountExecute', () => {
    let ethersSigner;
    let entryPoint;
    let account;
    let owner;
    (0, mocha_1.before)(async () => {
        const provider = hardhat_1.ethers.provider;
        ethersSigner = provider.getSigner();
        entryPoint = await (0, testutils_1.deployEntryPoint)();
        const factory = await new typechain_1.TestExecAccountFactory__factory(ethersSigner).deploy(entryPoint.address);
        owner = (0, testutils_1.createAccountOwner)();
        await factory.createAccount(owner.getAddress(), 0);
        const accountAddress = await factory.callStatic.createAccount(owner.getAddress(), 0);
        account = typechain_1.TestExecAccount__factory.connect(accountAddress, provider);
        await (0, testutils_1.fund)(accountAddress);
    });
    it('should execute  ', async () => {
        const execSig = account.interface.getSighash('executeUserOp');
        // innerCall, as TestExecAccount.executeUserOp will try to decode it:
        const innerCall = utils_1.defaultAbiCoder.encode(['address', 'bytes'], [
            account.address,
            account.interface.encodeFunctionData('entryPoint')
        ]);
        const userOp = await (0, UserOp_1.fillSignAndPack)({
            sender: account.address,
            callGasLimit: 100000, // normal estimate also chokes on this callData
            callData: (0, utils_1.hexConcat)([execSig, innerCall])
        }, owner, entryPoint);
        await entryPoint.handleOps([userOp], ethersSigner.getAddress());
        const e = await account.queryFilter(account.filters.Executed());
        (0, chai_1.expect)(e.length).to.eq(1, "didn't call inner execUserOp (no Executed event)");
        console.log(e[0].event, (0, testutils_1.objdump)(e[0].args));
        // validate we retrieved the return value of the called "entryPoint()" function:
        (0, chai_1.expect)((0, utils_1.hexStripZeros)(e[0].args.innerCallRet)).to.eq((0, utils_1.hexStripZeros)(entryPoint.address));
    });
});

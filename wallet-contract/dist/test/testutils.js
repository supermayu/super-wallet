"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unpackAccountGasLimits = exports.packPaymasterData = exports.packAccountGasLimits = exports.createAccount = exports.isDeployed = exports.deployEntryPoint = exports.checkForBannedOps = exports.objdump = exports.checkForGeth = exports.decodeRevertReason = exports.rethrow = exports.getAccountAddress = exports.getAggregatedAccountInitCode = exports.getAccountInitCode = exports.calcGasUsage = exports.callDataCost = exports.createAddress = exports.createAccountOwner = exports.getTokenBalance = exports.getBalance = exports.fund = exports.tonumber = exports.tostr = exports.FIVE_ETH = exports.TWO_ETH = exports.ONE_ETH = exports.HashZero = exports.AddressZero = void 0;
const hardhat_1 = require("hardhat");
const utils_1 = require("ethers/lib/utils");
const ethers_1 = require("ethers");
const typechain_1 = require("../typechain");
const chai_1 = require("chai");
const Create2Factory_1 = require("../src/Create2Factory");
const debugTx_1 = require("./debugTx");
exports.AddressZero = hardhat_1.ethers.constants.AddressZero;
exports.HashZero = hardhat_1.ethers.constants.HashZero;
exports.ONE_ETH = (0, utils_1.parseEther)('1');
exports.TWO_ETH = (0, utils_1.parseEther)('2');
exports.FIVE_ETH = (0, utils_1.parseEther)('5');
const tostr = (x) => x != null ? x.toString() : 'null';
exports.tostr = tostr;
function tonumber(x) {
    try {
        return parseFloat(x.toString());
    }
    catch (e) {
        console.log('=== failed to parseFloat:', x, (e).message);
        return NaN;
    }
}
exports.tonumber = tonumber;
// just throw 1eth from account[0] to the given address (or contract instance)
async function fund(contractOrAddress, amountEth = '1') {
    let address;
    if (typeof contractOrAddress === 'string') {
        address = contractOrAddress;
    }
    else {
        address = contractOrAddress.address;
    }
    await hardhat_1.ethers.provider.getSigner().sendTransaction({ to: address, value: (0, utils_1.parseEther)(amountEth) });
}
exports.fund = fund;
async function getBalance(address) {
    const balance = await hardhat_1.ethers.provider.getBalance(address);
    return parseInt(balance.toString());
}
exports.getBalance = getBalance;
async function getTokenBalance(token, address) {
    const balance = await token.balanceOf(address);
    return parseInt(balance.toString());
}
exports.getTokenBalance = getTokenBalance;
let counter = 0;
// create non-random account, so gas calculations are deterministic
function createAccountOwner() {
    const privateKey = (0, utils_1.keccak256)(Buffer.from((0, utils_1.arrayify)(ethers_1.BigNumber.from(++counter))));
    return new hardhat_1.ethers.Wallet(privateKey, hardhat_1.ethers.provider);
    // return new ethers.Wallet('0x'.padEnd(66, privkeyBase), ethers.provider);
}
exports.createAccountOwner = createAccountOwner;
function createAddress() {
    return createAccountOwner().address;
}
exports.createAddress = createAddress;
function callDataCost(data) {
    return hardhat_1.ethers.utils.arrayify(data)
        .map(x => x === 0 ? 4 : 16)
        .reduce((sum, x) => sum + x);
}
exports.callDataCost = callDataCost;
async function calcGasUsage(rcpt, entryPoint, beneficiaryAddress) {
    const actualGas = await rcpt.gasUsed;
    const logs = await entryPoint.queryFilter(entryPoint.filters.UserOperationEvent(), rcpt.blockHash);
    const { actualGasCost, actualGasUsed } = logs[0].args;
    console.log('\t== actual gasUsed (from tx receipt)=', actualGas.toString());
    console.log('\t== calculated gasUsed (paid to beneficiary)=', actualGasUsed);
    const tx = await hardhat_1.ethers.provider.getTransaction(rcpt.transactionHash);
    console.log('\t== gasDiff', actualGas.toNumber() - actualGasUsed.toNumber() - callDataCost(tx.data));
    if (beneficiaryAddress != null) {
        (0, chai_1.expect)(await getBalance(beneficiaryAddress)).to.eq(actualGasCost.toNumber());
    }
    return { actualGasCost };
}
exports.calcGasUsage = calcGasUsage;
// helper function to create the initCode to deploy the account, using our account factory.
function getAccountInitCode(owner, factory, salt = 0) {
    return (0, utils_1.hexConcat)([
        factory.address,
        factory.interface.encodeFunctionData('createAccount', [owner, salt])
    ]);
}
exports.getAccountInitCode = getAccountInitCode;
async function getAggregatedAccountInitCode(entryPoint, factory, salt = 0) {
    // the test aggregated account doesn't check the owner...
    const owner = exports.AddressZero;
    return (0, utils_1.hexConcat)([
        factory.address,
        factory.interface.encodeFunctionData('createAccount', [owner, salt])
    ]);
}
exports.getAggregatedAccountInitCode = getAggregatedAccountInitCode;
// given the parameters as AccountDeployer, return the resulting "counterfactual address" that it would create.
async function getAccountAddress(owner, factory, salt = 0) {
    return await factory.getAddress(owner, salt);
}
exports.getAccountAddress = getAccountAddress;
const panicCodes = {
    // from https://docs.soliditylang.org/en/v0.8.0/control-structures.html
    0x01: 'assert(false)',
    0x11: 'arithmetic overflow/underflow',
    0x12: 'divide by zero',
    0x21: 'invalid enum value',
    0x22: 'storage byte array that is incorrectly encoded',
    0x31: '.pop() on an empty array.',
    0x32: 'array sout-of-bounds or negative index',
    0x41: 'memory overflow',
    0x51: 'zero-initialized variable of internal function type'
};
// rethrow "cleaned up" exception.
// - stack trace goes back to method (or catch) line, not inner provider
// - attempt to parse revert data (needed for geth)
// use with ".catch(rethrow())", so that current source file/line is meaningful.
function rethrow() {
    const callerStack = new Error().stack.replace(/Error.*\n.*at.*\n/, '').replace(/.*at.* \(internal[\s\S]*/, '');
    if (arguments[0] != null) {
        throw new Error('must use .catch(rethrow()), and NOT .catch(rethrow)');
    }
    return function (e) {
        const solstack = e.stack.match(/((?:.* at .*\.sol.*\n)+)/);
        const stack = (solstack != null ? solstack[1] : '') + callerStack;
        // const regex = new RegExp('error=.*"data":"(.*?)"').compile()
        const found = /error=.*?"data":"(.*?)"/.exec(e.message);
        let message;
        if (found != null) {
            const data = found[1];
            message = decodeRevertReason(data) ?? e.message + ' - ' + data.slice(0, 100);
        }
        else {
            message = e.message;
        }
        const err = new Error(message);
        err.stack = 'Error: ' + message + '\n' + stack;
        throw err;
    };
}
exports.rethrow = rethrow;
const decodeRevertReasonContracts = new utils_1.Interface([
    ...typechain_1.EntryPoint__factory.createInterface().fragments,
    ...typechain_1.TestPaymasterRevertCustomError__factory.createInterface().fragments,
    ...typechain_1.TestERC20__factory.createInterface().fragments, // for OZ errors,
    'error ECDSAInvalidSignature()'
]); // .filter(f => f.type === 'error'))
function decodeRevertReason(data, nullIfNoMatch = true) {
    if (typeof data !== 'string') {
        const err = data;
        data = (err.data ?? err.error.data);
    }
    const methodSig = data.slice(0, 10);
    const dataParams = '0x' + data.slice(10);
    // can't add Error(string) to xface...
    if (methodSig === '0x08c379a0') {
        const [err] = hardhat_1.ethers.utils.defaultAbiCoder.decode(['string'], dataParams);
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        return `Error(${err})`;
    }
    else if (methodSig === '0x4e487b71') {
        const [code] = hardhat_1.ethers.utils.defaultAbiCoder.decode(['uint256'], dataParams);
        return `Panic(${panicCodes[code] ?? code} + ')`;
    }
    try {
        const err = decodeRevertReasonContracts.parseError(data);
        // treat any error "bytes" argument as possible error to decode (e.g. FailedOpWithRevert, PostOpReverted)
        const args = err.args.map((arg, index) => {
            switch (err.errorFragment.inputs[index].type) {
                case 'bytes': return decodeRevertReason(arg);
                case 'string': return `"${arg}"`;
                default: return arg;
            }
        });
        return `${err.name}(${args.join(',')})`;
    }
    catch (e) {
        // throw new Error('unsupported errorSig ' + data)
        if (!nullIfNoMatch) {
            return data;
        }
        return null;
    }
}
exports.decodeRevertReason = decodeRevertReason;
let currentNode = '';
// basic geth support
// - by default, has a single account. our code needs more.
async function checkForGeth() {
    // @ts-ignore
    const provider = hardhat_1.ethers.provider._hardhatProvider;
    currentNode = await provider.request({ method: 'web3_clientVersion' });
    console.log('node version:', currentNode);
    // NOTE: must run geth with params:
    // --http.api personal,eth,net,web3
    // --allow-insecure-unlock
    if (currentNode.match(/geth/i) != null) {
        for (let i = 0; i < 2; i++) {
            const acc = await provider.request({ method: 'personal_newAccount', params: ['pass'] }).catch(rethrow);
            await provider.request({ method: 'personal_unlockAccount', params: [acc, 'pass'] }).catch(rethrow);
            await fund(acc, '10');
        }
    }
}
exports.checkForGeth = checkForGeth;
// remove "array" members, convert values to strings.
// so Result obj like
// { '0': "a", '1': 20, first: "a", second: 20 }
// becomes:
// { first: "a", second: "20" }
function objdump(obj) {
    return obj == null
        ? null
        : Object.keys(obj)
            .filter(key => key.match(/^[\d_]/) == null)
            .reduce((set, key) => ({
            ...set,
            [key]: decodeRevertReason(obj[key].toString(), false)
        }), {});
}
exports.objdump = objdump;
async function checkForBannedOps(txHash, checkPaymaster) {
    const tx = await (0, debugTx_1.debugTransaction)(txHash);
    const logs = tx.structLogs;
    const blockHash = logs.map((op, index) => ({ op: op.op, index })).filter(op => op.op === 'NUMBER');
    (0, chai_1.expect)(blockHash.length).to.equal(2, 'expected exactly 2 call to NUMBER (Just before and after validateUserOperation)');
    const validateAccountOps = logs.slice(0, blockHash[0].index - 1);
    const validatePaymasterOps = logs.slice(blockHash[0].index + 1);
    const ops = validateAccountOps.filter(log => log.depth > 1).map(log => log.op);
    const paymasterOps = validatePaymasterOps.filter(log => log.depth > 1).map(log => log.op);
    (0, chai_1.expect)(ops).to.include('POP', 'not a valid ops list: ' + JSON.stringify(ops)); // sanity
    const bannedOpCodes = new Set(['GAS', 'BASEFEE', 'GASPRICE', 'NUMBER']);
    (0, chai_1.expect)(ops.filter((op, index) => {
        // don't ban "GAS" op followed by "*CALL"
        if (op === 'GAS' && (ops[index + 1].match(/CALL/) != null)) {
            return false;
        }
        return bannedOpCodes.has(op);
    })).to.eql([]);
    if (checkPaymaster) {
        (0, chai_1.expect)(paymasterOps).to.include('POP', 'not a valid ops list: ' + JSON.stringify(paymasterOps)); // sanity
        (0, chai_1.expect)(paymasterOps).to.not.include('BASEFEE');
        (0, chai_1.expect)(paymasterOps).to.not.include('GASPRICE');
        (0, chai_1.expect)(paymasterOps).to.not.include('NUMBER');
    }
}
exports.checkForBannedOps = checkForBannedOps;
async function deployEntryPoint(provider = hardhat_1.ethers.provider) {
    const create2factory = new Create2Factory_1.Create2Factory(provider);
    const addr = await create2factory.deploy(typechain_1.EntryPoint__factory.bytecode, 0, process.env.COVERAGE != null ? 20e6 : 8e6);
    return typechain_1.EntryPoint__factory.connect(addr, provider.getSigner());
}
exports.deployEntryPoint = deployEntryPoint;
async function isDeployed(addr) {
    const code = await hardhat_1.ethers.provider.getCode(addr);
    return code.length > 2;
}
exports.isDeployed = isDeployed;
// Deploys an implementation and a proxy pointing to this implementation
async function createAccount(ethersSigner, accountOwner, entryPoint, _factory) {
    const accountFactory = _factory ?? await new typechain_1.SimpleAccountFactory__factory(ethersSigner).deploy(entryPoint);
    const implementation = await accountFactory.accountImplementation();
    await accountFactory.createAccount(accountOwner, 0);
    const accountAddress = await accountFactory.getAddress(accountOwner, 0);
    const proxy = typechain_1.SimpleAccount__factory.connect(accountAddress, ethersSigner);
    return {
        implementation,
        accountFactory,
        proxy
    };
}
exports.createAccount = createAccount;
function packAccountGasLimits(validationGasLimit, callGasLimit) {
    return hardhat_1.ethers.utils.hexConcat([
        (0, utils_1.hexZeroPad)((0, utils_1.hexlify)(validationGasLimit, { hexPad: 'left' }), 16), (0, utils_1.hexZeroPad)((0, utils_1.hexlify)(callGasLimit, { hexPad: 'left' }), 16)
    ]);
}
exports.packAccountGasLimits = packAccountGasLimits;
function packPaymasterData(paymaster, paymasterVerificationGasLimit, postOpGasLimit, paymasterData) {
    return hardhat_1.ethers.utils.hexConcat([
        paymaster, (0, utils_1.hexZeroPad)((0, utils_1.hexlify)(paymasterVerificationGasLimit, { hexPad: 'left' }), 16),
        (0, utils_1.hexZeroPad)((0, utils_1.hexlify)(postOpGasLimit, { hexPad: 'left' }), 16), paymasterData
    ]);
}
exports.packPaymasterData = packPaymasterData;
function unpackAccountGasLimits(accountGasLimits) {
    return { validationGasLimit: parseInt(accountGasLimits.slice(2, 34), 16), callGasLimit: parseInt(accountGasLimits.slice(34), 16) };
}
exports.unpackAccountGasLimits = unpackAccountGasLimits;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.simulateHandleOp = exports.simulateValidation = exports.fillSignAndPack = exports.fillAndSign = exports.fillAndPack = exports.fillUserOp = exports.fillUserOpDefaults = exports.signUserOp = exports.DefaultsForUserOp = exports.getUserOpHash = exports.encodeUserOp = exports.packUserOp = void 0;
const utils_1 = require("ethers/lib/utils");
const ethers_1 = require("ethers");
const testutils_1 = require("./testutils");
const ethereumjs_util_1 = require("ethereumjs-util");
const typechain_1 = require("../typechain");
const Create2Factory_1 = require("../src/Create2Factory");
const EntryPointSimulations_json_1 = __importDefault(require("../artifacts/contracts/core/EntryPointSimulations.sol/EntryPointSimulations.json"));
const hardhat_1 = require("hardhat");
function packUserOp(userOp) {
    const accountGasLimits = (0, testutils_1.packAccountGasLimits)(userOp.verificationGasLimit, userOp.callGasLimit);
    let paymasterAndData = '0x';
    if (userOp.paymaster.length >= 20 && userOp.paymaster !== testutils_1.AddressZero) {
        paymasterAndData = (0, testutils_1.packPaymasterData)(userOp.paymaster, userOp.paymasterVerificationGasLimit, userOp.paymasterPostOpGasLimit, userOp.paymasterData);
    }
    return {
        sender: userOp.sender,
        nonce: userOp.nonce,
        callData: userOp.callData,
        accountGasLimits,
        initCode: userOp.initCode,
        preVerificationGas: userOp.preVerificationGas,
        maxFeePerGas: userOp.maxFeePerGas,
        maxPriorityFeePerGas: userOp.maxPriorityFeePerGas,
        paymasterAndData,
        signature: userOp.signature
    };
}
exports.packUserOp = packUserOp;
function encodeUserOp(userOp, forSignature = true) {
    const packedUserOp = packUserOp(userOp);
    if (forSignature) {
        return utils_1.defaultAbiCoder.encode(['address', 'uint256', 'bytes32', 'bytes32',
            'bytes32', 'uint256', 'uint256', 'uint256',
            'bytes32'], [packedUserOp.sender, packedUserOp.nonce, (0, utils_1.keccak256)(packedUserOp.initCode), (0, utils_1.keccak256)(packedUserOp.callData),
            packedUserOp.accountGasLimits, packedUserOp.preVerificationGas, packedUserOp.maxFeePerGas, packedUserOp.maxPriorityFeePerGas,
            (0, utils_1.keccak256)(packedUserOp.paymasterAndData)]);
    }
    else {
        // for the purpose of calculating gas cost encode also signature (and no keccak of bytes)
        return utils_1.defaultAbiCoder.encode(['address', 'uint256', 'bytes', 'bytes',
            'bytes32', 'uint256', 'uint256', 'uint256',
            'bytes', 'bytes'], [packedUserOp.sender, packedUserOp.nonce, packedUserOp.initCode, packedUserOp.callData,
            packedUserOp.accountGasLimits, packedUserOp.preVerificationGas, packedUserOp.maxFeePerGas, packedUserOp.maxPriorityFeePerGas,
            packedUserOp.paymasterAndData, packedUserOp.signature]);
    }
}
exports.encodeUserOp = encodeUserOp;
function getUserOpHash(op, entryPoint, chainId) {
    const userOpHash = (0, utils_1.keccak256)(encodeUserOp(op, true));
    const enc = utils_1.defaultAbiCoder.encode(['bytes32', 'address', 'uint256'], [userOpHash, entryPoint, chainId]);
    return (0, utils_1.keccak256)(enc);
}
exports.getUserOpHash = getUserOpHash;
exports.DefaultsForUserOp = {
    sender: testutils_1.AddressZero,
    nonce: 0,
    initCode: '0x',
    callData: '0x',
    callGasLimit: 0,
    verificationGasLimit: 150000, // default verification gas. will add create2 cost (3200+200*length) if initCode exists
    preVerificationGas: 21000, // should also cover calldata cost.
    maxFeePerGas: 0,
    maxPriorityFeePerGas: 1e9,
    paymaster: testutils_1.AddressZero,
    paymasterData: '0x',
    paymasterVerificationGasLimit: 3e5,
    paymasterPostOpGasLimit: 0,
    signature: '0x'
};
function signUserOp(op, signer, entryPoint, chainId) {
    const message = getUserOpHash(op, entryPoint, chainId);
    const msg1 = Buffer.concat([
        Buffer.from('\x19Ethereum Signed Message:\n32', 'ascii'),
        Buffer.from((0, utils_1.arrayify)(message))
    ]);
    const sig = (0, ethereumjs_util_1.ecsign)((0, ethereumjs_util_1.keccak256)(msg1), Buffer.from((0, utils_1.arrayify)(signer.privateKey)));
    // that's equivalent of:  await signer.signMessage(message);
    // (but without "async"
    const signedMessage1 = (0, ethereumjs_util_1.toRpcSig)(sig.v, sig.r, sig.s);
    return {
        ...op,
        signature: signedMessage1
    };
}
exports.signUserOp = signUserOp;
function fillUserOpDefaults(op, defaults = exports.DefaultsForUserOp) {
    const partial = { ...op };
    // we want "item:undefined" to be used from defaults, and not override defaults, so we must explicitly
    // remove those so "merge" will succeed.
    for (const key in partial) {
        if (partial[key] == null) {
            // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
            delete partial[key];
        }
    }
    const filled = { ...defaults, ...partial };
    return filled;
}
exports.fillUserOpDefaults = fillUserOpDefaults;
// helper to fill structure:
// - default callGasLimit to estimate call from entryPoint to account (TODO: add overhead)
// if there is initCode:
//  - calculate sender by eth_call the deployment code
//  - default verificationGasLimit estimateGas of deployment code plus default 100000
// no initCode:
//  - update nonce from account.getNonce()
// entryPoint param is only required to fill in "sender address when specifying "initCode"
// nonce: assume contract as "getNonce()" function, and fill in.
// sender - only in case of construction: fill sender from initCode.
// callGasLimit: VERY crude estimation (by estimating call to account, and add rough entryPoint overhead
// verificationGasLimit: hard-code default at 100k. should add "create2" cost
async function fillUserOp(op, entryPoint, getNonceFunction = 'getNonce') {
    const op1 = { ...op };
    const provider = entryPoint?.provider;
    if (op.initCode != null) {
        const initAddr = (0, utils_1.hexDataSlice)(op1.initCode, 0, 20);
        const initCallData = (0, utils_1.hexDataSlice)(op1.initCode, 20);
        if (op1.nonce == null)
            op1.nonce = 0;
        if (op1.sender == null) {
            // hack: if the init contract is our known deployer, then we know what the address would be, without a view call
            if (initAddr.toLowerCase() === Create2Factory_1.Create2Factory.contractAddress.toLowerCase()) {
                const ctr = (0, utils_1.hexDataSlice)(initCallData, 32);
                const salt = (0, utils_1.hexDataSlice)(initCallData, 0, 32);
                op1.sender = Create2Factory_1.Create2Factory.getDeployedAddress(ctr, salt);
            }
            else {
                // console.log('\t== not our deployer. our=', Create2Factory.contractAddress, 'got', initAddr)
                if (provider == null)
                    throw new Error('no entrypoint/provider');
                op1.sender = await entryPoint.callStatic.getSenderAddress(op1.initCode).catch(e => e.errorArgs.sender);
            }
        }
        if (op1.verificationGasLimit == null) {
            if (provider == null)
                throw new Error('no entrypoint/provider');
            const initEstimate = await provider.estimateGas({
                from: entryPoint?.address,
                to: initAddr,
                data: initCallData,
                gasLimit: 10e6
            });
            op1.verificationGasLimit = ethers_1.BigNumber.from(exports.DefaultsForUserOp.verificationGasLimit).add(initEstimate);
        }
    }
    if (op1.nonce == null) {
        if (provider == null)
            throw new Error('must have entryPoint to autofill nonce');
        const c = new ethers_1.Contract(op.sender, [`function ${getNonceFunction}() view returns(uint256)`], provider);
        op1.nonce = await c[getNonceFunction]().catch((0, testutils_1.rethrow)());
    }
    if (op1.callGasLimit == null && op.callData != null) {
        if (provider == null)
            throw new Error('must have entryPoint for callGasLimit estimate');
        const gasEtimated = await provider.estimateGas({
            from: entryPoint?.address,
            to: op1.sender,
            data: op1.callData
        });
        // console.log('estim', op1.sender,'len=', op1.callData!.length, 'res=', gasEtimated)
        // estimateGas assumes direct call from entryPoint. add wrapper cost.
        op1.callGasLimit = gasEtimated; // .add(55000)
    }
    if (op1.paymaster != null) {
        if (op1.paymasterVerificationGasLimit == null) {
            op1.paymasterVerificationGasLimit = exports.DefaultsForUserOp.paymasterVerificationGasLimit;
        }
        if (op1.paymasterPostOpGasLimit == null) {
            op1.paymasterPostOpGasLimit = exports.DefaultsForUserOp.paymasterPostOpGasLimit;
        }
    }
    if (op1.maxFeePerGas == null) {
        if (provider == null)
            throw new Error('must have entryPoint to autofill maxFeePerGas');
        const block = await provider.getBlock('latest');
        op1.maxFeePerGas = block.baseFeePerGas.add(op1.maxPriorityFeePerGas ?? exports.DefaultsForUserOp.maxPriorityFeePerGas);
    }
    // TODO: this is exactly what fillUserOp below should do - but it doesn't.
    // adding this manually
    if (op1.maxPriorityFeePerGas == null) {
        op1.maxPriorityFeePerGas = exports.DefaultsForUserOp.maxPriorityFeePerGas;
    }
    const op2 = fillUserOpDefaults(op1);
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    if (op2.preVerificationGas.toString() === '0') {
        // TODO: we don't add overhead, which is ~21000 for a single TX, but much lower in a batch.
        op2.preVerificationGas = (0, testutils_1.callDataCost)(encodeUserOp(op2, false));
    }
    return op2;
}
exports.fillUserOp = fillUserOp;
async function fillAndPack(op, entryPoint, getNonceFunction = 'getNonce') {
    return packUserOp(await fillUserOp(op, entryPoint, getNonceFunction));
}
exports.fillAndPack = fillAndPack;
async function fillAndSign(op, signer, entryPoint, getNonceFunction = 'getNonce') {
    const provider = entryPoint?.provider;
    const op2 = await fillUserOp(op, entryPoint, getNonceFunction);
    const chainId = await provider.getNetwork().then(net => net.chainId);
    const message = (0, utils_1.arrayify)(getUserOpHash(op2, entryPoint.address, chainId));
    let signature;
    try {
        signature = await signer.signMessage(message);
    }
    catch (err) {
        // attempt to use 'eth_sign' instead of 'personal_sign' which is not supported by Foundry Anvil
        signature = await signer._legacySignMessage(message);
    }
    return {
        ...op2,
        signature
    };
}
exports.fillAndSign = fillAndSign;
async function fillSignAndPack(op, signer, entryPoint, getNonceFunction = 'getNonce') {
    const filledAndSignedOp = await fillAndSign(op, signer, entryPoint, getNonceFunction);
    return packUserOp(filledAndSignedOp);
}
exports.fillSignAndPack = fillSignAndPack;
/**
 * This function relies on a "state override" functionality of the 'eth_call' RPC method
 * in order to provide the details of a simulated validation call to the bundler
 * @param userOp
 * @param entryPointAddress
 * @param txOverrides
 */
async function simulateValidation(userOp, entryPointAddress, txOverrides) {
    const entryPointSimulations = typechain_1.EntryPointSimulations__factory.createInterface();
    const data = entryPointSimulations.encodeFunctionData('simulateValidation', [userOp]);
    const tx = {
        to: entryPointAddress,
        data,
        ...txOverrides
    };
    const stateOverride = {
        [entryPointAddress]: {
            code: EntryPointSimulations_json_1.default.deployedBytecode
        }
    };
    try {
        const simulationResult = await hardhat_1.ethers.provider.send('eth_call', [tx, 'latest', stateOverride]);
        const res = entryPointSimulations.decodeFunctionResult('simulateValidation', simulationResult);
        // note: here collapsing the returned "tuple of one" into a single value - will break for returning actual tuples
        return res[0];
    }
    catch (error) {
        const revertData = error?.data;
        if (revertData != null) {
            // note: this line throws the revert reason instead of returning it
            entryPointSimulations.decodeFunctionResult('simulateValidation', revertData);
        }
        throw error;
    }
}
exports.simulateValidation = simulateValidation;
// TODO: this code is very much duplicated but "encodeFunctionData" is based on 20 overloads
//  TypeScript is not able to resolve overloads with variables: https://github.com/microsoft/TypeScript/issues/14107
async function simulateHandleOp(userOp, target, targetCallData, entryPointAddress, txOverrides) {
    const entryPointSimulations = typechain_1.EntryPointSimulations__factory.createInterface();
    const data = entryPointSimulations.encodeFunctionData('simulateHandleOp', [userOp, target, targetCallData]);
    const tx = {
        to: entryPointAddress,
        data,
        ...txOverrides
    };
    const stateOverride = {
        [entryPointAddress]: {
            code: EntryPointSimulations_json_1.default.deployedBytecode
        }
    };
    try {
        const simulationResult = await hardhat_1.ethers.provider.send('eth_call', [tx, 'latest', stateOverride]);
        const res = entryPointSimulations.decodeFunctionResult('simulateHandleOp', simulationResult);
        // note: here collapsing the returned "tuple of one" into a single value - will break for returning actual tuples
        return res[0];
    }
    catch (error) {
        const revertData = error?.data;
        if (revertData != null) {
            // note: this line throws the revert reason instead of returning it
            entryPointSimulations.decodeFunctionResult('simulateHandleOp', revertData);
        }
        throw error;
    }
}
exports.simulateHandleOp = simulateHandleOp;

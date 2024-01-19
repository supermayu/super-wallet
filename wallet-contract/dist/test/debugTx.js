"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.debugTransaction = void 0;
const hardhat_1 = require("hardhat");
async function debugTransaction(txHash, disableMemory = true, disableStorage = true) {
    const debugTx = async (hash) => await hardhat_1.ethers.provider.send('debug_traceTransaction', [hash, {
            disableMemory,
            disableStorage
        }]);
    return await debugTx(txHash);
}
exports.debugTransaction = debugTransaction;

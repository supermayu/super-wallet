"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SuperWallet = void 0;
const ethers_1 = require("ethers");
const builder_1 = require("userop");
const middleware_1 = require("userop");
const typechain_1 = require("../../typechain-types");
const typechain_2 = require("userop");
class SuperWallet extends builder_1.UserOperationBuilder {
    constructor(signer, ERC4337NodeRpc, entryPoint, factory) {
        super();
        this.resolveAccount = (ctx) => __awaiter(this, void 0, void 0, function* () {
            ctx.op.nonce = yield this.entryPoint.getNonce(ctx.op.sender, 0);
            ctx.op.initCode = ctx.op.nonce.eq(0) ? this.initCode : "0x";
        });
        this.signer = signer;
        this.provider = new ethers_1.ethers.providers.JsonRpcProvider(ERC4337NodeRpc);
        this.entryPoint = typechain_2.EntryPoint__factory.connect(entryPoint, this.provider);
        this.factory = typechain_1.SuperWalletFactory__factory.connect(factory, this.provider);
        this.initCode = "0x";
        this.proxy = typechain_1.SuperWallet__factory.connect(ethers_1.ethers.constants.AddressZero, this.provider);
    }
    static init(signer, ERC4337NodeRpc, entryPoint, factory, paymasterMiddleware) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const instance = new SuperWallet(signer, ERC4337NodeRpc, entryPoint, factory);
            try {
                instance.initCode = yield ethers_1.ethers.utils.hexConcat([
                    instance.factory.address,
                    instance.factory.interface.encodeFunctionData("createAccount", [
                        yield instance.signer.getAddress(),
                        ethers_1.ethers.BigNumber.from(0),
                    ]),
                ]);
                yield instance.entryPoint.callStatic.getSenderAddress(instance.initCode);
                throw new Error("getSenderAddress: unexpected result");
            }
            catch (error) {
                const addr = (_a = error === null || error === void 0 ? void 0 : error.errorArgs) === null || _a === void 0 ? void 0 : _a.sender;
                if (!addr)
                    throw error;
                instance.proxy = typechain_1.SuperWallet__factory.connect(addr, instance.provider);
            }
            const base = instance
                .useDefaults({
                sender: instance.proxy.address,
                signature: yield instance.signer.signMessage(ethers_1.ethers.utils.arrayify(ethers_1.ethers.utils.keccak256("0xdead"))),
            })
                .useMiddleware(instance.resolveAccount)
                .useMiddleware((0, middleware_1.getGasPrice)(instance.provider));
            const withPM = paymasterMiddleware
                ? base.useMiddleware(paymasterMiddleware)
                : base.useMiddleware((0, middleware_1.estimateUserOperationGas)(instance.provider));
            return withPM.useMiddleware((0, middleware_1.EOASignature)(instance.signer));
        });
    }
    execute(to, value, data) {
        return this.setCallData(this.proxy.interface.encodeFunctionData("execute", [to, value, data]));
    }
    executeBatch(to, data) {
        return this.setCallData(this.proxy.interface.encodeFunctionData("executeBatch", [to, data]));
    }
}
exports.SuperWallet = SuperWallet;

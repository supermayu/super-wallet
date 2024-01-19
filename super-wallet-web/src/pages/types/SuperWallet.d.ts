import { BigNumberish, BytesLike, ethers } from "ethers";
import { UserOperationBuilder } from "userop";
import { SuperWallet as SuperWalletImpl } from "@/typechain-types";
import { UserOperationMiddlewareFn } from "userop";

export declare class SuperWallet extends UserOperationBuilder{
    private signer;
    private provider;
    private entryPoint;
    private factory;
    private initCode;
    proxy: SuperWalletImpl;
    private constructor();
    private resolveAccount;
    static init(signer: ethers.Signer, ERC4337NodeRpc: string, entryPoint: string, factory: string, paymasterMiddleware?: UserOperationMiddlewareFn): Promise<SuperWallet>;
    execute(to: string, value: BigNumberish, data: BytesLike): this;
    executeBatch(to: Array<string>, data: Array<BytesLike>): this;
}
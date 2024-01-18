import { ethers } from 'hardhat'
import {
  keccak256,
  parseEther
} from 'ethers'
import { BigNumber, Signer, Wallet } from 'ethers'

import {
  EntryPoint,
  EntryPoint__factory,
  SimpleAccount,
  SimpleAccountFactory__factory,
  SimpleAccount__factory,
  SimpleAccountFactory,
} from '../typechain'
import { Create2Factory } from '../src/Create2Factory'

export const ONE_ETH = parseEther('1')

export async function createAccount (
    ethersSigner: Signer,
    accountOwner: string,
    entryPoint: string,
    _factory?: SimpleAccountFactory
  ):
    Promise<{
      proxy: SimpleAccount
      accountFactory: SimpleAccountFactory
      implementation: string
    }> {
    const accountFactory = _factory ?? await new SimpleAccountFactory__factory(ethersSigner).deploy(entryPoint)
    const implementation = await accountFactory.accountImplementation()
    await accountFactory.createAccount(accountOwner, 0)
    const accountAddress = await accountFactory.getAddress(accountOwner, 0)
    const proxy = SimpleAccount__factory.connect(accountAddress, ethersSigner)
    return {
      implementation,
      accountFactory,
      proxy
    }
  }

  export function createAddress (): string {
    return createAccountOwner().address
  }

  let counter = 0

  export function createAccountOwner (): Wallet {
    const privateKey = keccak256(Buffer.from(ethers.getBytes(BigNumber.from(++counter))))
    return new ethers.Wallet(privateKey, ethers.provider)
    // return new ethers.Wallet('0x'.padEnd(66, privkeyBase), ethers.provider);
  }

  export async function getBalance (address: string): Promise<number> {
    const balance = await ethers.provider.getBalance(address)
    return parseInt(balance.toString())
  }

  export async function isDeployed (addr: string): Promise<boolean> {
    const code = await ethers.provider.getCode(addr)
    return code.length > 2
  }

  export async function deployEntryPoint (provider = ethers.provider): Promise<EntryPoint> {
    const create2factory = new Create2Factory(provider)
    const addr = await create2factory.deploy(EntryPoint__factory.bytecode, 0, process.env.COVERAGE != null ? 20e6 : 8e6)
    return EntryPoint__factory.connect(addr, provider.getSigner())
  }
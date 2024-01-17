import { Wallet } from 'ethers'
import { ethers } from 'hardhat'
import { expect } from 'chai'
import {
  ERC1967Proxy__factory,
  SimpleAccountFactory__factory,
  SuperWallet__factory,
  SuperWallet,
} from '../typechain-types'
import {
  createAccount,
  createAddress,
  createAccountOwner,
  getBalance,
  isDeployed,
  ONE_ETH,
  deployEntryPoint
} from './testutils'
import { fillUserOpDefaults, getUserOpHash, encodeUserOp, signUserOp, packUserOp } from './UserOp'
import { parseEther } from 'ethers'
import { UserOperation } from './UserOperation'

describe('SimpleAccount', function () {
  let entryPoint: string
  let accounts: string[]
  let accountOwner: Wallet
  const ethersSigner = ethers.provider.getSigner()

  before(async function () {
    entryPoint = await deployEntryPoint().then(e => e.address)
    accounts = ethers.provider.listAccounts()
    // ignore in geth.. this is just a sanity test. should be refactored to use a single-account mode..
    if (accounts.length < 2) this.skip()
    accountOwner = createAccountOwner()
  })

  it('owner should be able to call transfer', async () => {
    const { proxy: account } = await createAccount(ethers.provider.getSigner(), accounts[0], entryPoint)
    await ethersSigner.sendTransaction({ from: accounts[0], to: account.address, value: parseEther('2') })
    await account.execute(accounts[2], ONE_ETH, '0x')
  })

  describe('#validateUserOp', () => {
    let account: SuperWallet
    let userOp: UserOperation
    let userOpHash: string
    let preBalance: number
    let expectedPay: number

    const actualGasPrice = 1e9
    // for testing directly validateUserOp, we initialize the account with EOA as entryPoint.
    let entryPointEoa: string

    before(async () => {
      entryPointEoa = accounts[2]
      const epAsSigner = await ethers.getSigner(entryPointEoa)

      // cant use "SimpleAccountFactory", since it attempts to increment nonce first
      const implementation = await new SuperWallet__factory(ethersSigner).deploy(entryPointEoa)
      const proxy = await new ERC1967Proxy__factory(ethersSigner).deploy(implementation.address, '0x')
      account = SuperWallet__factory.connect(proxy.address, epAsSigner)

      await ethersSigner.sendTransaction({ from: accounts[0], to: account.address, value: parseEther('0.2') })
      const callGasLimit = 200000
      const verificationGasLimit = 100000
      const maxFeePerGas = 3e9
      const chainId = await ethers.provider.getNetwork().then(net => net.chainId)

      userOp = signUserOp(fillUserOpDefaults({
        sender: account.address,
        callGasLimit,
        verificationGasLimit,
        maxFeePerGas
      }), accountOwner, entryPointEoa, chainId)

      userOpHash = await getUserOpHash(userOp, entryPointEoa, chainId)

      expectedPay = actualGasPrice * (callGasLimit + verificationGasLimit)

      preBalance = await getBalance(account.address)
      const packedOp = packUserOp(userOp)
      const ret = await account.validateUserOp(packedOp, userOpHash, expectedPay, { gasPrice: actualGasPrice })
      await ret.wait()
    })

    it('should pay', async () => {
      const postBalance = await getBalance(account.address)
      expect(preBalance - postBalance).to.eql(expectedPay)
    })
  })

  context('SimpleAccountFactory', () => {
    it('sanity: check deployer', async () => {
      const ownerAddr = createAddress()
      const deployer = await new SimpleAccountFactory__factory(ethersSigner).deploy(entryPoint)
      const target = await deployer.callStatic.createAccount(ownerAddr, 1234)
      expect(await isDeployed(target)).to.eq(false)
      await deployer.createAccount(ownerAddr, 1234)
      expect(await isDeployed(target)).to.eq(true)
    })
  })
})
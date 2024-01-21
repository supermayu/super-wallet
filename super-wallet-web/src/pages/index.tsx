import { SuperWallet__factory } from "@/typechain-types";
//import { SuperWallet } from "../typechain-types/contracts";
import { SuperWalletFactory__factory } from "@/typechain-types/factories/contracts";
import { CHAIN_NAMESPACES, SafeEventEmitterProvider } from "@web3auth/base";
import { Web3Auth } from "@web3auth/modal";
import {
  ethers,
  getAddress,
  JsonRpcProvider,
  parseEther,
  toQuantity,
  Wallet,
} from "ethers";
import { useEffect, useState } from "react";
import { Client, Presets } from "userop";

const entryPointAddress = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789";
//const swapRouterAddress = "0xE592427A0AEce92De3Edee1F18E0157C05861564"
const superWalletFactoryAddress = "0x7E2EEfc146f487BBdfE21F6Dc2c28dA83d1B2a45";
const pmContext = {
  type: "payg",
};
export default function Home() {
  const [web3auth, setWeb3auth] = useState<Web3Auth | null>(null);
  const [account, setAccount] = useState<ethers.Contract | null>(
    null
  );
  const [superWalletAddress,setSuperWalletAccount] = useState<string | null>(null);

  const [idToken, setIdToken] = useState<string | null>(null);
  const [privateKey, setPrivateKey] = useState<string | null>(null);
  const [events, setEvents] = useState<string[]>([
    `A sample application to demonstrate how to integrate self-custodial\nsocial login and transacting with Web3Auth and userop.js.`,
  ]);
  const [loading, setLoading] = useState(false);

  const [recipientAddress, setRecipientAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [receiveToken, setReceiveToken] = useState<string>("0x7af963cF6D228E564e2A0aA0DdBF06210B38615D");

  const [displayedContent, setDisplayedContent] = useState('sendToken');

  const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL;
  const pmUrl = process.env.NEXT_PUBLIC_PAYMASTER_URL;
  const web3AuthClientId = process.env.NEXT_PUBLIC_WEB3_AUTH_CLIENT_ID;

  if (!web3AuthClientId) {
    throw new Error("WEB3AUTH_CLIENT_ID is undefined");
  }

  if (!rpcUrl) {
    throw new Error("RPC_URL is undefined");
  }

  if (!pmUrl) {
    throw new Error("PAYMASTER_RPC_URL is undefined");
  }

  const paymaster = true
    ? Presets.Middleware.verifyingPaymaster(pmUrl, pmContext)
    : undefined;
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const provider = new JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL);
        const network = await provider.getNetwork();
        const chainId = network.chainId;
        const web3auth = new Web3Auth({
          clientId: web3AuthClientId,
          web3AuthNetwork: "testnet",
          chainConfig: {
            chainNamespace: CHAIN_NAMESPACES.EIP155,
            chainId: toQuantity(chainId),
            rpcTarget: process.env.NEXT_PUBLIC_RPC_URL,
          },
        });

        await web3auth.initModal();

        setWeb3auth(web3auth);
        setAuthorized(web3auth);
        setReceiveToken(await getReceiveToken());
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  const createAccount = async (privateKey: string) => {
    const wallet = new Wallet(privateKey, new JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL));

    const superWalletFactory = new ethers.Contract(
      superWalletFactoryAddress,
      SuperWalletFactory__factory.abi,
      wallet
    );

    const factoryTx = await superWalletFactory.createAccount(wallet.address, 0/*, {
      _entryPoint: entryPointAddress,
      _swapRouter: swapRouterAddress,
    }*/);
    
    const receipt = await factoryTx.wait();

    const superWalletAddress = await receipt.logs[0].address;
    setSuperWalletAccount(superWalletAddress);

    return  new ethers.Contract(
      superWalletAddress,
      SuperWallet__factory.abi,
      wallet
    );
  };

  const getPrivateKey = async (provider: SafeEventEmitterProvider) => {
    return (await provider.request({
      method: "private_key",
    })) as string;
  };

  const setAuthorized = async (w3auth: Web3Auth) => {
    if (!w3auth.provider) {
      throw new Error("web3authprovider not initialized yet");
    }
    const authenticateUser = await w3auth.authenticateUser();

    const privateKey = await getPrivateKey(w3auth.provider);
    const acc = await createAccount(privateKey);
    setIdToken(authenticateUser.idToken);
    setAccount(acc);
    setPrivateKey(privateKey);
  };

  const login = async () => {
    if (!web3auth) {
      throw new Error("web3auth not initialized yet");
    }
    const web3authProvider = await web3auth.connect();
    if (!web3authProvider) {
      throw new Error("web3authprovider not initialized yet");
    }
    setAuthorized(web3auth);
  };

  const logout = async () => {
    if (!web3auth) {
      throw new Error("web3auth not initialized yet");
    }
    await web3auth.logout();
    setAccount(null);
    setIdToken(null);
    setPrivateKey(null);
  };

  const addEvent = (newEvent: string) => {
    setEvents((prevEvents) => [...prevEvents, newEvent]);
  };

  const sendTransaction = async (recipient: string, amount: string) => {
    setEvents([]);
    if (!account) {
      throw new Error("Account not initialized");
    }
    addEvent("Sending transaction...");

    const client = await Client.init(rpcUrl, entryPointAddress);

    const target = getAddress(recipient);
    const value = parseEther(amount); 
    const res = await client.sendUserOperation(
      await account.execute(target, value, "0x"),
      {
        onBuild: async (op) => {
          addEvent(`Signed UserOperation: `);
          addEvent(JSON.stringify(op, null, 2) as any);
        },
      }
    );
    addEvent(`UserOpHash: ${res.userOpHash}`);

    addEvent("Waiting for transaction...");
    const ev = await res.wait();
    addEvent(`Transaction hash: ${ev?.transactionHash ?? null}`);

  };

  const handleRecipientChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRecipientAddress(event.target.value);
  };

  const handleAmountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(event.target.value);
  };

  const transfer = async () => {
    if (recipientAddress && recipientAddress.length > 0 && amount && amount.length > 0 && account) {
      const tokenIn = _selectedToken;
  
      await account.receiveToken(amount,tokenIn,{
        //value: amountIn,
        gasPrice: ethers.parseUnits('5', 'gwei'), 
        gasLimit: 200000,
      });
    } else {
      console.error("Recipient address and amount are required.");
    }
  };

  const handleReceiveTokenChange = (token: string) => {
    setReceiveToken(token);
  };

  const updateReceiveToken = async () => {
    if (!account) {
      throw new Error("Account not initialized");
    }
    const newReceiveToken = await account.updateReceiveToken(receiveToken);
    console.log(newReceiveToken);
    setReceiveToken(newReceiveToken);
  };

  const getReceiveToken = async () => {
    if (!account) {
      throw new Error("Account not initialized");
    }

    const receiveToken = await account.getReceiveToken();
    return receiveToken;
  }

  const renderContent = () => {
    switch (displayedContent) {
      case 'sendToken':
        return (
          <div className="col-span-1 row-span-1 w-full">
            <input
              type="text"
              placeholder="Enter public address (0x)"
              value={recipientAddress}
              onChange={handleRecipientChange}
              className="border border-gray-300 px-3 py-2 rounded-md mb-3"
              style={{ width: '300px' }}
            />
            <p className="text-sm mt-3">Asset: Goerli ETH</p>
            <input
              type="text"
              placeholder="Amount"
              value={amount}
              onChange={handleAmountChange}
              className="border border-gray-300 px-3 py-2 rounded-md mb-3 w-full"
            />
            <button
              className="group rounded-lg border border-transparent px-5 py-4  bg-blue-500 w-full transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
              onClick={transfer}
            >
              <h2 className={`mb-3 text-2xl font-semibold`}>
                Send token{" "}
              </h2>
            </button>
          </div>
        );
      case 'history':
        return (
          <div className="col-span-1 row-span-1 w-full">
            <table className="table-auto border-collapse w-full">
              <thead>
                <tr>
                  <th className="border px-4 py-2">Date</th>
                  <th className="border px-4 py-2">Token</th>
                  <th className="border px-4 py-2">Price</th>
                  <th className="border px-4 py-2">Amount</th>
                  <th className="border px-4 py-2">USD</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border px-4 py-2">2024/1/17 01:18:00</td>
                  <td className="border px-4 py-2">GHO</td>
                  <td className="border px-4 py-2">1</td>
                  <td className="border px-4 py-2">1000</td>
                  <td className="border px-4 py-2">1000</td>
                </tr>
                <tr>
                  <td className="border px-4 py-2">2024/1/16 15:50:00</td>
                  <td className="border px-4 py-2">ETH</td>
                  <td className="border px-4 py-2">2600</td>
                  <td className="border px-4 py-2">1</td>
                  <td className="border px-4 py-2">5000</td>
                </tr>
              </tbody>
            </table>
          </div>
        );
      case 'setting':
        return (
          <div className="col-span-1 row-span-1 w-full">
            <p className="text-lg font-semibold mb-2">Choose Receive Token</p>
            <div>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="receiveToken"
                  value="GHO"
                  onChange={() => handleReceiveTokenChange("0xcbE9771eD31e761b744D3cB9eF78A1f32DD99211")}
                  checked={receiveToken === "0xcbE9771eD31e761b744D3cB9eF78A1f32DD99211"}
                  className={`form-radio h-5 w-5 text-blue-500 ${receiveToken === "GHO" ? 'checked-style' : ''}`}
                />
                <span className="ml-2">GHO</span>
              </label>
            </div>
            <div>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="receiveToken"
                  value="ETH"
                  onChange={() => handleReceiveTokenChange("0x7af963cF6D228E564e2A0aA0DdBF06210B38615D")}
                  checked={receiveToken === "0x7af963cF6D228E564e2A0aA0DdBF06210B38615D"}
                  className="form-radio h-5 w-5 text-blue-500"
                />
                <span className="ml-2">ETH</span>
              </label>
            </div>
            <div>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="receiveToken"
                  value="USDC"
                  onChange={() => handleReceiveTokenChange("0x2f3A40A3db8a7e3D09B0adfEfbCe4f6F81927557")}
                  checked={receiveToken === "0x2f3A40A3db8a7e3D09B0adfEfbCe4f6F81927557"}
                  className="form-radio h-5 w-5 text-blue-500"
                />
                <span className="ml-2">USDC</span>
              </label>
            </div>
            <button
              className="bg-blue-500 text-white px-4 py-2 rounded mt-4"
              onClick={updateReceiveToken}
            >
              Decide
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return <p>loading...</p>;
  }
  return (
    <main className={`flex min-h-screen flex-col items-center justify-between p-24`}>
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex">
        <div></div>
        <div className="fixed bottom-0 left-0 flex h-48 w-full items-end justify-center bg-gradient-to-t from-white via-white dark:from-black dark:via-black lg:static lg:h-auto lg:w-auto lg:bg-none">
          {idToken ? (
            <div className="space-y-4">
              <div className="flex justify-end space-x-4">
                <p className="flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
                  Logged in as&nbsp;
                  <code className="font-mono font-bold text-green-300">
                    {superWalletAddress}
                  </code>
                </p>
                <button
                  type="button"
                  onClick={logout}
                  className="rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 self-center"
                >
                  Logout
                </button>
              </div>
              <div className="grid grid-cols-3 grid-rows-2 gap-4">
                <div className="col-span-1 row-span-2 flex flex-col">
                  <button
                    className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
                    onClick={() => setDisplayedContent('sendToken')}
                  >
                    <h2 className={`mb-3 text-2xl font-semibold`}>Send Token </h2>

                  </button>
                  <button
                    className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
                    onClick={() => setDisplayedContent('history')}
                  >
                    <h2 className={`mb-3 text-2xl font-semibold`}>History </h2>
                  </button>
                  <button
                    className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
                    onClick={() => setDisplayedContent('setting')}
                  >
                    <h2 className={`mb-3 text-2xl font-semibold`}>
                      Setting
                    </h2>
                  </button>
                </div>
                <div className=" col-start-2 col-span-2 row-span-2 border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
                  <div className="w-full">
                    <div className="block whitespace-pre-wrap justify-center ">
                      <div>
                        <div className="grid grid-cols-3 grid-rows-3 gap-10">
                          <div className="col-span-1 row-span-1"></div>
                          {renderContent()}
                        </div>
                        <div className="col-span-1 row-span-1"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={login}
              className="rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              Login
            </button>
          )}
        </div>
      </div>
    </main >
  );
}
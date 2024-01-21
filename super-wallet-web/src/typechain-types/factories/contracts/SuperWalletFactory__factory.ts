/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import {
  Contract,
  ContractFactory,
  ContractTransactionResponse,
  Interface,
} from "ethers";
import type {
  Signer,
  AddressLike,
  ContractDeployTransaction,
  ContractRunner,
} from "ethers";
import type { NonPayableOverrides } from "../../common";
import type {
  SuperWalletFactory,
  SuperWalletFactoryInterface,
} from "../../contracts/SuperWalletFactory";

const _abi = [
  {
    inputs: [
      {
        internalType: "contract IEntryPoint",
        name: "_entryPoint",
        type: "address",
      },
      {
        internalType: "contract ISwapRouter",
        name: "_swapRouter",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [],
    name: "accountImplementation",
    outputs: [
      {
        internalType: "contract SuperWallet",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "salt",
        type: "uint256",
      },
    ],
    name: "createAccount",
    outputs: [
      {
        internalType: "contract SuperWallet",
        name: "ret",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "salt",
        type: "uint256",
      },
    ],
    name: "getAddress",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

const _bytecode =
  "0x60a06040523480156200001157600080fd5b5060405162003e1f38038062003e1f83398181016040528101906200003791906200017e565b81816040516200004790620000ad565b6200005492919062000255565b604051809103906000f08015801562000071573d6000803e3d6000fd5b5073ffffffffffffffffffffffffffffffffffffffff1660808173ffffffffffffffffffffffffffffffffffffffff1681525050505062000282565b612e298062000ff683390190565b600080fd5b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b6000620000ed82620000c0565b9050919050565b60006200010182620000e0565b9050919050565b6200011381620000f4565b81146200011f57600080fd5b50565b600081519050620001338162000108565b92915050565b60006200014682620000e0565b9050919050565b620001588162000139565b81146200016457600080fd5b50565b60008151905062000178816200014d565b92915050565b60008060408385031215620001985762000197620000bb565b5b6000620001a88582860162000122565b9250506020620001bb8582860162000167565b9150509250929050565b6000819050919050565b6000620001f0620001ea620001e484620000c0565b620001c5565b620000c0565b9050919050565b60006200020482620001cf565b9050919050565b60006200021882620001f7565b9050919050565b6200022a816200020b565b82525050565b60006200023d82620001f7565b9050919050565b6200024f8162000230565b82525050565b60006040820190506200026c60008301856200021f565b6200027b602083018462000244565b9392505050565b608051610d4b620002ab6000396000818160db0152818161014501526102360152610d4b6000f3fe60806040523480156200001157600080fd5b5060043610620000465760003560e01c806311464fbe146200004b5780635fbfb9cf146200006d5780638cb84e1814620000a3575b600080fd5b62000055620000d9565b604051620000649190620003e1565b60405180910390f35b6200008b600480360381019062000085919062000483565b620000fd565b6040516200009a9190620003e1565b60405180910390f35b620000c16004803603810190620000bb919062000483565b62000204565b604051620000d09190620004db565b60405180910390f35b7f000000000000000000000000000000000000000000000000000000000000000081565b6000806200010c848462000204565b905060008173ffffffffffffffffffffffffffffffffffffffff163b905060008111156200013f578192505050620001fe565b8360001b7f000000000000000000000000000000000000000000000000000000000000000086604051602401620001779190620004db565b60405160208183030381529060405263c4d66de860e01b6020820180517bffffffffffffffffffffffffffffffffffffffffffffffffffffffff8381831617835250505050604051620001ca9062000348565b620001d792919062000592565b8190604051809103906000f5905080158015620001f8573d6000803e3d6000fd5b50925050505b92915050565b6000620002fe8260001b60405180602001620002209062000348565b6020820181038252601f19601f820116604052507f000000000000000000000000000000000000000000000000000000000000000086604051602401620002689190620004db565b60405160208183030381529060405263c4d66de860e01b6020820180517bffffffffffffffffffffffffffffffffffffffffffffffffffffffff8381831617835250505050604051602001620002c092919062000592565b604051602081830303815290604052604051602001620002e292919062000608565b6040516020818303038152906040528051906020012062000306565b905092915050565b6000620003158383306200031d565b905092915050565b6000604051836040820152846020820152828152600b810160ff815360558120925050509392505050565b6106e5806200063183390190565b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b6000819050919050565b6000620003a16200039b620003958462000356565b62000376565b62000356565b9050919050565b6000620003b58262000380565b9050919050565b6000620003c982620003a8565b9050919050565b620003db81620003bc565b82525050565b6000602082019050620003f86000830184620003d0565b92915050565b600080fd5b6000620004108262000356565b9050919050565b620004228162000403565b81146200042e57600080fd5b50565b600081359050620004428162000417565b92915050565b6000819050919050565b6200045d8162000448565b81146200046957600080fd5b50565b6000813590506200047d8162000452565b92915050565b600080604083850312156200049d576200049c620003fe565b5b6000620004ad8582860162000431565b9250506020620004c0858286016200046c565b9150509250929050565b620004d58162000403565b82525050565b6000602082019050620004f26000830184620004ca565b92915050565b600081519050919050565b600082825260208201905092915050565b60005b838110156200053457808201518184015260208101905062000517565b60008484015250505050565b6000601f19601f8301169050919050565b60006200055e82620004f8565b6200056a818562000503565b93506200057c81856020860162000514565b620005878162000540565b840191505092915050565b6000604082019050620005a96000830185620004ca565b8181036020830152620005bd818462000551565b90509392505050565b600081905092915050565b6000620005de82620004f8565b620005ea8185620005c6565b9350620005fc81856020860162000514565b80840191505092915050565b6000620006168285620005d1565b9150620006248284620005d1565b9150819050939250505056fe60806040526040516106e53803806106e583398181016040528101906100259190610512565b610035828261003c60201b60201c565b50506105f6565b61004b826100c160201b60201c565b8173ffffffffffffffffffffffffffffffffffffffff167fbc7cd75a20ee27fd9adebab32041f755214dbc6bffa90cc0225b39da2e5c2d3b60405160405180910390a26000815111156100ae576100a8828261019460201b60201c565b506100bd565b6100bc61021e60201b60201c565b5b5050565b60008173ffffffffffffffffffffffffffffffffffffffff163b0361011d57806040517f4c9c8ce3000000000000000000000000000000000000000000000000000000008152600401610114919061057d565b60405180910390fd5b806101507f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc60001b61025b60201b60201c565b60000160006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555050565b60606000808473ffffffffffffffffffffffffffffffffffffffff16846040516101be91906105df565b600060405180830381855af49150503d80600081146101f9576040519150601f19603f3d011682016040523d82523d6000602084013e6101fe565b606091505b509150915061021485838361026560201b60201c565b9250505092915050565b6000341115610259576040517fb398979f00000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b565b6000819050919050565b6060826102805761027b826102fa60201b60201c565b6102f2565b600082511480156102a8575060008473ffffffffffffffffffffffffffffffffffffffff163b145b156102ea57836040517f9996b3150000000000000000000000000000000000000000000000000000000081526004016102e1919061057d565b60405180910390fd5b8190506102f3565b5b9392505050565b60008151111561030d5780518082602001fd5b6040517f1425ea4200000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b6000604051905090565b600080fd5b600080fd5b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b600061037e82610353565b9050919050565b61038e81610373565b811461039957600080fd5b50565b6000815190506103ab81610385565b92915050565b600080fd5b600080fd5b6000601f19601f8301169050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b610404826103bb565b810181811067ffffffffffffffff82111715610423576104226103cc565b5b80604052505050565b600061043661033f565b905061044282826103fb565b919050565b600067ffffffffffffffff821115610462576104616103cc565b5b61046b826103bb565b9050602081019050919050565b60005b8381101561049657808201518184015260208101905061047b565b60008484015250505050565b60006104b56104b084610447565b61042c565b9050828152602081018484840111156104d1576104d06103b6565b5b6104dc848285610478565b509392505050565b600082601f8301126104f9576104f86103b1565b5b81516105098482602086016104a2565b91505092915050565b6000806040838503121561052957610528610349565b5b60006105378582860161039c565b925050602083015167ffffffffffffffff8111156105585761055761034e565b5b610564858286016104e4565b9150509250929050565b61057781610373565b82525050565b6000602082019050610592600083018461056e565b92915050565b600081519050919050565b600081905092915050565b60006105b982610598565b6105c381856105a3565b93506105d3818560208601610478565b80840191505092915050565b60006105eb82846105ae565b915081905092915050565b60e1806106046000396000f3fe6080604052600a600c565b005b60186014601a565b6027565b565b60006022604c565b905090565b3660008037600080366000845af43d6000803e80600081146047573d6000f35b3d6000fd5b600060787f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc60001b60a1565b60000160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff16905090565b600081905091905056fea264697066735822122067da619a0e2ed8891b265d46572c129780831fefc6c4308f0ac16133d3574b1c64736f6c63430008140033a2646970667358221220b3f82178df2526c664b87dba2ef567a5b34609fe8d7a8380457bc30bb524898164736f6c6343000814003360e06040523073ffffffffffffffffffffffffffffffffffffffff1660809073ffffffffffffffffffffffffffffffffffffffff1681525073e592427a0aece92de3edee1f18e0157c05861564600360006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055503480156200009957600080fd5b5060405162002e2938038062002e298339818101604052810190620000bf919062000389565b8173ffffffffffffffffffffffffffffffffffffffff1660a08173ffffffffffffffffffffffffffffffffffffffff1681525050620001036200019460201b60201c565b8073ffffffffffffffffffffffffffffffffffffffff1660c08173ffffffffffffffffffffffffffffffffffffffff1681525050737af963cf6d228e564e2a0aa0ddbf06210b38615d600260006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff160217905550505062000412565b6000620001a66200029e60201b60201c565b90508060000160089054906101000a900460ff1615620001f2576040517ff92ee8a900000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b67ffffffffffffffff80168160000160009054906101000a900467ffffffffffffffff1667ffffffffffffffff16146200029b5767ffffffffffffffff8160000160006101000a81548167ffffffffffffffff021916908367ffffffffffffffff1602179055507fc7f505b2f371ae2175ee4913f4499e1f2633a7b5936321eed1cdaeb6115181d267ffffffffffffffff604051620002929190620003f5565b60405180910390a15b50565b60007ff0c57e16840df040f15088dc2f81fe391c3923bec73e23a9662efc9c229c6a00905090565b600080fd5b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b6000620002f882620002cb565b9050919050565b60006200030c82620002eb565b9050919050565b6200031e81620002ff565b81146200032a57600080fd5b50565b6000815190506200033e8162000313565b92915050565b60006200035182620002eb565b9050919050565b620003638162000344565b81146200036f57600080fd5b50565b600081519050620003838162000358565b92915050565b60008060408385031215620003a357620003a2620002c6565b5b6000620003b3858286016200032d565b9250506020620003c68582860162000372565b9150509250929050565b600067ffffffffffffffff82169050919050565b620003ef81620003d0565b82525050565b60006020820190506200040c6000830184620003e4565b92915050565b60805160a05160c0516129d26200045760003960006109e701526000818161096401526114150152600081816110dc0152818161113101526112ec01526129d26000f3fe6080604052600436106101185760003560e01c806390fcdb36116100a0578063b0d691fe11610064578063b0d691fe1461034b578063b61d27f614610376578063c31c9c071461039f578063c399ec88146103ca578063c4d66de8146103f55761011f565b806390fcdb3614610276578063a4ae2f12146102a1578063a4e7410b146102ca578063ad3cb1cc146102f5578063affed0e0146103205761011f565b80634d44560d116100e75780634d44560d146101bf5780634f1ef286146101e857806352d1902d146102045780637a43c0861461022f5780638da5cb5b1461024b5761011f565b8063089fe6aa1461012457806318dfb3c71461014f5780633a871cdd146101785780634a58db19146101b55761011f565b3661011f57005b600080fd5b34801561013057600080fd5b5061013961041e565b6040516101469190611ae3565b60405180910390f35b34801561015b57600080fd5b5061017660048036038101906101719190611bcd565b610424565b005b34801561018457600080fd5b5061019f600480360381019061019a9190611cdf565b610536565b6040516101ac9190611d5d565b60405180910390f35b6101bd61057f565b005b3480156101cb57600080fd5b506101e660048036038101906101e19190611dd6565b6105f4565b005b61020260048036038101906101fd9190611f95565b610674565b005b34801561021057600080fd5b50610219610693565b6040516102269190612000565b60405180910390f35b6102496004803603810190610244919061201b565b6106c6565b005b34801561025757600080fd5b5061026061083d565b60405161026d919061206a565b60405180910390f35b34801561028257600080fd5b5061028b610863565b604051610298919061206a565b60405180910390f35b3480156102ad57600080fd5b506102c860048036038101906102c39190612085565b610889565b005b3480156102d657600080fd5b506102df6108cd565b6040516102ec919061206a565b60405180910390f35b34801561030157600080fd5b5061030a6108f7565b6040516103179190612131565b60405180910390f35b34801561032c57600080fd5b50610335610930565b6040516103429190611d5d565b60405180910390f35b34801561035757600080fd5b50610360610960565b60405161036d91906121b2565b60405180910390f35b34801561038257600080fd5b5061039d60048036038101906103989190612223565b610988565b005b3480156103ab57600080fd5b506103b46109e5565b6040516103c191906122b8565b60405180910390f35b3480156103d657600080fd5b506103df610a09565b6040516103ec9190611d5d565b60405180910390f35b34801561040157600080fd5b5061041c60048036038101906104179190612085565b610a91565b005b610bb881565b61042c610c20565b818190508484905014610474576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161046b9061231f565b60405180910390fd5b60005b8484905081101561052f5761051c8585838181106104985761049761233f565b5b90506020020160208101906104ad9190612085565b60008585858181106104c2576104c161233f565b5b90506020028101906104d4919061237d565b8080601f016020809104026020016040519081016040528093929190818152602001838380828437600081840152601f19601f82011690508083019250505050505050610cef565b80806105279061240f565b915050610477565b5050505050565b6000610540610d73565b61054a8484610dea565b9050600084806040019061055e919061237d565b90500361056f5761056e84610ec8565b5b61057882610f76565b9392505050565b610587610960565b73ffffffffffffffffffffffffffffffffffffffff1663b760faf934306040518363ffffffff1660e01b81526004016105c0919061206a565b6000604051808303818588803b1580156105d957600080fd5b505af11580156105ed573d6000803e3d6000fd5b5050505050565b6105fc611012565b610604610960565b73ffffffffffffffffffffffffffffffffffffffff1663205c287883836040518363ffffffff1660e01b815260040161063e929190612466565b600060405180830381600087803b15801561065857600080fd5b505af115801561066c573d6000803e3d6000fd5b505050505050565b61067c6110da565b610685826111c0565b61068f82826111cb565b5050565b600061069d6112ea565b7f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc60001b905090565b60006040518061010001604052808373ffffffffffffffffffffffffffffffffffffffff168152602001600260009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001610bb862ffffff1681526020013073ffffffffffffffffffffffffffffffffffffffff16815260200142815260200184815260200160008152602001600073ffffffffffffffffffffffffffffffffffffffff168152509050600063414bf38960e01b826040516024016107a2919061256d565b604051602081830303815290604052907bffffffffffffffffffffffffffffffffffffffffffffffffffffffff19166020820180517bffffffffffffffffffffffffffffffffffffffffffffffffffffffff83818316178352505050509050610809610c20565b610837600360009054906101000a900473ffffffffffffffffffffffffffffffffffffffff16600083610cef565b50505050565b6001600c9054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b600360009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b80600260006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555050565b6000600260009054906101000a900473ffffffffffffffffffffffffffffffffffffffff16905090565b6040518060400160405280600581526020017f352e302e3000000000000000000000000000000000000000000000000000000081525081565b6000600160009054906101000a90046bffffffffffffffffffffffff166bffffffffffffffffffffffff16905090565b60007f0000000000000000000000000000000000000000000000000000000000000000905090565b610990610c20565b6109df848484848080601f016020809104026020016040519081016040528093929190818152602001838380828437600081840152601f19601f82011690508083019250505050505050610cef565b50505050565b7f000000000000000000000000000000000000000000000000000000000000000081565b6000610a13610960565b73ffffffffffffffffffffffffffffffffffffffff166370a08231306040518263ffffffff1660e01b8152600401610a4b919061206a565b602060405180830381865afa158015610a68573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190610a8c919061259e565b905090565b6000610a9b611371565b905060008160000160089054906101000a900460ff1615905060008260000160009054906101000a900467ffffffffffffffff1690506000808267ffffffffffffffff16148015610ae95750825b9050600060018367ffffffffffffffff16148015610b1e575060003073ffffffffffffffffffffffffffffffffffffffff163b145b905081158015610b2c575080155b15610b63576040517ff92ee8a900000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b60018560000160006101000a81548167ffffffffffffffff021916908367ffffffffffffffff1602179055508315610bb35760018560000160086101000a81548160ff0219169083151502179055505b610bbc86611399565b8315610c185760008560000160086101000a81548160ff0219169083151502179055507fc7f505b2f371ae2175ee4913f4499e1f2633a7b5936321eed1cdaeb6115181d26001604051610c0f919061261a565b60405180910390a15b505050505050565b610c28610960565b73ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff161480610cae57506001600c9054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff16145b610ced576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610ce490612681565b60405180910390fd5b565b6000808473ffffffffffffffffffffffffffffffffffffffff168484604051610d1891906126e8565b60006040518083038185875af1925050503d8060008114610d55576040519150601f19603f3d011682016040523d82523d6000602084013e610d5a565b606091505b509150915081610d6c57805160208201fd5b5050505050565b610d7b610960565b73ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff1614610de8576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610ddf9061274b565b60405180910390fd5b565b600080610df683611479565b9050610e5e84806101400190610e0c919061237d565b8080601f016020809104026020016040519081016040528093929190818152602001838380828437600081840152601f19601f82011690508083019250505050505050826114af90919063ffffffff16565b73ffffffffffffffffffffffffffffffffffffffff166001600c9054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1614610ebc576001915050610ec2565b60009150505b92915050565b80602001356001600081819054906101000a90046bffffffffffffffffffffffff1680929190610ef790612783565b91906101000a8154816bffffffffffffffffffffffff02191690836bffffffffffffffffffffffff1602179055506bffffffffffffffffffffffff1614610f73576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610f6a90612803565b60405180910390fd5b50565b6000811461100f5760003373ffffffffffffffffffffffffffffffffffffffff16827fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff90604051610fc690612849565b600060405180830381858888f193505050503d8060008114611004576040519150601f19603f3d011682016040523d82523d6000602084013e611009565b606091505b50509050505b50565b6001600c9054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff16148061109957503073ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff16145b6110d8576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016110cf906128aa565b60405180910390fd5b565b7f000000000000000000000000000000000000000000000000000000000000000073ffffffffffffffffffffffffffffffffffffffff163073ffffffffffffffffffffffffffffffffffffffff16148061118757507f000000000000000000000000000000000000000000000000000000000000000073ffffffffffffffffffffffffffffffffffffffff1661116e6114db565b73ffffffffffffffffffffffffffffffffffffffff1614155b156111be576040517fe07c8dba00000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b565b6111c8611012565b50565b8173ffffffffffffffffffffffffffffffffffffffff166352d1902d6040518163ffffffff1660e01b8152600401602060405180830381865afa92505050801561123357506040513d601f19601f8201168201806040525081019061123091906128df565b60015b61127457816040517f4c9c8ce300000000000000000000000000000000000000000000000000000000815260040161126b919061206a565b60405180910390fd5b7f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc60001b81146112db57806040517faa1d49a40000000000000000000000000000000000000000000000000000000081526004016112d29190612000565b60405180910390fd5b6112e58383611532565b505050565b7f000000000000000000000000000000000000000000000000000000000000000073ffffffffffffffffffffffffffffffffffffffff163073ffffffffffffffffffffffffffffffffffffffff161461136f576040517fe07c8dba00000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b565b60007ff0c57e16840df040f15088dc2f81fe391c3923bec73e23a9662efc9c229c6a00905090565b806001600c6101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055506001600c9054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff167f000000000000000000000000000000000000000000000000000000000000000073ffffffffffffffffffffffffffffffffffffffff167fe45500f0d6169e983e8e8cafd2e4932915eb49a85ae65fe2353f3fb8c24edf2260405160405180910390a350565b60007f19457468657265756d205369676e6564204d6573736167653a0a33320000000060005281601c52603c6000209050919050565b6000806000806114bf86866115a5565b9250925092506114cf8282611601565b82935050505092915050565b60006115097f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc60001b611765565b60000160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff16905090565b61153b8261176f565b8173ffffffffffffffffffffffffffffffffffffffff167fbc7cd75a20ee27fd9adebab32041f755214dbc6bffa90cc0225b39da2e5c2d3b60405160405180910390a260008151111561159857611592828261183c565b506115a1565b6115a06118c0565b5b5050565b600080600060418451036115ea5760008060006020870151925060408701519150606087015160001a90506115dc888285856118fd565b9550955095505050506115fa565b60006002855160001b9250925092505b9250925092565b600060038111156116155761161461290c565b5b8260038111156116285761162761290c565b5b031561176157600160038111156116425761164161290c565b5b8260038111156116555761165461290c565b5b0361168c576040517ff645eedf00000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b600260038111156116a05761169f61290c565b5b8260038111156116b3576116b261290c565b5b036116f8578060001c6040517ffce698f70000000000000000000000000000000000000000000000000000000081526004016116ef9190611d5d565b60405180910390fd5b60038081111561170b5761170a61290c565b5b82600381111561171e5761171d61290c565b5b0361176057806040517fd78bce0c0000000000000000000000000000000000000000000000000000000081526004016117579190612000565b60405180910390fd5b5b5050565b6000819050919050565b60008173ffffffffffffffffffffffffffffffffffffffff163b036117cb57806040517f4c9c8ce30000000000000000000000000000000000000000000000000000000081526004016117c2919061206a565b60405180910390fd5b806117f87f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc60001b611765565b60000160006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555050565b60606000808473ffffffffffffffffffffffffffffffffffffffff168460405161186691906126e8565b600060405180830381855af49150503d80600081146118a1576040519150601f19603f3d011682016040523d82523d6000602084013e6118a6565b606091505b50915091506118b68583836119f1565b9250505092915050565b60003411156118fb576040517fb398979f00000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b565b60008060007f7fffffffffffffffffffffffffffffff5d576e7357a4501ddfe92f46681b20a08460001c111561193d5760006003859250925092506119e7565b6000600188888888604051600081526020016040526040516119629493929190612957565b6020604051602081039080840390855afa158015611984573d6000803e3d6000fd5b505050602060405103519050600073ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff16036119d857600060016000801b935093509350506119e7565b8060008060001b935093509350505b9450945094915050565b606082611a0657611a0182611a80565b611a78565b60008251148015611a2e575060008473ffffffffffffffffffffffffffffffffffffffff163b145b15611a7057836040517f9996b315000000000000000000000000000000000000000000000000000000008152600401611a67919061206a565b60405180910390fd5b819050611a79565b5b9392505050565b600081511115611a935780518082602001fd5b6040517f1425ea4200000000000000000000000000000000000000000000000000000000815260040160405180910390fd5b600062ffffff82169050919050565b611add81611ac5565b82525050565b6000602082019050611af86000830184611ad4565b92915050565b6000604051905090565b600080fd5b600080fd5b600080fd5b600080fd5b600080fd5b60008083601f840112611b3757611b36611b12565b5b8235905067ffffffffffffffff811115611b5457611b53611b17565b5b602083019150836020820283011115611b7057611b6f611b1c565b5b9250929050565b60008083601f840112611b8d57611b8c611b12565b5b8235905067ffffffffffffffff811115611baa57611ba9611b17565b5b602083019150836020820283011115611bc657611bc5611b1c565b5b9250929050565b60008060008060408587031215611be757611be6611b08565b5b600085013567ffffffffffffffff811115611c0557611c04611b0d565b5b611c1187828801611b21565b9450945050602085013567ffffffffffffffff811115611c3457611c33611b0d565b5b611c4087828801611b77565b925092505092959194509250565b600080fd5b60006101608284031215611c6a57611c69611c4e565b5b81905092915050565b6000819050919050565b611c8681611c73565b8114611c9157600080fd5b50565b600081359050611ca381611c7d565b92915050565b6000819050919050565b611cbc81611ca9565b8114611cc757600080fd5b50565b600081359050611cd981611cb3565b92915050565b600080600060608486031215611cf857611cf7611b08565b5b600084013567ffffffffffffffff811115611d1657611d15611b0d565b5b611d2286828701611c53565b9350506020611d3386828701611c94565b9250506040611d4486828701611cca565b9150509250925092565b611d5781611ca9565b82525050565b6000602082019050611d726000830184611d4e565b92915050565b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b6000611da382611d78565b9050919050565b611db381611d98565b8114611dbe57600080fd5b50565b600081359050611dd081611daa565b92915050565b60008060408385031215611ded57611dec611b08565b5b6000611dfb85828601611dc1565b9250506020611e0c85828601611cca565b9150509250929050565b6000611e2182611d78565b9050919050565b611e3181611e16565b8114611e3c57600080fd5b50565b600081359050611e4e81611e28565b92915050565b600080fd5b6000601f19601f8301169050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b611ea282611e59565b810181811067ffffffffffffffff82111715611ec157611ec0611e6a565b5b80604052505050565b6000611ed4611afe565b9050611ee08282611e99565b919050565b600067ffffffffffffffff821115611f0057611eff611e6a565b5b611f0982611e59565b9050602081019050919050565b82818337600083830152505050565b6000611f38611f3384611ee5565b611eca565b905082815260208101848484011115611f5457611f53611e54565b5b611f5f848285611f16565b509392505050565b600082601f830112611f7c57611f7b611b12565b5b8135611f8c848260208601611f25565b91505092915050565b60008060408385031215611fac57611fab611b08565b5b6000611fba85828601611e3f565b925050602083013567ffffffffffffffff811115611fdb57611fda611b0d565b5b611fe785828601611f67565b9150509250929050565b611ffa81611c73565b82525050565b60006020820190506120156000830184611ff1565b92915050565b6000806040838503121561203257612031611b08565b5b600061204085828601611cca565b925050602061205185828601611e3f565b9150509250929050565b61206481611e16565b82525050565b600060208201905061207f600083018461205b565b92915050565b60006020828403121561209b5761209a611b08565b5b60006120a984828501611e3f565b91505092915050565b600081519050919050565b600082825260208201905092915050565b60005b838110156120ec5780820151818401526020810190506120d1565b60008484015250505050565b6000612103826120b2565b61210d81856120bd565b935061211d8185602086016120ce565b61212681611e59565b840191505092915050565b6000602082019050818103600083015261214b81846120f8565b905092915050565b6000819050919050565b600061217861217361216e84611d78565b612153565b611d78565b9050919050565b600061218a8261215d565b9050919050565b600061219c8261217f565b9050919050565b6121ac81612191565b82525050565b60006020820190506121c760008301846121a3565b92915050565b60008083601f8401126121e3576121e2611b12565b5b8235905067ffffffffffffffff811115612200576121ff611b17565b5b60208301915083600182028301111561221c5761221b611b1c565b5b9250929050565b6000806000806060858703121561223d5761223c611b08565b5b600061224b87828801611e3f565b945050602061225c87828801611cca565b935050604085013567ffffffffffffffff81111561227d5761227c611b0d565b5b612289878288016121cd565b925092505092959194509250565b60006122a28261217f565b9050919050565b6122b281612297565b82525050565b60006020820190506122cd60008301846122a9565b92915050565b7f77726f6e67206172726179206c656e6774687300000000000000000000000000600082015250565b60006123096013836120bd565b9150612314826122d3565b602082019050919050565b60006020820190508181036000830152612338816122fc565b9050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052603260045260246000fd5b600080fd5b600080fd5b600080fd5b6000808335600160200384360303811261239a5761239961236e565b5b80840192508235915067ffffffffffffffff8211156123bc576123bb612373565b5b6020830192506001820236038313156123d8576123d7612378565b5b509250929050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b600061241a82611ca9565b91507fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff820361244c5761244b6123e0565b5b600182019050919050565b61246081611d98565b82525050565b600060408201905061247b6000830185612457565b6124886020830184611d4e565b9392505050565b61249881611e16565b82525050565b6124a781611ac5565b82525050565b6124b681611ca9565b82525050565b6124c581611d78565b82525050565b610100820160008201516124e2600085018261248f565b5060208201516124f5602085018261248f565b506040820151612508604085018261249e565b50606082015161251b606085018261248f565b50608082015161252e60808501826124ad565b5060a082015161254160a08501826124ad565b5060c082015161255460c08501826124ad565b5060e082015161256760e08501826124bc565b50505050565b60006101008201905061258360008301846124cb565b92915050565b60008151905061259881611cb3565b92915050565b6000602082840312156125b4576125b3611b08565b5b60006125c284828501612589565b91505092915050565b6000819050919050565b600067ffffffffffffffff82169050919050565b60006126046125ff6125fa846125cb565b612153565b6125d5565b9050919050565b612614816125e9565b82525050565b600060208201905061262f600083018461260b565b92915050565b7f6163636f756e743a206e6f74204f776e6572206f7220456e747279506f696e74600082015250565b600061266b6020836120bd565b915061267682612635565b602082019050919050565b6000602082019050818103600083015261269a8161265e565b9050919050565b600081519050919050565b600081905092915050565b60006126c2826126a1565b6126cc81856126ac565b93506126dc8185602086016120ce565b80840191505092915050565b60006126f482846126b7565b915081905092915050565b7f6163636f756e743a206e6f742066726f6d20456e747279506f696e7400000000600082015250565b6000612735601c836120bd565b9150612740826126ff565b602082019050919050565b6000602082019050818103600083015261276481612728565b9050919050565b60006bffffffffffffffffffffffff82169050919050565b600061278e8261276b565b91506bffffffffffffffffffffffff82036127ac576127ab6123e0565b5b600182019050919050565b7f6163636f756e743a20696e76616c6964206e6f6e636500000000000000000000600082015250565b60006127ed6016836120bd565b91506127f8826127b7565b602082019050919050565b6000602082019050818103600083015261281c816127e0565b9050919050565b50565b60006128336000836126ac565b915061283e82612823565b600082019050919050565b600061285482612826565b9150819050919050565b7f6f6e6c79206f776e657221000000000000000000000000000000000000000000600082015250565b6000612894600b836120bd565b915061289f8261285e565b602082019050919050565b600060208201905081810360008301526128c381612887565b9050919050565b6000815190506128d981611c7d565b92915050565b6000602082840312156128f5576128f4611b08565b5b6000612903848285016128ca565b91505092915050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602160045260246000fd5b600060ff82169050919050565b6129518161293b565b82525050565b600060808201905061296c6000830187611ff1565b6129796020830186612948565b6129866040830185611ff1565b6129936060830184611ff1565b9594505050505056fea26469706673582212204fd0a648e31ce3888cfc08e6784cd978b9fdaf9e08ba60753c538a1f495912c164736f6c63430008140033";

type SuperWalletFactoryConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: SuperWalletFactoryConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class SuperWalletFactory__factory extends ContractFactory {
  constructor(...args: SuperWalletFactoryConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
  }

  override getDeployTransaction(
    _entryPoint: AddressLike,
    _swapRouter: AddressLike,
    overrides?: NonPayableOverrides & { from?: string }
  ): Promise<ContractDeployTransaction> {
    return super.getDeployTransaction(
      _entryPoint,
      _swapRouter,
      overrides || {}
    );
  }
  override deploy(
    _entryPoint: AddressLike,
    _swapRouter: AddressLike,
    overrides?: NonPayableOverrides & { from?: string }
  ) {
    return super.deploy(_entryPoint, _swapRouter, overrides || {}) as Promise<
      SuperWalletFactory & {
        deploymentTransaction(): ContractTransactionResponse;
      }
    >;
  }
  override connect(runner: ContractRunner | null): SuperWalletFactory__factory {
    return super.connect(runner) as SuperWalletFactory__factory;
  }

  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): SuperWalletFactoryInterface {
    return new Interface(_abi) as SuperWalletFactoryInterface;
  }
  static connect(
    address: string,
    runner?: ContractRunner | null
  ): SuperWalletFactory {
    return new Contract(address, _abi, runner) as unknown as SuperWalletFactory;
  }
}

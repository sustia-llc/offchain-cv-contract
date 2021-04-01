import * as dotenv from 'dotenv';
import { ethers, upgrades } from "hardhat";
import '@openzeppelin/hardhat-upgrades';
import { DNYCV__factory, DNYCV } from "../typechain";
import { ContractTransaction, BigNumber } from "ethers";
// run:
// hh run --network rinkeby scripts/deploy-rinkeby.ts
// verify:
// hh verify --network rinkeby --contract contracts/DNYCV.sol:DNYCV <contract address>
// https://rinkeby.etherscan.io/address/<contract address>
const INFURA_API_KEY = process.env.INFURA_API_KEY || '';
const RINKEBY_PRIVATE_KEY = process.env.RINKEBY_PRIVATE_KEY || '';
const memberAccount1 = process.env.MEMBER_ACCOUNT1 || '';
const memberAccount2 = process.env.MEMBER_ACCOUNT2 || '';

const URL = `https://rinkeby.infura.io/v3/${INFURA_API_KEY}`;
console.log(`url: ${URL}`);

let dnycv: DNYCV;
let dnycvFactory: DNYCV__factory;

const name = 'DYNCV minter';
const symbol = 'DYNCV';
const targetTotal: BigNumber = BigNumber.from(9001);

interface MembersPrototype {
  address: string;
  amount: number;
}

async function main() {
  const provider = new ethers.providers.JsonRpcProvider(URL);
  const deployer = new ethers.Wallet(RINKEBY_PRIVATE_KEY, provider);
  const address = await deployer.getAddress();
  console.log(`deployer address: ${address}`);

  dnycvFactory = (await ethers.getContractFactory(
    'DNYCV',
    deployer
  )) as DNYCV__factory;
  dnycv = (await upgrades.deployProxy(
    dnycvFactory,
    [name, symbol],
    { initializer: 'initialize' }
  )) as DNYCV;

  await dnycv.deployed();
  console.log("deployed to:", dnycv);

  const members: Array<MembersPrototype> = [
    {
      address: memberAccount1,
      amount: 1337,
    },
    {
      address: memberAccount2,
      amount: 42,
    },
  ];

  let mintedAmount = 0;
  const decimals = await dnycv.decimals();
  const tokenBits = BigNumber.from(10).pow(decimals);

  // mint to members
  for (const member of members) {
    let receipt: ContractTransaction = await dnycv.connect(deployer)
      .mint(member.address, BigNumber.from(member.amount).mul(tokenBits), { gasLimit: 3000000 });
    mintedAmount += member.amount;
    console.log(`minted to: ${member.address}, amount ${member.amount}`);
  };

  console.log(`minted to members: ${mintedAmount}`);
  // mint to deployer
  const adminAmount: BigNumber = targetTotal.sub(mintedAmount);
  let receipt: ContractTransaction = await dnycv.connect(deployer)
    .mint(deployer.address, adminAmount.mul(tokenBits), { gasLimit: 3000000 });
    console.log(`minted to: ${deployer.address}, amount ${adminAmount}`);

  let totalSupply = await dnycv.totalSupply();
  console.log(`totalSupply for contract ${dnycv.address} : ${totalSupply}`);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

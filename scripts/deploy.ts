import { ethers, upgrades } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { DNYCV__factory, DNYCV } from "../typechain";
import { ContractTransaction, BigNumber } from "ethers";

let dnycv: DNYCV;
let dnycvFactory: DNYCV__factory;
let deployer: SignerWithAddress,
  member1: SignerWithAddress,
  member2: SignerWithAddress;

const name = 'DYNCV minter';
const symbol = 'DYNCV';
const total: BigNumber = BigNumber.from(9001);

interface MembersPrototype {
  member: SignerWithAddress;
  amount: number;
}

async function main() {
  [deployer, member1, member2] = await ethers.getSigners();
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
      member: member1,
      amount: 1337,
    },
    {
      member: member2,
      amount: 42,
    },
  ];

  let mintedAmount = 0;

  // mint to members
  for (const member of members) {
    let receipt: ContractTransaction = await dnycv.connect(deployer)
      .mint(member.member.address, member.amount);
    mintedAmount += member.amount;
    console.log(`minted to: ${member.member.address}, amount ${member.amount}`);
  };

  console.log(`minted to members: ${mintedAmount}`);
  // mint to self
  const adminAmount: BigNumber = total.sub(mintedAmount);
  let receipt: ContractTransaction = await dnycv.connect(deployer)
    .mint(deployer.address, adminAmount);
    console.log(`minted to: ${deployer.address}, amount ${adminAmount}`);

  let count = await (await dnycv.totalSupply()).toNumber();
  console.log(`totalSupply for contract ${dnycv.address} : ${count}`);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

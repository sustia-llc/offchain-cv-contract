import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { DNYCV__factory, DNYCV } from "../typechain";
import { ContractTransaction, BigNumber } from "ethers";

let dnycv: DNYCV;
let dnycvFactory: DNYCV__factory;
let deployer: SignerWithAddress,
  member1: SignerWithAddress,
  member2: SignerWithAddress;

const targetTotal: BigNumber = BigNumber.from(9001);

interface MembersPrototype {
  address: string;
  amount: number;
}

async function main() {
  [deployer, member1, member2] = await ethers.getSigners();
  dnycvFactory = (await ethers.getContractFactory(
    'DNYCV',
    deployer
  )) as DNYCV__factory;

  dnycv = (await dnycvFactory.deploy()) as DNYCV;
  console.log("deployed to:", dnycv);

  const members: Array<MembersPrototype> = [
    {
      address: member1.address,
      amount: 1337,
    },
    {
      address: member2.address,
      amount: 42,
    },
  ];

  let mintedAmount = 0;

  // mint to members
  for (const member of members) {
    let receipt: ContractTransaction = await dnycv.connect(deployer)
      .mint(member.address, BigNumber.from(member.amount), { gasLimit: 3000000 });
    mintedAmount += member.amount;
    console.log(`minted to: ${member.address}, amount ${member.amount}`);
  };

  console.log(`minted to members: ${mintedAmount}`);
  // mint to deployer
  const adminAmount: BigNumber = targetTotal.sub(mintedAmount);
  let receipt: ContractTransaction = await dnycv.connect(deployer)
    .mint(deployer.address, adminAmount, { gasLimit: 3000000 });
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

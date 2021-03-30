import { ethers, upgrades } from "hardhat";
import chai from "chai";
import { DNYCV__factory, DNYCV } from "../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { BigNumber } from "ethers";

const { expect } = chai;

let dnycv: DNYCV;
let dnycvFactory: DNYCV__factory;
let deployer: SignerWithAddress;
let other: SignerWithAddress;

const name = 'DYNCV minter';
const symbol = 'DYNCV';

const amount: BigNumber = BigNumber.from(5000);

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
const DEFAULT_ADMIN_ROLE = '0x0000000000000000000000000000000000000000000000000000000000000000';
const MINTER_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("MINTER_ROLE"));
const PAUSER_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("PAUSER_ROLE"));

describe("dnycv", () => {

    beforeEach(async () => {
        [deployer, other] = await ethers.getSigners();
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
        expect(dnycv.address).to.properAddress;
    });

    describe("deployment", async () => {
        it('token has correct name', async () => {
            expect(await dnycv.name()).to.equal(name);
        });

        it('token has correct symbol', async () => {
            expect(await dnycv.symbol()).to.equal(symbol);
        });

        it('deployer has the default admin role', async () => {
            expect(await dnycv.getRoleMemberCount(DEFAULT_ADMIN_ROLE)).to.equal(1);
            expect(await dnycv.getRoleMember(DEFAULT_ADMIN_ROLE, 0)).to.equal(deployer.address);
        });

        it('deployer has the minter role', async () => {
            expect(await dnycv.getRoleMemberCount(MINTER_ROLE)).to.equal(1);
            expect(await dnycv.getRoleMember(MINTER_ROLE, 0)).to.equal(deployer.address);
        });

        it('deployer has the pauser role', async () => {
            expect(await dnycv.getRoleMemberCount(PAUSER_ROLE)).to.equal(1);
            expect(await dnycv.getRoleMember(PAUSER_ROLE, 0)).to.equal(deployer.address);
        });

        it('minter and pauser role admin is the default admin', async () => {
            expect(await dnycv.getRoleAdmin(MINTER_ROLE)).to.equal(DEFAULT_ADMIN_ROLE);
            expect(await dnycv.getRoleAdmin(PAUSER_ROLE)).to.equal(DEFAULT_ADMIN_ROLE);
        });
    });

    describe("minting", async () => {
        it('deployer can mint tokens', async () => {
            const tokenId = ethers.BigNumber.from(0);

            await expect(dnycv.connect(deployer).mint(other.address, amount))
                .to.emit(dnycv, 'Transfer')
                .withArgs(ZERO_ADDRESS, other.address, amount);

            expect(await dnycv.balanceOf(other.address)).to.equal(amount);
        });

        it('other accounts cannot mint tokens', async () => {
            await expect(dnycv.connect(other).mint(other.address, amount))
                .to.be.revertedWith('ERC20PresetMinterPauser: must have minter role to mint');
        });
    });

    describe("pausing", async () => {
        it('deployer can pause', async () => {
            await expect(dnycv.connect(deployer).pause())
                .to.emit(dnycv, 'Paused')
                .withArgs(deployer.address);
            expect(await dnycv.paused()).to.equal(true);
        });

        it('deployer can unpause', async () => {
            await dnycv.connect(deployer).pause();
            await expect(dnycv.connect(deployer).unpause())
                .to.emit(dnycv, 'Unpaused')
                .withArgs(deployer.address);
            expect(await dnycv.paused()).to.equal(false);
        });

        it('cannot mint while paused', async () => {
            await dnycv.connect(deployer).pause();
            await expect(dnycv.connect(deployer).mint(other.address, amount))
                .to.be.revertedWith('ERC20Pausable: token transfer while paused');
        });

        it('other accounts cannot pause', async () => {
            await expect(dnycv.connect(other).pause())
                .to.be.revertedWith('ERC20PresetMinterPauser: must have pauser role to pause');
        });

        it('other accounts cannot unpause', async () => {
            await dnycv.connect(deployer).pause();
            await expect(dnycv.connect(other).unpause())
                .to.be.revertedWith('ERC20PresetMinterPauser: must have pauser role to unpause');
        });
    });

    describe("burning", async () => {
        it('holders can burn their tokens', async () => {
            const tokenId = ethers.BigNumber.from(0);

            await dnycv.connect(deployer).mint(other.address, amount);

            await expect(dnycv.connect(other).burn(amount.sub(1)))
                .to.emit(dnycv, 'Transfer')
                .withArgs(other.address, ZERO_ADDRESS, amount.sub(1));
            expect(await dnycv.balanceOf(other.address)).to.equal(1);
            expect(await dnycv.totalSupply()).to.equal(1);
        });
    });
});



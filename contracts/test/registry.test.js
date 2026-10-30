const { expect } = require('chai');
const { ethers } = require('hardhat');

async function expectRevert(promise) {
  let reverted = false;
  try { await promise; } catch { reverted = true; }
  expect(reverted).to.equal(true);
}

describe('Sherara prototype contracts', function () {
  it('binds one official agent to a principal and protects updates', async function () {
    const [alice, merchant] = await ethers.getSigners();
    const registry = await (await ethers.getContractFactory('AgentRegistry')).deploy();
    await registry.waitForDeployment();
    await (await registry.connect(alice).register(alice.address, 'metadata')).wait();
    expect(await registry.officialAgentOf(alice.address)).to.equal(1n);
    await expectRevert(registry.connect(alice).register(alice.address, 'again'));
    await expectRevert(registry.connect(merchant).setWallet(1, merchant.address));
  });

  it('requires counterpart acceptance and limits receipt submitters', async function () {
    const [alice, merchant, stranger] = await ethers.getSigners();
    const deals = await (await ethers.getContractFactory('DealRegistry')).deploy();
    await deals.waitForDeployment();
    const hash = ethers.id('agreement');
    await (await deals.connect(alice).propose(hash, merchant.address)).wait();
    await expectRevert(deals.connect(stranger).accept(hash));
    await (await deals.connect(merchant).accept(hash)).wait();
    expect((await deals.deals(hash)).agreed).to.equal(true);
    await expectRevert(deals.connect(stranger).recordReceipt(hash, ethers.id('receipt')));
    await (await deals.connect(alice).recordReceipt(hash, ethers.id('receipt'))).wait();
    expect(await deals.receiptCount(hash)).to.equal(1n);
  });
});

const hre = require('hardhat');
const { ethers } = hre;

async function main() {
  const [alice, merchant] = await ethers.getSigners();
  const registry = await (await ethers.getContractFactory('AgentRegistry')).deploy();
  const deals = await (await ethers.getContractFactory('DealRegistry')).deploy();
  const token = await (await ethers.getContractFactory('MockToken')).deploy();
  await Promise.all([registry.waitForDeployment(), deals.waitForDeployment(), token.waitForDeployment()]);
  await (await registry.connect(alice).register(alice.address, 'https://example.test/alice-agent.json')).wait();
  await (await registry.connect(merchant).register(merchant.address, 'https://example.test/merchant-agent.json')).wait();
  await (await token.mint(alice.address, 1_000_000_000n)).wait();

  const deployment = {
    chainId: Number((await ethers.provider.getNetwork()).chainId),
    agentRegistry: await registry.getAddress(),
    dealRegistry: await deals.getAddress(),
    token: await token.getAddress(),
    customer: alice.address,
    merchant: merchant.address,
  };
  console.log(JSON.stringify(deployment, null, 2));
}

main().catch(error => { console.error(error); process.exitCode = 1; });

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

  const amount = 100_000_000n;
  const agreement = {
    id: ethers.id('sherara-local-demo-agreement-1'),
    customer: alice.address,
    merchant: merchant.address,
    token: await token.getAddress(),
    recipient: merchant.address,
    amount: amount.toString(),
    chainId: Number((await ethers.provider.getNetwork()).chainId),
    deadline: Math.floor(Date.now() / 1000) + 3600,
  };
  const domain = { name: 'Sherara', version: '0.1', chainId: agreement.chainId };
  const types = { Agreement: [
    { name: 'id', type: 'bytes32' },
    { name: 'customer', type: 'address' },
    { name: 'merchant', type: 'address' },
    { name: 'token', type: 'address' },
    { name: 'recipient', type: 'address' },
    { name: 'amount', type: 'uint256' },
    { name: 'deadline', type: 'uint256' },
  ] };
  const customerSignature = await alice.signTypedData(domain, types, agreement);
  const merchantSignature = await merchant.signTypedData(domain, types, agreement);
  const agreementHash = ethers.TypedDataEncoder.hash(domain, types, agreement);
  await (await deals.connect(alice).propose(agreementHash, merchant.address)).wait();
  await (await deals.connect(merchant).accept(agreementHash)).wait();
  await (await token.mint(alice.address, amount)).wait();
  const payment = await (await token.connect(alice).transfer(merchant.address, amount)).wait();
  const transferLog = payment.logs.find(log => log.address.toLowerCase() === agreement.token.toLowerCase());
  const receiptHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify({ agreementHash, paymentTx: payment.hash, amount: amount.toString() })));
  await (await deals.connect(alice).recordReceipt(agreementHash, receiptHash)).wait();

  process.stdout.write(JSON.stringify({
    chainId: agreement.chainId,
    agentRegistry: await registry.getAddress(), dealRegistry: await deals.getAddress(),
    token: await token.getAddress(), alice: alice.address, merchant: merchant.address,
    agreement, customerSignature, merchantSignature,
    agreementHash, agreedBlock: Number((await deals.deals(agreementHash)).agreedBlock),
    paymentTx: payment.hash, paymentBlock: payment.blockNumber, logIndex: transferLog.index,
    receiptHash, merchantBalance: (await token.balanceOf(merchant.address)).toString(),
  }, null, 2) + '\n');
}

main().catch(error => { console.error(error); process.exitCode = 1; });

require('@nomicfoundation/hardhat-ethers');

const networks = {
  hardhat: { chainId: 31337 },
  localhost: { url: 'http://127.0.0.1:8545', chainId: 31337 },
};
if (process.env.SEPOLIA_RPC_URL && process.env.SEPOLIA_DEPLOYER_KEY) {
  networks.sepolia = {
    url: process.env.SEPOLIA_RPC_URL,
    accounts: [process.env.SEPOLIA_DEPLOYER_KEY],
    chainId: 11155111,
  };
}

module.exports = {
  solidity: { version: '0.8.24', settings: { optimizer: { enabled: true, runs: 200 } } },
  networks,
  paths: { sources: './src', tests: './test' },
};

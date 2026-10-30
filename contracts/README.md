# Prototype contracts

These contracts run on local Hardhat (chain ID 31337) and optionally Sepolia (11155111). `MockToken` has no real value. Do not deploy it as a production asset.

From this directory: `pnpm install`, `pnpm compile`, `pnpm test`, `pnpm demo`.

For a persistent local RPC, start `pnpm node` in one terminal. In another run `pnpm deploy:local` and use its printed addresses with the web app. The first two local Hardhat signers are the sample customer and merchant; no test key belongs in production configuration.

The demo deploys fresh contracts, binds two official agent wallets, signs the web app's EIP-712 Agreement type with both local signers, commits the resulting digest, transfers 100 test tokens, and records a receipt hash. It prints the agreement, both signatures, digest, payment transaction and log index for inspection. Its service and receipt content is illustrative; the on-chain transfer is real on the ephemeral local chain.

The registry does not enforce unique humanity or organization membership; those require the external enrollment layer in the spec. The deal contract commits digests and participation. It does not settle disputes, custody money, or validate service quality. Sepolia configuration is enabled only when `SEPOLIA_RPC_URL` and `SEPOLIA_DEPLOYER_KEY` are provided; there is no mainnet network entry.

# Sherara

Sherara is an exploratory social trust network for verified humans, organizations, and their AI agents. This repository contains a first working slice: a social UI, custom Solidity registries, signed agreements, and local Ethereum payment verification.

Start with [the prototype spec](docs/PROTOTYPE_SPEC.md), then [the story index](docs/user_stories/README.md). Design decisions and unresolved questions are recorded in the spec rather than assumed to be settled.

The frontend adapts the earlier `sites/common-agent-network` mockup. Its social counts and activity are sample data. The deal API and receipt status use the local chain when configured.

## Run the local Ethereum prototype

Requirements: Node.js 20.9+, pnpm 10+, and a browser. The demo uses Hardhat's local chain ID 31337 and a valueless mock token. Do not use Hardhat's public demo keys on another network.

```powershell
pnpm install
pnpm --filter @sherara/contracts compile
pnpm --dir contracts node
```

Keep that terminal running. In a second terminal:

```powershell
pnpm --dir contracts exec hardhat run scripts/demo.js --network localhost
```

The demo prints the deployed Deal Registry address, signed agreement, signatures, payment transaction, and Transfer log index. Set the address it prints in a third terminal, then start the app:

```powershell
$env:ETHEREUM_RPC_URL = 'http://127.0.0.1:8545'
$env:DEAL_REGISTRY_ADDRESS = '<dealRegistry from demo output>'
pnpm dev
```

Open `http://localhost:3000`. The web form accepts the demo's agreement fields, two signatures, and the payment transaction/log index. Alternatively POST `{ "agreement", "customerSignature", "merchantSignature" }` to `/api/agreements`, then `{ "agreementId", "txHash", "logIndex" }` to `/api/receipts/verify`. The server checks the signatures and accepted on-chain commitment before storing the agreement; payment verification checks the exact token Transfer event and accepted block ordering. Receipts persist in an embedded PGlite database under `apps/web/.sherara-data`.

The app now starts at Sign up or Log in. For a quick walkthrough, use the buttons for Maya or Noah (both demo passwords are `demo12345`). Maya has a personal agent and founded Northstar; Noah can create a personal agent and join Northstar with `NORTHSTAR-DEMO`. New local human accounts, organization memberships, agents, and sessions also persist in PGlite. The Accounts page shows these relationships and supports logout. This login is for the local prototype; email and password do not prove unique personhood, and creating a local agent does not register it on Ethereum.

The Network tab shows a principal's receipt graph: direct partners, partners of those partners, and every stored receipt among those accounts. Choose your personal account or an organization you belong to. Add a personal network wallet on the Accounts page (or an agent wallet during agent creation) so agreement participant addresses can be attributed locally. Wallet links are claims until signing is implemented. If no mapped receipts exist, the page opens a clearly labeled illustrative sample; switch to **Show my receipts** to see the actual empty or populated network. Run `pnpm test` to check the two-hop filter.

The contracts can be checked with `pnpm --filter @sherara/contracts test`; the web app with `pnpm --filter @sherara/web typecheck` and `pnpm build`.

Only local chain 31337 and Sepolia chain 11155111 are accepted by the API. The default setup uses local chain. No mainnet configuration, real token, human enrollment, production agent negotiation, escrow, or anonymous proof is implemented in this slice. User stories describe those next branches.

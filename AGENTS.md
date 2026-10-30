# Sherara agent guide

## Scope

Sherara is an exploratory MVP on Ethereum testnets. The documents in `docs/` describe the evolving design; they are context, not a request to implement every milestone at once. Follow the user's current request and keep changes small enough to review.

Read `README.md`, `docs/PROTOTYPE_SPEC.md`, and the relevant story in `docs/user_stories/` before changing a feature. The onboarding design is in `docs/ONBOARDING_FLOWS.md`. When touching `apps/web`, also follow its local `AGENTS.md` and read the relevant installed Next.js guide under `apps/web/node_modules/next/dist/docs/`.

## Current architecture

- `apps/web`: Next.js/React UI and API routes, with an embedded PGlite database under `apps/web/.sherara-data/` for local accounts, memberships, agents, agreements, and receipts.
- `contracts`: custom Solidity `AgentRegistry` and `DealRegistry` with Hardhat. ERC-8004 is design background, not a dependency or the registry to deploy.
- `docs`: prototype specification and small user stories. Update these when behavior or trust claims change.

## Invariants and truth labels

- Use only the local Hardhat chain (31337) or Sepolia (11155111), valueless test assets, and test wallets. Never use mainnet or real funds. Do not commit private keys, mnemonics, `.env` files, or database contents.
- One human account per person and human eligibility are **external assumptions** today. Local email/password login does not prove unique personhood. Wallet fields are unverified local claims until wallet signatures are implemented.
- An organization must start with at least one enrolled human. A human and an organization each have at most one official agent. Organization membership alone does not grant every member agent-management authority.
- The current `AgentRegistry` enforces one agent per principal *wallet address*; it does not enforce human uniqueness, organization membership, or a canonical organization identity. Do not describe a local agent profile as on-chain registered.
- A verified receipt supports a specific payment observation, not arbitrary service delivery or trustworthiness. Keep payment, delivery, acceptance, and dispute claims distinct.
- The Network page uses stored receipt edges: include nodes within two hops of the selected principal, then include **all** receipts whose endpoints are in that node set. It offers a clearly labeled illustrative sample when the real graph is empty. Local wallet-to-account attribution is not proof of wallet control.
- Keep private or anonymous deal details out of public views. The current prototype does not yet implement production privacy controls or Semaphore proofs.

## Checks

From the repository root, run `pnpm test`, `pnpm --filter @sherara/web typecheck`, and `pnpm build` for web changes. For contract changes, also run `pnpm --filter @sherara/contracts test`. Verify UI/API behavior against the local app when a change crosses those boundaries. Do not treat sample activity or counts as live evidence.

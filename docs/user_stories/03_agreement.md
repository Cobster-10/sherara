# 03 — Negotiate and authorize terms

**As two agents considering a deal**, we want to negotiate through our own channel or a smart contract and commit to identical terms before either party performs.

## Behavior

Agents exchange proposals off-platform or through an agent-built negotiation contract. Once they agree, both authorize a versioned agreement digest. The agreement defines the service, asset/payment obligation, recipients, deadlines, acceptance criteria, privacy, evidence requirements, and a resolution policy with timeouts. If a negotiation or escrow contract controls execution, the agreement binds its address, code identity, and relevant rules. A new offer changes the digest and requires new authorization. A testnet commitment establishes that the final agreement existed by a specific block before execution.

## Acceptance

- Both signatures bind the same digest, their roles, chain/domain, nonce, and expiry.
- A changed amount, recipient, deadline, resolution rule, or contract reference invalidates prior authorization.
- The workspace refuses to mark a deal `agreed` if required signatures or resolution terms are missing.
- It shows what was negotiated privately and what was actually committed on-chain.

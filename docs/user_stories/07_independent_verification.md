# 07 — Inspect and recheck evidence

**As an observer or counterpart**, I want to verify a receipt without trusting the platform's status label.

## Behavior

An exported bundle contains the signed agreement or its permitted redacted form, evidence references, typed digests, attestations, verification policy and report, and contract identities. An independent checker recomputes hashes, checks signer authority and anonymous proofs where disclosed, and queries the Ethereum testnet for payment events and canonical block identity. A recheck appends a new report if the chain or evidence state changes.

## Acceptance

- Tampered terms or evidence fail digest/signature validation.
- Wrong chain, token, recipient, amount, reused event, and insufficient confirmations do not yield verified payment.
- RPC outage, private missing evidence, unsupported service claims, and pending finality produce an inconclusive result rather than success.
- A reorganization can downgrade a previous observation without erasing the historical report.
- The checker states which claims were independently checked and which rely on participant or resolver assertions.

# 06 — Make an anonymous deal

**As Alice**, I want to prove that a unique eligible platform member authorized this deal while keeping my public account hidden from the merchant and observers.

## Proposed design

Enrollment inserts a commitment for Alice's private identity into an eligible-members group. For this deal she creates a fresh signing key. A Semaphore-style membership proof binds a message containing the agreement digest, deal ID, customer role, fresh public key, expiry, and chain/domain. The proof's deal-scoped nullifier prevents reuse for the same authorization. The merchant verifies the proof and signs the agreement referencing it. Later receipt acknowledgment or dispute statements are signed by Alice's deal key, proving continuity within this deal. Her public identity does not appear in the shared receipt.

The platform must decide whether it also should be unable to link the proof to Alice; hiding her name from public viewers is a weaker mode. The payment wallet and metadata must be designed for privacy too: a fresh signing key does not conceal an on-chain transfer from Alice's known wallet. Per-deal nullifiers do not create cross-deal reputation or let observers count distinct anonymous customers across deals.

## Acceptance

- A valid group member can authorize a deal without exposing her public account to the merchant-facing receipt.
- Proof verification checks the exact message, eligible group root, scope, nullifier uniqueness, and expiry.
- Replaying the proof for another agreement or attaching another member's proof fails.
- Only the bound deal key may issue later customer acknowledgments and dispute statements.
- Public UI explains the privacy level and does not promise hidden payment provenance.

Reference: [Semaphore proof mechanics](https://docs.semaphore.pse.dev/guides/proofs). This is a proposed adaptation; circuit integration and privacy review remain future implementation work.

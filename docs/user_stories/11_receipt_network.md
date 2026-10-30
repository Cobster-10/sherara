# 11 — Explore a two-hop receipt network

**As a signed-in human**, I want to see the receipt relationships around my personal account or an organization I belong to, so I can inspect who has dealt with whom nearby.

## Behavior

The graph starts at the selected principal. It follows submitted receipt edges in either direction to find direct partners, then follows one more receipt edge to find second-degree accounts. Once that node set is chosen, it includes **every** stored receipt whose two endpoints are in the set, including receipts between two partners, between two second-degree accounts, and repeated receipts for the same pair. It excludes third-degree accounts and their edges. Edge color reflects the current payment-evidence status; it does not claim the service was delivered.

The API maps agreement customer and merchant wallets to local human or organization profiles and their single agent wallet when a unique matching wallet is present. Unmatched or ambiguously linked wallets remain address nodes. A signed-in human can select their own account or an organization of which they are a member. The UI offers a clearly labeled illustrative graph when no linked receipts exist.

## Acceptance

- A receipt does not create a social edge merely because two accounts follow one another; only stored receipt rows form graph edges.
- A third-hop node never appears. A receipt between two included nodes always appears, even when neither is the root.
- Multiple receipts for one pair remain separate selectable edges and details.
- An unauthenticated request is rejected; a human cannot request an organization network without membership.
- Verified, inconclusive, and failed payment observations are visually distinct.
- The UI distinguishes the illustrative sample from stored receipts and explains that local wallet-to-account claims are not signature verified.

## Current limitation

The prototype has no receipt privacy flag, wallet challenge signature, or complete service-delivery claim model. Until those exist, this graph is suitable for local test data and should not be used to expose private deal terms. A receipt status is the payment verifier's observation, not a universal trust score.

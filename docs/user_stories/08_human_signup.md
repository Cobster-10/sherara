# 08 — First human signup

**As a first-time human**, I want to prove I am eligible without publishing my identity, then create one account that I control.

## Behavior

The person presents a valid external human-eligibility proof and domain-specific uniqueness nullifier, signs a wallet challenge, and chooses a profile. The platform creates the account only once for that nullifier. A returning person signs in or uses recovery instead of creating a second account. Creating an official agent is a later optional step.

## Acceptance

- A valid unused nullifier and wallet authorization create exactly one human account.
- Reusing the nullifier cannot create another account, even from a new wallet.
- An invalid, expired, replayed, or wrong-domain proof fails.
- The public profile does not expose the proof or nullifier.
- The current UI creates a local password account and labels external uniqueness verification as assumed; it does not claim a real proof was checked.

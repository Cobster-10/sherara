# 01 — Verified account and official agent

**As a verified human**, I want a single public account and one official agent linked to it, so others can tell which agent represents me. **As an organization**, I want consenting human members/operators and one official organization agent.

## Behavior

The prototype accepts an external uniqueness and human-eligibility result at enrollment. The human creates a profile and authorizes one official agent ID and signing key. An organization links member accounts only with their consent and appoints one official agent. Profiles show principal relationships and historical changes. The agent may advertise endpoints and capabilities, but these remain claims until backed by evidence.

## Acceptance

- Duplicate official agent assignment for the same principal is rejected under the prototype policy.
- An unauthorized wallet cannot change an agent's principal or sign a deal as that agent.
- Key rotation retains the historical key needed to check older signatures and clearly marks current authority.
- The UI distinguishes “verified eligible human,” “official agent link,” and “demonstrated capability.”

## Open question

What external enrollment system supplies the unique-human guarantee, and how are revocation and appeals handled?

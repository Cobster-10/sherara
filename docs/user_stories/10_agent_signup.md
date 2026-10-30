# 10 — First official agent

**As an authorized human or organization principal**, I want to register one official agent and show which principal stands behind it.

## Behavior

The principal chooses an agent wallet, contact endpoint, and claimed capabilities, then signs a registration through Sherara's custom Ethereum testnet Agent Registry. The app waits for a confirmed event before labeling the agent official. A principal with an existing official agent manages that agent rather than creating a second identity.

## Acceptance

- An agent cannot enroll without an existing human or organization principal.
- A principal can have at most one official agent, including an inactive one, under the current policy.
- A human's personal agent and the agent of an organization they belong to occupy different principal slots.
- Only the principal's authorized wallet can register or modify the agent; agent self-claims are insufficient.
- A reverted or pending transaction does not create an official profile.
- The current UI stores a local agent profile and does not report a registry transaction.

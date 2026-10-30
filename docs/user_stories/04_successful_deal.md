# 04 — Complete a deal and publish a receipt

**As Alice's agent and a merchant agent**, we want a successful payment and service exchange to produce a portable, inspectable receipt.

## Scenario

Alice discovers the merchant on Sherara and contacts it externally. They authorize an agreement before execution. Alice sends test ERC-20 tokens to the agreed recipient, and the merchant provides the agreed service. Either party submits payment and service evidence. Sherara checks the specified on-chain payment, while Alice may separately accept the service. The merchant acknowledges its own delivery claim. A verifier signs a report listing exactly what it checked. The platform links the receipt to both agent profiles according to their visibility choices.

## Acceptance

- Chain, token contract, recipient, raw amount, event identity, success, and confirmation threshold match the agreement.
- Service delivery, acceptance, and payment are separate claims; signatures identify the exact claim endorsed.
- A receipt can be issued with objectively checked payment even if one party has not acknowledged it; absence is visible.
- Export and reimport preserve digests and signature checks. Unrelated or duplicate transactions cannot satisfy the obligation.
- The public UI never labels service quality verified solely because money moved.

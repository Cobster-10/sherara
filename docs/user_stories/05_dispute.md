# 05 — Disagree and resolve

**As either party to a deal**, I want the record to show incomplete performance or disagreement and to apply the process we chose before execution.

## Scenarios

The merchant delivers but Alice does not pay; Alice pays but believes the merchant failed to deliver; or the agents' negotiation contract reports an objective outcome that one party disputes. Either party can submit its evidence and statement. Sherara verifies checkable chain facts and preserves contradictory statements. It never requires the alleged nonperforming party to cosign a dispute record.

## Resolution flow

Before execution, both parties choose a named reviewer, panel, or deterministic contract rule; evidence access, deadlines, fees, no-response defaults, and outcomes are in the agreement. A contract can settle objective conditions such as deposit, transfer, release, or timeout. Off-chain quality questions go to the chosen human or other agreed resolver. The resolver's decision is signed and appended with reasons and evidence references. Funds move only if the separately agreed escrow/payment mechanism authorizes it.

## Acceptance

- The receipt can show `payment_verified`, `merchant_claimed_delivery`, `customer_disputed_delivery`, and `resolution_pending` simultaneously.
- The UI differentiates observed contract events, party statements, and resolver decisions.
- Neither the platform nor an agent may substitute a different resolver after the deal is agreed without a new bilateral agreement.
- Missing response, resolver failure, appeal, and expiry follow the pre-agreed rules or remain explicitly unresolved.
- Every revision is appended, with the earlier signed record still inspectable.

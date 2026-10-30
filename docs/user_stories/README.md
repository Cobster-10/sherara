# Prototype user stories

Each story is a small behavior that can be designed, demonstrated, and reviewed independently. The [prototype spec](../PROTOTYPE_SPEC.md) defines shared terms and boundaries.

| ID | Story | Depends on |
| --- | --- | --- |
| 01 | [Verified account and official agent](01_identity.md) | Enrollment assumption |
| 02 | [Discover and assess an agent](02_discovery.md) | 01 |
| 03 | [Negotiate and authorize terms](03_agreement.md) | 01, 02 |
| 04 | [Complete a deal and publish a receipt](04_successful_deal.md) | 03 |
| 05 | [Disagree and resolve](05_dispute.md) | 03, 04 evidence model |
| 06 | [Make an anonymous deal](06_anonymous_deal.md) | 01, 03, 05 |
| 07 | [Inspect and recheck evidence](07_independent_verification.md) | 04 |
| 08 | [First human signup](08_human_signup.md) | External enrollment assumption |
| 09 | [First organization signup](09_organization_signup.md) | 08 |
| 10 | [First official agent](10_agent_signup.md) | 08 or 09 |
| 11 | [Explore a two-hop receipt network](11_receipt_network.md) | 04, 08–10 |

Suggested first demonstration: 01 → 02 → 03 → 04 → 07, then branch into 05 and 06. These are design stories; they do not imply that the implementation already exists.

The [onboarding flows](../ONBOARDING_FLOWS.md) detail the signup order, authority checks, and limits behind stories 08–10.

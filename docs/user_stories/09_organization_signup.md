# 09 — First organization signup

**As an enrolled human founder**, I want to create an organization that starts with my consenting membership and can later include more humans.

## Behavior

The founder authorizes organization creation and a canonical organization wallet. The organization and founder membership are created atomically. Additional enrolled humans may accept invitations. An authorized controller may later create one official organization agent. Individual members may still have their own personal agents.

## Acceptance

- A person without a human account cannot found an organization.
- Creation never leaves an organization with zero human members.
- Removing the last human member is rejected.
- A member without delegated organization authority cannot create or rotate its official agent.
- The current UI stores the organization and founder membership locally and does not claim legal or wallet verification.

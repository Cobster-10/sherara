import { randomBytes, randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { currentHuman, sameOrigin } from '@/lib/local-auth';
import { readyClient } from '@/lib/db';

const handlePattern = /^[a-z0-9_]{3,20}$/;
const walletPattern = /^0x[a-fA-F0-9]{40}$/;
const failure = (error: string, status: number) => NextResponse.json({ error }, { status });

export async function GET() {
  const human = await currentHuman();
  if (!human) return failure('Sign in required', 401);
  const db = await readyClient();
  const [organizations, agents] = await Promise.all([
    db.query(`SELECT o.id, o.name, o.handle, o.wallet, o.founder_id AS "founderId", o.invite_code AS "inviteCode", count(m2.human_id)::int AS "memberCount"
      FROM organizations o JOIN organization_memberships mine ON mine.organization_id = o.id AND mine.human_id = $1
      JOIN organization_memberships m2 ON m2.organization_id = o.id
      GROUP BY o.id ORDER BY o.created_at DESC`, [human.id]),
    db.query(`SELECT a.id, a.name, a.handle, a.wallet, a.capability, a.endpoint, a.owner_id AS "ownerId", a.owner_kind AS "ownerKind"
      FROM agent_accounts a WHERE (a.owner_kind = 'human' AND a.owner_id = $1)
      OR (a.owner_kind = 'organization' AND a.owner_id IN (SELECT organization_id FROM organization_memberships WHERE human_id = $1))`, [human.id]),
  ]);
  return NextResponse.json({ human, organizations: organizations.rows, agents: agents.rows, demoInviteCode: 'NORTHSTAR-DEMO' }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return failure('Invalid request origin', 403);
  const human = await currentHuman();
  if (!human) return failure('Sign in required', 401);
  let body: Record<string, unknown>;
  try { body = await request.json(); }
  catch { return failure('Invalid request', 400); }
  const db = await readyClient();
  if (body.action === 'setHumanWallet') {
    const wallet = String(body.wallet || '').trim();
    if (wallet && !walletPattern.test(wallet)) return failure('Enter a valid Ethereum wallet address', 400);
    await db.query('UPDATE humans SET wallet = $1 WHERE id = $2', [wallet || null, human.id]);
    return NextResponse.json({ wallet: wallet || null });
  }
  if (body.action === 'createOrganization') {
    const name = String(body.name || '').trim();
    const handle = String(body.handle || '').trim().toLowerCase();
    const wallet = String(body.wallet || '').trim();
    if (!name || name.length > 80 || !handlePattern.test(handle) || (wallet && !walletPattern.test(wallet))) return failure('Enter a name, valid handle, and optional Ethereum address', 400);
    const id = randomUUID();
    const code = randomBytes(9).toString('base64url').toUpperCase();
    try {
      await db.query(`WITH created AS (
        INSERT INTO organizations (id, name, handle, wallet, founder_id, invite_code) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id
      ) INSERT INTO organization_memberships (organization_id, human_id) SELECT id, $5 FROM created`, [id, name, handle, wallet || null, human.id, code]);
    } catch { return failure('Organization handle is already in use', 409); }
    return NextResponse.json({ id, inviteCode: code }, { status: 201 });
  }
  if (body.action === 'joinOrganization') {
    const code = String(body.inviteCode || '').trim().toUpperCase();
    if (!code) return failure('Enter an invitation code', 400);
    const joined = await db.query(`INSERT INTO organization_memberships (organization_id, human_id)
      SELECT id, $2 FROM organizations WHERE invite_code = $1
      ON CONFLICT DO NOTHING RETURNING organization_id`, [code, human.id]);
    if (joined.rows.length) return NextResponse.json({ joined: true });
    const existing = await db.query('SELECT id FROM organizations WHERE invite_code = $1', [code]);
    return failure(existing.rows.length ? 'You already belong to this organization' : 'Invitation code not found', existing.rows.length ? 409 : 404);
  }
  if (body.action === 'createAgent') {
    const ownerKind = body.ownerKind === 'organization' ? 'organization' : body.ownerKind === 'human' ? 'human' : null;
    const ownerId = String(body.ownerId || '');
    const name = String(body.name || '').trim();
    const handle = String(body.handle || '').trim().toLowerCase();
    const wallet = String(body.wallet || '').trim();
    const capability = String(body.capability || '').trim();
    const endpoint = String(body.endpoint || '').trim();
    if (!ownerKind || !ownerId || !name || name.length > 80 || !handlePattern.test(handle) || !capability || capability.length > 160 || (wallet && !walletPattern.test(wallet))) return failure('Enter a principal, name, handle, capability, and optional Ethereum address', 400);
    if (endpoint) {
      try { if (!/^https?:$/.test(new URL(endpoint).protocol)) return failure('Contact URL must use http or https', 400); }
      catch { return failure('Enter a valid contact URL', 400); }
    }
    if (ownerKind === 'human' && ownerId !== human.id) return failure('You cannot create another human’s agent', 403);
    if (ownerKind === 'organization') {
      const authorized = await db.query('SELECT id FROM organizations WHERE id = $1 AND founder_id = $2', [ownerId, human.id]);
      if (!authorized.rows.length) return failure('Only the founding human can create this organization’s agent in the demo', 403);
    }
    const id = randomUUID();
    try { await db.query(`INSERT INTO agent_accounts (id, name, handle, wallet, capability, endpoint, owner_id, owner_kind) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`, [id, name, handle, wallet || null, capability, endpoint || null, ownerId, ownerKind]); }
    catch { return failure('This principal already has an agent, or the handle is taken', 409); }
    return NextResponse.json({ id }, { status: 201 });
  }
  return failure('Unknown action', 400);
}

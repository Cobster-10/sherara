import { NextResponse } from 'next/server';
import { agents } from '@/lib/fixtures';
import { readyClient } from '@/lib/db';

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const sample = agents.find(item => item.id === id);
  if (sample) return NextResponse.json({ agent: sample });
  const db = await readyClient();
  const result = await db.query(`SELECT a.id, a.name, a.handle, a.wallet, a.capability,
    CASE WHEN a.owner_kind = 'human' THEN h.name ELSE o.name END AS principal
    FROM agent_accounts a LEFT JOIN humans h ON a.owner_kind = 'human' AND a.owner_id = h.id
    LEFT JOIN organizations o ON a.owner_kind = 'organization' AND a.owner_id = o.id WHERE a.id = $1`, [id]);
  const row = result.rows[0] as { id: string; name: string; handle: string; wallet: string | null; capability: string; principal: string } | undefined;
  const agent = row && { ...row, handle: `@${row.handle}`, description: `Local demo agent of ${row.principal}. Capabilities are self-described.`, followers: 0, local: true };
  return agent ? NextResponse.json({ agent }) : NextResponse.json({ error: 'Agent not found' }, { status: 404 });
}

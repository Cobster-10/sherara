import { NextResponse } from 'next/server';
import { agents } from '@/lib/fixtures';
import { readyClient } from '@/lib/db';

export async function GET() {
  const db = await readyClient();
  const result = await db.query(`SELECT a.id, a.name, a.handle, a.wallet, a.capability,
    CASE WHEN a.owner_kind = 'human' THEN h.name ELSE o.name END AS principal
    FROM agent_accounts a LEFT JOIN humans h ON a.owner_kind = 'human' AND a.owner_id = h.id
    LEFT JOIN organizations o ON a.owner_kind = 'organization' AND a.owner_id = o.id
    WHERE a.id NOT LIKE 'demo-agent-%' ORDER BY a.created_at DESC`);
  const local = result.rows.map(row => {
    const item = row as { id: string; name: string; handle: string; wallet: string | null; capability: string; principal: string };
    return { ...item, handle: `@${item.handle}`, description: `Local demo agent of ${item.principal}. Capabilities are self-described.`, followers: 0, local: true };
  });
  return NextResponse.json({ agents: [...agents, ...local] });
}

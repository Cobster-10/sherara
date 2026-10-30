import { NextResponse } from 'next/server';
import { currentHuman } from '@/lib/local-auth';
import { readyClient } from '@/lib/db';
import { inducedTwoHopNetwork, type NetworkNode, type NetworkReceipt } from '@/lib/receipt-network';

const addressPattern = /^0x[a-fA-F0-9]{40}$/;
const shortAddress = (address: string) => `${address.slice(0, 6)}…${address.slice(-4)}`;

type HumanRow = { id: string; name: string; handle: string; wallet: string | null };
type OrganizationRow = { id: string; name: string; handle: string; wallet: string | null };
type AgentRow = { name: string; wallet: string | null; owner_id: string; owner_kind: 'human' | 'organization' };
type ReceiptRow = { id: string; agreement_id: string; tx_hash: string; chain_id: string; amount: string; status: string; created_at: Date | string; customer: string; merchant: string };

export async function GET(request: Request) {
  const human = await currentHuman();
  if (!human) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  const db = await readyClient();
  const [memberResult, humanResult, organizationResult, agentResult, receiptResult] = await Promise.all([
    db.query(`SELECT o.id, o.name FROM organizations o JOIN organization_memberships m ON m.organization_id = o.id WHERE m.human_id = $1 ORDER BY o.name`, [human.id]),
    db.query('SELECT id, name, handle, wallet FROM humans'),
    db.query('SELECT id, name, handle, wallet FROM organizations'),
    db.query('SELECT name, wallet, owner_id, owner_kind FROM agent_accounts'),
    db.query(`SELECT r.id, r.agreement_id, r.tx_hash, r.status, r.created_at, a.customer, a.merchant, a.chain_id, a.amount
      FROM receipts r JOIN agreements a ON a.id = r.agreement_id ORDER BY r.created_at DESC`),
  ]);
  const memberships = memberResult.rows as { id: string; name: string }[];
  const choices = [{ id: `human:${human.id}`, label: `${human.name} · personal` }, ...memberships.map(org => ({ id: `organization:${org.id}`, label: `${org.name} · organization` }))];
  const requested = new URL(request.url).searchParams.get('principalId');
  const rootId = requested || choices[0].id;
  if (!choices.some(choice => choice.id === rootId)) return NextResponse.json({ error: 'You cannot view that account network' }, { status: 403 });

  const humans = humanResult.rows as HumanRow[];
  const organizations = organizationResult.rows as OrganizationRow[];
  const agents = agentResult.rows as AgentRow[];
  const allNodes = new Map<string, NetworkNode>();
  const byAddress = new Map<string, string | null>();
  const register = (address: string | null, id: string) => {
    if (!address || !addressPattern.test(address)) return;
    const key = address.toLowerCase();
    const existing = byAddress.get(key);
    byAddress.set(key, existing === undefined || existing === id ? id : null);
  };

  for (const item of humans) {
    const id = `human:${item.id}`;
    allNodes.set(id, { id, label: item.name, kind: 'human', handle: `@${item.handle}`, wallet: item.wallet || undefined });
    register(item.wallet, id);
  }
  for (const item of organizations) {
    const id = `organization:${item.id}`;
    allNodes.set(id, { id, label: item.name, kind: 'organization', handle: `@${item.handle}`, wallet: item.wallet || undefined });
    register(item.wallet, id);
  }
  for (const item of agents) {
    const id = `${item.owner_kind}:${item.owner_id}`;
    register(item.wallet, id);
    const node = allNodes.get(id);
    if (node && item.wallet) node.representedBy = item.name;
  }
  const resolveAddress = (address: string) => {
    const key = address.toLowerCase();
    const known = byAddress.get(key);
    if (known) return known;
    const id = `wallet:${key}`;
    if (!allNodes.has(id)) allNodes.set(id, { id, label: shortAddress(address), kind: 'wallet', wallet: address });
    return id;
  };

  const receipts = (receiptResult.rows as ReceiptRow[]).filter(row => addressPattern.test(row.customer) && addressPattern.test(row.merchant)).map(row => ({
    id: row.id,
    source: resolveAddress(row.customer),
    target: resolveAddress(row.merchant),
    agreementId: row.agreement_id,
    txHash: row.tx_hash,
    chainId: Number(row.chain_id),
    amount: row.amount,
    status: ['verified', 'inconclusive', 'failed'].includes(row.status) ? row.status as NetworkReceipt['status'] : 'inconclusive' as const,
    createdAt: new Date(row.created_at).toISOString(),
  }));
  const network = inducedTwoHopNetwork(rootId, [...allNodes.values()], receipts);
  return NextResponse.json({ ...network, choices, accountWallets: allNodes.get(rootId)?.wallet ? true : agents.some(agent => `${agent.owner_kind}:${agent.owner_id}` === rootId && !!agent.wallet), attribution: 'Wallet-to-account links are local claims; receipt verification does not prove who controls those wallets.' }, { headers: { 'Cache-Control': 'no-store' } });
}

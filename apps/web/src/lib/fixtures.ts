export type Agent = {
  id: string; name: string; handle: string; principal: string;
  description: string; capability: string; followers: number;
  wallet: `0x${string}` | null;
};

export const agents: Agent[] = [
  { id: 'orbit', name: 'Orbit Pay', handle: '@orbitpay', principal: 'Northstar Cooperative', description: 'Routes test token payments and returns inspectable delivery evidence.', capability: 'Payment routing', followers: 12400, wallet: null },
  { id: 'ledger', name: 'Ledger Lens', handle: '@ledgerlens', principal: 'Maya Chen', description: 'Reconciles wallet activity into reviewable reports.', capability: 'Reconciliation', followers: 8100, wallet: null },
  { id: 'safety', name: 'Safe Route', handle: '@saferoute', principal: 'Northstar Cooperative', description: 'Explains transaction paths before value moves.', capability: 'Transaction simulation', followers: 5700, wallet: null }
];

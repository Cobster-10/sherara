export type NetworkNode = {
  id: string;
  label: string;
  kind: 'human' | 'organization' | 'wallet';
  handle?: string;
  wallet?: string;
  representedBy?: string;
  degree?: 0 | 1 | 2;
};

export type NetworkReceipt = {
  id: string;
  source: string;
  target: string;
  agreementId: string;
  txHash: string;
  chainId: number;
  amount: string;
  status: 'verified' | 'inconclusive' | 'failed';
  createdAt: string;
  sample?: boolean;
};

export type ReceiptNetwork = { rootId: string; nodes: NetworkNode[]; receipts: NetworkReceipt[] };

/** Keep the radius-two node set, then include every receipt between those nodes. */
export function inducedTwoHopNetwork(rootId: string, nodes: NetworkNode[], receipts: NetworkReceipt[]): ReceiptNetwork {
  const byId = new Map(nodes.map(node => [node.id, node]));
  const adjacency = new Map<string, Set<string>>();
  for (const receipt of receipts) {
    if (!byId.has(receipt.source) || !byId.has(receipt.target)) continue;
    if (!adjacency.has(receipt.source)) adjacency.set(receipt.source, new Set());
    if (!adjacency.has(receipt.target)) adjacency.set(receipt.target, new Set());
    adjacency.get(receipt.source)!.add(receipt.target);
    adjacency.get(receipt.target)!.add(receipt.source);
  }
  const degree = new Map<string, 0 | 1 | 2>([[rootId, 0]]);
  let frontier = [rootId];
  for (const distance of [1, 2] as const) {
    const next: string[] = [];
    for (const id of frontier) for (const neighbor of adjacency.get(id) ?? []) {
      if (degree.has(neighbor)) continue;
      degree.set(neighbor, distance);
      next.push(neighbor);
    }
    frontier = next;
  }
  return {
    rootId,
    nodes: nodes.filter(node => degree.has(node.id)).map(node => ({ ...node, degree: degree.get(node.id)! }))
      .sort((a, b) => (a.degree ?? 0) - (b.degree ?? 0) || a.label.localeCompare(b.label)),
    receipts: receipts.filter(receipt => degree.has(receipt.source) && degree.has(receipt.target)),
  };
}

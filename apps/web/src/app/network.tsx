"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { HumanAccount } from "./auth-screen";
import { inducedTwoHopNetwork, type NetworkNode, type NetworkReceipt, type ReceiptNetwork } from "@/lib/receipt-network";

type NetworkResponse = ReceiptNetwork & { choices: { id: string; label: string }[]; accountWallets: boolean; attribution: string };
type Point = { x: number; y: number };

const sampleNodes: NetworkNode[] = [
  { id: "sample:you", label: "You", kind: "human" },
  { id: "sample:orbit", label: "Orbit Pay", kind: "organization", representedBy: "Orbit Pay" },
  { id: "sample:ledger", label: "Ledger Lens", kind: "human", representedBy: "Ledger Lens" },
  { id: "sample:safe", label: "Safe Route", kind: "organization", representedBy: "Safe Route" },
  { id: "sample:aurora", label: "Aurora Labs", kind: "organization" },
  { id: "sample:cedar", label: "Cedar Finance", kind: "organization" },
  { id: "sample:nimbus", label: "Nimbus Insights", kind: "organization" },
  { id: "sample:quarry", label: "Quarry Metrics", kind: "organization" },
  { id: "sample:lattice", label: "Lattice BI", kind: "organization" },
  { id: "sample:ardent", label: "Ardent Data", kind: "organization" },
  { id: "sample:meridian", label: "Meridian Ops", kind: "organization" },
  { id: "sample:axiom", label: "Axiom Labs", kind: "organization" },
  { id: "sample:bluefin", label: "Bluefin Data", kind: "organization" },
  { id: "sample:helio", label: "Helio Systems", kind: "organization" },
  { id: "sample:vale", label: "Vale Metrics", kind: "organization" },
];
const sampleReceipt = (id: string, source: string, target: string, status: NetworkReceipt["status"] = "verified"): NetworkReceipt => ({
  id, source, target, status, agreementId: "", txHash: "", chainId: 11155111, amount: "1000000", createdAt: "2026-10-30T12:00:00.000Z", sample: true,
});
const sampleGraph = inducedTwoHopNetwork("sample:you", sampleNodes, [
  sampleReceipt("sample-01", "sample:you", "sample:orbit"),
  sampleReceipt("sample-02", "sample:you", "sample:ledger"),
  sampleReceipt("sample-03", "sample:you", "sample:safe"),
  sampleReceipt("sample-04", "sample:you", "sample:orbit"),
  sampleReceipt("sample-11", "sample:you", "sample:aurora"),
  sampleReceipt("sample-12", "sample:you", "sample:cedar"),
  sampleReceipt("sample-05", "sample:orbit", "sample:nimbus"),
  sampleReceipt("sample-06", "sample:orbit", "sample:quarry"),
  sampleReceipt("sample-07", "sample:ledger", "sample:lattice"),
  sampleReceipt("sample-08", "sample:safe", "sample:ardent", "inconclusive"),
  sampleReceipt("sample-09", "sample:nimbus", "sample:quarry"),
  sampleReceipt("sample-10", "sample:quarry", "sample:lattice", "failed"),
  sampleReceipt("sample-13", "sample:orbit", "sample:meridian"),
  sampleReceipt("sample-14", "sample:ledger", "sample:axiom"),
  sampleReceipt("sample-15", "sample:ledger", "sample:bluefin"),
  sampleReceipt("sample-16", "sample:aurora", "sample:helio"),
  sampleReceipt("sample-17", "sample:cedar", "sample:vale"),
  sampleReceipt("sample-18", "sample:nimbus", "sample:meridian"),
  sampleReceipt("sample-19", "sample:aurora", "sample:bluefin"),
  sampleReceipt("sample-20", "sample:axiom", "sample:helio"),
  sampleReceipt("sample-21", "sample:ardent", "sample:vale", "inconclusive"),
  sampleReceipt("sample-22", "sample:cedar", "sample:nimbus"),
]);

function layout(graph: ReceiptNetwork) {
  const positions = new Map<string, Point>([[graph.rootId, { x: 0, y: 0 }]]);
  const direct = graph.nodes.filter(node => node.degree === 1);
  const outer = graph.nodes.filter(node => node.degree === 2);
  direct.forEach((node, index) => {
    const angle = -Math.PI / 2 + (index * Math.PI * 2) / Math.max(1, direct.length);
    positions.set(node.id, { x: Math.cos(angle) * 185, y: Math.sin(angle) * 185 });
  });
  const groups = new Map<string, NetworkNode[]>();
  for (const node of outer) {
    const anchor = direct.find(first => graph.receipts.some(receipt => (receipt.source === first.id && receipt.target === node.id) || (receipt.target === first.id && receipt.source === node.id)));
    const id = anchor?.id || direct[0]?.id || graph.rootId;
    groups.set(id, [...(groups.get(id) || []), node]);
  }
  direct.forEach((anchor, index) => {
    const members = groups.get(anchor.id) || [];
    const center = -Math.PI / 2 + (index * Math.PI * 2) / Math.max(1, direct.length);
    const spread = Math.min(1.5, Math.max(0.6, members.length * 0.2));
    members.forEach((node, memberIndex) => {
      const angle = center + (members.length === 1 ? 0 : ((memberIndex / (members.length - 1)) - 0.5) * spread);
      positions.set(node.id, { x: Math.cos(angle) * 255, y: Math.sin(angle) * 255 });
    });
  });
  return positions;
}

function receiptPaths(graph: ReceiptNetwork, positions: Map<string, Point>) {
  const groups = new Map<string, NetworkReceipt[]>();
  for (const receipt of graph.receipts) {
    const key = [receipt.source, receipt.target].sort().join("|");
    groups.set(key, [...(groups.get(key) || []), receipt]);
  }
  const paths = new Map<string, string>();
  for (const receipts of groups.values()) receipts.forEach((receipt, index) => {
    const a = positions.get(receipt.source); const b = positions.get(receipt.target);
    if (!a || !b) return;
    if (receipt.source === receipt.target) {
      paths.set(receipt.id, `M ${a.x} ${a.y - 10} C ${a.x + 80} ${a.y - 85} ${a.x - 80} ${a.y - 85} ${a.x} ${a.y - 10}`);
      return;
    }
    const dx = b.x - a.x; const dy = b.y - a.y; const length = Math.hypot(dx, dy) || 1;
    const offset = (index - (receipts.length - 1) / 2) * 22;
    const cx = (a.x + b.x) / 2 - (dy / length) * offset;
    const cy = (a.y + b.y) / 2 + (dx / length) * offset;
    paths.set(receipt.id, `M ${a.x} ${a.y} Q ${cx} ${cy} ${b.x} ${b.y}`);
  });
  return paths;
}

const shortHash = (value: string) => value ? `${value.slice(0, 10)}…${value.slice(-6)}` : "Illustrative only";

export default function Network({ human, onOpenAccounts }: { human: HumanAccount; onOpenAccounts: () => void }) {
  const [principalId, setPrincipalId] = useState(`human:${human.id}`);
  const [data, setData] = useState<NetworkResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sample, setSample] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 });
  const svg = useRef<SVGSVGElement>(null);
  const drag = useRef<{ x: number; y: number; pan: Point } | null>(null);

  useEffect(() => {
    let current = true;
    fetch(`/api/network?principalId=${encodeURIComponent(principalId)}`, { cache: "no-store" }).then(async response => {
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not load receipt network");
      if (current) { setData(result); setSample(result.receipts.length === 0); setSelectedNode(null); setSelectedReceipt(null); setZoom(1); setPan({ x: 0, y: 0 }); }
    }).catch(caught => { if (current) setError(caught instanceof Error ? caught.message : "Could not load network"); })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [principalId]);

  const graph = sample ? sampleGraph : data;
  const positions = useMemo(() => graph ? layout(graph) : new Map<string, Point>(), [graph]);
  const paths = useMemo(() => graph ? receiptPaths(graph, positions) : new Map<string, string>(), [graph, positions]);
  const nodeById = useMemo(() => new Map(graph?.nodes.map(node => [node.id, node]) || []), [graph]);
  const chosenNode = selectedNode ? nodeById.get(selectedNode) : null;
  const chosenReceipt = selectedReceipt ? graph?.receipts.find(receipt => receipt.id === selectedReceipt) : null;
  const matches = query.trim() ? graph?.nodes.filter(node => `${node.label} ${node.handle || ""} ${node.wallet || ""}`.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 6) || [] : [];
  const partners = graph?.nodes.filter(node => node.degree === 1).length || 0;
  const visibleReceipts = chosenNode ? graph?.receipts.filter(receipt => receipt.source === chosenNode.id || receipt.target === chosenNode.id) || [] : graph?.receipts || [];

  function selectNode(id: string) { setSelectedNode(id); setSelectedReceipt(null); setQuery(""); }
  function selectReceipt(id: string) { setSelectedReceipt(id); setSelectedNode(null); }
  function focusNode(id: string) {
    selectNode(id);
    const position = positions.get(id);
    if (position) setPan({ x: -position.x * zoom, y: -position.y * zoom });
  }
  function zoomBy(factor: number) { setZoom(value => Math.max(0.55, Math.min(2.6, value * factor))); }

  if (loading) return <div className="network-loading">Loading receipt network…</div>;
  if (error) return <div className="network-loading" role="alert">{error}</div>;
  if (!data || !graph) return null;

  return <section className="network-page">
    <div className="network-intro"><div><span className="step-label">Receipt network</span><h2>See the deals around you.</h2><p>Only accounts within two receipt hops appear. Every receipt between those accounts stays visible, including connections between your partners.</p></div><label>View as<select value={principalId} onChange={event => { setLoading(true); setError(""); setPrincipalId(event.target.value); }}>{data.choices.map(choice => <option key={choice.id} value={choice.id}>{choice.label}</option>)}</select></label></div>
    <div className="network-topline"><span className={`network-source ${sample ? "sample" : ""}`}>{sample ? "Illustrative sample" : "Your stored receipts"}</span><span>{graph.nodes.length} {graph.nodes.length === 1 ? "account" : "accounts"} · {graph.receipts.length} {graph.receipts.length === 1 ? "receipt" : "receipts"} · {partners} direct {partners === 1 ? "partner" : "partners"}</span><button onClick={() => { setSample(value => !value); setSelectedNode(null); setSelectedReceipt(null); setPan({ x: 0, y: 0 }); setZoom(1); }}>{sample ? "Show my receipts" : "View sample"}</button></div>
    <div className="network-grid"><div className="network-stage">
      <svg ref={svg} viewBox="0 0 1000 650" role="img" aria-label={`Receipt network with ${graph.nodes.length} accounts and ${graph.receipts.length} receipts. Select a node or receipt to inspect it.`} onPointerDown={event => { if (event.target !== event.currentTarget && !(event.target as Element).classList.contains("network-backdrop")) return; svg.current?.setPointerCapture(event.pointerId); drag.current = { x: event.clientX, y: event.clientY, pan }; }} onPointerMove={event => { if (!drag.current || !svg.current) return; const rect = svg.current.getBoundingClientRect(); setPan({ x: drag.current.pan.x + (event.clientX - drag.current.x) * 1000 / rect.width, y: drag.current.pan.y + (event.clientY - drag.current.y) * 650 / rect.height }); }} onPointerUp={() => { drag.current = null; }}>
        <rect className="network-backdrop" x="0" y="0" width="1000" height="650" fill="transparent" />
        <g transform={`translate(${500 + pan.x} ${325 + pan.y}) scale(${zoom})`}>
          {graph.receipts.map(receipt => <path key={receipt.id} d={paths.get(receipt.id)} className={`network-edge ${receipt.status} ${selectedReceipt === receipt.id ? "selected" : ""}`} strokeWidth={selectedReceipt === receipt.id ? 4 : 2.4} fill="none" onClick={() => selectReceipt(receipt.id)}><title>{`${nodeById.get(receipt.source)?.label} → ${nodeById.get(receipt.target)?.label}: ${receipt.status} receipt`}</title></path>)}
          {graph.nodes.map(node => { const point = positions.get(node.id); if (!point) return null; const root = node.id === graph.rootId; return <g key={node.id} className={`network-node ${root ? "root" : ""} ${selectedNode === node.id ? "selected" : ""}`} transform={`translate(${point.x} ${point.y})`} onClick={() => selectNode(node.id)} role="button" tabIndex={0} onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); selectNode(node.id); } }} aria-label={`${node.label}, ${node.degree === 0 ? "you" : node.degree === 1 ? "one receipt hop away" : "two receipt hops away"}`}><circle className="node-halo" r={root ? 24 : node.degree === 1 ? 18 : 12} /><circle className="node-core" r={root ? 12 : node.degree === 1 ? 8 : 5} /><text y={root ? 32 : node.degree === 1 ? 27 : 22} textAnchor="middle">{node.label}</text></g>; })}
        </g>
      </svg>
      <div className="network-search"><span>⌕</span><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Find an account" aria-label="Find an account" onKeyDown={event => { if (event.key === "Enter" && matches[0]) focusNode(matches[0].id); }} />{matches.length > 0 && <div className="network-results">{matches.map(node => <button key={node.id} onClick={() => focusNode(node.id)}>{node.label}<small>{node.degree} hop{node.degree === 1 ? "" : "s"}</small></button>)}</div>}</div>
      <div className="network-controls"><button aria-label="Zoom in" onClick={() => zoomBy(1.25)}>+</button><button aria-label="Zoom out" onClick={() => zoomBy(0.8)}>−</button><button aria-label="Reset view" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}>↺</button></div>
      <div className="network-legend"><span><i className="you" />You</span><span><i className="direct" />Direct partner</span><span><i className="second" />Two hops</span><span><i className="verified" />Verified payment</span><span><i className="inconclusive" />Inconclusive</span><span><i className="failed" />Failed</span></div>
    </div><aside className="network-panel">
      {chosenReceipt ? <><span className="network-panel-eyebrow">Receipt detail</span><h3>{nodeById.get(chosenReceipt.source)?.label} → {nodeById.get(chosenReceipt.target)?.label}</h3><span className={`network-status ${chosenReceipt.status}`}>{chosenReceipt.sample ? "Sample · " : ""}{chosenReceipt.status}</span><dl><dt>Amount</dt><dd>{chosenReceipt.amount} token base units</dd><dt>Chain</dt><dd>{chosenReceipt.chainId === 11155111 ? "Sepolia" : chosenReceipt.chainId === 31337 ? "Local Hardhat" : chosenReceipt.chainId}</dd><dt>Agreement</dt><dd>{shortHash(chosenReceipt.agreementId)}</dd><dt>Transaction</dt><dd>{shortHash(chosenReceipt.txHash)}</dd></dl><p>A verified payment receipt checks token transfer evidence. It does not by itself prove service delivery.</p><button className="network-panel-action" onClick={() => setSelectedReceipt(null)}>Back to network</button></>
        : chosenNode ? <><span className="network-panel-eyebrow">{chosenNode.degree === 0 ? "Your account" : chosenNode.degree === 1 ? "Direct partner" : "Two hops away"}</span><h3>{chosenNode.label}</h3>{chosenNode.handle && <p>{chosenNode.handle}</p>}{chosenNode.representedBy && <p>Represented by {chosenNode.representedBy}</p>}{chosenNode.wallet && <code>{shortHash(chosenNode.wallet)}</code>}<h4>{visibleReceipts.length} receipt{visibleReceipts.length === 1 ? "" : "s"} in this view</h4><div className="network-receipt-list">{visibleReceipts.map(receipt => <button key={receipt.id} onClick={() => selectReceipt(receipt.id)}><span>{nodeById.get(receipt.source)?.label} → {nodeById.get(receipt.target)?.label}</span><small className={receipt.status}>{receipt.status}</small></button>)}</div><button className="network-panel-action" onClick={() => setSelectedNode(null)}>Back to network</button></>
        : <><span className="network-panel-eyebrow">{sample ? "Sample network" : "Your network"}</span><h3>{sample ? "Explore a sample" : "Receipt connections"}</h3><div className="network-stats"><div><strong>{graph.nodes.length}</strong><span>accounts</span></div><div><strong>{partners}</strong><span>direct partners</span></div><div><strong>{graph.receipts.length}</strong><span>receipts</span></div></div>{sample ? <p>This diagram uses illustrative receipts. Select a node or line to see how the two-hop view works.</p> : graph.receipts.length ? <p>Select a node or line to inspect the stored receipt evidence. Connections are drawn from submitted receipts, regardless of outcome.</p> : <><p>{data.accountWallets ? "No stored receipts connect to this account yet. Verify a testnet payment involving its linked wallet to populate the graph." : "No wallet is linked to this account yet. Add a personal or agent wallet, then verify a testnet payment receipt."}</p><button className="network-panel-action" onClick={onOpenAccounts}>Open accounts →</button></>}<h4>Receipts in view</h4><div className="network-receipt-list">{graph.receipts.map(receipt => <button key={receipt.id} onClick={() => selectReceipt(receipt.id)}><span>{nodeById.get(receipt.source)?.label} → {nodeById.get(receipt.target)?.label}</span><small className={receipt.status}>{receipt.status}</small></button>)}</div></>}
    </aside></div>
    {!sample && <p className="network-attribution">{data.attribution}</p>}
  </section>;
}

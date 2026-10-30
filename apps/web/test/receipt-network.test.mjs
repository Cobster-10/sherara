import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

const source = fs.readFileSync(new URL('../src/lib/receipt-network.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 } }).outputText;
const { inducedTwoHopNetwork } = await import(`data:text/javascript,${encodeURIComponent(compiled)}`);

test('two-hop network keeps every receipt among included nodes and excludes third-hop nodes', () => {
  const nodes = ['you', 'alice', 'bob', 'carol', 'dave', 'third'].map(id => ({ id, label: id, kind: 'wallet' }));
  const pairs = [
    ['you', 'alice'], ['you', 'bob'], ['alice', 'carol'], ['bob', 'dave'],
    ['carol', 'dave'], ['alice', 'bob'], ['alice', 'carol'], ['carol', 'third'],
  ];
  const receipts = pairs.map(([source, target], index) => ({ id: `r${index}`, source, target }));
  const graph = inducedTwoHopNetwork('you', nodes, receipts);
  assert.deepEqual(graph.nodes.map(node => [node.id, node.degree]), [
    ['you', 0], ['alice', 1], ['bob', 1], ['carol', 2], ['dave', 2],
  ]);
  assert.deepEqual(graph.receipts.map(receipt => receipt.id), ['r0', 'r1', 'r2', 'r3', 'r4', 'r5', 'r6']);
});

import { createPublicClient, getAddress, http, isAddress, type Hex } from 'viem';
import type { AgreementInput } from './agreement';

const abi = [{ type: 'function', name: 'deals', stateMutability: 'view', inputs: [{ name: '', type: 'bytes32' }], outputs: [
  { name: 'proposer', type: 'address' }, { name: 'counterparty', type: 'address' },
  { name: 'proposedBlock', type: 'uint64' }, { name: 'agreedBlock', type: 'uint64' }, { name: 'agreed', type: 'bool' }
] }] as const;

export async function checkCommitment(agreement: AgreementInput, digest: Hex) {
  const rpc = process.env.ETHEREUM_RPC_URL;
  const address = process.env.DEAL_REGISTRY_ADDRESS;
  if (!rpc || !address || !isAddress(address)) throw new Error('Testnet RPC or Deal Registry is not configured');
  const client = createPublicClient({ transport: http(rpc) });
  if (await client.getChainId() !== agreement.chainId) throw new Error('Wrong chain for agreement');
  const [proposer, counterparty, proposedBlock, agreedBlock, agreed] = await client.readContract({ address, abi, functionName: 'deals', args: [digest] });
  if (!agreed || getAddress(proposer) !== getAddress(agreement.customer) || getAddress(counterparty) !== getAddress(agreement.merchant) || proposedBlock === BigInt(0) || agreedBlock < proposedBlock) throw new Error('Agreement is not accepted on the Deal Registry');
  return { proposedBlock: proposedBlock.toString(), agreedBlock: agreedBlock.toString() };
}

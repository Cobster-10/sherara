import { createPublicClient, decodeEventLog, getAddress, http, parseAbiItem, type Address, type Hex } from 'viem';
import type { AgreementInput } from './agreement';

const transferEvent = parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)');

export async function verifyPayment(agreement: AgreementInput, txHash: Hex, logIndex: number, agreedBlock?: bigint) {
  const rpc = process.env.ETHEREUM_RPC_URL;
  if (!rpc) return { status: 'inconclusive', reason: 'ETHEREUM_RPC_URL is not configured' };
  const client = createPublicClient({ transport: http(rpc) });
  const chainId = await client.getChainId();
  if (chainId !== agreement.chainId || ![31337, 11155111].includes(chainId)) return { status: 'failed', reason: 'Unexpected chain' };
  const receipt = await client.getTransactionReceipt({ hash: txHash });
  if (agreedBlock !== undefined && receipt.blockNumber <= agreedBlock) return { status: 'failed', reason: 'Payment did not follow the accepted agreement' };
  if (receipt.status !== 'success') return { status: 'failed', reason: 'Transaction reverted' };
  const log = receipt.logs.find(item => item.logIndex === logIndex && item.transactionHash.toLowerCase() === txHash.toLowerCase());
  if (!log || getAddress(log.address) !== getAddress(agreement.token)) return { status: 'failed', reason: 'Expected token event missing' };
  try {
    const event = decodeEventLog({ abi: [transferEvent], data: log.data, topics: log.topics });
    if (event.eventName !== 'Transfer' || getAddress(event.args.to) !== getAddress(agreement.recipient) || event.args.value < BigInt(agreement.amount)) return { status: 'failed', reason: 'Recipient or amount does not match' };
  } catch { return { status: 'failed', reason: 'Invalid Transfer event' }; }
  const block = await client.getBlock({ blockNumber: receipt.blockNumber });
  if (block.hash !== receipt.blockHash) return { status: 'inconclusive', reason: 'Block identity changed' };
  if (Number(block.timestamp) > agreement.deadline) return { status: 'failed', reason: 'Payment followed the agreement deadline' };
  const confirmations = await client.getTransactionConfirmations({ hash: txHash });
  if (confirmations < 1n) return { status: 'inconclusive', reason: 'Awaiting confirmation' };
  return { status: 'verified', reason: 'Token delivery matched', blockHash: receipt.blockHash, blockNumber: receipt.blockNumber.toString(), confirmations: confirmations.toString(), policy: 'sherara-direct-erc20-v0.1' };
}

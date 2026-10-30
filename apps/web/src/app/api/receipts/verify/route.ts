import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { isHash, type Hex } from 'viem';
import { agreements, ready, receipts } from '@/lib/db';
import { verifyPayment } from '@/lib/verify';
import type { AgreementInput } from '@/lib/agreement';
import { checkCommitment } from '@/lib/commitment';

export const runtime = 'nodejs';
export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (typeof body.agreementId !== 'string' || !isHash(body.txHash) || !Number.isInteger(body.logIndex) || body.logIndex < 0) throw new Error('Invalid evidence reference');
    const db = await ready();
    const [stored] = await db.select().from(agreements).where(eq(agreements.id, body.agreementId));
    if (!stored) return NextResponse.json({ error: 'Agreement not found' }, { status: 404 });
    const agreement: AgreementInput = { id: stored.id as Hex, customer: stored.customer as `0x${string}`, merchant: stored.merchant as `0x${string}`, token: stored.token as `0x${string}`, recipient: stored.recipient as `0x${string}`, amount: stored.amount, chainId: Number(stored.chainId), deadline: Number(stored.deadline) };
    const commitment = await checkCommitment(agreement, stored.digest as Hex);
    const report = await verifyPayment(agreement, body.txHash, body.logIndex, BigInt(commitment.agreedBlock));
    const id = `${stored.id}:${body.txHash}:${body.logIndex}`;
    const [saved] = await db.insert(receipts).values({ id, agreementId: stored.id, txHash: body.txHash, logIndex: String(body.logIndex), status: report.status, report: JSON.stringify(report) }).onConflictDoUpdate({ target: receipts.id, set: { status: report.status, report: JSON.stringify(report) } }).returning();
    return NextResponse.json({ receipt: saved, report });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Verification unavailable' }, { status: 400 }); }
}

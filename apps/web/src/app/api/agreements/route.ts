import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { isAddress, type Hex } from 'viem';
import { agreements, ready } from '@/lib/db';
import { checkAgreement, type AgreementInput } from '@/lib/agreement';
import { checkCommitment } from '@/lib/commitment';

export const runtime = 'nodejs';

export async function GET() {
  const db = await ready();
  return NextResponse.json({ agreements: await db.select().from(agreements) });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const a = body.agreement as AgreementInput;
    if (!a || !/^0x[0-9a-fA-F]{64}$/.test(a.id) || !isAddress(a.customer) || !isAddress(a.merchant) || !isAddress(a.token) || !isAddress(a.recipient) || !/^[1-9]\d*$/.test(a.amount) || !Number.isSafeInteger(a.deadline) || a.deadline <= Date.now() / 1000 || ![31337, 11155111].includes(a.chainId)) throw new Error('Invalid local or Sepolia agreement');
    if (!/^0x[0-9a-fA-F]+$/.test(body.customerSignature) || !/^0x[0-9a-fA-F]+$/.test(body.merchantSignature)) throw new Error('Both signatures are required');
    const checked = await checkAgreement(a, body.customerSignature as Hex, body.merchantSignature as Hex);
    if (!checked.customerValid || !checked.merchantValid) return NextResponse.json({ error: 'Agreement signatures invalid' }, { status: 422 });
    const commitment = await checkCommitment(a, checked.digest);
    const db = await ready();
    const existing = await db.select().from(agreements).where(eq(agreements.id, a.id));
    if (existing.length) return NextResponse.json({ error: 'Agreement ID already used' }, { status: 409 });
    const [saved] = await db.insert(agreements).values({ id: a.id, digest: checked.digest, customer: a.customer, merchant: a.merchant, chainId: String(a.chainId), token: a.token, recipient: a.recipient, amount: a.amount, deadline: String(a.deadline), customerSignature: body.customerSignature, merchantSignature: body.merchantSignature, commitmentTx: body.commitmentTx ?? null }).returning();
    return NextResponse.json({ agreement: saved, signatures: checked, commitment }, { status: 201 });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Invalid request' }, { status: 400 }); }
}

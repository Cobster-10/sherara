import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { agreements, ready } from '@/lib/db';

export const runtime = 'nodejs';
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const db = await ready();
  const { id } = await context.params;
  const [agreement] = await db.select().from(agreements).where(eq(agreements.id, id));
  return agreement ? NextResponse.json({ agreement }) : NextResponse.json({ error: 'Agreement not found' }, { status: 404 });
}

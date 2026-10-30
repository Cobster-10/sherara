import { NextResponse } from 'next/server';
import { agents } from '@/lib/fixtures';

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const agent = agents.find(item => item.id === id);
  return agent ? NextResponse.json({ agent }) : NextResponse.json({ error: 'Agent not found' }, { status: 404 });
}

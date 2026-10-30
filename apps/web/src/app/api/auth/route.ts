import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { checkPassword, currentHuman, passwordHash, sameOrigin, signInResponse, signOutResponse, type HumanAccount } from '@/lib/local-auth';
import { readyClient } from '@/lib/db';

const handlePattern = /^[a-z0-9_]{3,20}$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function GET() {
  return NextResponse.json({ human: await currentHuman() }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 });
  let body: Record<string, unknown>;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'Invalid request' }, { status: 400 }); }
  if (body.action === 'logout') return signOutResponse();
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');
  if (!emailPattern.test(email) || password.length < 8 || password.length > 128) return NextResponse.json({ error: 'Enter a valid email and password of at least 8 characters' }, { status: 400 });
  const db = await readyClient();
  if (body.action === 'login') {
    const found = await db.query('SELECT id, name, email, handle, wallet, password_hash FROM humans WHERE email = $1', [email]);
    const row = found.rows[0] as (HumanAccount & { password_hash: string }) | undefined;
    if (!row || !checkPassword(password, row.password_hash)) return NextResponse.json({ error: 'Email or password is incorrect' }, { status: 401 });
    return signInResponse({ id: row.id, name: row.name, email: row.email, handle: row.handle, wallet: row.wallet });
  }
  if (body.action === 'signup') {
    if (await currentHuman()) return NextResponse.json({ error: 'You are already signed in as a human. Log out before creating a different demo account.' }, { status: 409 });
    const name = String(body.name || '').trim();
    const handle = String(body.handle || '').trim().toLowerCase();
    if (!name || name.length > 80 || !handlePattern.test(handle)) return NextResponse.json({ error: 'Enter a name and a handle of 3–20 letters, numbers, or underscores' }, { status: 400 });
    const account = { id: randomUUID(), name, email, handle, wallet: null };
    try { await db.query('INSERT INTO humans (id, name, email, handle, password_hash) VALUES ($1, $2, $3, $4, $5)', [account.id, name, email, handle, passwordHash(password)]); }
    catch { return NextResponse.json({ error: 'Email or handle is already in use' }, { status: 409 }); }
    return signInResponse(account);
  }
  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}

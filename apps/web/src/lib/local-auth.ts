import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { readyClient } from './db';

export type HumanAccount = { id: string; name: string; email: string; handle: string; wallet: string | null };
const cookieName = 'sherara_session';
const sessionSeconds = 60 * 60 * 24 * 7;

export function passwordHash(password: string) {
  const salt = randomBytes(16).toString('hex');
  return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
}

export function checkPassword(password: string, stored: string) {
  const [salt, hex] = stored.split(':');
  if (!salt || !hex || hex.length !== 128) return false;
  const expected = Buffer.from(hex, 'hex');
  const actual = scryptSync(password, salt, expected.length);
  return timingSafeEqual(expected, actual);
}

function tokenHash(token: string) { return createHash('sha256').update(token).digest('hex'); }

export async function currentHuman(): Promise<HumanAccount | null> {
  const token = (await cookies()).get(cookieName)?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  const db = await readyClient();
  const result = await db.query(`SELECT h.id, h.name, h.email, h.handle, h.wallet FROM humans h JOIN sessions s ON s.human_id = h.id WHERE s.token_hash = $1 AND s.expires_at > now()`, [tokenHash(token)]);
  return (result.rows[0] as HumanAccount | undefined) ?? null;
}

export async function signInResponse(account: HumanAccount) {
  const token = randomBytes(32).toString('hex');
  const db = await readyClient();
  await db.query(`INSERT INTO sessions (token_hash, human_id, expires_at) VALUES ($1, $2, now() + interval '7 days')`, [tokenHash(token), account.id]);
  const response = NextResponse.json({ human: account });
  response.cookies.set(cookieName, token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: sessionSeconds });
  return response;
}

export async function signOutResponse() {
  const token = (await cookies()).get(cookieName)?.value;
  if (token) {
    const db = await readyClient();
    await db.query('DELETE FROM sessions WHERE token_hash = $1', [tokenHash(token)]);
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(cookieName);
  return response;
}

export function sameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  return !origin || origin === new URL(request.url).origin;
}

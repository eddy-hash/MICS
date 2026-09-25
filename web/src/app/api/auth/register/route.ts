import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ACCESS_COOKIE, REFRESH_COOKIE, accessCookieOptions, refreshCookieOptions } from '@/lib/cookies';
const BACKEND = process.env.BACKEND_URL ?? 'http://localhost:8080';
export async function POST(req: NextRequest) {
  const body = await req.json();
  const r = await fetch(`${BACKEND}/api/auth/register`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body), cache: 'no-store',
  });
  if (!r.ok) return NextResponse.json(await r.json().catch(() => ({})), { status: r.status });
  const data = await r.json();
  const store = await cookies();
  store.set(ACCESS_COOKIE, data.access_token, accessCookieOptions);
  store.set(REFRESH_COOKIE, data.refresh_token, refreshCookieOptions);
  return NextResponse.json({ ok: true });
}

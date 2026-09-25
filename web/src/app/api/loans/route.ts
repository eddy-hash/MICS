import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ACCESS_COOKIE } from '@/lib/cookies';
const BACKEND = process.env.BACKEND_URL ?? 'http://localhost:8080';
async function tok() { return (await cookies()).get(ACCESS_COOKIE)?.value ?? null; }
export async function GET(req: NextRequest) {
  const t = await tok();
  if (!t) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const qs = new URL(req.url).searchParams.toString();
  const r = await fetch(`${BACKEND}/api/loans/mine${qs ? '?' + qs : ''}`, {
    headers: { Authorization: `Bearer ${t}` }, cache: 'no-store',
  });
  return NextResponse.json(await r.json().catch(() => ({})), { status: r.status });
}
export async function POST(req: NextRequest) {
  const t = await tok();
  if (!t) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  const r = await fetch(`${BACKEND}/api/loans`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return NextResponse.json(await r.json().catch(() => ({})), { status: r.status });
}

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ACCESS_COOKIE } from '@/lib/cookies';
const BACKEND = process.env.BACKEND_URL ?? 'http://localhost:8080';
export async function GET() {
  const store = await cookies();
  const t = store.get(ACCESS_COOKIE)?.value;
  if (!t) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const r = await fetch(`${BACKEND}/api/me`, { headers: { Authorization: `Bearer ${t}` }, cache: 'no-store' });
  return NextResponse.json(await r.json().catch(() => ({})), { status: r.status });
}
export async function PUT(req: NextRequest) {
  const store = await cookies();
  const t = store.get(ACCESS_COOKIE)?.value;
  if (!t) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  const r = await fetch(`${BACKEND}/api/me`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return NextResponse.json(await r.json().catch(() => ({})), { status: r.status });
}

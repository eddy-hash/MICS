import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ACCESS_COOKIE } from '@/lib/cookies';
const BACKEND = process.env.BACKEND_URL ?? 'http://localhost:8080';
export async function GET(req: NextRequest) {
  const store = await cookies();
  const t = store.get(ACCESS_COOKIE)?.value;
  if (!t) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const qs = new URL(req.url).searchParams.toString();
  const r = await fetch(`${BACKEND}/api/admin/audit${qs ? '?' + qs : ''}`, {
    headers: { Authorization: `Bearer ${t}` }, cache: 'no-store',
  });
  return NextResponse.json(await r.json().catch(() => ({})), { status: r.status });
}

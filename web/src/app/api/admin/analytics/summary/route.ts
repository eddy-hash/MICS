import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ACCESS_COOKIE } from '@/lib/cookies';
const BACKEND = process.env.BACKEND_URL ?? 'http://localhost:8080';
export async function GET() {
  const t = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!t) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const r = await fetch(`${BACKEND}/api/admin/analytics/summary`, {
    headers: { Authorization: `Bearer ${t}` }, cache: 'no-store',
  });
  return NextResponse.json(await r.json().catch(() => ({})), { status: r.status });
}

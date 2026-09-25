import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ACCESS_COOKIE } from '@/lib/cookies';
const BACKEND = process.env.BACKEND_URL ?? 'http://localhost:8080';
export async function GET() {
  const store = await cookies();
  const t = store.get(ACCESS_COOKIE)?.value;
  if (!t) return NextResponse.json({ count: 0 });
  const r = await fetch(`${BACKEND}/api/notifications/unread-count`, {
    headers: { Authorization: `Bearer ${t}` }, cache: 'no-store',
  });
  return NextResponse.json(await r.json().catch(() => ({ count: 0 })), { status: r.status });
}

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ACCESS_COOKIE } from '@/lib/cookies';
const BACKEND = process.env.BACKEND_URL ?? 'http://localhost:8080';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ role: string }> }) {
  const { role } = await params;
  const t = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!t) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const r = await fetch(`${BACKEND}/api/admin/rbac/${role}`, {
    headers: { Authorization: `Bearer ${t}` },
    cache: 'no-store',
  });
  return NextResponse.json(await r.json().catch(() => ({})), { status: r.status });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ role: string }> }) {
  const { role } = await params;
  const t = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!t) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  const r = await fetch(`${BACKEND}/api/admin/rbac/${role}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return NextResponse.json(await r.json().catch(() => ({})), { status: r.status });
}

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ACCESS_COOKIE } from '@/lib/cookies';

const BACKEND = process.env.BACKEND_URL ?? 'http://localhost:8080';

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!t) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const r = await fetch(`${BACKEND}/api/notifications/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${t}` },
  });

  if (r.status === 204) return new NextResponse(null, { status: 204 });
  return NextResponse.json(await r.json().catch(() => ({})), { status: r.status });
}

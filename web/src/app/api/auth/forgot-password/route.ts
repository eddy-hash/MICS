import { NextRequest, NextResponse } from 'next/server';
const BACKEND = process.env.BACKEND_URL ?? 'http://localhost:8080';
export async function POST(req: NextRequest) {
  const body = await req.json();
  await fetch(`${BACKEND}/api/auth/forgot-password`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body), cache: 'no-store',
  }).catch(() => {});
  return NextResponse.json({ ok: true }, { status: 200 });
}

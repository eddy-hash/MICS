import { NextRequest, NextResponse } from 'next/server';
import { ACCESS_COOKIE } from '@/lib/cookies';

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:8080';

/**
 * Generic BFF proxy for loan action endpoints (approve/reject/disburse/repay).
 * Reads the access token from the httpOnly cookie, forwards the PUT request
 * to Spring, and returns Spring's response verbatim.
 */
export async function loanAction(
  request: NextRequest,
  id: string,
  action: 'approve' | 'reject' | 'disburse' | 'repay',
): Promise<Response> {
  const token = request.cookies.get(ACCESS_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));

  const backend = await fetch(`${BACKEND_URL}/api/loans/${id}/${action}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  });

  const responseBody = await backend.json().catch(() => ({}));
  return NextResponse.json(responseBody, { status: backend.status });
}

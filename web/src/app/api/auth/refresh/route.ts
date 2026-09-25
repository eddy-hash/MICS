import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  ACCESS_COOKIE, REFRESH_COOKIE,
  accessCookieOptions, refreshCookieOptions,
} from '@/lib/cookies';

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:8080';

// Serialize refresh attempts — prevents race conditions with rotating tokens
let inFlight: Promise<Response> | null = null;

export async function POST(_request: NextRequest) {
  const store = await cookies();
  const refreshToken = store.get(REFRESH_COOKIE)?.value;

  if (!refreshToken) {
    return NextResponse.json({ error: 'No refresh token' }, { status: 401 });
  }

  try {
    if (!inFlight) {
      inFlight = fetch(`${BACKEND_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
        cache: 'no-store',
      }).finally(() => { inFlight = null; });
    }

    const backend = await inFlight;

    if (!backend.ok) {
      store.delete(ACCESS_COOKIE);
      store.delete(REFRESH_COOKIE);
      return NextResponse.json({ error: 'Refresh failed' }, { status: 401 });
    }

    const data = await backend.json();
    const { access_token, refresh_token: newRefresh } = data as {
      access_token: string;
      refresh_token: string;
    };

    store.set(ACCESS_COOKIE, access_token, accessCookieOptions);
    store.set(REFRESH_COOKIE, newRefresh, refreshCookieOptions);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[refresh] error', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

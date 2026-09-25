import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  ACCESS_COOKIE, REFRESH_COOKIE,
  accessCookieOptions, refreshCookieOptions,
} from '@/lib/cookies';

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:8080';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const backend = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    if (!backend.ok) {
      const detail = await backend.json().catch(() => ({}));
      return NextResponse.json(
        { error: 'Authentication failed', detail },
        { status: backend.status },
      );
    }

    const data = await backend.json();
    const { access_token, refresh_token } = data as {
      access_token: string;
      refresh_token: string;
    };

    const store = await cookies();
    store.set(ACCESS_COOKIE, access_token, accessCookieOptions);
    store.set(REFRESH_COOKIE, refresh_token, refreshCookieOptions);

    // Tokens never reach browser JS — that's the whole point of BFF
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[login] error', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

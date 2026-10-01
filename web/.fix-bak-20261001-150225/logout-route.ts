import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  accessCookieOptions,
  refreshCookieOptions,
} from '@/lib/cookies';

export async function POST() {
  const store = await cookies();

  // Must set with the SAME path/attributes used when creating them,
  // otherwise the browser treats them as different cookies and keeps the originals.
  store.set(ACCESS_COOKIE, '', { ...accessCookieOptions, maxAge: 0 });
  store.set(REFRESH_COOKIE, '', { ...refreshCookieOptions, maxAge: 0 });

  return NextResponse.json({ ok: true });
}

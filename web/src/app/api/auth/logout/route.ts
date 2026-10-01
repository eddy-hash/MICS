import { NextResponse } from 'next/server';
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  accessCookieOptions,
  refreshCookieOptions,
} from '@/lib/cookies';

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ACCESS_COOKIE, '', { ...accessCookieOptions, maxAge: 0 });
  response.cookies.set(REFRESH_COOKIE, '', { ...refreshCookieOptions, maxAge: 0 });
  return response;
}

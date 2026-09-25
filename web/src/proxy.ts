import { NextRequest, NextResponse } from 'next/server';
import { ACCESS_COOKIE } from '@/lib/cookies';

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/loans/:path*',
    '/officer/:path*',
    '/admin/:path*',
    '/profile/:path*',
    '/notifications/:path*',
  ],
};

export default function proxy(request: NextRequest) {
  const accessToken = request.cookies.get(ACCESS_COOKIE)?.value;

  if (!accessToken) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('Authorization', `Bearer ${accessToken}`);

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

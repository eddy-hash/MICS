// __Host- prefix in production only; browsers reject it over http://localhost in dev
const isProd = process.env.NODE_ENV === 'production';

export const ACCESS_COOKIE = isProd ? '__Host-loan-access' : 'loan-access';
export const REFRESH_COOKIE = isProd ? '__Host-loan-refresh' : 'loan-refresh';
export const REFRESH_PATH = '/api/auth/refresh';

export const ACCESS_TTL_SECONDS = 60 * 15;
export const REFRESH_TTL_SECONDS = 60 * 60 * 24 * 7;

export const accessCookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: 'strict' as const,
  path: '/',
  maxAge: ACCESS_TTL_SECONDS,
};

export const refreshCookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: 'strict' as const,
  path: REFRESH_PATH,
  maxAge: REFRESH_TTL_SECONDS,
};

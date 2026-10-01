/**
 * fetch() wrapper that transparently handles expired access tokens.
 *
 *   1. Fire the request with cookies
 *   2. On 401 → POST /api/auth/refresh (uses httpOnly refresh cookie)
 *   3. Retry once with the new access cookie
 *   4. If refresh also fails → redirect to /login
 */
export async function fetchWithRefresh(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  const url = typeof input === 'string' ? input : input.toString();

  // Never wrap refresh/login endpoints
  if (url.includes('/api/auth/refresh') || url.includes('/api/auth/login')) {
    return fetch(input, init);
  }

  const opts: RequestInit = { ...init, credentials: 'include' };

  let res = await fetch(input, opts);
  if (res.status !== 401) return res;

  // Try refreshing
  const refresh = await fetch('/api/auth/refresh', {
    method: 'POST',
    credentials: 'include',
    cache: 'no-store',
  });

  if (!refresh.ok) {
    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
      const from = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `/login?from=${from}&expired=1`;
    }
    return res;
  }

  // Retry with small backoff until the fresh cookie takes effect
  for (let i = 0; i < 5; i++) {
    await new Promise((r) => setTimeout(r, 30));
    const retry = await fetch(input, opts);
    if (retry.status !== 401) return retry;
  }
  return res;
}

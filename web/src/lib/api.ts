'use client';

export class ApiError extends Error {
  constructor(public status: number, message: string, public detail?: unknown) {
    super(message);
    this.name = 'ApiError';
  }
}

let refreshing: Promise<void> | null = null;

async function tryRefresh(): Promise<boolean> {
  if (!refreshing) {
    refreshing = fetch('/api/auth/refresh', { method: 'POST' })
      .then((r) => { if (!r.ok) throw new Error('refresh failed'); })
      .finally(() => { refreshing = null; });
  }
  try {
    await refreshing;
    return true;
  } catch {
    return false;
  }
}

export interface ApiOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  silent?: boolean;
}

export async function api<T = unknown>(url: string, opts: ApiOptions = {}): Promise<T> {
  const { body, silent, ...rest } = opts;

  async function once(): Promise<Response> {
    return fetch(url, {
      ...rest,
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        ...(rest.headers ?? {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  let res = await once();

  // Auto-refresh on 401 (once)
  if (res.status === 401) {
    const ok = await tryRefresh();
    if (ok) res = await once();
  }

  if (!res.ok) {
    let detail: unknown;
    try { detail = await res.json(); } catch { /* ignore */ }
    if (!silent) {
      // eslint-disable-next-line no-console
      console.error(`[api ${res.status}] ${url}`, detail);
    }
    throw new ApiError(res.status, res.statusText, detail);
  }

  if (res.status === 204) return undefined as T;
  const ct = res.headers.get('content-type') ?? '';
  return ct.includes('application/json')
    ? ((await res.json()) as T)
    : ((await res.text()) as unknown as T);
}

api.get = <T>(url: string, opts?: ApiOptions) => api<T>(url, { ...opts, method: 'GET' });
api.post = <T>(url: string, body?: unknown, opts?: ApiOptions) =>
  api<T>(url, { ...opts, method: 'POST', body });
api.put = <T>(url: string, body?: unknown, opts?: ApiOptions) =>
  api<T>(url, { ...opts, method: 'PUT', body });

'use client';
import { useEffect, useState } from 'react';
import type { Role } from '@/lib/types';

export interface CurrentUser {
  email: string;
  uid: string;
  roles: Role[];
  permissions: string[];
}

export function useUser() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/auth/me', { credentials: 'same-origin' })
      .then((r) => r.json())
      .then((d) => { if (!cancelled) setUser(d.user); })
      .catch(() => { if (!cancelled) setUser(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return {
    user,
    loading,
    permissions: user?.permissions ?? [],
    can: (perm: string) => (user?.permissions ?? []).includes(perm),
  };
}

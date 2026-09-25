import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ACCESS_COOKIE } from '@/lib/cookies';
import { AppShell } from '@/components/layout/AppShell';
import type { Role } from '@/lib/types';

interface JwtPayload {
  sub: string;
  uid: string;
  authorities: string[];
}

function decode(token: string): JwtPayload | null {
  try {
    const p = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString('utf-8'));
    return {
      sub: p.sub as string,
      uid: p.uid as string,
      authorities: (p.authorities ?? []) as string[],
    };
  } catch {
    return null;
  }
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const store = await cookies();
  const token = store.get(ACCESS_COOKIE)?.value;
  if (!token) redirect('/login');

  const payload = decode(token);
  if (!payload) redirect('/login');

  const roles: Role[] = payload.authorities
    .filter((a) => a.startsWith('ROLE_'))
    .map((a) => a.replace('ROLE_', '') as Role);

  // Permissions as a plain array — safe to cross the RSC boundary
  const permissions: string[] = payload.authorities.filter((a) => !a.startsWith('ROLE_'));

  return (
    <AppShell
      email={payload.sub}
      roles={roles}
      permissions={permissions}
    >
      {children}
    </AppShell>
  );
}

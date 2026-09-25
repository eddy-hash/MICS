'use client';
import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import type { Role } from '@/lib/types';

interface AppShellProps {
  children: ReactNode;
  email: string;
  roles: Role[];
  permissions: string[];
}

export function AppShell({ children, email, roles, permissions }: AppShellProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      <Sidebar roles={roles} permissions={permissions} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar email={email} roles={roles} permissions={permissions} />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6 md:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

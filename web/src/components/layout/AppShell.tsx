'use client';

import { useState, useCallback, type ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { PageTransition } from './PageTransition';
import { NavigationOverlay } from '@/components/ui/NavigationOverlay';
import type { Role } from '@/lib/types';

interface AppShellProps {
  children: ReactNode;
  email: string;
  roles: Role[];
  permissions: string[];
}

export function AppShell({ children, email, roles, permissions }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const open = useCallback(() => setMobileOpen(true), []);
  const close = useCallback(() => setMobileOpen(false), []);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      <Sidebar
        roles={roles}
        permissions={permissions}
        isMobileOpen={mobileOpen}
        onMobileClose={close}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar
          email={email}
          roles={roles}
          permissions={permissions}
          onMenuClick={open}
        />
        <main className="relative flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-7xl px-3 py-4 sm:px-4 sm:py-6 md:px-6 md:py-8">
            <PageTransition>{children}</PageTransition>
          </div>
          <NavigationOverlay />
        </main>
      </div>
    </div>
  );
}

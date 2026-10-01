'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  PlusIcon, MagnifyingGlassIcon, Bars3Icon,
} from '@heroicons/react/24/outline';
import { NotificationBell } from './NotificationBell';
import { ThemeToggleCompact } from './ThemeToggle';
import { ProfileMenu } from './ProfileMenu';
import { Breadcrumbs, type Crumb } from '@/components/ui/Breadcrumbs';
import { Button } from '@/components/ui/Button';
import { PERMISSIONS } from '@/lib/permissions';
import type { Role } from '@/lib/types';

const LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  loans: 'Loans',
  new: 'New',
  officer: 'Officer',
  queue: 'Queue',
  disburse: 'Disbursements',
  admin: 'Admin',
  users: 'Users',
  rbac: 'Roles & Permissions',
  audit: 'Audit',
  notifications: 'Notifications',
  profile: 'Profile',
  settings: 'Settings',
};

const SECTION_PATHS = new Set(['/officer', '/admin', '/loans']);

function crumbsFor(pathname: string): Crumb[] {
  const parts = pathname.split('/').filter(Boolean);
  const crumbs: Crumb[] = [];
  let acc = '';
  for (const p of parts) {
    acc += '/' + p;
    const label = LABELS[p] ?? p;
    const isLinkable = !SECTION_PATHS.has(acc);
    crumbs.push({ label, href: isLinkable ? acc : undefined });
  }
  if (crumbs.length) crumbs[crumbs.length - 1] = { ...crumbs[crumbs.length - 1], href: undefined };
  return crumbs;
}

interface NavbarProps {
  email: string;
  roles: Role[];
  permissions: string[];
  onMenuClick?: () => void;
}

export function Navbar({ email, roles, permissions, onMenuClick }: NavbarProps) {
  const pathname = usePathname();
  const crumbs = crumbsFor(pathname);
  const canCreate = permissions.includes(PERMISSIONS.LOAN_CREATE);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-slate-200 bg-white/90 px-3 backdrop-blur-md sm:gap-3 sm:px-4 md:px-6 dark:border-slate-800 dark:bg-slate-900/90">
      {/* Hamburger (mobile) */}
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Open navigation"
        className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 md:hidden dark:text-slate-300 dark:hover:bg-slate-800"
      >
        <Bars3Icon className="h-6 w-6" />
      </button>

      {/* Breadcrumbs — flex-1 */}
      <div className="min-w-0 flex-1">
        {crumbs.length > 0 ? (
          <Breadcrumbs items={crumbs} />
        ) : (
          <span className="text-sm text-slate-500 dark:text-slate-400">Home</span>
        )}
      </div>

      {/* Search — desktop only */}
      <div className="hidden lg:flex items-center">
        <button className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-500 transition hover:border-slate-300 hover:text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:text-slate-200">
          <MagnifyingGlassIcon className="h-4 w-4" />
          <span>Search</span>
          <kbd className="ml-2 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[10px] text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* New Loan (desktop, permission-gated) */}
      {canCreate && (
        <Link href="/loans/new" className="hidden sm:block">
          <Button size="sm" leftIcon={<PlusIcon className="h-4 w-4" />}>
            New Loan
          </Button>
        </Link>
      )}

      {/* Compact right cluster */}
      <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
        <ThemeToggleCompact />
        <NotificationBell />
        <ProfileMenu email={email} roles={roles} />
      </div>
    </header>
  );
}

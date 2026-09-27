'use client';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
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

function crumbsFor(pathname: string): Crumb[] {
  const parts = pathname.split('/').filter(Boolean);
  const crumbs: Crumb[] = [];
  let acc = '';
  for (const p of parts) {
    acc += '/' + p;
    const label = LABELS[p] ?? p;
    crumbs.push({ label, href: acc });
  }
  if (crumbs.length) crumbs[crumbs.length - 1] = { ...crumbs[crumbs.length - 1], href: undefined };
  return crumbs;
}

interface NavbarProps {
  email: string;
  roles: Role[];
  permissions: string[];
}

export function Navbar({ email, roles, permissions }: NavbarProps) {
  const pathname = usePathname();
  const crumbs = crumbsFor(pathname);
  const canCreate = permissions.includes(PERMISSIONS.LOAN_CREATE);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/80 px-4 backdrop-blur-md md:px-6">
      <div className="flex-1 min-w-0">
        {crumbs.length > 0 ? <Breadcrumbs items={crumbs} /> : <span className="text-sm text-slate-500">Home</span>}
      </div>

      <div className="hidden lg:flex items-center">
        <button className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-500 transition hover:border-slate-300 hover:text-slate-700">
          <MagnifyingGlassIcon className="h-4 w-4" />
          <span>Search</span>
          <kbd className="ml-2 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[10px] text-slate-500">⌘K</kbd>
        </button>
      </div>

      {canCreate && (
        <Link href="/loans/new" className="hidden sm:block">
          <Button size="sm" leftIcon={<PlusIcon className="h-4 w-4" />}>New Loan</Button>
        </Link>
      )}

      <ThemeToggleCompact />
      <NotificationBell />
      <ProfileMenu email={email} roles={roles} />
    </header>
  );
}

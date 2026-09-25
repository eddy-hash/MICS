'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HomeIcon,
  BanknotesIcon,
  PlusCircleIcon,
  ClipboardDocumentCheckIcon,
  CurrencyDollarIcon,
  ChartBarSquareIcon,
  UsersIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  BellIcon,
  UserCircleIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  CubeIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import type { Role } from '@/lib/types';

interface Item {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  permission: string | null;
}

interface Group {
  heading: string;
  items: Item[];
}

// Full navigation catalog. `permission: null` = always visible when logged in.
const GROUPS: Group[] = [
  {
    heading: 'Main',
    items: [
      { href: '/dashboard', label: 'Overview', icon: HomeIcon, permission: null },
      { href: '/loans', label: 'My Loans', icon: BanknotesIcon, permission: 'loan:view:own' },
      { href: '/loans/new', label: 'Apply for Loan', icon: PlusCircleIcon, permission: 'loan:create' },
      { href: '/notifications', label: 'Notifications', icon: BellIcon, permission: null },
    ],
  },
  {
    heading: 'Operations',
    items: [
      { href: '/officer/queue', label: 'Review Queue', icon: ClipboardDocumentCheckIcon, permission: 'loan:review' },
      { href: '/officer/disburse', label: 'Disbursements', icon: CurrencyDollarIcon, permission: 'loan:disburse' },
    ],
  },
  {
    heading: 'Administration',
    items: [
      { href: '/admin', label: 'Analytics', icon: ChartBarSquareIcon, permission: 'analytics:view' },
      { href: '/admin/users', label: 'Users', icon: UsersIcon, permission: 'user:view:all' },
      { href: '/admin/rbac', label: 'Roles & Permissions', icon: ShieldCheckIcon, permission: 'role:permission:manage' },
      { href: '/admin/audit', label: 'Audit Log', icon: DocumentTextIcon, permission: 'audit:view' },
    ],
  },
  {
    heading: 'Account',
    items: [
      { href: '/profile', label: 'Profile', icon: UserCircleIcon, permission: null },
    ],
  },
];

interface SidebarProps {
  roles: Role[];
  permissions: string[];
}

export function Sidebar({ roles: _roles, permissions }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved === '1') setCollapsed(true);
  }, []);

  function toggle() {
    setCollapsed((c) => {
      const next = !c;
      localStorage.setItem('sidebar-collapsed', next ? '1' : '0');
      return next;
    });
  }

  // Strict filter: item is visible if it has no permission OR the user has it.
  const visible = (item: Item) => item.permission === null || permissions.includes(item.permission);

  const visibleGroups = GROUPS.map((g) => ({
    ...g,
    items: g.items.filter(visible),
  })).filter((g) => g.items.length > 0);

  return (
    <motion.aside
      animate={{ width: collapsed ? 76 : 260 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className="relative hidden h-screen shrink-0 flex-col border-r border-slate-200 bg-white md:flex dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="flex h-16 shrink-0 items-center gap-2.5 border-b border-slate-100 px-5 dark:border-slate-800">
        <Image
          src="/auth/logo.jpg"
          alt="NaedCredit"
          width={36}
          height={36}
          className="h-9 w-9 shrink-0 rounded-xl object-contain"
          priority
        />
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -4 }}
              className="text-base font-semibold tracking-tight text-slate-900 dark:text-white"
            >
              <span className="font-bold text-slate-900">Naed</span><span className="text-brand-600">Credit</span>
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 scrollbar-thin">
        {visibleGroups.map((group) => (
          <div key={group.heading} className="mb-5">
            {!collapsed && (
              <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                {group.heading}
              </p>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active =
                  pathname === item.href ||
                  (item.href !== '/dashboard' && pathname.startsWith(item.href + '/'));
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition',
                        active
                          ? 'bg-brand-50 font-medium text-brand-700 dark:bg-brand-500/10 dark:text-brand-300'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white',
                      )}
                    >
                      {active && (
                        <motion.span
                          layoutId="sidebar-active"
                          className="absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-r bg-brand-600"
                        />
                      )}
                      <Icon className={cn('h-5 w-5 shrink-0', active ? 'text-brand-600 dark:text-brand-300' : 'text-slate-400 dark:text-slate-500')} />
                      <AnimatePresence>
                        {!collapsed && (
                          <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="truncate"
                          >
                            {item.label}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <button
        onClick={toggle}
        className="flex h-11 shrink-0 items-center justify-center border-t border-slate-100 text-slate-400 transition hover:bg-slate-50 hover:text-slate-700 dark:border-slate-800 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? (
          <ChevronDoubleRightIcon className="h-4 w-4" />
        ) : (
          <ChevronDoubleLeftIcon className="h-4 w-4" />
        )}
      </button>
    </motion.aside>
  );
}

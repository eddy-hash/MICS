'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
  HomeIcon, BanknotesIcon, PlusCircleIcon, ClipboardDocumentCheckIcon,
  CurrencyDollarIcon, ChartBarSquareIcon, UsersIcon, ShieldCheckIcon,
  DocumentTextIcon, BellIcon, UserCircleIcon, ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon, XMarkIcon,
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
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ permissions, isMobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved === '1') setCollapsed(true);
  }, []);

  // Keep a stable ref so effects don't re-run when parent re-renders
  const onMobileCloseRef = useRef(onMobileClose);
  useEffect(() => { onMobileCloseRef.current = onMobileClose; }, [onMobileClose]);

  // Close on route change
  useEffect(() => {
    onMobileCloseRef.current?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Close on Esc
  useEffect(() => {
    if (!isMobileOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onMobileCloseRef.current?.(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isMobileOpen]);

  function toggle() {
    setCollapsed((c) => {
      const next = !c;
      localStorage.setItem('sidebar-collapsed', next ? '1' : '0');
      return next;
    });
  }

  const visible = (item: Item) => item.permission === null || permissions.includes(item.permission);
  const visibleGroups = GROUPS
    .map((g) => ({ ...g, items: g.items.filter(visible) }))
    .filter((g) => g.items.length > 0);

  return (
    <>
      {/* Mobile backdrop */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onMobileClose}
            className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm md:hidden"
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      <aside
        className={cn(
          // Base — mobile: fixed drawer; desktop: inline column
          'fixed inset-y-0 left-0 z-50 flex h-screen shrink-0 flex-col',
          'border-r border-slate-200 bg-white',
          'dark:border-slate-800 dark:bg-slate-900',
          'transition-[width,transform] duration-200 ease-out',
          // Desktop: static, always visible
          'md:relative md:z-auto md:translate-x-0',
          // Mobile slide
          isMobileOpen ? 'translate-x-0' : '-translate-x-full',
          // Desktop width (collapsed ↔ expanded)
          collapsed ? 'md:w-[76px]' : 'md:w-[260px]',
          // Mobile always full width
          'w-[260px]',
        )}
        aria-label="Main navigation"
      >
        {/* Header — logo + close on mobile */}
        <div
          className={cn(
            'flex h-16 shrink-0 items-center gap-2.5 border-b border-slate-100 px-4 dark:border-slate-800',
            collapsed ? 'md:justify-center md:px-2' : 'md:px-5',
          )}
        >
          <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-xl">
            <Image
              src="/auth/logo.jpg"
              alt="NaedCredit"
              width={36}
              height={36}
              className="h-9 w-9 object-contain"
              priority
            />
          </div>
          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -4 }}
                className="hidden text-base font-semibold tracking-tight md:inline-flex"
              >
                <span className="font-bold text-slate-900 dark:text-white">Naed</span>
                <span className="text-brand-600 dark:text-brand-400">Credit</span>
              </motion.span>
            )}
          </AnimatePresence>

          {/* Mobile-only brand + close */}
          <span className="flex text-base font-semibold tracking-tight md:hidden">
            <span className="font-bold text-slate-900 dark:text-white">Naed</span>
            <span className="text-brand-600 dark:text-brand-400">Credit</span>
          </span>
          <button
            onClick={onMobileClose}
            aria-label="Close navigation"
            className="ml-auto rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 md:hidden"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {visibleGroups.map((group) => (
            <div key={group.heading} className="mb-5">
              {!collapsed && (
                <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-500">
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
                            ? 'bg-slate-100 font-semibold text-slate-900 dark:bg-slate-800 dark:text-white'
                            : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white',
                          collapsed && 'md:justify-center md:px-2',
                        )}
                      >
                        {active && (
                          <motion.span
                            layoutId="sidebar-active"
                            className="absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-r bg-brand-600"
                          />
                        )}
                        <Icon
                          className={cn(
                            'h-5 w-5 shrink-0',
                            active
                              ? 'text-slate-900 dark:text-white'
                              : 'text-slate-600 group-hover:text-slate-900 dark:text-slate-400 dark:group-hover:text-white',
                          )}
                        />
                        {!collapsed && (
                          <span className="truncate">{item.label}</span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Collapse button (desktop only) */}
        <button
          onClick={toggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="hidden h-11 shrink-0 items-center justify-center border-t border-slate-100 text-slate-400 transition hover:bg-slate-50 hover:text-slate-700 dark:border-slate-800 dark:hover:bg-slate-800 dark:hover:text-slate-300 md:flex"
        >
          {collapsed ? <ChevronDoubleRightIcon className="h-4 w-4" /> : <ChevronDoubleLeftIcon className="h-4 w-4" />}
        </button>
      </aside>
    </>
  );
}

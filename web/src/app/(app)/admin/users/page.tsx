'use client';
import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  MagnifyingGlassIcon,
  UsersIcon,
  CheckCircleIcon,
  XCircleIcon,
  LockClosedIcon,
  LockOpenIcon,
} from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonTable } from '@/components/ui/Skeleton';
import { ExportBundle } from '@/components/ui/ExportBundle';
import { notify } from '@/lib/toast';
import { formatDateShort } from '@/lib/format';
import { dateLong, type PdfOptions } from '@/lib/pdf';
import type { CsvColumn } from '@/lib/csv';
import type { Role, UserSummary } from '@/lib/types';

const ALL_ROLES: Role[] = ['LOANEE', 'OFFICER', 'ADMINISTRATOR'];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch('/api/admin/users-proxy', { cache: 'no-store' });
      const d = await r.json();
      setUsers(Array.isArray(d) ? d : []);
    } catch {
      notify.error('Could not load users');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    if (!q) return users;
    const s = q.toLowerCase();
    return users.filter((u) => u.email.toLowerCase().includes(s) || u.fullName.toLowerCase().includes(s));
  }, [users, q]);

  async function toggleRole(user: UserSummary, role: Role) {
    const has = user.roles.includes(role);
    const next = has ? user.roles.filter((r) => r !== role) : [...user.roles, role];
    if (next.length === 0) { notify.warning('At least one role required'); return; }
    setBusy(user.id);
    try {
      const r = await fetch(`/api/admin/users-proxy/${user.id}/roles`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roles: next }),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        notify.error('Update failed', { subMessage: d?.message });
        return;
      }
      notify.success(`${user.fullName} roles updated`, { subMessage: 'Sessions revoked on next login' });
      load();
    } finally { setBusy(null); }
  }

  async function toggleStatus(user: UserSummary, patch: { enabled?: boolean; locked?: boolean }) {
    setBusy(user.id);
    try {
      const r = await fetch(`/api/admin/users-proxy/${user.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        notify.error('Update failed', { subMessage: d?.message });
        return;
      }
      notify.success('Status updated');
      load();
    } finally { setBusy(null); }
  }

  // ─── CSV ───
  const csvColumns: CsvColumn<UserSummary>[] = [
    { header: 'Full name', value: (u) => u.fullName },
    { header: 'Email', value: (u) => u.email },
    { header: 'Phone', value: (u) => u.phone ?? '' },
    { header: 'Roles', value: (u) => u.roles.join('|') },
    { header: 'Enabled', value: (u) => (u.enabled ? 'true' : 'false') },
    { header: 'Locked', value: (u) => (u.locked ? 'true' : 'false') },
    { header: 'Created', value: (u) => u.createdAt },
  ];

  // ─── PDF ───
  function buildUsersPdf(): PdfOptions {
    return {
      header: {
        title: 'Users & Roles',
        subtitle: `All registered accounts · ${filtered.length} user${filtered.length === 1 ? '' : 's'}`,
      },
      tables: [
        {
          columns: ['Name', 'Email', 'Roles', 'Status', 'Joined'],
          rows: filtered.map((u) => [
            u.fullName,
            u.email,
            u.roles.join(', '),
            u.enabled ? (u.locked ? 'Locked' : 'Active') : 'Disabled',
            dateLong(u.createdAt),
          ]),
        },
      ],
      footerNote:
        'Confidential — contains user identity data. Handle according to your privacy policy.',
    };
  }

  return (
    <div>
      <PageHeader
        title="Users"
        description={`${users.length} account${users.length === 1 ? '' : 's'} in the system`}
        actions={
          <ExportBundle<UserSummary>
            filename="naedcredit-users"
            printTitle={`NaedCredit-Users-${new Date().toISOString().slice(0, 10)}`}
            csv={{ rows: filtered, columns: csvColumns }}
            pdf={buildUsersPdf}
          />
        }
      />

      <div className="mb-5">
        <div className="relative max-w-md">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name or email…"
            className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
        </div>
      </div>

      {loading ? <SkeletonTable rows={6} /> : filtered.length === 0 ? (
        <EmptyState icon={<UsersIcon className="h-6 w-6" />} title={q ? 'No matching users' : 'No users'} description={q ? 'Try a different search term.' : 'No accounts registered yet.'} />
      ) : (
        <Card padded={false} className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px]">
              <thead className="bg-slate-50 dark:bg-slate-800">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">User</th>
                  {ALL_ROLES.map((r) => (
                    <th key={r} className="px-3 py-3 text-center text-xs font-medium uppercase tracking-wider text-slate-500">{r}</th>
                  ))}
                  <th className="px-5 py-3 text-center text-xs font-medium uppercase tracking-wider text-slate-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((u, i) => (
                  <motion.tr key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} className={busy === u.id ? 'opacity-50' : ''}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar name={u.fullName} size="sm" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-900 dark:text-white">{u.fullName}</p>
                          <p className="truncate text-xs text-slate-500">{u.email}</p>
                          <p className="mt-0.5 text-[10px] text-slate-400">Joined {formatDateShort(u.createdAt)}</p>
                        </div>
                      </div>
                    </td>
                    {ALL_ROLES.map((role) => (
                      <td key={role} className="px-3 py-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={u.roles.includes(role)}
                          onChange={() => toggleRole(u, role)}
                          disabled={busy === u.id}
                          className="h-4 w-4 cursor-pointer rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                        />
                      </td>
                    ))}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => toggleStatus(u, { enabled: !u.enabled })}
                          disabled={busy === u.id}
                          className={`inline-flex h-7 items-center gap-1 rounded-full px-2 text-[10px] font-medium transition ${u.enabled ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                        >
                          {u.enabled ? (<><CheckCircleIcon className="h-3 w-3" /> Active</>) : (<><XCircleIcon className="h-3 w-3" /> Disabled</>)}
                        </button>
                        <button
                          onClick={() => toggleStatus(u, { locked: !u.locked })}
                          disabled={busy === u.id}
                          className={`inline-flex h-7 items-center gap-1 rounded-full px-2 text-[10px] font-medium transition ${u.locked ? 'bg-amber-100 text-amber-800 hover:bg-amber-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                        >
                          {u.locked ? (<><LockClosedIcon className="h-3 w-3" /> Locked</>) : (<><LockOpenIcon className="h-3 w-3" /> Open</>)}
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

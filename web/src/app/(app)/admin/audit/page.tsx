'use client';
import { useEffect, useMemo, useState } from 'react';
import { DocumentTextIcon, MagnifyingGlassIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';

import { ExportBundle } from '@/components/ui/ExportBundle';
import type { CsvColumn } from '@/lib/csv';
import { dateLong, type PdfOptions } from '@/lib/pdf';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonTable } from '@/components/ui/Skeleton';
import { notify } from '@/lib/toast';
import { formatDateTime } from '@/lib/format';
import type { AuditLog, Paged } from '@/lib/types';

function actionTone(action: string): 'brand' | 'emerald' | 'rose' | 'amber' | 'violet' | 'slate' {
  if (action.startsWith('LOGIN_SUCCESS')) return 'emerald';
  if (action.startsWith('LOGIN_FAILED') || action.startsWith('LOGIN_BLOCKED')) return 'rose';
  if (action.includes('APPROVED') || action.includes('DISBURSED') || action === 'LOAN_REPAID') return 'brand';
  if (action.includes('REJECTED') || action.includes('CANCELLED')) return 'rose';
  if (action.includes('UPDATED') || action.includes('CHANGED')) return 'amber';
  if (action.startsWith('LOAN_')) return 'violet';
  return 'slate';
}

export default function AuditPage() {
  const [rows, setRows] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  async function load() {
    setLoading(true);
    const qs = actionFilter ? `?action=${encodeURIComponent(actionFilter)}&size=100` : '?size=100';
    try {
      const r = await fetch(`/api/admin/audit${qs}`, { cache: 'no-store' });
      const d = (await r.json()) as Paged<AuditLog> | AuditLog[];
      const arr = Array.isArray(d) ? d : (d as Paged<AuditLog>).content ?? [];
      setRows(arr);
    } catch {
      notify.error('Could not load audit log');
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const filtered = useMemo(() => {
    if (!q) return rows;
    const s = q.toLowerCase();
    return rows.filter((r) =>
      r.action.toLowerCase().includes(s) ||
      (r.actor?.email ?? '').toLowerCase().includes(s) ||
      (r.resourceType ?? '').toLowerCase().includes(s));
  }, [rows, q]);

  const auditCsvColumns: CsvColumn<AuditLog>[] = [
    { header: 'Time', value: (r) => r.createdAt },
    { header: 'Action', value: (r) => r.action },
    { header: 'Actor', value: (r) => r.actor?.email ?? '' },
    { header: 'Resource type', value: (r) => r.resourceType ?? '' },
    { header: 'Resource id', value: (r) => r.resourceId ?? '' },
    { header: 'IP', value: (r) => r.ipAddress ?? '' },
    { header: 'Metadata', value: (r) => r.metadata ?? '' },
  ];


  function buildAuditPdf(): PdfOptions {
    return {
      header: {
        title: 'Audit Log',
        subtitle: 'Every sensitive action recorded by the system',
      },
      tables: [
        {
          columns: ['Time', 'Action', 'Actor', 'Resource', 'IP'],
          rows: filtered.map((r) => [
            dateLong(r.createdAt),
            r.action,
            r.actor ? `${r.actor.firstName} ${r.actor.lastName} (${r.actor.email})` : '—',
            r.resourceType ?? '—',
            r.ipAddress ?? '—',
          ]),
        },
      ],
      footerNote:
        'Confidential — contains audit trail data. Do not distribute outside your organization.',
    };
  }

  function exportCsv() {
    const headers = ['timestamp', 'action', 'actor', 'resourceType', 'resourceId', 'ip'];
    const lines = [headers.join(',')];
    for (const r of filtered) {
      lines.push([r.createdAt, r.action, r.actor?.email ?? '', r.resourceType ?? '', r.resourceId ?? '', r.ipAddress ?? '']
        .map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','));
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `naedcredit-audit-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    notify.success('Audit log exported');
  }

  return (
    <div>
      <PageHeader
        title="Audit log"
        description={`${rows.length} recorded action${rows.length === 1 ? '' : 's'}`}
        actions={<Button variant="outline" size="sm" onClick={exportCsv} leftIcon={<ArrowDownTrayIcon className="h-4 w-4" />}>Export CSV</Button>}
      />

      <div className="mb-5 flex flex-wrap gap-3">
        <div className="relative min-w-[260px] flex-1">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search action, actor, resource…"
            className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30"
          />
        </div>
        <div className="flex gap-2">
          <input
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            placeholder="Filter by exact action"
            className="h-10 w-64 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30"
          />
          <Button variant="outline" onClick={load}>Apply</Button>
        </div>
      </div>

      {loading ? <SkeletonTable rows={8} /> : filtered.length === 0 ? (
        <EmptyState icon={<DocumentTextIcon className="h-6 w-6" />} title="No audit entries" description="Actions will appear here as users interact with the system." />
      ) : (
        <Card padded={false} className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className="bg-slate-50">
                <tr>
                  {['Time', 'Action', 'Actor', 'Resource', 'IP'].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filtered.map((r) => (
                  <tr key={r.id} className="transition hover:bg-slate-50">
                    <td className="whitespace-nowrap px-5 py-3 font-mono text-xs text-slate-500">{formatDateTime(r.createdAt)}</td>
                    <td className="px-5 py-3"><Badge tone={actionTone(r.action)}>{r.action}</Badge></td>
                    <td className="px-5 py-3 text-xs">
                      {r.actor ? (
                        <div>
                          <p className="font-medium text-slate-700">{r.actor.firstName} {r.actor.lastName}</p>
                          <p className="text-slate-500">{r.actor.email}</p>
                        </div>
                      ) : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-600">
                      {r.resourceType ? <span className="font-mono">{r.resourceType}{r.resourceId ? `·${r.resourceId.slice(0, 8)}` : ''}</span> : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-slate-500">{r.ipAddress ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ClipboardDocumentCheckIcon,
  MagnifyingGlassIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoanStatusBadge } from '@/components/ui/LoanStatusBadge';
import { SkeletonTable } from '@/components/ui/Skeleton';
import { PageHeader } from '@/components/ui/PageHeader';
import { ExportBundle } from '@/components/ui/ExportBundle';
import { dateLong, money, type PdfOptions } from '@/lib/pdf';
import type { CsvColumn } from '@/lib/csv';
import { formatMoney, timeAgo } from '@/lib/format';
import type { Loan, Paged } from '@/lib/types';

export default function QueuePage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch('/api/loans/pending?size=50', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d: Paged<Loan>) => { if (!cancelled) setLoans(d.content ?? []); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    return loans.filter((l) => {
      if (!q) return true;
      const s = q.toLowerCase();
      return (
        l.reference.toLowerCase().includes(s) ||
        l.applicantName.toLowerCase().includes(s)
      );
    });
  }, [loans, q]);

  const totalAmount = filtered.reduce((sum, l) => sum + l.amount, 0);


  const csvColumns: CsvColumn<Loan>[] = [
    { header: 'Reference', value: (l) => l.reference },
    { header: 'Applicant', value: (l) => l.applicantName },
    { header: 'Amount', value: (l) => l.amount },
    { header: 'Currency', value: (l) => l.currency },
    { header: 'Term (months)', value: (l) => l.termMonths },
    { header: 'Status', value: (l) => l.status },
    { header: 'Submitted', value: (l) => l.submittedAt },
  ];

  function buildQueuePdf(): PdfOptions {
    return {
      header: {
        title: 'Review Queue',
        subtitle: `${filtered.length} pending application${filtered.length === 1 ? '' : 's'}`,
      },
      tables: [
        {
          columns: ['Reference', 'Applicant', 'Amount', 'Term', 'Status', 'Submitted'],
          rows: filtered.map((l) => [
            l.reference,
            l.applicantName,
            money(l.amount, l.currency),
            `${l.termMonths} mo`,
            l.status.replace(/_/g, ' '),
            dateLong(l.submittedAt),
          ]),
        },
      ],
      footerNote: 'Confidential — pending loan applications awaiting officer review.',
    };
  }

  return (
    <div>
      <PageHeader
        title="Review queue"
        description={`${loans.length} pending application${loans.length === 1 ? '' : 's'} awaiting decision`}
        actions={
          <ExportBundle<Loan>
            filename="naedcredit-review-queue"
            printTitle={`NaedCredit-Queue-${new Date().toISOString().slice(0, 10)}`}
            csv={{ rows: filtered, columns: csvColumns }}
            pdf={buildQueuePdf}
          />
        }
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">In queue</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-slate-900">{loans.length}</p>
        </Card>
        <Card>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Total requested</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-slate-900">
            {formatMoney(totalAmount)}
          </p>
        </Card>
        <Card>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Oldest wait</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {loans.length > 0
              ? timeAgo(loans[loans.length - 1].submittedAt).replace(' ago', '')
              : '—'}
          </p>
        </Card>
      </div>

      <div className="mb-5">
        <div className="relative max-w-md">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by reference or applicant…"
            className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30"
          />
        </div>
      </div>

      {loading ? (
        <SkeletonTable rows={6} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<ClipboardDocumentCheckIcon className="h-6 w-6" />}
          title={q ? 'No matching loans' : 'All caught up'}
          description={
            q
              ? 'Try a different search term.'
              : 'There are no pending applications in the queue right now.'
          }
        />
      ) : (
        <Card padded={false} className="overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                {['Reference', 'Applicant', 'Amount', 'Submitted', ''].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((l, i) => (
                <motion.tr
                  key={l.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02, duration: 0.18 }}
                  className="transition hover:bg-brand-50/30"
                >
                  <td className="px-5 py-3.5">
                    <Link
                      href={`/loans/${l.id}`}
                      className="font-mono text-sm font-medium text-slate-900 hover:text-brand-700"
                    >
                      {l.reference}
                    </Link>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-slate-700">{l.applicantName}</td>
                  <td className="px-5 py-3.5 text-sm tabular-nums text-slate-700">
                    {formatMoney(l.amount, l.currency)}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                      <ClockIcon className="h-3.5 w-3.5" />
                      {timeAgo(l.submittedAt)}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <Link href={`/loans/${l.id}`}>
                      <Button size="sm" variant="outline">Review</Button>
                    </Link>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

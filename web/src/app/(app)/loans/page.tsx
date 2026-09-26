'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  PlusIcon,
  BanknotesIcon,
  MagnifyingGlassIcon,
  TableCellsIcon,
  Squares2X2Icon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoanStatusBadge } from '@/components/ui/LoanStatusBadge';
import { SkeletonTable } from '@/components/ui/Skeleton';
import { PageHeader } from '@/components/ui/PageHeader';
import { Select } from '@/components/ui/Select';
import { ExportBundle } from '@/components/ui/ExportBundle';
import { formatMoney, formatDateShort, formatPercent } from '@/lib/format';
import { dateLong, money, type PdfOptions } from '@/lib/pdf';
import type { CsvColumn } from '@/lib/csv';
import type { Loan, LoanStatus, Paged } from '@/lib/types';
import { STATUS_LABEL } from '@/lib/types';

type ViewMode = 'table' | 'grid';

const STATUSES: (LoanStatus | 'ALL')[] = [
  'ALL',
  'PENDING',
  'UNDER_REVIEW',
  'APPROVED',
  'DISBURSED',
  'REPAID',
  'REJECTED',
  'CANCELLED',
];

export default function LoansPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<LoanStatus | 'ALL'>('ALL');
  const [q, setQ] = useState('');
  const [view, setView] = useState<ViewMode>('table');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Restore view preference
  useEffect(() => {
    const saved = (localStorage.getItem('loans-view') as ViewMode) ?? 'table';
    setView(saved);
  }, []);

  function changeView(v: ViewMode) {
    setView(v);
    localStorage.setItem('loans-view', v);
  }

  // Load data whenever page changes
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/loans?page=${page}&size=20&sort=submittedAt,desc`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((d: Paged<Loan>) => {
        if (cancelled) return;
        setLoans(d.content ?? []);
        setTotalPages(d.totalPages ?? 1);
        setTotal(d.totalElements ?? 0);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [page]);

  // Client-side filter by status + search
  const filtered = useMemo(() => {
    return loans.filter((l) => {
      if (filter !== 'ALL' && l.status !== filter) return false;
      if (q && !l.reference.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [loans, filter, q]);

  // ─── CSV columns ───
  const csvColumns: CsvColumn<Loan>[] = [
    { header: 'Reference', value: (l) => l.reference },
    { header: 'Amount', value: (l) => l.amount },
    { header: 'Currency', value: (l) => l.currency },
    { header: 'Term (months)', value: (l) => l.termMonths },
    { header: 'Interest rate', value: (l) => l.interestRate },
    { header: 'Status', value: (l) => l.status },
    { header: 'Submitted', value: (l) => l.submittedAt },
    { header: 'Purpose', value: (l) => l.purpose ?? '' },
  ];

  // ─── PDF builder ───
  function buildLoansPdf(): PdfOptions {
    return {
      header: {
        title: 'My Loans',
        subtitle: `All loan applications · ${filtered.length} record${filtered.length === 1 ? '' : 's'}`,
      },
      tables: [
        {
          columns: ['Reference', 'Amount', 'Term', 'Rate', 'Status', 'Submitted'],
          rows: filtered.map((l) => [
            l.reference,
            money(l.amount, l.currency),
            `${l.termMonths} mo`,
            `${(l.interestRate * 100).toFixed(2)}%`,
            l.status.replace(/_/g, ' '),
            dateLong(l.submittedAt),
          ]),
        },
      ],
      footerNote: 'System-generated summary from NaedCredit.',
    };
  }

  return (
    <div>
      <PageHeader
        title="My Loans"
        description={`${total} total application${total === 1 ? '' : 's'}`}
        actions={
          <div className="flex items-center gap-2">
            <ExportBundle<Loan>
              filename="naedcredit-my-loans"
              printTitle={`NaedCredit-Loans-${new Date().toISOString().slice(0, 10)}`}
              csv={{ rows: filtered, columns: csvColumns }}
              pdf={buildLoansPdf}
            />
            <Link href="/loans/new">
              <Button leftIcon={<PlusIcon className="h-4 w-4" />}>
                Apply for a loan
              </Button>
            </Link>
          </div>
        }
      />

      {/* ─── Filter bar ─── */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by reference…"
            className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
        </div>

        <div className="w-48">
          <Select
            value={filter}
            onChange={(e) => setFilter(e.target.value as LoanStatus | 'ALL')}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s === 'ALL' ? 'All statuses' : STATUS_LABEL[s as LoanStatus]}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex rounded-lg border border-slate-300 bg-white p-0.5 dark:border-slate-700 dark:bg-slate-900">
          <button
            onClick={() => changeView('table')}
            className={`rounded-md p-2 transition ${
              view === 'table'
                ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300'
                : 'text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
            aria-label="Table view"
          >
            <TableCellsIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => changeView('grid')}
            className={`rounded-md p-2 transition ${
              view === 'grid'
                ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300'
                : 'text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
            aria-label="Grid view"
          >
            <Squares2X2Icon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ─── Content ─── */}
      {loading ? (
        <SkeletonTable rows={6} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<BanknotesIcon className="h-6 w-6" />}
          title={q || filter !== 'ALL' ? 'No matching loans' : 'No applications yet'}
          description={
            q || filter !== 'ALL'
              ? 'Try adjusting filters or search terms.'
              : 'Start your first application and track its progress here.'
          }
          action={
            !q && filter === 'ALL' ? (
              <Link href="/loans/new">
                <Button>Apply for a loan</Button>
              </Link>
            ) : undefined
          }
        />
      ) : view === 'table' ? (
        <Card padded={false} className="overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-800">
              <tr>
                {['Reference', 'Amount', 'Term', 'Rate', 'Status', 'Submitted'].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((l) => (
                <motion.tr
                  key={l.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="cursor-pointer transition hover:bg-brand-50/30 dark:hover:bg-brand-500/5"
                >
                  <td className="px-5 py-3.5">
                    <Link
                      href={`/loans/${l.id}`}
                      className="font-mono text-sm font-medium text-slate-900 hover:text-brand-700 dark:text-white dark:hover:text-brand-400"
                    >
                      {l.reference}
                    </Link>
                  </td>
                  <td className="px-5 py-3.5 text-sm tabular-nums text-slate-700 dark:text-slate-300">
                    {formatMoney(l.amount, l.currency)}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-slate-600 dark:text-slate-400">
                    {l.termMonths} mo
                  </td>
                  <td className="px-5 py-3.5 text-sm tabular-nums text-slate-600 dark:text-slate-400">
                    {formatPercent(l.interestRate, 2)}
                  </td>
                  <td className="px-5 py-3.5">
                    <LoanStatusBadge status={l.status} />
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-500 dark:text-slate-500">
                    {formatDateShort(l.submittedAt)}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((l) => (
            <Link key={l.id} href={`/loans/${l.id}`}>
              <Card className="h-full transition hover:border-brand-300 hover:shadow-md dark:hover:border-brand-700">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-mono text-xs font-medium text-slate-600 dark:text-slate-400">
                    {l.reference}
                  </span>
                  <LoanStatusBadge status={l.status} />
                </div>
                <p className="mt-4 text-2xl font-semibold tabular-nums text-slate-900 dark:text-white">
                  {formatMoney(l.amount, l.currency)}
                </p>
                <div className="mt-3 flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                  <span>{l.termMonths} months</span>
                  <span>·</span>
                  <span>{formatPercent(l.interestRate, 2)} p.a.</span>
                </div>
                <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
                  Applied {formatDateShort(l.submittedAt)}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* ─── Pagination ─── */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between text-sm">
          <p className="text-slate-500 dark:text-slate-400">
            Page {page + 1} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
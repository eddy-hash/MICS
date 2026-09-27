'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { CurrencyDollarIcon, MagnifyingGlassIcon, BanknotesIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoanStatusBadge } from '@/components/ui/LoanStatusBadge';
import { SkeletonTable } from '@/components/ui/Skeleton';
import { PageHeader } from '@/components/ui/PageHeader';
import { formatMoney, timeAgo } from '@/lib/format';
import type { Loan, Paged } from '@/lib/types';

export default function DisbursePage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch('/api/loans?size=100&sort=approvedAt,desc', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d: Paged<Loan>) => {
        if (cancelled) return;
        setLoans((d.content ?? []).filter((l) => l.status === 'APPROVED'));
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    if (!q) return loans;
    const s = q.toLowerCase();
    return loans.filter(
      (l) =>
        l.reference.toLowerCase().includes(s) ||
        l.applicantName.toLowerCase().includes(s),
    );
  }, [loans, q]);

  const total = filtered.reduce((sum, l) => sum + l.amount, 0);

  return (
    <div>
      <PageHeader
        title="Disbursements"
        description={`${loans.length} approved loan${loans.length === 1 ? '' : 's'} awaiting disbursement`}
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Awaiting</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-slate-900">{loans.length}</p>
        </Card>
        <Card>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Total to disburse</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-slate-900">
            {formatMoney(total)}
          </p>
        </Card>
        <Card>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Ready</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {filtered.length === 0 ? '—' : `${filtered.length} loan${filtered.length === 1 ? '' : 's'}`}
          </p>
        </Card>
      </div>

      <div className="mb-5">
        <div className="relative max-w-md">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search reference or applicant…"
            className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30"
          />
        </div>
      </div>

      {loading ? (
        <SkeletonTable rows={5} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<CurrencyDollarIcon className="h-6 w-6" />}
          title="Nothing to disburse"
          description="There are no approved loans awaiting disbursement."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((l, i) => (
            <motion.div
              key={l.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03, duration: 0.2 }}
            >
              <Card className="flex h-full flex-col">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-mono text-xs font-medium text-slate-600">{l.reference}</span>
                  <LoanStatusBadge status={l.status} />
                </div>
                <div className="mt-4 flex items-center gap-2 text-sm text-slate-700">
                  <BanknotesIcon className="h-4 w-4 text-slate-400" />
                  {l.applicantName}
                </div>
                <p className="mt-3 text-2xl font-semibold tabular-nums text-slate-900">
                  {formatMoney(l.amount, l.currency)}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {l.termMonths} months · approved {l.approvedAt ? timeAgo(l.approvedAt) : ''}
                </p>
                <div className="mt-auto pt-4">
                  <Link href={`/loans/${l.id}`}>
                    <Button fullWidth leftIcon={<CurrencyDollarIcon className="h-4 w-4" />}>
                      Open &amp; disburse
                    </Button>
                  </Link>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

'use client';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeftIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { SuccessModal } from '@/components/ui/SuccessModal';
import { MoneyInput } from '@/components/domain/MoneyInput';
import { InterestRateInput } from '@/components/domain/InterestRateInput';
import { PageHeader } from '@/components/ui/PageHeader';
import { notify } from '@/lib/toast';
import { estimateMonthlyPayment, totalPayable, formatMoney } from '@/lib/format';
import type { Loan, Paged } from '@/lib/types';

const ACTIVE_STATUSES = ['PENDING', 'UNDER_REVIEW', 'APPROVED', 'DISBURSED'];

export default function NewLoanPage() {
  const router = useRouter();
  const [activeLoan, setActiveLoan] = useState<Loan | null>(null);
  const [checking, setChecking] = useState(true);

  const [amount, setAmount] = useState(5_000_000);
  const [termMonths, setTermMonths] = useState(12);
  const [interestRate, setInterestRate] = useState(0.15);
  const [purpose, setPurpose] = useState('');
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState<{ reference: string; id: string } | null>(null);

  useEffect(() => {
    fetch('/api/loans?size=50', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d: Paged<Loan>) => {
        const active = (d.content ?? []).find((l) => ACTIVE_STATUSES.includes(l.status));
        setActiveLoan(active ?? null);
      })
      .catch(() => setActiveLoan(null))
      .finally(() => setChecking(false));
  }, []);

  const monthly = useMemo(() => estimateMonthlyPayment(amount, interestRate, termMonths), [amount, interestRate, termMonths]);
  const total = useMemo(() => totalPayable(amount, interestRate, termMonths), [amount, interestRate, termMonths]);
  const totalInterest = Math.max(0, total - amount);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await fetch('/api/loans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount, currency: 'TZS', termMonths, interestRate,
          purpose: purpose.trim() || null,
        }),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        notify.error('Submission failed', { subMessage: d?.message });
        return;
      }
      const created = await r.json();
      notify.success('Application submitted');
      setSuccess({ reference: created.reference, id: created.id });
    } finally {
      setBusy(false);
    }
  }

  // ── Checking state ──
  if (checking) {
    return (
      <div className="mx-auto max-w-5xl">
        <div className="animate-pulse rounded-2xl bg-white p-8 shadow-sm dark:bg-slate-900">
          <div className="h-8 w-48 rounded bg-slate-200 dark:bg-slate-700" />
          <div className="mt-4 h-4 w-64 rounded bg-slate-100 dark:bg-slate-800" />
        </div>
      </div>
    );
  }

  // ── Already has an active loan ──
  if (activeLoan) {
    return (
      <div className="mx-auto max-w-2xl">
        <Link href="/loans" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200">
          <ArrowLeftIcon className="h-4 w-4" /> Back to loans
        </Link>

        <PageHeader title="Apply for a loan" />

        <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-500/30 dark:bg-amber-500/5">
          <div className="flex items-start gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
              <ExclamationTriangleIcon className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h2 className="text-base font-semibold text-amber-900 dark:text-amber-200">
                You already have an active loan
              </h2>
              <p className="mt-1 text-sm text-amber-800/80 dark:text-amber-200/70">
                NaedCredit allows one active loan at a time. You can apply again once your current loan is fully repaid, rejected, or cancelled.
              </p>
              <dl className="mt-4 space-y-2 text-sm">
                <Row label="Reference" value={activeLoan.reference} mono />
                <Row label="Amount" value={formatMoney(activeLoan.amount, activeLoan.currency)} />
                <Row label="Status" value={activeLoan.status.replace(/_/g, ' ')} />
                <Row label="Submitted" value={new Date(activeLoan.submittedAt).toLocaleDateString()} />
              </dl>
              <div className="mt-5">
                <Link href={`/loans/${activeLoan.id}`}>
                  <Button>View loan details</Button>
                </Link>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // ── Normal form ──
  return (
    <div className="mx-auto max-w-5xl">
      <Link href="/loans" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200">
        <ArrowLeftIcon className="h-4 w-4" /> Back to loans
      </Link>

      <PageHeader
        title="Apply for a loan"
        description="Fill in the details and submit. An officer will review your application."
      />

      <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <Card>
            <h2 className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">Loan details</h2>
            <div className="space-y-4">
              <MoneyInput label="Amount" value={amount} onChange={setAmount} min={100_000} max={500_000_000} required hint="Min 100,000 TZS · Max 500,000,000 TZS" />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Term (months)" type="number" min={1} max={360} required value={termMonths} onChange={(e) => setTermMonths(Number(e.target.value))} className="tabular-nums" />
                <InterestRateInput label="Interest rate" value={interestRate} onChange={setInterestRate} required hint="Typical: 12% – 24%" />
              </div>
              <Textarea label="Purpose (optional)" rows={4} maxLength={2000} value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="What will you use this loan for?" hint={`${purpose.length}/2000`} />
            </div>
          </Card>

          <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-500/30 dark:bg-amber-500/5">
            <div className="flex items-start gap-3">
              <InformationCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
              <div className="text-xs text-amber-900 dark:text-amber-200">
                <p className="font-medium">Before you submit</p>
                <ul className="mt-1 list-disc space-y-0.5 pl-4">
                  <li>All figures are indicative until an officer approves.</li>
                  <li>Interest is calculated on the declining balance.</li>
                  <li>You can cancel any time before approval.</li>
                  <li><b>Only one active loan at a time.</b></li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:sticky lg:top-24 h-fit">
          <motion.div
            key={`${amount}-${termMonths}-${interestRate}`}
            initial={{ opacity: 0.6 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="bg-gradient-to-br from-brand-700 via-brand-600 to-cyan-600 text-white">
              <p className="text-xs font-medium uppercase tracking-wider text-brand-100">Estimated monthly payment</p>
              <p className="mt-2 text-3xl font-semibold tabular-nums">{formatMoney(monthly)}</p>
              <p className="mt-1 text-xs text-brand-100/80">over {termMonths} month{termMonths === 1 ? '' : 's'}</p>
              <div className="mt-6 space-y-2.5 border-t border-white/15 pt-4 text-sm">
                <PreviewRow label="Principal" value={formatMoney(amount)} />
                <PreviewRow label="Total interest" value={formatMoney(totalInterest)} />
                <PreviewRow label="Total payable" value={formatMoney(total)} bold />
              </div>
            </Card>
            <Button type="submit" size="lg" fullWidth loading={busy} className="mt-4">
              {busy ? 'Submitting…' : 'Submit application'}
            </Button>
            <p className="mt-2 text-center text-xs text-slate-500 dark:text-slate-400">
              Reviewed within 1–2 business days.
            </p>
          </motion.div>
        </div>
      </form>

      <SuccessModal
        open={success !== null}
        onClose={() => { router.push('/loans'); router.refresh(); }}
        title="Application submitted"
        message={`Your loan application ${success?.reference} is now pending review.`}
        details={
          <div className="space-y-1 text-slate-700">
            <p><span className="text-slate-500">Reference:</span> <span className="font-mono">{success?.reference}</span></p>
            <p><span className="text-slate-500">Amount:</span> {formatMoney(amount)}</p>
            <p><span className="text-slate-500">Term:</span> {termMonths} months</p>
            <p><span className="text-slate-500">Monthly:</span> {formatMoney(monthly)}</p>
          </div>
        }
        buttonText="View my loans"
        onButtonClick={() => { router.push('/loans'); router.refresh(); }}
      />
    </div>
  );
}

function PreviewRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex items-center justify-between ${bold ? 'text-white' : 'text-brand-50/90'}`}>
      <span>{label}</span>
      <span className={`tabular-nums ${bold ? 'font-semibold' : ''}`}>{value}</span>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className={`font-medium text-slate-900 dark:text-white ${mono ? 'font-mono text-xs' : ''}`}>{value}</dd>
    </div>
  );
}

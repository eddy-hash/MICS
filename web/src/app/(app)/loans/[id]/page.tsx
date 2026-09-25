import Link from 'next/link';
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import {
  ArrowLeftIcon,
  ClockIcon,
  UserCircleIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { ACCESS_COOKIE } from '@/lib/cookies';
import { Card } from '@/components/ui/Card';
import { LoanStatusBadge } from '@/components/ui/LoanStatusBadge';
import { Avatar } from '@/components/ui/Avatar';
import { LoanTimeline } from '@/components/domain/LoanTimeline';
import { LoanActionsPanel } from '@/components/domain/LoanActionsPanel';
import { formatMoney, formatDateShort, formatDateTime, formatPercent } from '@/lib/format';
import type { LoanDetail, Role } from '@/lib/types';

const BACKEND = process.env.BACKEND_URL ?? 'http://localhost:8080';

export default async function LoanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const store = await cookies();
  const token = store.get(ACCESS_COOKIE)?.value;
  if (!token) redirect('/login');

  // Decode JWT to get roles + permissions
  const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString('utf-8'));
  const authorities: string[] = payload.authorities ?? [];
  const roles: Role[] = authorities
    .filter((a) => a.startsWith('ROLE_'))
    .map((a) => a.replace('ROLE_', '') as Role);
  const permissions = new Set(authorities.filter((a) => !a.startsWith('ROLE_')));

  const r = await fetch(`${BACKEND}/api/loans/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!r.ok) notFound();

  const d = (await r.json()) as LoanDetail;
  const l = d.loan;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link
        href="/loans"
        className="inline-flex items-center gap-1 text-sm text-slate-500 transition hover:text-slate-800"
      >
        <ArrowLeftIcon className="h-4 w-4" /> Back to loans
      </Link>

      {/* Hero */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-brand-700 via-brand-600 to-cyan-600 text-white">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
        <div className="relative z-10">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-brand-100">
                Loan application
              </p>
              <p className="mt-1 font-mono text-2xl font-semibold">{l.reference}</p>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-brand-50/80">
                <span className="inline-flex items-center gap-1.5">
                  <ClockIcon className="h-4 w-4" /> Submitted {formatDateShort(l.submittedAt)}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <UserCircleIcon className="h-4 w-4" /> {l.applicantName}
                </span>
              </div>
            </div>
            <div className="rounded-xl bg-white/15 px-3 py-1.5 backdrop-blur">
              <LoanStatusBadge status={l.status} />
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-4">
            <Stat label="Amount" value={formatMoney(l.amount, l.currency)} />
            <Stat label="Term" value={`${l.termMonths} months`} />
            <Stat label="Interest" value={`${formatPercent(l.interestRate, 2)} p.a.`} />
            <Stat
              label="Monthly"
              value={formatMoney(monthly(l.amount, l.interestRate, l.termMonths))}
            />
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          {/* Details */}
          <Card>
            <h2 className="mb-4 text-sm font-semibold text-slate-900">Details</h2>
            <dl className="grid gap-4 sm:grid-cols-2">
              <Field label="Applicant">
                <div className="flex items-center gap-2">
                  <Avatar name={l.applicantName} size="sm" />
                  <span className="text-sm text-slate-700">{l.applicantName}</span>
                </div>
              </Field>
              <Field label="Currency">
                <span className="text-sm text-slate-700">{l.currency}</span>
              </Field>
              {l.purpose && (
                <Field label="Purpose" wide>
                  <p className="text-sm text-slate-700">{l.purpose}</p>
                </Field>
              )}
              {l.reviewedBy && (
                <Field label="Reviewed by">
                  <span className="text-sm text-slate-700">
                    {l.reviewedBy} · {l.reviewedAt ? formatDateShort(l.reviewedAt) : ''}
                  </span>
                </Field>
              )}
              {l.approvedBy && (
                <Field label="Approved by">
                  <span className="text-sm text-slate-700">
                    {l.approvedBy} · {l.approvedAt ? formatDateShort(l.approvedAt) : ''}
                  </span>
                </Field>
              )}
              {l.rejectedBy && (
                <Field label="Rejected by">
                  <span className="text-sm text-slate-700">
                    {l.rejectedBy} · {l.rejectedAt ? formatDateShort(l.rejectedAt) : ''}
                  </span>
                </Field>
              )}
              {l.rejectionReason && (
                <Field label="Rejection reason" wide>
                  <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800">
                    {l.rejectionReason}
                  </p>
                </Field>
              )}
              {l.disbursedBy && (
                <Field label="Disbursed by">
                  <span className="text-sm text-slate-700">
                    {l.disbursedBy} · {l.disbursedAt ? formatDateShort(l.disbursedAt) : ''}
                  </span>
                </Field>
              )}
              {l.disbursementRef && (
                <Field label="Disbursement ref">
                  <span className="font-mono text-sm text-slate-700">{l.disbursementRef}</span>
                </Field>
              )}
              {l.repaidAt && (
                <Field label="Repaid at">
                  <span className="text-sm text-slate-700">{formatDateTime(l.repaidAt)}</span>
                </Field>
              )}
            </dl>
          </Card>

          {/* Timeline */}
          <Card>
            <div className="mb-5 flex items-center gap-2">
              <DocumentTextIcon className="h-4 w-4 text-slate-500" />
              <h2 className="text-sm font-semibold text-slate-900">Status history</h2>
            </div>
            <LoanTimeline entries={d.history} />
          </Card>
        </div>

        {/* Right rail */}
        <div className="space-y-4 lg:sticky lg:top-24 h-fit">
          <LoanActionsPanel loan={l} roles={roles} permissions={permissions} />
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-wider text-brand-100/80">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function Field({
  label,
  children,
  wide,
}: {
  label: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className={wide ? 'sm:col-span-2' : ''}>
      <dt className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd>{children}</dd>
    </div>
  );
}

function monthly(amount: number, annualRate: number, termMonths: number) {
  const r = annualRate / 12;
  if (r === 0) return amount / termMonths;
  const f = Math.pow(1 + r, termMonths);
  return (amount * r * f) / (f - 1);
}

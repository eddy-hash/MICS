import { cn } from '@/lib/utils';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  BanknotesIcon,
  ClipboardDocumentCheckIcon,
  ChartBarSquareIcon,
  ArrowRightIcon,
  ClockIcon,
  CheckCircleIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';
import { ACCESS_COOKIE } from '@/lib/cookies';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LoanStatusBadge } from '@/components/ui/LoanStatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { CountUpNumber } from '@/components/domain/CountUpNumber';
import { formatMoney, formatDateShort } from '@/lib/format';
import { PERMISSIONS } from '@/lib/permissions';
import type { Loan, Paged, Role, AnalyticsSummary } from '@/lib/types';

const BACKEND = process.env.BACKEND_URL ?? 'http://localhost:8080';

async function getJson<T>(path: string, token: string): Promise<T | null> {
  try {
    const r = await fetch(`${BACKEND}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    return r.ok ? ((await r.json()) as T) : null;
  } catch { return null; }
}

export default async function DashboardPage() {
  const store = await cookies();
  const token = store.get(ACCESS_COOKIE)!.value;

  const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString('utf-8'));
  const email = payload.sub as string;
  const firstName = email.split('@')[0];

  const authorities: string[] = payload.authorities ?? [];
  const roles: Role[] = authorities
    .filter((a) => a.startsWith('ROLE_'))
    .map((a) => a.replace('ROLE_', '') as Role);
  const permissions = new Set(authorities.filter((a) => !a.startsWith('ROLE_')));

  const isStaff = permissions.has(PERMISSIONS.LOAN_VIEW_ALL);
  const canViewOwn = permissions.has(PERMISSIONS.LOAN_VIEW_OWN);
  const canCreate = permissions.has(PERMISSIONS.LOAN_CREATE);
  const canReview = permissions.has(PERMISSIONS.LOAN_REVIEW);
  const canDisburse = permissions.has(PERMISSIONS.LOAN_DISBURSE);
  const canAnalytics = permissions.has(PERMISSIONS.ANALYTICS_VIEW);

  const [myLoans, analytics] = await Promise.all([
    canViewOwn ? getJson<Paged<Loan>>('/api/loans/mine?size=5&sort=submittedAt,desc', token) : null,
    canAnalytics ? getJson<AnalyticsSummary>('/api/admin/analytics/summary', token) : null,
  ]);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  })();

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 via-brand-600 to-cyan-600 px-5 py-7 text-white shadow-xl sm:px-8 sm:py-10">
        <div className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
        <div className="relative z-10 max-w-xl">
          <p className="text-xs font-medium uppercase tracking-wider text-white/70 sm:text-sm sm:normal-case sm:tracking-normal sm:text-brand-100">Karibu tena</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            {greeting}, {firstName}
          </h1>
          <p className="mt-2 text-sm text-white/85 sm:text-[15px]">
            {isStaff
              ? 'Staff access — manage the queue, disburse funds, and monitor the portfolio.'
              : 'Track your loans, apply for new ones, and manage your account.'}
          </p>
          <div className="mt-6 flex flex-wrap gap-2.5">
            {canViewOwn && (
              <Link href="/loans">
                <Button className="border-0 !bg-white !text-slate-900 hover:!bg-brand-50 shadow-sm font-semibold dark:!bg-white dark:!text-slate-900" leftIcon={<BanknotesIcon className="h-4 w-4" />}>
                  My Loans
                </Button>
              </Link>
            )}
            {canCreate && (
              <Link href="/loans/new">
                <Button className="border border-white/40 !bg-white/10 !text-white hover:!bg-white/20 backdrop-blur font-semibold">
                  Apply for a Loan
                </Button>
              </Link>
            )}
            {canReview && (
              <Link href="/officer/queue">
                <Button className="border border-white/40 !bg-white/10 !text-white hover:!bg-white/20 backdrop-blur font-semibold">
                  Review Queue
                </Button>
              </Link>
            )}
            {canDisburse && (
              <Link href="/officer/disburse">
                <Button className="border border-white/40 !bg-white/10 !text-white hover:!bg-white/20 backdrop-blur font-semibold">
                  Disbursements
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>

      {analytics && (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiTile label="Total loans" value={analytics.totalLoans} mode="number" tone="brand" icon={<BanknotesIcon className="h-5 w-5" />} />
          <KpiTile label="Pending" value={analytics.pendingCount} mode="number" tone="amber" icon={<ClockIcon className="h-5 w-5" />} />
          <KpiTile label="Disbursed" value={analytics.disbursedCount} mode="number" tone="violet" icon={<CurrencyDollarIcon className="h-5 w-5" />} />
          <KpiTile
            label="Portfolio value"
            value={analytics.totalDisbursedAmount}
            mode="money"
            currency={analytics.currency}
            tone="emerald"
            icon={<CheckCircleIcon className="h-5 w-5" />}
          />
        </section>
      )}

      <section className="grid gap-4 md:grid-cols-3">
        {canViewOwn && (
          <QuickTile href="/loans" title="My Loans" description="Track the status of your applications and manage active loans." icon={<BanknotesIcon className="h-5 w-5" />} />
        )}
        {canReview && (
          <QuickTile href="/officer/queue" title="Review Queue" description="Review, approve, or reject pending loan applications." icon={<ClipboardDocumentCheckIcon className="h-5 w-5" />} />
        )}
        {canAnalytics && (
          <QuickTile href="/admin" title="Analytics" description="Portfolio KPIs, trends, and system-wide loan statistics." icon={<ChartBarSquareIcon className="h-5 w-5" />} />
        )}
      </section>

      {canViewOwn && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Recent applications</h2>
            <Link href="/loans" className="text-sm font-medium text-brand-600 hover:text-brand-700">View all →</Link>
          </div>
          {!myLoans || myLoans.content.length === 0 ? (
            <EmptyState
              icon={<BanknotesIcon className="h-6 w-6" />}
              title="No loan applications yet"
              description="Start your first application and see it appear here."
              action={canCreate ? (
                <Link href="/loans/new"><Button>Apply for a loan</Button></Link>
              ) : undefined}
            />
          ) : (
            <Card padded={false}>
              <ul className="divide-y divide-slate-100">
                {myLoans.content.map((l) => (
                  <li key={l.id}>
                    <Link href={`/loans/${l.id}`} className="flex items-center gap-4 px-5 py-4 transition hover:bg-slate-50 dark:hover:bg-slate-800">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                        <BanknotesIcon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-mono text-sm font-medium text-slate-900 dark:text-white">{l.reference}</p>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                          {formatMoney(l.amount, l.currency)} · {l.termMonths} months
                        </p>
                      </div>
                      <div className="hidden text-xs text-slate-500 dark:text-slate-400 sm:block">{formatDateShort(l.submittedAt)}</div>
                      <LoanStatusBadge status={l.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </section>
      )}

      <section className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <span>Signed in as</span>
        <span className="font-medium text-slate-700 dark:text-slate-200">{email}</span>
        {roles.map((r) => <Badge key={r} tone="brand">{r}</Badge>)}
      </section>
    </div>
  );
}

function KpiTile({
  label,
  value,
  mode,
  currency,
  icon,
  tone,
}: {
  label: string;
  value: number;
  mode: 'number' | 'money';
  currency?: string;
  icon: React.ReactNode;
  tone: 'brand' | 'amber' | 'violet' | 'emerald';
}) {
  const tones: Record<typeof tone, { bg: string; text: string; blob: string }> = {
    brand:   { bg: 'from-brand-500/10 to-cyan-500/5',    text: 'text-brand-700',   blob: 'bg-brand-500/20' },
    amber:   { bg: 'from-amber-500/10 to-orange-500/5',  text: 'text-amber-700',   blob: 'bg-amber-500/20' },
    violet:  { bg: 'from-violet-500/10 to-purple-500/5', text: 'text-violet-700',  blob: 'bg-violet-500/20' },
    emerald: { bg: 'from-emerald-500/10 to-teal-500/5',  text: 'text-emerald-700', blob: 'bg-emerald-500/20' },
  };
  const t = tones[tone];
  return (
    <Card padded={false} className={`!p-3 bg-gradient-to-br sm:!p-5 ${t.bg}`}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 sm:text-xs">
          {label}
        </p>
        <span className={cn('shrink-0 [&_svg]:h-4 [&_svg]:w-4 sm:[&_svg]:h-5 sm:[&_svg]:w-5', t.text)}>
          {icon}
        </span>
      </div>
      <p className="mt-1.5 text-base font-semibold leading-tight tabular-nums text-slate-900 dark:text-white sm:mt-3 sm:text-2xl">
        <CountUpNumber value={value} mode={mode} currency={currency} />
      </p>
      <div className={`pointer-events-none absolute -right-6 -top-6 h-16 w-16 rounded-full blur-2xl sm:h-24 sm:w-24 ${t.blob}`} />
    </Card>
  );
}

function QuickTile({ href, title, description, icon }: { href: string; title: string; description: string; icon: React.ReactNode }) {
  return (
    <Link href={href} className="block h-full">
      <Card padded={false} className="group h-full !p-3.5 transition hover:border-brand-300 hover:shadow-md sm:!p-5">
        <div className="flex items-start gap-2.5 sm:gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600 sm:h-10 sm:w-10 sm:rounded-xl">
            {icon}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-[13px] font-semibold text-slate-900 dark:text-white sm:text-sm">
              {title}
            </h3>
            <p className="mt-0.5 text-[11.5px] leading-snug text-slate-500 dark:text-slate-400 sm:mt-1 sm:text-xs">
              {description}
            </p>
            <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-brand-600 group-hover:text-brand-700 sm:mt-3 sm:text-xs">
              Open <ArrowRightIcon className="h-3 w-3" />
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  BanknotesIcon,
  ClockIcon,
  CurrencyDollarIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { ACCESS_COOKIE } from '@/lib/cookies';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { AnalyticsExportButton } from './AnalyticsExportButton';
import { StatCard } from '@/components/ui/StatCard';
import {
  StatusBarChart,
  StatusPieChart,
  AmountAreaChart,
  ApprovalRadial,
} from '@/components/charts/AnalyticsCharts';
import { formatMoney } from '@/lib/format';
import type { AnalyticsSummary, Loan, Paged } from '@/lib/types';

const BACKEND = process.env.BACKEND_URL ?? 'http://localhost:8080';

async function getJson<T>(path: string, token: string): Promise<T | null> {
  try {
    const r = await fetch(`${BACKEND}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    return r.ok ? ((await r.json()) as T) : null;
  } catch {
    return null;
  }
}

function monthLabel(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('en-TZ', { month: 'short' });
}

function aggregateByMonth(loans: Loan[]) {
  const buckets = new Map<string, { disbursed: number; pending: number }>();
  const now = new Date();
  // Last 6 months
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.set(monthLabel(d.toISOString()), { disbursed: 0, pending: 0 });
  }
  for (const l of loans) {
    const key = monthLabel(l.submittedAt);
    if (!buckets.has(key)) continue;
    const b = buckets.get(key)!;
    if (l.status === 'DISBURSED' || l.status === 'REPAID') b.disbursed += l.amount;
    else if (l.status === 'PENDING' || l.status === 'UNDER_REVIEW' || l.status === 'APPROVED')
      b.pending += l.amount;
  }
  return Array.from(buckets.entries()).map(([month, v]) => ({ month, ...v }));
}

export default async function AdminDashboard() {
  const store = await cookies();
  const token = store.get(ACCESS_COOKIE)?.value;
  if (!token) redirect('/login');

  const [summary, allLoans] = await Promise.all([
    getJson<AnalyticsSummary>('/api/admin/analytics/summary', token),
    getJson<Paged<Loan>>('/api/loans?size=200&sort=submittedAt,desc', token),
  ]);

  if (!summary) {
    return (
      <div>
        <PageHeader title="Analytics" description="Portfolio overview" />
        <Card className="border-rose-200 bg-rose-50 text-sm text-rose-800">
          Could not load analytics. Make sure you have the required permissions.
        </Card>
      </div>
    );
  }

  const statusData = [
    { name: 'Pending', value: summary.pendingCount },
    { name: 'Approved', value: summary.approvedCount },
    { name: 'Disbursed', value: summary.disbursedCount },
    { name: 'Rejected', value: summary.rejectedCount },
  ];

  const monthlyData = aggregateByMonth(allLoans?.content ?? []);
  const approvalBase = summary.approvedCount + summary.rejectedCount;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description={`Portfolio overview · ${summary.currency}`}
        actions={<AnalyticsExportButton summary={summary} />}
      />

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total loans"
          value={summary.totalLoans}
          tone="brand"
          icon={<BanknotesIcon className="h-5 w-5" />}
        />
        <StatCard
          label="Pending"
          value={summary.pendingCount}
          tone="amber"
          icon={<ClockIcon className="h-5 w-5" />}
        />
        <StatCard
          label="Disbursed"
          value={summary.disbursedCount}
          tone="violet"
          icon={<CurrencyDollarIcon className="h-5 w-5" />}
        />
        <StatCard
          label="Rejected"
          value={summary.rejectedCount}
          tone="rose"
          icon={<XCircleIcon className="h-5 w-5" />}
        />
      </div>

      {/* Amount cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="bg-gradient-to-br from-emerald-500/10 to-teal-500/5">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Total disbursed ({summary.currency})
          </p>
          <p className="mt-2 text-3xl font-semibold tabular-nums text-slate-900">
            {formatMoney(summary.totalDisbursedAmount, summary.currency)}
          </p>
        </Card>
        <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/5">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Total pending ({summary.currency})
          </p>
          <p className="mt-2 text-3xl font-semibold tabular-nums text-slate-900">
            {formatMoney(summary.totalPendingAmount, summary.currency)}
          </p>
        </Card>
      </div>

      {/* Charts row 1 */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="h-[340px]">
          <h2 className="text-sm font-semibold text-slate-900">Loans by status</h2>
          <p className="mb-4 text-xs text-slate-500">Count per workflow stage</p>
          <div className="h-[240px]">
            <StatusBarChart data={statusData} />
          </div>
        </Card>
        <Card className="h-[340px]">
          <h2 className="text-sm font-semibold text-slate-900">Distribution</h2>
          <p className="mb-4 text-xs text-slate-500">Share of portfolio by state</p>
          <div className="h-[240px]">
            <StatusPieChart data={statusData} />
          </div>
        </Card>
      </div>

      {/* Charts row 2 */}
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card className="h-[340px]">
          <h2 className="text-sm font-semibold text-slate-900">Volume over time</h2>
          <p className="mb-4 text-xs text-slate-500">Last 6 months · TZS</p>
          <div className="h-[240px]">
            {monthlyData.some((m) => m.disbursed + m.pending > 0) ? (
              <AmountAreaChart data={monthlyData} />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">
                No volume data yet
              </div>
            )}
          </div>
        </Card>
        <Card className="h-[340px]">
          <h2 className="text-sm font-semibold text-slate-900">Decisions</h2>
          <p className="mb-4 text-xs text-slate-500">Approval vs rejection ratio</p>
          <div className="h-[240px]">
            <ApprovalRadial approved={summary.approvedCount} total={approvalBase} />
          </div>
        </Card>
      </div>
    </div>
  );
}

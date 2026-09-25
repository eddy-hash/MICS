'use client';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  RadialBarChart, RadialBar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

const CHART_COLORS = {
  brand: '#14b8a6',
  cyan: '#06b6d4',
  amber: '#f59e0b',
  emerald: '#10b981',
  violet: '#8b5cf6',
  rose: '#ef4444',
  slate: '#94a3b8',
};

const STATUS_COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444'];

interface StatusDatum {
  name: string;
  value: number;
}

export function StatusBarChart({ data }: { data: StatusDatum[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CHART_COLORS.brand} stopOpacity={0.9} />
            <stop offset="100%" stopColor={CHART_COLORS.cyan} stopOpacity={0.6} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
        <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{
            borderRadius: 10,
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
            fontSize: 12,
          }}
        />
        <Bar dataKey="value" fill="url(#barGradient)" radius={[8, 8, 0, 0]} animationDuration={700} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function StatusPieChart({ data }: { data: StatusDatum[] }) {
  const filtered = data.filter((d) => d.value > 0);
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={filtered}
          dataKey="value"
          nameKey="name"
          innerRadius={60}
          outerRadius={90}
          paddingAngle={3}
          animationDuration={700}
        >
          {filtered.map((_, i) => (
            <Cell key={i} fill={STATUS_COLORS[i % STATUS_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            borderRadius: 10,
            border: '1px solid #e2e8f0',
            fontSize: 12,
          }}
        />
        <Legend
          iconType="circle"
          wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

interface AmountDatum {
  month: string;
  disbursed: number;
  pending: number;
}

export function AmountAreaChart({ data }: { data: AmountDatum[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="disbursedGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CHART_COLORS.brand} stopOpacity={0.35} />
            <stop offset="100%" stopColor={CHART_COLORS.brand} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="pendingGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CHART_COLORS.amber} stopOpacity={0.35} />
            <stop offset="100%" stopColor={CHART_COLORS.amber} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
        <YAxis
          tick={{ fontSize: 12, fill: '#64748b' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => (v >= 1_000_000 ? `${(v / 1_000_000).toFixed(0)}M` : `${v}`)}
        />
        <Tooltip
          contentStyle={{
            borderRadius: 10,
            border: '1px solid #e2e8f0',
            fontSize: 12,
          }}
          formatter={(v: number) => `${v.toLocaleString()} TZS`}
        />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
        <Area
          type="monotone"
          dataKey="disbursed"
          stroke={CHART_COLORS.brand}
          strokeWidth={2}
          fill="url(#disbursedGrad)"
          animationDuration={700}
        />
        <Area
          type="monotone"
          dataKey="pending"
          stroke={CHART_COLORS.amber}
          strokeWidth={2}
          fill="url(#pendingGrad)"
          animationDuration={700}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

interface RadialDatum {
  name: string;
  value: number;
  fill: string;
}

export function ApprovalRadial({ approved, total }: { approved: number; total: number }) {
  const rate = total === 0 ? 0 : Math.round((approved / total) * 100);
  const data: RadialDatum[] = [
    { name: 'Approved', value: rate, fill: CHART_COLORS.emerald },
    { name: 'Other', value: 100 - rate, fill: '#e2e8f0' },
  ];
  return (
    <div className="relative h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          data={data}
          innerRadius="70%"
          outerRadius="100%"
          startAngle={90}
          endAngle={-270}
        >
          <RadialBar dataKey="value" cornerRadius={12} animationDuration={700} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-3xl font-semibold tabular-nums text-slate-900">{rate}%</p>
        <p className="mt-0.5 text-xs text-slate-500">Approval rate</p>
      </div>
    </div>
  );
}

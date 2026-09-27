'use client';
import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

type Tone = 'brand' | 'amber' | 'emerald' | 'rose' | 'violet' | 'slate';

const tones: Record<Tone, { bg: string; ring: string; text: string; blob: string }> = {
  brand:   { bg: 'from-brand-500/10 to-cyan-500/5',        ring: 'ring-brand-500/10',    text: 'text-brand-700',   blob: 'bg-brand-500/20' },
  amber:   { bg: 'from-amber-500/10 to-orange-500/5',      ring: 'ring-amber-500/10',    text: 'text-amber-700',   blob: 'bg-amber-500/20' },
  emerald: { bg: 'from-emerald-500/10 to-teal-500/5',      ring: 'ring-emerald-500/10',  text: 'text-emerald-700', blob: 'bg-emerald-500/20' },
  rose:    { bg: 'from-rose-500/10 to-red-500/5',          ring: 'ring-rose-500/10',     text: 'text-rose-700',    blob: 'bg-rose-500/20' },
  violet:  { bg: 'from-violet-500/10 to-purple-500/5',     ring: 'ring-violet-500/10',   text: 'text-violet-700',  blob: 'bg-violet-500/20' },
  slate:   { bg: 'from-slate-500/5 to-slate-400/5',        ring: 'ring-slate-500/10',    text: 'text-slate-700',   blob: 'bg-slate-400/20' },
};

interface StatCardProps {
  label: string;
  value: string | number;
  hint?: string;
  tone?: Tone;
  icon?: ReactNode;
}

export function StatCard({ label, value, hint, tone = 'brand', icon }: StatCardProps) {
  const t = tones[tone];
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={cn(
        'relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ring-1',
        'bg-gradient-to-br',
        t.bg, t.ring,
      )}
    >
      <div className="relative z-10">
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</p>
          {icon && <span className={t.text}>{icon}</span>}
        </div>
        <p className="mt-3 text-2xl font-semibold tabular-nums text-slate-900">{value}</p>
        {hint && <p className="mt-1.5 text-xs text-slate-500">{hint}</p>}
      </div>
      <div className={cn('absolute -right-6 -top-6 h-24 w-24 rounded-full blur-2xl', t.blob)} />
    </motion.div>
  );
}

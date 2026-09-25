'use client';
import { motion } from 'framer-motion';
import type { LoanHistoryEntry } from '@/lib/types';
import { STATUS_LABEL } from '@/lib/types';
import { formatDateTime } from '@/lib/format';

export function LoanTimeline({ entries }: { entries: LoanHistoryEntry[] }) {
  if (entries.length === 0) {
    return <p className="text-sm text-slate-500">No history yet.</p>;
  }

  return (
    <ol className="relative space-y-1">
      {entries.map((h, i) => (
        <motion.li
          key={i}
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.06, duration: 0.24, ease: 'easeOut' }}
          className="relative flex gap-4 pb-5 last:pb-0"
        >
          {i < entries.length - 1 && (
            <span className="absolute left-[9px] top-5 h-full w-px bg-slate-200" />
          )}
          <span className="relative z-10 mt-1 h-5 w-5 shrink-0 rounded-full border-2 border-white bg-brand-500 shadow-sm ring-2 ring-brand-100" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              {h.fromStatus && (
                <span className="text-sm text-slate-500">{STATUS_LABEL[h.fromStatus]}</span>
              )}
              {h.fromStatus && <span className="text-xs text-slate-400">→</span>}
              <span className="text-sm font-semibold text-slate-900">
                {STATUS_LABEL[h.toStatus]}
              </span>
              {h.changedBy && (
                <span className="text-xs text-slate-500">by {h.changedBy}</span>
              )}
            </div>
            {h.notes && (
              <p className="mt-0.5 text-xs italic text-slate-500">{h.notes}</p>
            )}
            <p className="mt-0.5 text-[10px] uppercase tracking-wide text-slate-400">
              {formatDateTime(h.changedAt)}
            </p>
          </div>
        </motion.li>
      ))}
    </ol>
  );
}

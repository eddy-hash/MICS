import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type Tone = 'brand' | 'amber' | 'blue' | 'emerald' | 'violet' | 'rose' | 'slate';

const tones: Record<Tone, string> = {
  brand:   'bg-brand-50 text-brand-700 border-brand-200',
  amber:   'bg-amber-50 text-amber-700 border-amber-200',
  blue:    'bg-blue-50 text-blue-700 border-blue-200',
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  violet:  'bg-violet-50 text-violet-700 border-violet-200',
  rose:    'bg-rose-50 text-rose-700 border-rose-200',
  slate:   'bg-slate-100 text-slate-600 border-slate-200',
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  dot?: boolean;
}

export function Badge({ tone = 'slate', dot = false, className, children, ...rest }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        tones[tone],
        className,
      )}
      {...rest}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />}
      {children}
    </span>
  );
}

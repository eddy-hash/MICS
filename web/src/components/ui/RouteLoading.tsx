'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface RouteLoadingProps {
  /** Optional label under the spinner */
  label?: string;
  /** Full-page (h-screen) or inline (h-64) */
  full?: boolean;
  className?: string;
}

export function RouteLoading({
  label = 'Loading…',
  full = false,
  className,
}: RouteLoadingProps) {
  return (
    <div
      className={cn(
        'flex w-full flex-col items-center justify-center gap-4',
        full ? 'h-screen' : 'min-h-[60vh]',
        className,
      )}
    >
      {/* Spinning ring */}
      <div className="relative h-12 w-12">
        <motion.span
          className="absolute inset-0 rounded-full border-2 border-brand-100 border-t-brand-600 dark:border-brand-500/20 dark:border-t-brand-400"
          animate={{ rotate: 360 }}
          transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
        />
        <motion.span
          className="absolute inset-2 rounded-full bg-brand-500/10 dark:bg-brand-500/20"
          animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Label with shimmer */}
      <motion.p
        className="text-sm font-medium text-slate-500 dark:text-slate-400"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
      >
        {label}
      </motion.p>
    </div>
  );
}

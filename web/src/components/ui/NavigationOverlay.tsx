'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';

/** Minimum time the overlay stays visible (ms) */
const MIN_DURATION = 600;
/** Fade in/out duration (ms) */
const FADE = 180;

export function NavigationOverlay() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const prevPath = useRef(pathname);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Skip first mount
    if (prevPath.current === pathname) return;

    // Path changed → show overlay for at least MIN_DURATION
    prevPath.current = pathname;
    setVisible(true);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setVisible(false), MIN_DURATION);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [pathname]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="nav-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: FADE / 1000 }}
          className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center bg-white/70 backdrop-blur-sm dark:bg-slate-950/70"
        >
          <div className="flex flex-col items-center gap-4">
            {/* Dual-ring spinner */}
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

            <motion.span
              className="text-sm font-medium tracking-wide text-slate-600 dark:text-slate-300"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
            >
              Loading…
            </motion.span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

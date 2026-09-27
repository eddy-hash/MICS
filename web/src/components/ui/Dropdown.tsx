'use client';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface DropdownProps {
  trigger: ReactNode;
  children: ReactNode;
  align?: 'left' | 'right';
  className?: string;
}

export function Dropdown({ trigger, children, align = 'right', className }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <div onClick={() => setOpen(!open)}>{trigger}</div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -4 }}
            transition={{ duration: 0.14, ease: 'easeOut' }}
            style={{ transformOrigin: align === 'right' ? 'top right' : 'top left' }}
            className={cn(
              'absolute z-50 mt-2 min-w-[12rem] overflow-hidden rounded-xl border shadow-xl',
              'border-slate-200 bg-white',
              'dark:border-slate-700 dark:bg-slate-800',
              align === 'right' ? 'right-0' : 'left-0',
              className,
            )}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function DropdownItem({
  onClick,
  danger,
  children,
  icon,
}: {
  onClick?: () => void;
  danger?: boolean;
  children: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'group flex w-full items-center gap-3 px-3.5 py-2 text-sm font-medium transition',
        danger
          ? 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10'
          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60',
      )}
    >
      {icon && (
        <span
          className={cn(
            'flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors',
            danger
              ? 'bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400'
              : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 group-hover:bg-slate-200/80 dark:group-hover:bg-slate-600',
          )}
        >
          {icon}
        </span>
      )}
      <span className="truncate">{children}</span>
    </button>
  );
}

export function DropdownDivider() {
  return <div className="my-1 border-t border-slate-100 dark:border-slate-700" />;
}

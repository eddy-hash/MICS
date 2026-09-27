import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  label?: string;
  hint?: string;
  error?: string;
  leading?: ReactNode;
  suffix?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, leading, suffix, className, id, ...rest },
  ref,
) {
  const inputId = id ?? rest.name;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200 dark:text-slate-300">
          {label}
        </label>
      )}
      <div
        className={cn(
          'flex items-center gap-2 rounded-lg border bg-white px-3 transition dark:bg-slate-900',
          'focus-within:ring-2 focus-within:ring-brand-500/40 focus-within:border-brand-500',
          error ? 'border-rose-400' : 'border-slate-300 dark:border-slate-700',
        )}
      >
        {leading && <span className="text-sm text-slate-500 dark:text-slate-400">{leading}</span>}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'h-10 w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-white dark:placeholder:text-slate-500',
            'tabular-nums',
            className,
          )}
          {...rest}
        />
        {suffix && <span className="text-sm text-slate-500 dark:text-slate-400">{suffix}</span>}
      </div>
      {error ? (
        <p className="mt-1.5 text-xs text-rose-600">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">{hint}</p>
      ) : null}
    </div>
  );
});

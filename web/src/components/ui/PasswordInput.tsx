'use client';
import { forwardRef, useState, type InputHTMLAttributes } from 'react';
import { EyeIcon, EyeSlashIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface PasswordInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput({ label, hint, error, className, id, ...rest }, ref) {
    const [show, setShow] = useState(false);
    const inputId = id ?? rest.name;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-slate-700">
            {label}
          </label>
        )}
        <div
          className={cn(
            'flex items-center gap-2 rounded-lg border bg-white px-3 transition',
            'focus-within:ring-2 focus-within:ring-brand-500/40 focus-within:border-brand-500',
            error ? 'border-rose-400' : 'border-slate-300',
          )}
        >
          <LockClosedIcon className="h-4 w-4 shrink-0 text-slate-400" />
          <input
            ref={ref}
            id={inputId}
            type={show ? 'text' : 'password'}
            className={cn(
              'h-10 w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400',
              className,
            )}
            {...rest}
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? 'Hide password' : 'Show password'}
            aria-pressed={show}
            className="shrink-0 rounded p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            tabIndex={-1}
          >
            {show ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
          </button>
        </div>
        {error ? (
          <p className="mt-1.5 text-xs text-rose-600">{error}</p>
        ) : hint ? (
          <p className="mt-1.5 text-xs text-slate-500">{hint}</p>
        ) : null}
      </div>
    );
  },
);

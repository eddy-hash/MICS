'use client';
import { forwardRef } from 'react';
import { Input } from '@/components/ui/Input';

interface MoneyInputProps {
  label?: string;
  value: number;
  onChange: (n: number) => void;
  currency?: string;
  min?: number;
  max?: number;
  hint?: string;
  error?: string;
  required?: boolean;
  name?: string;
}

export const MoneyInput = forwardRef<HTMLInputElement, MoneyInputProps>(function MoneyInput(
  { label, value, onChange, currency = 'TZS', min, max, hint, error, required, name },
  ref,
) {
  return (
    <Input
      ref={ref}
      name={name}
      label={label}
      type="number"
      required={required}
      min={min}
      max={max}
      step={1000}
      value={Number.isFinite(value) ? value : ''}
      onChange={(e) => onChange(Number(e.target.value))}
      prefix={<span className="text-xs font-medium text-slate-500">{currency}</span>}
      hint={hint}
      error={error}
      className="tabular-nums"
    />
  );
});

'use client';
import { forwardRef, useState } from 'react';
import { Input } from '@/components/ui/Input';

interface InterestRateInputProps {
  label?: string;
  value: number;
  onChange: (decimal: number) => void;
  hint?: string;
  error?: string;
  required?: boolean;
  name?: string;
}

/**
 * Internal state is stored as a percentage string, but the value passed to
 * onChange is a decimal (0.15 = 15%). Prevents confusing user input.
 */
export const InterestRateInput = forwardRef<HTMLInputElement, InterestRateInputProps>(
  function InterestRateInput({ label, value, onChange, hint, error, required, name }, ref) {
    const [text, setText] = useState(value ? String(value * 100) : '');

    return (
      <Input
        ref={ref}
        name={name}
        label={label}
        type="number"
        step={0.1}
        min={0}
        max={100}
        required={required}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          const pct = Number(e.target.value);
          onChange(Number.isFinite(pct) ? pct / 100 : 0);
        }}
        suffix={<span className="text-xs font-medium text-slate-500">% p.a.</span>}
        hint={hint}
        error={error}
        className="tabular-nums"
      />
    );
  },
);

'use client';
import { useEffect, useState } from 'react';
import { motion, useMotionValue, animate } from 'framer-motion';
import { formatMoney, formatNumber } from '@/lib/format';

type Mode = 'number' | 'money';

interface CountUpNumberProps {
  value: number;
  mode?: Mode;
  currency?: string;
  duration?: number;
  className?: string;
}

export function CountUpNumber({
  value,
  mode = 'number',
  currency = 'TZS',
  duration = 0.8,
  className,
}: CountUpNumberProps) {
  const format = (n: number) =>
    mode === 'money' ? formatMoney(n, currency) : formatNumber(Math.round(n));

  const motionValue = useMotionValue(0);
  const [display, setDisplay] = useState(format(0));

  useEffect(() => {
    const controls = animate(motionValue, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => setDisplay(format(latest)),
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, mode, currency]);

  return <motion.span className={className}>{display}</motion.span>;
}

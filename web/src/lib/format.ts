import { formatDistanceToNow, format as formatDate } from 'date-fns';

const TZS = new Intl.NumberFormat('en-TZ', {
  style: 'currency',
  currency: 'TZS',
  currencyDisplay: 'code',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const PLAIN = new Intl.NumberFormat('en-TZ', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function formatMoney(amount: number, currency = 'TZS'): string {
  if (currency === 'TZS') return TZS.format(amount).replace('TZS', 'TZS ');
  return new Intl.NumberFormat('en-TZ', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(n: number): string {
  return PLAIN.format(n);
}

export function formatPercent(decimal: number, digits = 2): string {
  return `${(decimal * 100).toFixed(digits)}%`;
}

export function formatDateShort(iso: string): string {
  return formatDate(new Date(iso), 'dd MMM yyyy');
}

export function formatDateTime(iso: string): string {
  return formatDate(new Date(iso), 'dd MMM yyyy · HH:mm');
}

export function timeAgo(iso: string): string {
  return formatDistanceToNow(new Date(iso), { addSuffix: true });
}

/** Estimate monthly payment using simple amortization. */
export function estimateMonthlyPayment(
  amount: number,
  annualRate: number,
  termMonths: number,
): number {
  const monthlyRate = annualRate / 12;
  if (monthlyRate === 0) return amount / termMonths;
  const factor = Math.pow(1 + monthlyRate, termMonths);
  return (amount * monthlyRate * factor) / (factor - 1);
}

export function totalPayable(
  amount: number,
  annualRate: number,
  termMonths: number,
): number {
  return estimateMonthlyPayment(amount, annualRate, termMonths) * termMonths;
}

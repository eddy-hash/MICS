'use client';
import { Suspense, useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { EnvelopeIcon, ExclamationCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { AuthSlideshow } from '@/components/auth/AuthSlideshow';
import { notify } from '@/lib/toast';

const SLIDES = [
  {
    src: '/auth/team.jpg',
    alt: 'Our team',
    caption: 'Building financial inclusion, one community at a time.',
  },
  {
    src: '/auth/brand.jpg',
    alt: 'Growth — coins and plants',
    caption: 'Small loans, real growth — for people who work hard every day.',
  },
  {
    src: '/auth/farmer.jpg',
    alt: 'Farmer with fresh tomatoes',
    caption: "Supporting Tanzania's farmers, traders, and entrepreneurs.",
  },
];

function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const from = search.get('from') ?? '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorKind, setErrorKind] = useState<'credentials' | 'rate-limit' | 'server' | 'network' | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setErrorKind(null);
    setBusy(true);

    try {
      const r = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      // ── 429: Too Many Requests ──
      if (r.status === 429) {
        const d = await r.json().catch(() => ({}));
        const msg =
          d?.message ??
          d?.detail?.message ??
          'Too many failed attempts. Please wait 15 minutes before trying again.';
        setError(msg);
        setErrorKind('rate-limit');
        notify.warning('Too many attempts', { subMessage: 'Try again later' });
        return;
      }

      // ── 401: Invalid credentials ──
      if (r.status === 401) {
        setError('Invalid email or password.');
        setErrorKind('credentials');
        notify.error('Sign in failed', { subMessage: 'Check your email and password' });
        return;
      }

      // ── 4xx/5xx other ──
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        setError(d?.message ?? `Server error (${r.status}). Please try again.`);
        setErrorKind('server');
        return;
      }

      // ── Success ──
      notify.welcomeBack(email.split('@')[0]);
      router.push(from);
      router.refresh();
    } catch {
      setError('Network error. Check your connection and try again.');
      setErrorKind('network');
      notify.error('Network error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="mx-auto w-full max-w-sm"
    >
      <div className="lg:hidden mb-8 flex items-center gap-2.5">
        <Image
          src="/auth/logo.jpg"
          alt="NaedCredit"
          width={40}
          height={40}
          className="h-10 w-10 rounded-xl object-contain"
          priority
        />
        <span className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
          <span className="font-bold text-slate-900 dark:text-white">Naed</span>
          <span className="text-brand-600 dark:text-brand-400">Credit</span>
        </span>
      </div>

      <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
        Sign in
      </h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Access your NaedCredit account
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <Input
          label="Email"
          type="email"
          required
          autoComplete="username"
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          prefix={<EnvelopeIcon className="h-4 w-4" />}
          disabled={busy}
        />
        <PasswordInput
          label="Password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={busy}
        />

        {/* Error banner — styled by kind */}
        {error && (
          <div
            className={
              errorKind === 'rate-limit'
                ? 'flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200'
                : 'flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300'
            }
          >
            {errorKind === 'rate-limit' ? (
              <ClockIcon className="mt-0.5 h-4 w-4 shrink-0" />
            ) : (
              <ExclamationCircleIcon className="mt-0.5 h-4 w-4 shrink-0" />
            )}
            <div>
              <p className="font-medium">
                {errorKind === 'rate-limit'
                  ? 'Too many failed attempts'
                  : errorKind === 'network'
                    ? 'Network error'
                    : errorKind === 'server'
                      ? 'Something went wrong'
                      : 'Sign in failed'}
              </p>
              <p className="mt-0.5 text-xs opacity-90">{error}</p>
            </div>
          </div>
        )}

        <Button type="submit" size="lg" fullWidth loading={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>

      <div className="mt-6 flex items-center justify-center gap-2 text-sm">
        <Link
          href="/forgot-password"
          className="font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
        >
          Forgot password?
        </Link>
        <span className="text-slate-300 dark:text-slate-700">·</span>
        <Link
          href="/register"
          className="font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
        >
          Create account
        </Link>
      </div>
    </motion.div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen">
      <div className="relative hidden flex-1 overflow-hidden bg-slate-900 lg:block">
        <AuthSlideshow slides={SLIDES} />

        <div className="relative z-10 flex h-full flex-col justify-between p-12 text-white">
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src="/auth/logo.jpg"
              alt="NaedCredit"
              width={40}
              height={40}
              className="h-10 w-10 rounded-xl bg-white/10 object-contain p-1 backdrop-blur"
              priority
            />
            <span className="text-lg font-semibold tracking-tight">
              <span className="font-bold text-white">Naed</span>
              <span className="text-brand-400">Credit</span>
            </span>
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.6 }}
            className="max-w-md"
          >
            <h1 className="text-4xl font-semibold leading-tight tracking-tight drop-shadow-sm">
              Mikopo ya haraka,<br />usimamizi wa kisasa.
            </h1>
            <p className="mt-4 text-sm text-white/85">
              Secure loan management for microfinance institutions.
            </p>
          </motion.div>

          <p className="text-xs text-white/70">
            © {new Date().getFullYear()} NaedCredit. All rights reserved.
          </p>
        </div>
      </div>

      <div className="flex w-full flex-col justify-center px-6 py-12 lg:w-[520px] lg:px-16">
        <Suspense fallback={<div className="text-sm text-slate-500">Loading…</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}

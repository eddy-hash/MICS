'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, MotionConfig } from 'framer-motion';
import {
  EnvelopeIcon,
  ExclamationTriangleIcon,
  ExclamationCircleIcon,
  WifiIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { AuthSlideshow } from '@/components/auth/AuthSlideshow';
import { notify } from '@/lib/toast';

type ErrorKind = 'invalid' | 'rate-limit' | 'server' | 'network' | null;

const SLIDES = [
  {
    src: '/auth/team.jpg',
    alt: 'Timu yetu',
    caption: 'Kujenga ujumuishaji wa kifedha, jamii moja kwa wakati mmoja.',
  },
  {
    src: '/auth/brand.jpg',
    alt: 'Ukuaji',
    caption: 'Mikopo midogo, ukuaji wa kweli — kwa wafanyakazi wa kila siku.',
  },
  {
    src: '/auth/farmer.jpg',
    alt: 'Mkulima',
    caption: 'Kusaidia wakulima, wafanyabiashara na wajasiriamali wa Tanzania.',
  },
];

const fieldVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

/* Each row slides left → right slowly, holds, then repeats.
   The `custom` index offsets each row by 500ms so they animate
   one sentence after another, and keep looping. */
const panelRow = {
  hidden: { opacity: 0, x: -40 },
  visible: (i: number) => ({
    opacity: [0, 1, 1, 0],
    x: [-40, 0, 0, -40],
    transition: {
      duration: 3,
      times: [0, 0.2, 0.8, 1],
      ease: [0.22, 1, 0.36, 1],
      repeat: Infinity,
      repeatDelay: 0.4,
      delay: i * 0.5,
    },
  }),
};

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from') || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorKind, setErrorKind] = useState<ErrorKind>(null);
  const [errorMessage, setErrorMessage] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorKind(null);
    setErrorMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        const username = email.split('@')[0];
        notify.welcomeBack(username);
        router.push(from);
        router.refresh();
        return;
      }

      let kind: ErrorKind;
      let message: string;

      if (res.status === 400 || res.status === 401) {
        kind = 'invalid';
        message = 'Invalid email or password.';
      } else if (res.status === 429) {
        kind = 'rate-limit';
        message = 'Too many attempts. Please wait a moment before trying again.';
      } else if (res.status >= 500) {
        kind = 'server';
        message = 'Something went wrong on our end. Please try again later.';
      } else {
        kind = 'server';
        message = "We couldn't sign you in right now. Please try again.";
      }

      setErrorKind(kind);
      setErrorMessage(message);
      notify.error(message);
    } catch {
      setErrorKind('network');
      setErrorMessage('You appear to be offline. Check your connection.');
      notify.error('Network error. Check your connection.');
    } finally {
      setLoading(false);
    }
  }

  const isRateLimit = errorKind === 'rate-limit';
  const bannerTone = isRateLimit
    ? 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/40 dark:border-amber-900 dark:text-amber-300'
    : 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300';
  const bannerIcon = isRateLimit ? (
    <ExclamationTriangleIcon className="h-5 w-5 shrink-0" />
  ) : errorKind === 'network' ? (
    <WifiIcon className="h-5 w-5 shrink-0" />
  ) : (
    <ExclamationCircleIcon className="h-5 w-5 shrink-0" />
  );

  return (
    <MotionConfig reducedMotion="never">
      <div className="flex min-h-screen w-full bg-white dark:bg-slate-950">
        {/* ─── Left panel — slideshow (desktop only) ─── */}
        <div className="relative hidden w-full max-w-[880px] flex-col justify-between overflow-hidden bg-slate-950 px-14 py-12 lg:flex">
          {/* Slideshow — images only, no caption/dots (tagline handles that) */}
          <div className="absolute inset-0">
            <AuthSlideshow slides={SLIDES} showCaption={false} showDots={false} />

            <div className="pointer-events-none absolute inset-0 bg-slate-950/40" />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-slate-950/80 to-transparent" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-slate-950/95 via-slate-950/70 to-transparent" />
          </div>

          {/* Top — brand */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="relative z-10 flex items-center gap-4"
          >
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-white/10 ring-1 ring-white/10 backdrop-blur">
              <Image
                src="/auth/logo.jpg"
                alt="NaedCredit"
                width={32}
                height={32}
                className="h-8 w-8 rounded-full object-cover"
                priority
              />
            </div>
            <span className="text-lg font-semibold tracking-tight">
              <span className="font-bold text-white">Naed</span>
              <span className="text-brand-400">Credit</span>
            </span>
          </motion.div>

          {/* Spacer — pushes tagline to bottom */}
          <div className="relative z-10 flex-1" />

          {/* Bottom — left-aligned. Each sentence slides left → right,
              then repeats, offset 500ms apart. */}
          <div className="relative z-10 flex w-full max-w-md flex-col gap-6">
            <motion.div
              custom={0}
              variants={panelRow}
              initial="hidden"
              animate="visible"
              className="space-y-3"
            >
              <h1 className="text-4xl font-semibold leading-tight tracking-tight text-white drop-shadow-sm">
                Maamuzi ya mikopo,
                <br />
                kwa ujasiri.
              </h1>
              <p className="text-sm leading-relaxed text-white/85">
                Mfumo mmoja wa kukagua mikopo, kufuata sheria na kuripoti —
                umeundwa kwa wakopeshaji Tanzania.
              </p>
            </motion.div>

            <motion.div
              custom={1}
              variants={panelRow}
              initial="hidden"
              animate="visible"
              className="flex items-center gap-6 rounded-xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur"
            >
              <div>
                <div className="text-2xl font-semibold text-white">TZS</div>
                <div className="text-xs text-white/60">Sarafu ya ndani</div>
              </div>
              <div className="h-8 w-px bg-white/10" />
              <div>
                <div className="text-2xl font-semibold text-white">RBAC</div>
                <div className="text-xs text-white/60">Ufikiaji kwa nafasi</div>
              </div>
              <div className="h-8 w-px bg-white/10" />
              <div>
                <div className="text-2xl font-semibold text-white">Imekaguliwa</div>
                <div className="text-xs text-white/60">Kumbukumbu kamili</div>
              </div>
            </motion.div>

            <motion.p
              custom={2}
              variants={panelRow}
              initial="hidden"
              animate="visible"
              className="text-xs leading-relaxed text-white/55"
            >
              Inaaminika na timu za ukopeshaji kusimamia mzunguko kamili wa
              mikopo, kutoka maombi hadi ukusanyaji.
            </motion.p>
          </div>
        </div>

        {/* ─── Right panel — form ─── */}
        <div className="relative flex w-full flex-1 items-center justify-center overflow-hidden bg-white px-8 py-12 dark:bg-slate-950">
          <div
            className="pointer-events-none absolute inset-0 opacity-40 dark:opacity-20"
            style={{
              backgroundImage:
                'radial-gradient(circle at 1px 1px, rgb(59 130 246 / 0.08) 1px, transparent 0)',
              backgroundSize: '28px 28px',
            }}
          />
          <div className="pointer-events-none absolute -top-32 right-[-10%] h-96 w-96 rounded-full bg-brand-500/5 blur-3xl" />

          <motion.div
            initial="hidden"
            animate="visible"
            transition={{ staggerChildren: 0.06 }}
            className="relative z-10 w-full max-w-lg"
          >
            {/* Mobile brand block */}
            <motion.div
              variants={fieldVariants}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="mb-8 flex items-center gap-3 lg:hidden"
            >
              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-brand-500/10">
                <Image
                  src="/auth/logo.jpg"
                  alt="NaedCredit"
                  width={28}
                  height={28}
                  className="h-7 w-7 rounded-full object-cover"
                  priority
                />
              </div>
              <span className="text-base font-semibold tracking-tight">
                <span className="font-bold text-slate-900 dark:text-white">Naed</span>
                <span className="text-brand-600 dark:text-brand-400">Credit</span>
              </span>
            </motion.div>

            <motion.div
              variants={fieldVariants}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="mb-8"
            >
              <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
                Sign in
              </h2>
              <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
                Sign in to your NaedCredit account
              </p>
            </motion.div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
              <motion.div variants={fieldVariants} transition={{ duration: 0.4, ease: 'easeOut' }}>
                <Input
                  type="email"
                  name="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  label="Email"
                  prefix={<EnvelopeIcon className="h-4 w-4" />}
                />
              </motion.div>

              <motion.div variants={fieldVariants} transition={{ duration: 0.4, ease: 'easeOut' }}>
                <PasswordInput
                  name="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  label="Password"
                />
              </motion.div>

              {errorKind && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className={`flex items-start gap-2 rounded-xl border px-3.5 py-2.5 text-sm ${bannerTone}`}
                >
                  {bannerIcon}
                  <span className="leading-snug">{errorMessage}</span>
                </motion.div>
              )}

              <motion.div variants={fieldVariants} transition={{ duration: 0.4, ease: 'easeOut' }}>
                <Button
                  type="submit"
                  disabled={loading}
                  className="h-11 w-full rounded-xl bg-brand-600 text-white transition-transform duration-150 hover:scale-[1.01] hover:bg-brand-600/90 active:scale-100"
                >
                  {loading ? 'Signing in…' : 'Sign in'}
                </Button>
              </motion.div>
            </form>

            <div className="mt-8 border-t border-slate-200 pt-5 dark:border-slate-800">
              <div className="flex items-center justify-between text-sm">
                <Link
                  href="/forgot-password"
                  className="text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                >
                  Forgot password?
                </Link>
                <Link
                  href="/register"
                  className="font-medium text-brand-600 transition-colors hover:text-brand-500 dark:text-brand-400 dark:hover:text-brand-300"
                >
                  Create account
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </MotionConfig>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen w-full items-center justify-center bg-white dark:bg-slate-950">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-brand-500 dark:border-slate-800" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

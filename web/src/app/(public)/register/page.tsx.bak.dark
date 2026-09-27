'use client';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { EnvelopeIcon, LockClosedIcon, UserIcon, PhoneIcon, CubeIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { AuthSlideshow } from '@/components/auth/AuthSlideshow';
import { SuccessModal } from '@/components/ui/SuccessModal';
import { notify } from '@/lib/toast';
import { cn } from '@/lib/utils';

const SLIDES = [
  {
    src: '/auth/farmer.jpg',
    alt: 'Farmer',
    caption: 'Start your journey — apply for a loan in minutes.',
  },
  {
    src: '/auth/team.jpg',
    alt: 'Team',
    caption: 'Real people. Real support. Real growth.',
  },
  {
    src: '/auth/brand.jpg',
    alt: 'Growth',
    caption: 'Transparent terms. Fast approvals.',
  },
];

function strength(p: string): { score: number; label: string; color: string } {
  let s = 0;
  if (p.length >= 12) s++;
  if (/[a-z]/.test(p)) s++;
  if (/[A-Z]/.test(p)) s++;
  if (/\d/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  const labels = ['Very weak', 'Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['bg-rose-500', 'bg-orange-500', 'bg-amber-500', 'bg-blue-500', 'bg-emerald-500'];
  const i = Math.max(0, Math.min(4, s - 1));
  return { score: s, label: labels[i], color: colors[i] };
}

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    email: '', password: '', firstName: '', lastName: '', phone: '',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successOpen, setSuccessOpen] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const r = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        setError(d?.message ?? 'Registration failed');
        notify.error('Registration failed', { subMessage: d?.message });
        return;
      }
      setSuccessOpen(true);
    } catch {
      setError('Network error');
      notify.error('Network error', { subMessage: 'Please try again' });
    } finally {
      setBusy(false);
    }
  }

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  const pw = strength(form.password);

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
              <span className="font-bold text-slate-900">Naed</span><span className="text-brand-600">Credit</span>
            </span>
          </Link>
          <div className="max-w-md">
            <h1 className="text-4xl font-semibold leading-tight">Create your account.</h1>
            <p className="mt-4 text-sm text-white/85">
              Apply for loans, track status, receive funds directly.
            </p>
          </div>
          <p className="text-xs text-white/70">© {new Date().getFullYear()} NaedCredit</p>
        </div>
      </div>

      <div className="flex w-full flex-col justify-center px-6 py-12 lg:w-[560px] lg:px-16">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mx-auto w-full max-w-sm"
        >
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Create account</h2>
          <p className="mt-1 text-sm text-slate-500">Get started in under a minute</p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input label="First name" required value={form.firstName} onChange={set('firstName')} prefix={<UserIcon className="h-4 w-4" />} />
              <Input label="Last name" required value={form.lastName} onChange={set('lastName')} prefix={<UserIcon className="h-4 w-4" />} />
            </div>

            <Input label="Email" type="email" required value={form.email} onChange={set('email')} prefix={<EnvelopeIcon className="h-4 w-4" />} />

            <Input label="Phone (optional)" type="tel" value={form.phone} onChange={set('phone')} placeholder="+255 7XX XXX XXX" prefix={<PhoneIcon className="h-4 w-4" />} />

            <div>
              <PasswordInput label="Password" required minLength={12} value={form.password} onChange={set('password')} />
              {form.password && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="h-1 flex-1 overflow-hidden rounded-full bg-slate-200">
                    <div className={cn('h-full transition-all', pw.color)} style={{ width: `${(pw.score / 5) * 100}%` }} />
                  </div>
                  <span className="text-xs text-slate-500">{pw.label}</span>
                </div>
              )}
              <p className="mt-1.5 text-xs text-slate-500">
                12+ characters with uppercase, lowercase, and a digit.
              </p>
            </div>

            {error && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {error}
              </div>
            )}

            <Button type="submit" size="lg" fullWidth loading={busy}>
              {busy ? 'Creating…' : 'Create account'}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-brand-600 hover:text-brand-700">
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>

      <SuccessModal
        open={successOpen}
        onClose={() => { setSuccessOpen(false); router.push('/dashboard'); router.refresh(); }}
        title="Account created"
        message="Welcome to NaedCredit. You're signed in and ready to go."
        details={
          <div className="space-y-1 text-slate-700">
            <p><span className="text-slate-500">Name:</span> {form.firstName} {form.lastName}</p>
            <p><span className="text-slate-500">Email:</span> {form.email}</p>
          </div>
        }
        buttonText="Go to dashboard"
        onButtonClick={() => { setSuccessOpen(false); router.push('/dashboard'); router.refresh(); }}
      />
    </div>
  );
}

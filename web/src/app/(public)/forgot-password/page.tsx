'use client';
import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { EnvelopeIcon, ArrowLeftIcon, CubeIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { notify } from '@/lib/toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setSent(true);
      notify.success('Reset link sent', { subMessage: `Check ${email} for instructions` });
    } catch {
      notify.error('Could not send reset link');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-brand-50/30 px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        <Link href="/" className="mb-8 flex items-center justify-center gap-2.5">
          <Image
            src="/auth/logo.jpg"
            alt="NaedCredit"
            width={40}
            height={40}
            className="h-10 w-10 rounded-xl object-contain"
            priority
          />
          <span className="text-lg font-semibold tracking-tight text-slate-900">
            <span className="font-bold text-slate-900">Naed</span>
            <span className="text-brand-600">Credit</span>
          </span>
        </Link>

        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          {/* Centered heading */}
          <div className="text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Reset your password
            </h1>
            <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-slate-500">
              We&apos;ll email a secure link if an account exists for that address.
            </p>
          </div>

          {sent ? (
            <div className="mt-6 space-y-4">
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-sm text-emerald-800">
                If <b>{email}</b> exists, a reset link is on its way.
                <br />
                Check your inbox.
              </div>
              <Link href="/login">
                <Button variant="outline" fullWidth leftIcon={<ArrowLeftIcon className="h-4 w-4" />}>
                  Back to sign in
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              <Input
                label="Email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                prefix={<EnvelopeIcon className="h-4 w-4" />}
              />
              <Button type="submit" size="lg" fullWidth loading={busy}>
                {busy ? 'Sending…' : 'Send reset link'}
              </Button>
            </form>
          )}

          {!sent && (
            <div className="mt-6 text-center text-sm">
              <Link
                href="/login"
                className="font-medium text-brand-600 hover:text-brand-700"
              >
                Back to sign in
              </Link>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

'use client';
import { use, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { CubeIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { SuccessModal } from '@/components/ui/SuccessModal';
import { notify } from '@/lib/toast';

export default function ResetPasswordPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successOpen, setSuccessOpen] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const r = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword: password }),
    });
    setBusy(false);
    if (!r.ok) {
      const d = await r.json().catch(() => ({}));
      setError(d?.message ?? 'Reset failed');
      notify.error('Reset failed', { subMessage: d?.message });
      return;
    }
    setSuccessOpen(true);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-brand-50/30 px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        {/* Brand — centered */}
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
            <span className="font-bold text-slate-900">Naed</span><span className="text-brand-600">Credit</span>
          </span>
        </Link>

        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          {/* Heading — centered */}
          <div className="text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Set new password
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Choose a strong password for your account.
            </p>
          </div>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <PasswordInput
              label="New password"
              required
              minLength={12}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              hint="12+ characters with uppercase, lowercase, and a digit."
            />
            {error && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {error}
              </div>
            )}
            <Button type="submit" size="lg" fullWidth loading={busy}>
              {busy ? 'Updating…' : 'Update password'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <Link href="/login" className="font-medium text-brand-600 hover:text-brand-700">
              Back to sign in
            </Link>
          </div>
        </div>
      </motion.div>

      <SuccessModal
        open={successOpen}
        onClose={() => router.push('/login')}
        title="Password updated"
        message="Your password has been changed. Sign in with your new credentials."
        buttonText="Sign in"
        onButtonClick={() => router.push('/login')}
      />
    </div>
  );
}

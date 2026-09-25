'use client';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LockClosedIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ShieldCheckIcon,
  EyeIcon,
  EyeSlashIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { SuccessModal } from '@/components/ui/SuccessModal';
import { notify } from '@/lib/toast';
import { cn } from '@/lib/utils';

type Step = 1 | 2 | 3;

interface PasswordWizardProps {
  onCancel?: () => void;
}

// ─── Password strength scoring ───
function scorePassword(p: string): { score: number; label: string; color: string } {
  let s = 0;
  if (p.length >= 12) s++;
  if (p.length >= 16) s++;
  if (/[a-z]/.test(p)) s++;
  if (/[A-Z]/.test(p)) s++;
  if (/\d/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  const labels = ['Very weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very strong'];
  const colors = ['bg-rose-500', 'bg-rose-400', 'bg-amber-500', 'bg-amber-400', 'bg-emerald-500', 'bg-emerald-600'];
  const i = Math.min(5, Math.max(0, s - 1));
  return { score: s, label: labels[i], color: colors[i] };
}

const STEP_LABELS: Record<Step, string> = {
  1: 'Verify identity',
  2: 'Set new password',
  3: 'Complete',
};

export function PasswordWizard({ onCancel }: PasswordWizardProps) {
  const router = useRouter();

  const [step, setStep] = useState<Step>(1);
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');
  const [busy, setBusy] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);

  // Step 1
  const [currentPassword, setCurrentPassword] = useState('');
  const [currentPasswordError, setCurrentPasswordError] = useState<string | null>(null);

  // Step 2
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newPasswordError, setNewPasswordError] = useState<string | null>(null);

  const strength = scorePassword(newPassword);
  const passwordsMatch = newPassword === confirmPassword && newPassword.length > 0;

  const canProceedStep1 = currentPassword.length >= 8;
  const canProceedStep2 =
    newPassword.length >= 12 &&
    /[a-z]/.test(newPassword) &&
    /[A-Z]/.test(newPassword) &&
    /\d/.test(newPassword) &&
    passwordsMatch;

  // ─── Step 1 submit: verify current password by attempting login ───
  async function verifyCurrentPassword(e: FormEvent) {
    e.preventDefault();
    setCurrentPasswordError(null);
    setBusy(true);
    try {
      // Get user's email from /api/me, then re-auth with the current password
      const meRes = await fetch('/api/me', { cache: 'no-store' });
      if (!meRes.ok) {
        setCurrentPasswordError('Could not verify identity. Please sign in again.');
        return;
      }
      const me = await meRes.json();
      const email = me?.email;

      const loginRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: currentPassword }),
      });

      if (!loginRes.ok) {
        setCurrentPasswordError('Current password is incorrect.');
        notify.error('Wrong password', { subMessage: 'Please try again' });
        return;
      }

      // Verified — advance
      setDirection('forward');
      setStep(2);
    } catch {
      setCurrentPasswordError('Network error. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  // ─── Step 2 submit: change password ───
  async function submitNewPassword(e: FormEvent) {
    e.preventDefault();
    setNewPasswordError(null);

    if (!canProceedStep2) {
      if (!passwordsMatch) {
        setNewPasswordError('Passwords do not match.');
      } else {
        setNewPasswordError('Password must be 12+ chars with uppercase, lowercase, and a digit.');
      }
      return;
    }

    setBusy(true);
    try {
      const r = await fetch('/api/me/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        setNewPasswordError(d?.message ?? 'Could not change password');
        notify.error('Password change failed', { subMessage: d?.message });
        return;
      }

      setDirection('forward');
      setStep(3);
      notify.success('Password changed');
    } catch {
      setNewPasswordError('Network error. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  function goBack() {
    if (step === 2) {
      setDirection('back');
      setStep(1);
    }
  }

  async function finishAndSignOut() {
    setSuccessOpen(false);
    await fetch('/api/auth/logout', { method: 'POST' });
    notify.logout('Signed out', { subMessage: 'Sign in with your new password' });
    router.push('/login');
    router.refresh();
  }

  const slideVariants = {
    enter: (dir: 'forward' | 'back') => ({
      x: dir === 'forward' ? 60 : -60,
      opacity: 0,
    }),
    center: { x: 0, opacity: 1 },
    exit: (dir: 'forward' | 'back') => ({
      x: dir === 'forward' ? -60 : 60,
      opacity: 0,
    }),
  };

  return (
    <>
      <Card className="overflow-hidden">
        {/* Header */}
        <div className="border-b border-slate-100 dark:border-slate-800 px-5 pb-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-cyan-500 text-white shadow-sm">
              <ShieldCheckIcon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                Change password
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {STEP_LABELS[step]}
              </p>
            </div>
          </div>

          {/* Progress dots */}
          <div className="mt-5 flex items-center gap-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex flex-1 items-center gap-2">
                <div
                  className={cn(
                    'grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-semibold transition',
                    s < step && 'bg-brand-600 text-white',
                    s === step && 'bg-brand-600 text-white ring-4 ring-brand-100 dark:ring-brand-500/20',
                    s > step && 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500',
                  )}
                >
                  {s < step ? <CheckCircleIcon className="h-4 w-4" /> : s}
                </div>
                {s < 3 && (
                  <div
                    className={cn(
                      'h-0.5 flex-1 rounded transition',
                      s < step ? 'bg-brand-600' : 'bg-slate-200 dark:bg-slate-700',
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Body — animated step content */}
        <div className="relative overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            {step === 1 && (
              <motion.form
                key="step-1"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.24, ease: 'easeOut' }}
                onSubmit={verifyCurrentPassword}
                className="space-y-4 p-5"
              >
                <div className="rounded-xl bg-brand-50/50 dark:bg-brand-500/5 p-3">
                  <p className="text-xs text-brand-900 dark:text-brand-200">
                    <b>Step 1 of 3:</b> Confirm your current password to verify your identity.
                  </p>
                </div>

                <PasswordInput
                  label="Current password"
                  required
                  autoFocus
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(e) => {
                    setCurrentPassword(e.target.value);
                    if (currentPasswordError) setCurrentPasswordError(null);
                  }}
                  error={currentPasswordError ?? undefined}
                  hint="Enter the password you use to sign in"
                />

                <div className="flex items-center justify-between gap-3 pt-2">
                  {onCancel && (
                    <Button type="button" variant="ghost" onClick={onCancel}>
                      Cancel
                    </Button>
                  )}
                  <Button
                    type="submit"
                    loading={busy}
                    disabled={!canProceedStep1}
                    className="ml-auto"
                    rightIcon={<ArrowRightIcon className="h-4 w-4" />}
                  >
                    Verify
                  </Button>
                </div>
              </motion.form>
            )}

            {step === 2 && (
              <motion.form
                key="step-2"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.24, ease: 'easeOut' }}
                onSubmit={submitNewPassword}
                className="space-y-4 p-5"
              >
                <div className="rounded-xl bg-brand-50/50 dark:bg-brand-500/5 p-3">
                  <p className="text-xs text-brand-900 dark:text-brand-200">
                    <b>Step 2 of 3:</b> Choose a new password. You&apos;ll be signed out of all devices after this.
                  </p>
                </div>

                <PasswordInput
                  label="New password"
                  required
                  autoFocus
                  minLength={12}
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (newPasswordError) setNewPasswordError(null);
                  }}
                />

                {newPassword && (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                        <div
                          className={cn('h-full transition-all duration-300', strength.color)}
                          style={{ width: `${(strength.score / 6) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        {strength.label}
                      </span>
                    </div>
                    <ul className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
                      <Requirement met={newPassword.length >= 12} text="12+ characters" />
                      <Requirement met={/[a-z]/.test(newPassword)} text="Lowercase" />
                      <Requirement met={/[A-Z]/.test(newPassword)} text="Uppercase" />
                      <Requirement met={/\d/.test(newPassword)} text="Number" />
                    </ul>
                  </div>
                )}

                <PasswordInput
                  label="Confirm new password"
                  required
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (newPasswordError) setNewPasswordError(null);
                  }}
                  error={
                    confirmPassword.length > 0 && !passwordsMatch
                      ? 'Passwords do not match'
                      : undefined
                  }
                  hint={confirmPassword && passwordsMatch ? '✓ Passwords match' : undefined}
                />

                {newPasswordError && (
                  <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
                    <ExclamationCircleIcon className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{newPasswordError}</span>
                  </div>
                )}

                <div className="flex items-center justify-between gap-3 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={goBack}
                    leftIcon={<ArrowLeftIcon className="h-4 w-4" />}
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    loading={busy}
                    disabled={!canProceedStep2}
                    rightIcon={<ArrowRightIcon className="h-4 w-4" />}
                  >
                    Change password
                  </Button>
                </div>
              </motion.form>
            )}

            {step === 3 && (
              <motion.div
                key="step-3"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.24, ease: 'easeOut' }}
                className="space-y-4 p-5"
              >
                <div className="flex flex-col items-center py-2 text-center">
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="relative grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg"
                  >
                    <CheckCircleIcon className="h-8 w-8 text-white" strokeWidth={3} />
                    <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400/40" />
                  </motion.div>

                  <h3 className="mt-5 text-lg font-semibold text-slate-900 dark:text-white">
                    Password changed
                  </h3>
                  <p className="mt-1 max-w-xs text-sm text-slate-500 dark:text-slate-400">
                    For security, all your active sessions on every device have been signed out.
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 text-sm">
                  <p className="text-slate-600 dark:text-slate-400">
                    Sign back in with your new password.
                  </p>
                </div>

                <Button
                  onClick={() => setSuccessOpen(true)}
                  size="lg"
                  fullWidth
                  leftIcon={<LockClosedIcon className="h-4 w-4" />}
                >
                  Sign in again
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Card>

      <SuccessModal
        open={successOpen}
        onClose={finishAndSignOut}
        title="Password updated"
        message="You'll be signed out and redirected to sign in."
        buttonText="Continue"
        onButtonClick={finishAndSignOut}
      />
    </>
  );
}

function Requirement({ met, text }: { met: boolean; text: string }) {
  return (
    <li className={cn('flex items-center gap-1.5', met ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500')}>
      <span className={cn('grid h-3 w-3 place-items-center rounded-full text-white', met ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700')}>
        {met && <CheckCircleIcon className="h-2.5 w-2.5" strokeWidth={4} />}
      </span>
      {text}
    </li>
  );
}

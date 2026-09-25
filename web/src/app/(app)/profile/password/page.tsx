'use client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { PageHeader } from '@/components/ui/PageHeader';
import { PasswordWizard } from '@/components/profile/PasswordWizard';

export default function ChangePasswordPage() {
  const router = useRouter();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/profile"
        className="inline-flex items-center gap-1 text-sm text-slate-500 transition hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
      >
        <ArrowLeftIcon className="h-4 w-4" /> Back to profile
      </Link>

      <PageHeader
        title="Change password"
        description="Secure your account by updating your password. All other sessions will be signed out."
      />

      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <PasswordWizard onCancel={() => router.push('/profile')} />
      </motion.div>
    </div>
  );
}

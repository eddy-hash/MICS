'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Skeleton } from '@/components/ui/Skeleton';
import { SuccessModal } from '@/components/ui/SuccessModal';
import { notify } from '@/lib/toast';
import { formatDateShort } from '@/lib/format';
import type { Profile } from '@/lib/types';
import { LockClosedIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '' });
  const [busyProfile, setBusyProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);

  useEffect(() => {
    fetch('/api/me', { cache: 'no-store' })
      .then((r) => r.json())
      .then((p: Profile) => {
        setProfile(p);
        setForm({ firstName: p.firstName, lastName: p.lastName, phone: p.phone ?? '' });
      })
      .catch(() => notify.error('Could not load profile'));
  }, []);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setBusyProfile(true);
    try {
      const r = await fetch('/api/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        notify.error('Update failed', { subMessage: d?.message });
        return;
      }
      notify.success('Profile updated');
      setProfileSuccess(true);
    } finally {
      setBusyProfile(false);
    }
  }

  if (!profile) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-40 w-full" rounded="lg" />
        <Skeleton className="h-64 w-full" rounded="lg" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Profile" description="Manage your personal details and password." />

      {/* Identity card */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <Card className="flex items-center gap-4">
          <Avatar name={`${profile.firstName} ${profile.lastName}`} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="text-lg font-semibold text-slate-900 dark:text-white">
              {profile.firstName} {profile.lastName}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{profile.email}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {profile.roles.map((r) => (
                <Badge key={r} tone="brand">
                  {r}
                </Badge>
              ))}
              {!profile.enabled && <Badge tone="rose">Disabled</Badge>}
              {profile.locked && <Badge tone="amber">Locked</Badge>}
            </div>
          </div>
          <div className="hidden shrink-0 text-right text-xs text-slate-500 dark:text-slate-400 sm:block">
            <p className="font-medium">Member since</p>
            <p>{formatDateShort(profile.createdAt)}</p>
          </div>
        </Card>
      </motion.div>

      {/* Personal details */}
      <Card>
        <h2 className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">
          Personal details
        </h2>
        <form onSubmit={saveProfile} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="First name"
              required
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            />
            <Input
              label="Last name"
              required
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            />
          </div>
          <Input
            label="Phone"
            type="tel"
            placeholder="+255 7XX XXX XXX"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <div className="flex justify-end">
            <Button type="submit" loading={busyProfile}>
              {busyProfile ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </form>
      </Card>

      {/* Password — link to separate page */}
      <Card>
        <Link
          href="/profile/password"
          className="flex items-start justify-between gap-4 group"
        >
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
              <LockClosedIcon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                Password
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Change your password in 3 quick steps. You&apos;ll be signed out of all devices.
              </p>
            </div>
          </div>
          <span className="flex items-center gap-1 text-sm font-medium text-brand-600 opacity-70 transition group-hover:opacity-100 dark:text-brand-400">
            Change
            <ArrowRightIcon className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </span>
        </Link>
      </Card>

      <SuccessModal
        open={profileSuccess}
        onClose={() => setProfileSuccess(false)}
        title="Profile updated"
        message="Your personal details have been saved."
        buttonText="Done"
      />
    </div>
  );
}

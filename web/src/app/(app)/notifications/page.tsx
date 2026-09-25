'use client';
import { useEffect, useState } from 'react';
import { BellIcon, CheckIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Tabs } from '@/components/ui/Tabs';
import { PageHeader } from '@/components/ui/PageHeader';
import { notify } from '@/lib/toast';
import { timeAgo } from '@/lib/format';
import type { Notification, Paged } from '@/lib/types';

export default function NotificationsPage() {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const qs = filter === 'unread' ? '?unreadOnly=true&size=100' : '?size=100';
      const r = await fetch(`/api/notifications${qs}`, { cache: 'no-store' });

      // Session expired → redirect
      if (r.status === 401) {
        window.location.href = '/login';
        return;
      }

      if (!r.ok) {
        setError(`Could not load notifications (${r.status})`);
        setItems([]);
        return;
      }

      const text = await r.text();
      if (!text) {
        setItems([]);
        return;
      }

      const d = JSON.parse(text) as Paged<Notification>;
      setItems(d.content ?? []);
    } catch (e) {
      setError((e as Error).message || 'Something went wrong');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  async function markAll() {
    try {
      const r = await fetch('/api/notifications/read-all', { method: 'POST' });
      if (!r.ok) {
        notify.error('Could not mark all as read');
        return;
      }
      notify.success('All notifications marked as read');
      load();
    } catch {
      notify.error('Network error');
    }
  }

  async function markRead(id: string) {
    const r = await fetch(`/api/notifications/${id}/read`, { method: 'POST' });
    if (!r.ok) return;
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }

  const unread = items.filter((n) => !n.read).length;

  return (
    <div>
      <PageHeader
        title="Notifications"
        description="Updates about your loans and account activity."
        actions={
          unread > 0 && (
            <Button variant="outline" size="sm" onClick={markAll} leftIcon={<CheckIcon className="h-4 w-4" />}>
              Mark all read
            </Button>
          )
        }
      />

      <Tabs
        tabs={[
          { id: 'all', label: 'All', count: items.length },
          { id: 'unread', label: 'Unread', count: unread },
        ]}
        value={filter}
        onChange={(id) => setFilter(id as 'all' | 'unread')}
        className="mb-5"
      />

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" rounded="lg" />
          ))}
        </div>
      ) : error ? (
        <Card className="border-rose-200 bg-rose-50 dark:border-rose-500/30 dark:bg-rose-500/10">
          <p className="text-sm text-rose-800 dark:text-rose-300">{error}</p>
          <Button variant="outline" size="sm" onClick={load} className="mt-3">
            Retry
          </Button>
        </Card>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<BellIcon className="h-6 w-6" />}
          title={filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
          description="You'll see updates here when loans change status or your account is modified."
        />
      ) : (
        <div className="space-y-2">
          {items.map((n) => (
            <Card
              key={n.id}
              className={`cursor-pointer transition ${
                n.read
                  ? ''
                  : 'border-l-4 border-l-brand-500 bg-brand-50/20 dark:bg-brand-500/5'
              }`}
              onClick={() => !n.read && markRead(n.id)}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${
                    n.read
                      ? 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                      : 'bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300'
                  }`}
                >
                  <BellIcon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {n.title}
                    </p>
                    <span className="shrink-0 text-xs text-slate-400 dark:text-slate-500">
                      {timeAgo(n.createdAt)}
                    </span>
                  </div>
                  {n.body && (
                    <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">
                      {n.body}
                    </p>
                  )}
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-500">
                    {n.type}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

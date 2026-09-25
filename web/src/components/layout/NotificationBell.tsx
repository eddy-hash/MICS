'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  BellIcon,
  CheckIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { notify } from '@/lib/toast';
import { timeAgo } from '@/lib/format';
import type { Notification, Paged } from '@/lib/types';

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Notification | null>(null);
  const [deleting, setDeleting] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  async function refresh() {
    try {
      const [c, l] = await Promise.all([
        fetch('/api/notifications/unread-count', { cache: 'no-store' }).then((r) => r.json()),
        fetch('/api/notifications?size=8', { cache: 'no-store' }).then((r) => r.json()),
      ]);
      setCount(c.count ?? 0);
      setItems((l as Paged<Notification>).content ?? []);
    } catch { /* silent */ }
  }

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 30_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  async function markAll() {
    await fetch('/api/notifications/read-all', { method: 'POST' });
    notify.success('All notifications marked as read');
    refresh();
  }

  async function markRead(id: string) {
    await fetch(`/api/notifications/${id}/read`, { method: 'POST' });
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setCount((c) => Math.max(0, c - 1));
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const r = await fetch(`/api/notifications/${deleteTarget.id}`, { method: 'DELETE' });
      if (!r.ok) {
        notify.error('Could not delete notification');
        return;
      }
      setItems((prev) => prev.filter((n) => n.id !== deleteTarget.id));
      if (!deleteTarget.read) setCount((c) => Math.max(0, c - 1));
      notify.success('Notification deleted');
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen((o) => !o)}
          aria-label="Notifications"
          className="relative rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <BellIcon className="h-5 w-5" />
          {count > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white shadow">
              {count > 9 ? '9+' : count}
            </span>
          )}
        </button>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -4 }}
              transition={{ duration: 0.14, ease: 'easeOut' }}
              style={{ transformOrigin: 'top right' }}
              className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl sm:w-96 dark:border-slate-800 dark:bg-slate-900"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Notifications
                  </h3>
                  {count > 0 && (
                    <span className="rounded-full bg-brand-100 px-1.5 py-0.5 text-[10px] font-bold text-brand-700 dark:bg-brand-500/20 dark:text-brand-300">
                      {count} new
                    </span>
                  )}
                </div>
                {count > 0 && (
                  <button
                    onClick={markAll}
                    className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              {/* List */}
              <div className="max-h-[420px] overflow-y-auto scrollbar-thin">
                {items.length === 0 ? (
                  <div className="px-4 py-12 text-center">
                    <BellIcon className="mx-auto mb-3 h-10 w-10 text-slate-300 dark:text-slate-600" />
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      No notifications yet
                    </p>
                    <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                      Updates about your loans will appear here.
                    </p>
                  </div>
                ) : (
                  <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                    {items.map((n) => (
                      <li
                        key={n.id}
                        className={`group flex items-start gap-3 px-4 py-3 transition ${
                          n.read
                            ? 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                            : 'bg-brand-50/40 hover:bg-brand-50/70 dark:bg-brand-500/5 dark:hover:bg-brand-500/10'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start gap-2">
                            {!n.read && (
                              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-500" />
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
                                {n.title}
                              </p>
                              {n.body && (
                                <p className="mt-0.5 line-clamp-2 text-xs text-slate-600 dark:text-slate-400">
                                  {n.body}
                                </p>
                              )}
                              <p className="mt-1 text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-500">
                                {timeAgo(n.createdAt)}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Hover actions */}
                        <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition group-hover:opacity-100">
                          {!n.read && (
                            <button
                              onClick={() => markRead(n.id)}
                              title="Mark as read"
                              aria-label="Mark as read"
                              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-brand-100 hover:text-brand-600 dark:hover:bg-brand-500/20 dark:hover:text-brand-300"
                            >
                              <CheckIcon className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => setDeleteTarget(n)}
                            title="Delete"
                            aria-label="Delete"
                            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-500/20 dark:hover:text-rose-400"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Footer */}
              {items.length > 0 && (
                <Link
                  href="/notifications"
                  onClick={() => setOpen(false)}
                  className="block border-t border-slate-100 px-4 py-3 text-center text-sm font-medium text-brand-600 transition hover:bg-brand-50/50 dark:border-slate-800 dark:text-brand-400 dark:hover:bg-slate-800"
                >
                  View all
                </Link>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ConfirmModal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete notification"
        message={`Are you sure you want to delete "${deleteTarget?.title ?? 'this notification'}"? This cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        loading={deleting}
      />
    </>
  );
}

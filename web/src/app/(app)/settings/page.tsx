'use client';
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';

type Theme = 'light' | 'dark' | 'system';

export default function SettingsPage() {
  const [theme, setTheme] = useState<Theme>('system');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = (localStorage.getItem('theme') as Theme) ?? 'system';
    setTheme(stored);
  }, []);

  function applyTheme(t: Theme) {
    setTheme(t);
    localStorage.setItem('theme', t);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Settings" description="Preferences for how LoanFlow looks and behaves." />

      <Card>
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Appearance</h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          This is stored per-browser. Full dark mode rollout arrives soon.
        </p>
        <div className="mt-4 grid grid-cols-3 gap-3">
          {(['light', 'dark', 'system'] as Theme[]).map((t) => (
            <button
              key={t}
              onClick={() => applyTheme(t)}
              className={`rounded-xl border p-4 text-left transition ${
                theme === t
                  ? 'border-brand-500 bg-brand-50/40 ring-1 ring-brand-500/20'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300'
              }`}
            >
              <p className="text-sm font-medium capitalize text-slate-900 dark:text-white">{t}</p>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                {t === 'light' ? 'Bright UI' : t === 'dark' ? 'Dim UI' : 'Follow OS'}
              </p>
            </button>
          ))}
        </div>
        {saved && <p className="mt-3 text-xs text-emerald-600">Saved</p>}
      </Card>

      <Card>
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Data &amp; privacy</h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Your session tokens are stored as HttpOnly cookies and cannot be read by JavaScript.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => {
              document.cookie.split(';').forEach((c) => {
                const name = c.split('=')[0].trim();
                document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
              });
              window.location.href = '/login';
            }}
          >
            Clear local data &amp; sign out
          </Button>
        </div>
      </Card>
    </div>
  );
}

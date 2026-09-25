'use client';
import { useEffect, useState, Fragment } from 'react';
import { ShieldCheckIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { ExportBundle } from '@/components/ui/ExportBundle';
import { type PdfOptions } from '@/lib/pdf';
import { Skeleton } from '@/components/ui/Skeleton';
import { SuccessModal } from '@/components/ui/SuccessModal';
import { notify } from '@/lib/toast';
import type { RbacMatrix, Role } from '@/lib/types';

const ROLES: Role[] = ['LOANEE', 'OFFICER', 'ADMINISTRATOR'];
const GROUP_ORDER = ['loan', 'user', 'audit', 'analytics', 'notification', 'profile', 'role'];
const GROUP_LABEL: Record<string, string> = {
  loan: 'Loans', user: 'Users', audit: 'Audit', analytics: 'Analytics',
  notification: 'Notifications', profile: 'Profile', role: 'Role administration',
};

function groupOf(perm: string): string {
  const head = perm.split(':')[0];
  return GROUP_LABEL[head] ? head : 'other';
}

export default function RbacPage() {
  const [matrix, setMatrix] = useState<RbacMatrix | null>(null);
  const [draft, setDraft] = useState<Record<Role, Set<string>>>({ LOANEE: new Set(), OFFICER: new Set(), ADMINISTRATOR: new Set() });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Role | null>(null);
  const [success, setSuccess] = useState<Role | null>(null);

  async function load() {
    setLoading(true);
    const r = await fetch('/api/admin/rbac', { cache: 'no-store' });
    const d: RbacMatrix = await r.json();
    setMatrix(d);
    setDraft({
      LOANEE: new Set(d.byRole.LOANEE ?? []),
      OFFICER: new Set(d.byRole.OFFICER ?? []),
      ADMINISTRATOR: new Set(d.byRole.ADMINISTRATOR ?? []),
    });
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function toggle(role: Role, perm: string) {
    setDraft((prev) => {
      const next = { ...prev, [role]: new Set(prev[role]) };
      if (next[role].has(perm)) next[role].delete(perm); else next[role].add(perm);
      return next;
    });
  }

  async function save(role: Role) {
    setSaving(role);
    try {
      const r = await fetch(`/api/admin/rbac/${role}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions: Array.from(draft[role]) }),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        notify.error(`Failed to save ${role}`, { subMessage: d?.message });
        return;
      }
      notify.success(`${role} permissions updated`);
      setSuccess(role);
      load();
    } finally { setSaving(null); }
  }


  function buildRbacPdf(): PdfOptions {
    const rows: string[][] = [];
    for (const perm of matrix.allPermissions) {
      rows.push([
        perm,
        draft.LOANEE.has(perm) ? '✓' : '',
        draft.OFFICER.has(perm) ? '✓' : '',
        draft.ADMINISTRATOR.has(perm) ? '✓' : '',
      ]);
    }
    return {
      header: {
        title: 'Roles & Permissions Matrix',
        subtitle: 'Snapshot of role→permission assignments',
      },
      tables: [
        {
          columns: ['Permission', 'LOANEE', 'OFFICER', 'ADMINISTRATOR'],
          rows,
        },
      ],
      footerNote:
        'Confidential — this document reflects the RBAC configuration at the time of export.',
    };
  }

  if (loading || !matrix) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[500px] w-full" rounded="lg" />
      </div>
    );
  }

  const grouped: Record<string, string[]> = {};
  for (const p of matrix.allPermissions) {
    const g = groupOf(p);
    grouped[g] ??= [];
    grouped[g].push(p);
  }
  const orderedGroups = [
    ...GROUP_ORDER.filter((g) => grouped[g]?.length),
    ...Object.keys(grouped).filter((g) => !GROUP_ORDER.includes(g)),
  ];

  return (
    <div>
      <PageHeader
        title="Roles & Permissions"
        description="Toggle what each role can do. New logins pick up changes immediately; existing sessions update within 15 minutes."
      />

      <Card padded={false} className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="sticky top-0 z-10 bg-slate-50">
              <tr>
                <th className="w-[340px] px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Permission</th>
                {ROLES.map((r) => (
                  <th key={r} className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-slate-500">{r}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orderedGroups.map((g) => (
                <Fragment key={`h-${g}`}>
                  <tr className="bg-brand-50/30 dark:bg-brand-500/5">
                    <td colSpan={4} className="px-5 py-2 text-xs font-semibold uppercase tracking-wide text-brand-700 dark:text-brand-300">{GROUP_LABEL[g] ?? g}</td>
                  </tr>
                  {grouped[g].sort().map((perm) => (
                    <tr key={perm} className="transition hover:bg-slate-50">
                      <td className="px-5 py-2.5 font-mono text-xs text-slate-700">{perm}</td>
                      {ROLES.map((role) => (
                        <td key={role} className="px-4 py-2.5 text-center">
                          <input
                            type="checkbox"
                            checked={draft[role].has(perm)}
                            onChange={() => toggle(role, perm)}
                            className="h-4 w-4 cursor-pointer rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
            <tfoot className="sticky bottom-0 bg-slate-50">
              <tr>
                <td className="px-5 py-3 text-xs font-medium uppercase tracking-wide text-slate-500">Save changes</td>
                {ROLES.map((r) => (
                  <td key={r} className="px-4 py-3 text-center">
                    <Button size="sm" variant="secondary" loading={saving === r} onClick={() => save(r)}>
                      Save {r}
                    </Button>
                  </td>
                ))}
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      <div className="mt-4 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/50 p-4 text-sm text-amber-900">
        <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
        <div>
          <p className="font-medium">Guardrail</p>
          <p className="mt-0.5 text-xs">
            ADMINISTRATOR must always keep <code className="rounded bg-white/70 px-1">role:permission:manage</code>, otherwise nobody can edit RBAC again. The backend enforces this automatically.
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-start gap-3 rounded-2xl border border-brand-200 bg-brand-50/40 p-4 text-sm text-brand-900">
        <ShieldCheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
        <div>
          <p className="font-medium">How enforcement works</p>
          <p className="mt-0.5 text-xs">
            Each endpoint checks a specific permission via Spring Security. The JWT issued at login contains every granted permission. Changing a role&apos;s permissions affects new logins immediately; in-flight sessions refresh their tokens within 15 minutes.
          </p>
        </div>
      </div>

      <SuccessModal
        open={success !== null}
        onClose={() => setSuccess(null)}
        title="Permissions updated"
        message={`${success} now has the updated permission set.`}
        details={
          <div className="text-slate-700">
            <p className="text-sm">Users with this role will pick up the changes on their next sign-in (or within 15 minutes on token refresh).</p>
          </div>
        }
        buttonText="Done"
      />
    </div>
  );
}

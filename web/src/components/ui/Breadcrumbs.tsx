import Link from 'next/link';
import { ChevronRightIcon } from '@heroicons/react/20/solid';

export interface Crumb {
  label: string;
  href?: string;
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav className="flex items-center gap-1 text-sm text-slate-500">
      {items.map((c, i) => (
        <span key={i} className="flex items-center gap-1">
          {c.href ? (
            <Link href={c.href} className="transition hover:text-slate-800">
              {c.label}
            </Link>
          ) : (
            <span className="font-medium text-slate-900">{c.label}</span>
          )}
          {i < items.length - 1 && <ChevronRightIcon className="h-4 w-4 text-slate-300" />}
        </span>
      ))}
    </nav>
  );
}

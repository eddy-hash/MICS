'use client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  UserCircleIcon,
  KeyIcon,
  ArrowRightStartOnRectangleIcon,
} from '@heroicons/react/24/outline';
import { Dropdown, DropdownItem, DropdownDivider } from '@/components/ui/Dropdown';
import { ThemeToggle } from './ThemeToggle';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { notify } from '@/lib/toast';
import type { Role } from '@/lib/types';

interface ProfileMenuProps {
  email: string;
  roles: Role[];
}

export function ProfileMenu({ email, roles }: ProfileMenuProps) {
  const router = useRouter();

  async function signOut() {
    await fetch('/api/auth/logout', { method: 'POST' });
    notify.logout('Signed out', { subMessage: 'See you soon' });
    router.push('/login');
    router.refresh();
  }

  return (
    <Dropdown
      className="w-64"
      trigger={
        <button className="flex items-center gap-2 rounded-full p-0.5 transition hover:bg-slate-100">
          <Avatar name={email} size="sm" />
        </button>
      }
    >
      <div className="border-b border-slate-100 px-4 py-3">
        <p className="truncate text-sm font-medium text-slate-900">{email}</p>
        <div className="mt-1.5 flex flex-wrap gap-1">
          {roles.map((r) => (
            <Badge key={r} tone="brand" className="text-[10px]">
              {r}
            </Badge>
          ))}
        </div>
      </div>
      <div className="border-b border-slate-100 px-4 py-3">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
          Theme
        </p>
        <ThemeToggle />
      </div>
      <div className="py-1">
        <Link href="/profile">
          <DropdownItem icon={<UserCircleIcon className="h-4 w-4" />}>Profile</DropdownItem>
        </Link>
        <Link href="/settings">
          <DropdownItem icon={<KeyIcon className="h-4 w-4" />}>Settings</DropdownItem>
        </Link>
        <DropdownDivider />
        <DropdownItem
          danger
          onClick={signOut}
          icon={<ArrowRightStartOnRectangleIcon className="h-4 w-4" />}
        >
          Sign out
        </DropdownItem>
      </div>
    </Dropdown>
  );
}

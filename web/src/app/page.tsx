import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ACCESS_COOKIE } from '@/lib/cookies';

export default async function Home() {
  const store = await cookies();
  const token = store.get(ACCESS_COOKIE)?.value;
  if (token) redirect('/dashboard');
  redirect('/login');
}

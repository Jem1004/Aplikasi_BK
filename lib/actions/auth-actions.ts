'use server';

import { signOut } from '@/lib/actions/auth';
import { redirect } from 'next/navigation';

export async function handleSignOut() {
  await signOut();
  redirect('/login');
}
import { Metadata } from 'next';
import { LoginClient } from '@/components/auth/LoginClient';
import { auth } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Login - Aplikasi BK Sekolah',
  description: 'Login ke Aplikasi Bimbingan Konseling Sekolah',
};

export default async function LoginPage() {
  // Check if user is already authenticated
  const session = await auth();

  if (session) {
    // Redirect to appropriate dashboard based on role
    let redirectUrl = '/';
    switch (session.user.role) {
      case 'ADMIN':
        redirectUrl = '/admin';
        break;
      case 'GURU_BK':
        redirectUrl = '/guru-bk';
        break;
      case 'WALI_KELAS':
        redirectUrl = '/wali-kelas';
        break;
      case 'SISWA':
        redirectUrl = '/siswa';
        break;
    }
    redirect(redirectUrl);
  }

  return <LoginClient />;
}
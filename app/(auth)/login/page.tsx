import { Metadata } from 'next';
import { LoginForm } from '@/components/auth/LoginForm';
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

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-white p-8 shadow-xl">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-100">
              <svg
                className="h-8 w-8 text-primary-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <h1 className="mb-2 text-2xl font-bold text-gray-900">
              Aplikasi BK Sekolah
            </h1>
            <p className="text-sm text-gray-600">
              Masuk ke akun Anda untuk melanjutkan
            </p>
          </div>

          {/* Login Form */}
          <LoginForm />

          {/* Footer */}
          <div className="mt-6 text-center text-sm text-gray-600">
            <p>Sistem Bimbingan Konseling Digital</p>
          </div>
        </div>

        {/* Demo Credentials Info */}
        <div className="mt-6 rounded-lg bg-white/80 p-4 text-xs text-gray-600">
          <p className="mb-2 font-semibold">Demo Credentials:</p>
          <div className="space-y-1">
            <p>Admin: admin / admin123</p>
            <p>Guru BK: gurubk / gurubk123</p>
            <p>Wali Kelas: walikelas / walikelas123</p>
            <p>Siswa: siswa001 / siswa123</p>
          </div>
        </div>
      </div>
    </div>
  );
}

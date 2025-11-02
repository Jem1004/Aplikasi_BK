import Link from 'next/link';
import { auth } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';

export default async function UnauthorizedPage() {
  const session = await auth();

  // Determine the correct dashboard URL based on role
  let dashboardUrl = '/';
  if (session?.user) {
    switch (session.user.role) {
      case 'ADMIN':
        dashboardUrl = '/admin';
        break;
      case 'GURU_BK':
        dashboardUrl = '/guru-bk';
        break;
      case 'WALI_KELAS':
        dashboardUrl = '/wali-kelas';
        break;
      case 'SISWA':
        dashboardUrl = '/siswa';
        break;
    }
  } else {
    // If not authenticated, redirect to login
    redirect('/login');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md text-center">
        <div className="mb-8">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
            <svg
              className="h-10 w-10 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="mb-2 text-3xl font-bold text-gray-900">
            Akses Ditolak
          </h1>
          <p className="text-gray-600">
            Anda tidak memiliki izin untuk mengakses halaman ini.
          </p>
        </div>

        <div className="space-y-3">
          <Link
            href={dashboardUrl}
            className="block w-full rounded-lg bg-primary-600 px-4 py-3 text-center font-medium text-white hover:bg-primary-700 transition-colors"
          >
            Kembali ke Dashboard
          </Link>
          <Link
            href="/"
            className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-center font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Ke Halaman Utama
          </Link>
        </div>
      </div>
    </div>
  );
}

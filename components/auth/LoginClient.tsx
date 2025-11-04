'use client';

import { SimpleLoginForm } from '@/components/auth/SimpleLoginForm';
import { ErrorBoundary } from '@/components/auth/ErrorBoundary';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { BookOpen, AlertCircle } from 'lucide-react';

export function LoginClient() {
  const searchParams = useSearchParams();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const error = searchParams.get('error');
    if (error) {
      setErrorMessage(decodeURIComponent(error));
    }
  }, [searchParams]);

  try {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 px-4 py-12">
        {/* Background Pattern */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-100/30 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-100/30 rounded-full blur-3xl"></div>
        </div>

        <div className="relative w-full max-w-md">
          {/* Login Card */}
          <div className="rounded-3xl bg-white/90 backdrop-blur-md border border-green-200/30 p-8 shadow-2xl">
            {/* Header */}
            <div className="mb-8 text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg">
                <BookOpen className="h-8 w-8 text-white" />
              </div>
              <h1 className="mb-3 text-3xl font-light text-gray-900 tracking-tight">
                Aplikasi BK
              </h1>
              <p className="text-sm text-gray-500">
                Sistem Bimbingan Konseling Digital
              </p>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="mb-6 rounded-xl bg-red-50 border border-red-200/50 p-4 text-sm text-red-700 flex items-start gap-3" role="alert">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Login Gagal</p>
                  <p className="text-red-600 mt-1">{errorMessage}</p>
                </div>
              </div>
            )}

            {/* Login Form */}
            <ErrorBoundary>
              <SimpleLoginForm />
            </ErrorBoundary>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-green-200/60 text-center">
              <p className="text-xs text-gray-500">
                Platform manajemen bimbingan konseling modern
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('LoginClient error:', error);

    // Fallback UI in case of errors
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 px-4 py-12">
        <div className="relative w-full max-w-md">
          <div className="rounded-3xl bg-white/90 backdrop-blur-md border border-green-200/30 p-8 shadow-2xl">
            <div className="text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500">
                <AlertCircle className="h-8 w-8 text-white" />
              </div>
              <h1 className="mb-3 text-2xl font-light text-red-900 tracking-tight">
                Terjadi Kesalahan
              </h1>
              <p className="text-sm text-gray-600 mb-8">
                Sistem sedang mengalami gangguan. Silakan refresh halaman atau coba lagi nanti.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-2xl font-medium hover:from-red-600 hover:to-red-700 transition-all duration-300 hover:shadow-lg"
              >
                Refresh Halaman
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
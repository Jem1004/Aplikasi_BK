'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function SimpleLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get('callbackUrl') || '/';

  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [csrfToken, setCsrfToken] = useState<string>('');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // Get CSRF token
    fetch('/api/auth/csrf')
      .then(res => res.json())
      .then(data => setCsrfToken(data.csrfToken))
      .catch(err => console.error('Failed to get CSRF token:', err));
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!isMounted || !csrfToken) {
      setError('Form is loading. Please wait...');
      return;
    }

    setIsPending(true);

    try {
      const form = e.currentTarget;
      const formData = new FormData(form);

      // Validate form data
      const identifier = formData.get('identifier') as string;
      const password = formData.get('password') as string;

      if (!identifier || !password) {
        setError('Email/username dan password harus diisi');
        setIsPending(false);
        return;
      }

      console.log('Submitting form to NextAuth...');

      // Submit to NextAuth API directly
      const response = await fetch('/api/auth/callback/credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          identifier,
          password,
          redirect: 'false',
          csrfToken,
          json: 'true',
        }),
      });

      console.log('NextAuth response:', response.status);

      if (response.ok) {
        // Login successful, check session
        const sessionResponse = await fetch('/api/auth/session');
        const session = await sessionResponse.json();

        console.log('Session data:', session);

        if (session?.user) {
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

          console.log('Redirecting to:', redirectUrl);
          router.push(callbackUrl !== '/' ? callbackUrl : redirectUrl);
          router.refresh();
        } else {
          setError('Login berhasil tetapi sesi tidak ditemukan. Silakan refresh halaman.');
        }
      } else {
        const errorData = await response.text();
        console.error('Login failed:', errorData);
        setError('Login gagal. Silakan periksa kredensial Anda.');
      }
    } catch (err) {
      console.error('Form submission error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan server. Silakan coba lagi.';
      setError(errorMessage);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" aria-label="Login form">
      {error && (
        <div
          className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700"
          role="alert"
          aria-live="assertive"
        >
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="identifier">Email atau Username</Label>
        <Input
          id="identifier"
          name="identifier"
          type="text"
          placeholder="Masukkan email atau username"
          disabled={isPending || !isMounted || !csrfToken}
          autoComplete="username"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="Masukkan password"
          disabled={isPending || !isMounted || !csrfToken}
          autoComplete="current-password"
          required
        />
      </div>

      <Button
        type="submit"
        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white min-h-[44px] font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
        disabled={isPending || !isMounted || !csrfToken}
        aria-busy={isPending}
      >
        {!isMounted ? 'Loading...' : !csrfToken ? 'Preparing...' : isPending ? 'Memproses...' : 'Masuk'}
      </Button>
    </form>
  );
}
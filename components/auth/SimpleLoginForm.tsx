'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { signIn } from 'next-auth/react';

export function SimpleLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get('callbackUrl') || '/';

  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!isMounted) {
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

      console.log('Attempting sign in with NextAuth...');

      // Use NextAuth signIn for better mobile compatibility
      const result = await signIn('credentials', {
        identifier,
        password,
        redirect: false,
        callbackUrl: callbackUrl !== '/' ? callbackUrl : undefined,
      });

      console.log('SignIn result:', result);

      if (result?.error) {
        // Log as warning instead of error (this is expected for wrong credentials)
        console.warn('Sign in failed:', result.error);
        
        // Provide more specific error message
        if (result.error === 'CredentialsSignin') {
          setError('Email/username atau password salah. Silakan coba lagi.');
        } else {
          setError('Login gagal. Silakan periksa kredensial Anda.');
        }
      } else if (result?.ok) {
        // Login successful, redirect based on user role
        // Add delay to ensure session is properly established
        await new Promise(resolve => setTimeout(resolve, 500));

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
          // Retry session fetching once more
          await new Promise(resolve => setTimeout(resolve, 1000));
          const retrySessionResponse = await fetch('/api/auth/session');
          const retrySession = await retrySessionResponse.json();

          if (retrySession?.user) {
            let redirectUrl = '/';
            switch (retrySession.user.role) {
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
            router.push(callbackUrl !== '/' ? callbackUrl : redirectUrl);
            router.refresh();
          } else {
            setError('Login berhasil tetapi sesi tidak ditemukan. Silakan refresh halaman.');
          }
        }
      } else {
        setError('Login gagal. Terjadi kesalahan yang tidak diketahui.');
      }
    } catch (err) {
      console.error('Form submission error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan koneksi. Silakan coba lagi.';
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
          disabled={isPending || !isMounted}
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
          disabled={isPending || !isMounted}
          autoComplete="current-password"
          required
        />
      </div>

      <Button
        type="submit"
        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white min-h-[44px] font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
        disabled={isPending || !isMounted}
        aria-busy={isPending}
      >
        {!isMounted ? 'Loading...' : isPending ? 'Memproses...' : 'Masuk'}
      </Button>
    </form>
  );
}
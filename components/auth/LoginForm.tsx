'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from '@/lib/actions/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get('callbackUrl') || '/';

  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [isMounted, setIsMounted] = useState(false);

  // Ensure component is mounted before using hooks that depend on client-side data
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    // Prevent submission if component is not mounted
    if (!isMounted) {
      setError('Component is loading. Please wait...');
      return;
    }

    try {
      const form = e.currentTarget;
      const formData = new FormData(form);

      // Validate form data before sending
      const identifier = formData.get('identifier') as string;
      const password = formData.get('password') as string;

      if (!identifier || !password) {
        setError('Email/username dan password harus diisi');
        return;
      }

      startTransition(async () => {
        try {
          console.log('Attempting sign in with:', { identifier, passwordLength: password.length });

          // Use our custom server action instead of NextAuth signIn directly
          const { signIn } = await import('@/lib/actions/auth');
          const result = await signIn(formData);

          console.log('Sign in result:', result);

          if (result?.success && result?.data) {
            const userData = (result.data as { user: any }).user;
            console.log('Login successful, user:', userData);

            // Store user data in session storage for temporary session management
            try {
              sessionStorage.setItem('user', JSON.stringify(userData));

              let redirectUrl = '/';
              switch (userData.role) {
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
              // Use window.location for reliable redirect
              window.location.href = redirectUrl;
            } catch (storageError) {
              console.error('Session storage error:', storageError);
              setError('Login berhasil tetapi gagal menyimpan sesi. Silakan coba lagi.');
            }
          } else if (result?.success === false) {
            console.log('Login failed:', result);
            if (result.errors && typeof result.errors === 'object') {
              setFieldErrors(result.errors);
            } else if (result.error && typeof result.error === 'string') {
              setError(result.error);
            } else {
              setError('Login gagal. Silakan periksa kredensial Anda.');
            }
          } else {
            console.error('Unexpected response format:', result);
            setError('Respons server tidak valid. Silakan coba lagi.');
          }
        } catch (err) {
          console.error('Login error:', err);
          const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan server. Silakan coba lagi nanti.';
          setError(errorMessage);
        }
      });
    } catch (err) {
      console.error('Form submission error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan pada formulir. Silakan coba lagi.';
      setError(errorMessage);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" aria-label="Login form">
      {error && (
        <div
          className="rounded-lg bg-red-50 p-4 text-sm text-red-800"
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
          className={fieldErrors?.identifier ? 'border-red-500' : ''}
          autoComplete="username"
          aria-invalid={!!fieldErrors?.identifier}
          aria-describedby={fieldErrors?.identifier ? 'identifier-error' : undefined}
          required
        />
        {fieldErrors?.identifier && (
          <p id="identifier-error" className="text-sm text-red-600" role="alert">
            {fieldErrors.identifier[0]}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="Masukkan password"
          disabled={isPending || !isMounted}
          className={fieldErrors?.password ? 'border-red-500' : ''}
          autoComplete="current-password"
          aria-invalid={!!fieldErrors?.password}
          aria-describedby={fieldErrors?.password ? 'password-error' : undefined}
          required
        />
        {fieldErrors?.password && (
          <p id="password-error" className="text-sm text-red-600" role="alert">
            {fieldErrors.password[0]}
          </p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full bg-primary-600 hover:bg-primary-700 min-h-[44px]"
        disabled={isPending || !isMounted}
        aria-busy={isPending}
      >
        {!isMounted ? 'Loading...' : isPending ? 'Memproses...' : 'Masuk'}
      </Button>
    </form>
  );
}

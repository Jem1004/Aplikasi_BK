'use client';

import { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from '@/lib/actions/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await signIn(formData);

      if (result.success && result.data) {
        // Redirect to the appropriate dashboard or callback URL
        router.push(callbackUrl !== '/' ? callbackUrl : result.data.redirectUrl);
        router.refresh();
      } else if (result.errors) {
        setFieldErrors(result.errors);
      } else if (result.error) {
        setError(result.error);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-800">
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
          disabled={isPending}
          className={fieldErrors.identifier ? 'border-red-500' : ''}
          autoComplete="username"
        />
        {fieldErrors.identifier && (
          <p className="text-sm text-red-600">{fieldErrors.identifier[0]}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="Masukkan password"
          disabled={isPending}
          className={fieldErrors.password ? 'border-red-500' : ''}
          autoComplete="current-password"
        />
        {fieldErrors.password && (
          <p className="text-sm text-red-600">{fieldErrors.password[0]}</p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full bg-primary-600 hover:bg-primary-700"
        disabled={isPending}
      >
        {isPending ? 'Memproses...' : 'Masuk'}
      </Button>
    </form>
  );
}

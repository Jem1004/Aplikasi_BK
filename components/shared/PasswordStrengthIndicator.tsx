'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface PasswordStrengthIndicatorProps {
  password: string;
  className?: string;
}

type StrengthLevel = 'weak' | 'fair' | 'good' | 'strong';

interface StrengthInfo {
  level: StrengthLevel;
  label: string;
  color: string;
  percentage: number;
}

export function PasswordStrengthIndicator({ password, className }: PasswordStrengthIndicatorProps) {
  const strength = useMemo((): StrengthInfo => {
    if (!password) {
      return { level: 'weak', label: '', color: 'bg-gray-300', percentage: 0 };
    }

    let score = 0;

    // Length check
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;

    // Character variety checks
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^a-zA-Z0-9]/.test(password)) score += 1;

    // Determine strength level
    if (score <= 2) {
      return { level: 'weak', label: 'Lemah', color: 'bg-red-500', percentage: 25 };
    } else if (score <= 3) {
      return { level: 'fair', label: 'Cukup', color: 'bg-orange-500', percentage: 50 };
    } else if (score <= 4) {
      return { level: 'good', label: 'Baik', color: 'bg-yellow-500', percentage: 75 };
    } else {
      return { level: 'strong', label: 'Kuat', color: 'bg-green-500', percentage: 100 };
    }
  }, [password]);

  if (!password) {
    return null;
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Kekuatan Password:</span>
        <span className={cn(
          'font-medium',
          strength.level === 'weak' && 'text-red-600',
          strength.level === 'fair' && 'text-orange-600',
          strength.level === 'good' && 'text-yellow-600',
          strength.level === 'strong' && 'text-green-600'
        )}>
          {strength.label}
        </span>
      </div>
      <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
        <div
          className={cn('h-full transition-all duration-300', strength.color)}
          style={{ width: `${strength.percentage}%` }}
        />
      </div>
      <ul className="text-xs text-muted-foreground space-y-1">
        <li className={password.length >= 8 ? 'text-green-600' : ''}>
          {password.length >= 8 ? '✓' : '○'} Minimal 8 karakter
        </li>
        <li className={/[a-zA-Z]/.test(password) ? 'text-green-600' : ''}>
          {/[a-zA-Z]/.test(password) ? '✓' : '○'} Mengandung huruf
        </li>
        <li className={/[0-9]/.test(password) ? 'text-green-600' : ''}>
          {/[0-9]/.test(password) ? '✓' : '○'} Mengandung angka
        </li>
      </ul>
    </div>
  );
}

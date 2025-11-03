'use client';

import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface FormErrorProps {
  error?: string;
  errors?: Record<string, string[]>;
  className?: string;
}

export function FormError({ error, errors, className }: FormErrorProps) {
  // If there's a general error message
  if (error) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  // If there are field-level errors
  if (errors && Object.keys(errors).length > 0) {
    const errorMessages = Object.entries(errors)
      .flatMap(([field, messages]) => messages)
      .filter(Boolean);

    if (errorMessages.length === 0) {
      return null;
    }

    return (
      <Alert variant="destructive" className={className}>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <ul className="list-disc list-inside space-y-1">
            {errorMessages.map((message, index) => (
              <li key={index}>{message}</li>
            ))}
          </ul>
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}

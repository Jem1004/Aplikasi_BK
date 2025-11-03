'use client';

import { toast } from '@/hooks/use-toast';
import type { ActionResponse } from '@/types';

/**
 * Display success toast notification
 */
export function showSuccessToast(message: string, description?: string) {
  toast({
    title: message,
    description,
    variant: 'default',
  });
}

/**
 * Display error toast notification
 */
export function showErrorToast(message: string, description?: string) {
  toast({
    title: message,
    description,
    variant: 'destructive',
  });
}

/**
 * Handle action response and show appropriate toast
 * Returns true if successful, false if error
 */
export function handleActionResponse<T>(
  response: ActionResponse<T>,
  options?: {
    successMessage?: string;
    errorMessage?: string;
    onSuccess?: (data?: T) => void;
    onError?: (error: string) => void;
  }
): boolean {
  if (response.success) {
    if (options?.successMessage) {
      showSuccessToast(options.successMessage);
    }
    if (options?.onSuccess) {
      options.onSuccess(response.data);
    }
    return true;
  } else {
    const errorMessage = options?.errorMessage || response.error || 'Terjadi kesalahan';
    showErrorToast(errorMessage);
    
    if (options?.onError && response.error) {
      options.onError(response.error);
    }
    return false;
  }
}

/**
 * Extract field errors from action response for form display
 */
export function getFieldErrors(response: ActionResponse<any>): Record<string, string> {
  if (!response.errors) {
    return {};
  }

  const fieldErrors: Record<string, string> = {};
  
  Object.entries(response.errors).forEach(([field, messages]) => {
    if (Array.isArray(messages) && messages.length > 0) {
      fieldErrors[field] = messages[0];
    }
  });

  return fieldErrors;
}

/**
 * Check if action response has field errors
 */
export function hasFieldErrors(response: ActionResponse<any>): boolean {
  return !!response.errors && Object.keys(response.errors).length > 0;
}

'use client';

import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

interface RedirectOptions {
  successMessage?: string;
  errorMessage?: string;
  onSuccess?: () => void;
  fallbackUrl?: string;
}

/**
 * Standardized redirect utility for consistent navigation flow
 * across all CRUD operations in the application.
 */
export class NavigationHelper {
  private router: ReturnType<typeof useRouter>;
  private toast: any;

  constructor(router: ReturnType<typeof useRouter>, toast: ReturnType<typeof useToast>['toast']) {
    this.router = router;
    this.toast = toast;
  }

  /**
   * Handle successful operation with redirect
   */
  async handleSuccess(
    listUrl: string,
    message?: string,
    options?: RedirectOptions
  ) {
    const {
      successMessage = message || 'Operasi berhasil',
      onSuccess,
      fallbackUrl
    } = options || {};

    // Show success toast
    this.toast({
      title: 'Berhasil',
      description: successMessage,
    });

    // Execute custom onSuccess callback if provided
    if (onSuccess) {
      onSuccess();
      return;
    }

    // Default redirect to list page
    const targetUrl = fallbackUrl || listUrl;

    // Add small delay for better UX
    await new Promise(resolve => setTimeout(resolve, 300));

    this.router.push(targetUrl);
    this.router.refresh();
  }

  /**
   * Handle operation error
   */
  handleError(error: string | unknown, defaultMessage = 'Terjadi kesalahan') {
    const errorMessage = typeof error === 'string' ? error : defaultMessage;

    this.toast({
      title: 'Gagal',
      description: errorMessage,
      variant: 'destructive',
    });
  }

  /**
   * Handle form submission with standard redirect pattern
   */
  async handleFormSubmit(
    operation: () => Promise<{ success: boolean; error?: string; errors?: any }>,
    successMessage: string,
    listUrl: string,
    options?: RedirectOptions
  ) {
    try {
      const result = await operation();

      if (result.success) {
        await this.handleSuccess(listUrl, successMessage, options);
      } else {
        if (result.errors) {
          return { success: false, errors: result.errors };
        } else {
          this.handleError(result.error, 'Operasi gagal');
        }
      }

      return { success: result.success };
    } catch (error) {
      this.handleError(error, 'Terjadi kesalahan tak terduga');
      return { success: false };
    }
  }

  /**
   * Navigate back with fallback
   */
  goBack(fallbackUrl = '/admin') {
    if (window.history.length > 2) {
      this.router.back();
    } else {
      this.router.push(fallbackUrl);
    }
  }
}

/**
 * Hook for using NavigationHelper in components
 */
export function useNavigationHelper() {
  const router = useRouter();
  const { toast } = useToast();

  return new NavigationHelper(router, toast);
}

/**
 * Predefined redirect URLs for different sections
 */
export const REDIRECT_URLS = {
  // Admin section
  USERS: '/admin/users',
  SCHOOL_INFO: '/admin/master-data/school-info',
  CLASSES: '/admin/master-data/classes',
  ACADEMIC_YEARS: '/admin/master-data/academic-years',
  VIOLATION_TYPES: '/admin/master-data/violation-types',
  AUDIT_LOGS: '/admin/audit-logs',
  SETTINGS: '/admin/settings',

  // Guru BK section
  APPOINTMENTS: '/guru-bk/appointments',
  VIOLATIONS: '/guru-bk/violations',
  JOURNALS: '/guru-bk/journals',
  STUDENTS: '/guru-bk/students',
  PERMISSIONS: '/guru-bk/permissions',
  BK_SETTINGS: '/guru-bk/settings',

  // Wali Kelas section
  WK_STUDENTS: '/wali-kelas/students',
  WK_SETTINGS: '/wali-kelas/settings',

  // Siswa section
  SISWA_APPOINTMENTS: '/siswa/appointments',
  VIOLATIONS_SISWA: '/siswa/violations',
  PERMISSIONS_SISWA: '/siswa/permissions',
  SISWA_PROFILE: '/siswa/profile',
} as const;
'use server';

import { signIn as nextAuthSignIn, signOut as nextAuthSignOut } from '@/lib/auth/auth';
import { AuthError } from 'next-auth';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { hash, compare } from 'bcryptjs';
import { auth } from '@/lib/auth/auth';
import type { ActionResponse } from '@/types';

// Validation schemas
const signInSchema = z.object({
  identifier: z.string().min(1, 'Email atau username harus diisi'),
  password: z.string().min(1, 'Password harus diisi'),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Password saat ini harus diisi'),
  newPassword: z
    .string()
    .min(8, 'Password minimal 8 karakter')
    .regex(/[a-zA-Z]/, 'Password harus mengandung huruf')
    .regex(/[0-9]/, 'Password harus mengandung angka'),
  confirmPassword: z.string().min(1, 'Konfirmasi password harus diisi'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Password tidak cocok',
  path: ['confirmPassword'],
});

/**
 * Sign in action
 * Authenticates user with credentials
 */
export async function signIn(
  formData: FormData
): Promise<ActionResponse<{ redirectUrl: string }>> {
  try {
    // Validate input
    const validatedFields = signInSchema.safeParse({
      identifier: formData.get('identifier'),
      password: formData.get('password'),
    });

    if (!validatedFields.success) {
      return {
        success: false,
        errors: validatedFields.error.flatten().fieldErrors,
      };
    }

    const { identifier, password } = validatedFields.data;

    // Attempt sign in
    await nextAuthSignIn('credentials', {
      identifier,
      password,
      redirect: false,
    });

    // Get session to determine redirect URL based on role
    const session = await auth();
    
    if (!session || !session.user) {
      return {
        success: false,
        error: 'Email/username atau password salah',
      };
    }

    // Determine redirect URL based on role
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

    return {
      success: true,
      data: { redirectUrl },
    };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return {
            success: false,
            error: 'Email/username atau password salah',
          };
        default:
          return {
            success: false,
            error: 'Terjadi kesalahan. Silakan coba lagi',
          };
      }
    }
    
    console.error('Sign in error:', error);
    return {
      success: false,
      error: 'Terjadi kesalahan. Silakan coba lagi',
    };
  }
}

/**
 * Sign out action
 * Logs out the current user
 */
export async function signOut(): Promise<ActionResponse> {
  try {
    await nextAuthSignOut({ redirect: false });
    
    return {
      success: true,
    };
  } catch (error) {
    console.error('Sign out error:', error);
    return {
      success: false,
      error: 'Terjadi kesalahan saat logout',
    };
  }
}

/**
 * Change password action
 * Allows authenticated users to change their password
 */
export async function changePassword(
  formData: FormData
): Promise<ActionResponse> {
  try {
    // Check authentication
    const session = await auth();
    
    if (!session || !session.user) {
      return {
        success: false,
        error: 'Anda harus login terlebih dahulu',
      };
    }

    // Validate input
    const validatedFields = changePasswordSchema.safeParse({
      currentPassword: formData.get('currentPassword'),
      newPassword: formData.get('newPassword'),
      confirmPassword: formData.get('confirmPassword'),
    });

    if (!validatedFields.success) {
      return {
        success: false,
        errors: validatedFields.error.flatten().fieldErrors,
      };
    }

    const { currentPassword, newPassword } = validatedFields.data;

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, passwordHash: true },
    });

    if (!user) {
      return {
        success: false,
        error: 'User tidak ditemukan',
      };
    }

    // Verify current password
    const isPasswordValid = await compare(currentPassword, user.passwordHash);

    if (!isPasswordValid) {
      return {
        success: false,
        error: 'Password saat ini salah',
      };
    }

    // Hash new password
    const hashedPassword = await hash(newPassword, 12);

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: hashedPassword },
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error('Change password error:', error);
    return {
      success: false,
      error: 'Terjadi kesalahan. Silakan coba lagi',
    };
  }
}

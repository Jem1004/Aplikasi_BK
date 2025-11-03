'use server';

import { signIn as nextAuthSignIn, signOut as nextAuthSignOut } from '@/lib/auth/auth';
import { AuthError } from 'next-auth';
import { prisma } from '@/lib/db/prisma';
import { hash, compare } from 'bcryptjs';
import { auth } from '@/lib/auth/auth';
import { 
  loginSchema, 
  changePasswordSchema,
  type LoginInput,
  type ChangePasswordInput 
} from '@/lib/validations';
import {
  type ActionResponse,
  createSuccessResponse,
  createErrorResponse,
  createValidationErrorResponse,
  ERROR_MESSAGES,
  logError,
  mapZodErrorsToFields,
  mapErrorToMessage,
} from '@/lib/errors';
import { loginRateLimiter, getClientIp, checkRateLimit } from '@/lib/rate-limit';
import { headers } from 'next/headers';

/**
 * Sign in action
 * Authenticates user with credentials
 */
export async function signIn(
  formData: FormData
): Promise<ActionResponse<{ redirectUrl: string }>> {
  try {
    // Rate limiting check
    const headersList = await headers();
    const clientIp = getClientIp(headersList);
    const rateLimitResult = await checkRateLimit(loginRateLimiter, clientIp);
    
    if (!rateLimitResult.success) {
      return createErrorResponse(rateLimitResult.error!);
    }

    // Validate input
    const validatedFields = loginSchema.safeParse({
      identifier: formData.get('identifier'),
      password: formData.get('password'),
    });

    if (!validatedFields.success) {
      return createValidationErrorResponse(mapZodErrorsToFields(validatedFields.error));
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
      return createErrorResponse(ERROR_MESSAGES.INVALID_CREDENTIALS);
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

    return createSuccessResponse({ redirectUrl });
  } catch (error) {
    logError(error, { action: 'signIn', identifier: formData.get('identifier') as string });
    
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return createErrorResponse(ERROR_MESSAGES.INVALID_CREDENTIALS);
        default:
          return createErrorResponse(ERROR_MESSAGES.SERVER_ERROR);
      }
    }
    
    return createErrorResponse(mapErrorToMessage(error));
  }
}

/**
 * Sign out action
 * Logs out the current user
 */
export async function signOut(): Promise<ActionResponse> {
  try {
    await nextAuthSignOut({ redirect: false });
    
    return createSuccessResponse();
  } catch (error) {
    logError(error, { action: 'signOut' });
    return createErrorResponse(mapErrorToMessage(error));
  }
}

/**
 * Change password action
 * Allows authenticated users to change their password
 */
export async function changePassword(
  formData: FormData
): Promise<ActionResponse> {
  let userId: string | undefined;
  
  try {
    // Check authentication
    const session = await auth();
    
    if (!session || !session.user) {
      return createErrorResponse(ERROR_MESSAGES.UNAUTHORIZED);
    }

    userId = session.user.id;

    // Validate input
    const validatedFields = changePasswordSchema.safeParse({
      currentPassword: formData.get('currentPassword'),
      newPassword: formData.get('newPassword'),
      confirmPassword: formData.get('confirmPassword'),
    });

    if (!validatedFields.success) {
      return createValidationErrorResponse(mapZodErrorsToFields(validatedFields.error));
    }

    const { currentPassword, newPassword } = validatedFields.data;

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, passwordHash: true },
    });

    if (!user) {
      return createErrorResponse(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    // Verify current password
    const isPasswordValid = await compare(currentPassword, user.passwordHash);

    if (!isPasswordValid) {
      return createErrorResponse('Password saat ini salah');
    }

    // Hash new password
    const hashedPassword = await hash(newPassword, 12);

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: hashedPassword },
    });

    return createSuccessResponse();
  } catch (error) {
    logError(error, { action: 'changePassword', userId });
    return createErrorResponse(mapErrorToMessage(error));
  }
}

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

/**
 * Sign in action
 * Authenticates user with credentials
 */
export async function signIn(
  formData: FormData
): Promise<ActionResponse<{user: any}>> {
  try {
    // Note: Rate limiting disabled to avoid headers() scope issues
    // Rate limiting should be implemented at middleware level instead

    // Validate input
    const identifier = formData.get('identifier') as string;
    const password = formData.get('password') as string;

    if (!identifier || !password) {
      return createErrorResponse('Email/username dan password harus diisi');
    }

    const validatedFields = loginSchema.safeParse({
      identifier,
      password,
    });

    if (!validatedFields.success) {
      return createValidationErrorResponse(mapZodErrorsToFields(validatedFields.error));
    }

    const { identifier: validatedIdentifier, password: validatedPassword } = validatedFields.data;

    // Manual authentication without using NextAuth signIn to avoid headers issues
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: validatedIdentifier },
          { username: validatedIdentifier },
        ],
        isActive: true,
        deletedAt: null,
      },
      include: {
        teacher: true,
        student: true,
      },
    });

    if (!user) {
      return createErrorResponse(ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    // Verify password
    const { compare } = await import('bcryptjs');
    const isPasswordValid = await compare(validatedPassword, user.passwordHash);

    if (!isPasswordValid) {
      return createErrorResponse(ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    // Manual session creation approach to avoid NextAuth headers issues
    // We'll create a custom session management solution
    return createSuccessResponse({
      message: 'Login berhasil',
      user: {
        id: user.id,
        email: user.email,
        name: user.fullName,
        role: user.role,
        teacherId: user.teacher?.id || null,
        studentId: user.student?.id || null,
      }
    });
  } catch (error) {
    console.error('Sign in error:', error);

    // Safely extract identifier for logging
    let identifierForLog = 'unknown';
    try {
      identifierForLog = formData?.get('identifier') as string || 'unknown';
    } catch {
      // Use default value if formData access fails
    }

    logError(error, { action: 'signIn', identifier: identifierForLog });

    if (error instanceof AuthError) {
      switch (String(error.type)) {
        case 'CredentialsSignin':
          return createErrorResponse(ERROR_MESSAGES.INVALID_CREDENTIALS);
        case 'OAuthSignin':
        case 'OAuthCallbackError':
        case 'OAuthCreateAccount':
        case 'EmailCreateAccount':
        case 'Callback':
          return createErrorResponse('Terjadi kesalahan autentikasi. Silakan coba lagi.');
        default:
          return createErrorResponse(ERROR_MESSAGES.SERVER_ERROR);
      }
    }

    // Handle string errors and other types safely
    let errorMessage: string = ERROR_MESSAGES.SERVER_ERROR;
    try {
      errorMessage = (mapErrorToMessage(error) as string) || ERROR_MESSAGES.SERVER_ERROR;
    } catch (mapError) {
      console.warn('Error mapping error mapping:', mapError);
    }

    return createErrorResponse(errorMessage);
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

    // Update password and clear mustChangePassword flag
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        passwordHash: hashedPassword,
        mustChangePassword: false,
      },
    });

    return createSuccessResponse();
  } catch (error) {
    logError(error, { action: 'changePassword', userId });
    return createErrorResponse(mapErrorToMessage(error));
  }
}

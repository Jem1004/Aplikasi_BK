import { auth } from '@/lib/auth/auth';
import type { ActionResponse } from '@/types';
import { ERROR_MESSAGES } from './error-messages';
import { createErrorResponse, createSuccessResponse } from './index';
import { logError } from './error-logger';
import { mapErrorToMessage } from './error-mapper';

/**
 * Wrapper for server actions that require authentication
 * Automatically handles auth checking and error logging
 */
export async function withAuth<T>(
  handler: (session: NonNullable<Awaited<ReturnType<typeof auth>>>) => Promise<ActionResponse<T>>,
  options?: {
    requiredRole?: string | string[];
    actionName?: string;
  }
): Promise<ActionResponse<T>> {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return createErrorResponse<T>(ERROR_MESSAGES.UNAUTHORIZED);
    }

    // Check role if required
    if (options?.requiredRole) {
      const requiredRoles = Array.isArray(options.requiredRole) 
        ? options.requiredRole 
        : [options.requiredRole];
      
      if (!requiredRoles.includes(session.user.role)) {
        return createErrorResponse<T>(ERROR_MESSAGES.PERMISSION_DENIED);
      }
    }

    return await handler(session);
  } catch (error) {
    logError(error, {
      action: options?.actionName || 'unknown',
      userId: undefined,
    });
    return createErrorResponse<T>(mapErrorToMessage(error));
  }
}

/**
 * Wrapper for server actions that handles errors automatically
 * Use this for actions that don't require authentication
 */
export async function withErrorHandling<T>(
  handler: () => Promise<ActionResponse<T>>,
  actionName?: string
): Promise<ActionResponse<T>> {
  try {
    return await handler();
  } catch (error) {
    logError(error, { action: actionName || 'unknown' });
    return createErrorResponse<T>(mapErrorToMessage(error));
  }
}

import { ZodError } from 'zod';
import { ERROR_MESSAGES } from './error-messages';
import { handlePrismaError } from './prisma-error-handler';

/**
 * Map various error types to user-friendly messages
 */
export function mapErrorToMessage(error: unknown): string {
  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const firstError = error.errors[0];
    return firstError?.message || ERROR_MESSAGES.VALIDATION_FAILED;
  }

  // Handle Prisma errors
  if (error && typeof error === 'object' && 'code' in error) {
    return handlePrismaError(error);
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    // Check if error message is one of our predefined messages
    const errorMessage = error.message;
    if (Object.values(ERROR_MESSAGES).includes(errorMessage as any)) {
      return errorMessage;
    }
    
    // For development, return the actual error message
    if (process.env.NODE_ENV === 'development') {
      return error.message;
    }
    
    // For production, return generic error
    return ERROR_MESSAGES.SERVER_ERROR;
  }

  // Handle string errors
  if (typeof error === 'string') {
    return error;
  }

  // Unknown error type
  return ERROR_MESSAGES.UNKNOWN_ERROR;
}

/**
 * Convert Zod errors to field-level error object
 */
export function mapZodErrorsToFields(error: ZodError): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};
  
  error.errors.forEach((err) => {
    const path = err.path.join('.');
    if (!fieldErrors[path]) {
      fieldErrors[path] = [];
    }
    fieldErrors[path].push(err.message);
  });
  
  return fieldErrors;
}

/**
 * Sanitize error message for user display
 * Removes sensitive information and technical details
 */
export function sanitizeErrorMessage(error: unknown): string {
  const message = mapErrorToMessage(error);
  
  // Remove any potential sensitive information
  // This is a simple implementation - enhance based on your needs
  const sanitized = message
    .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[email]') // Remove emails
    .replace(/\b\d{10,}\b/g, '[number]') // Remove long numbers (potential IDs)
    .replace(/password/gi, '[credential]'); // Remove password mentions
  
  return sanitized;
}

// Export all error handling utilities
export * from './error-messages';
export * from './error-logger';
export * from './prisma-error-handler';
export * from './error-mapper';

// Export common types
export interface ActionResponse<T = void> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>; // Field-level validation errors
}

/**
 * Create a success response
 */
export function createSuccessResponse<T = void>(data?: T): ActionResponse<T> {
  return {
    success: true,
    data,
  };
}

/**
 * Create an error response with a single error message
 */
export function createErrorResponse<T = void>(error: string): ActionResponse<T> {
  return {
    success: false,
    error,
  };
}

/**
 * Create an error response with field-level errors
 */
export function createValidationErrorResponse<T = void>(errors: Record<string, string[]>): ActionResponse<T> {
  return {
    success: false,
    errors,
  };
}

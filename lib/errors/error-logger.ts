/**
 * Error logging utility
 * Logs errors with context for debugging
 * In production, this should be integrated with error tracking services like Sentry
 */

export interface ErrorContext {
  userId?: string;
  action?: string;
  resource?: string;
  identifier?: string;
  metadata?: Record<string, any>;
  [key: string]: any;
}

export function logError(error: Error | unknown, context?: ErrorContext): void {
  const timestamp = new Date().toISOString();
  
  const errorInfo = {
    timestamp,
    message: error instanceof Error ? error.message : 'Unknown error',
    stack: error instanceof Error ? error.stack : undefined,
    context: context || {},
  };

  // In development, log to console
  if (process.env.NODE_ENV === 'development') {
    console.error('🔴 Error:', errorInfo);
  } else {
    // In production, log to error tracking service
    // Example: Sentry.captureException(error, { contexts: { custom: context } });
    console.error(JSON.stringify(errorInfo));
  }
}

/**
 * Log warning (non-critical issues)
 */
export function logWarning(message: string, context?: ErrorContext): void {
  const timestamp = new Date().toISOString();
  
  const warningInfo = {
    timestamp,
    message,
    context: context || {},
  };

  if (process.env.NODE_ENV === 'development') {
    console.warn('⚠️ Warning:', warningInfo);
  } else {
    console.warn(JSON.stringify(warningInfo));
  }
}

/**
 * Log info (for tracking important operations)
 */
export function logInfo(message: string, context?: ErrorContext): void {
  const timestamp = new Date().toISOString();
  
  const infoLog = {
    timestamp,
    message,
    context: context || {},
  };

  if (process.env.NODE_ENV === 'development') {
    console.info('ℹ️ Info:', infoLog);
  } else {
    console.info(JSON.stringify(infoLog));
  }
}

import { Prisma } from '@prisma/client';
import { ERROR_MESSAGES } from './error-messages';

/**
 * Handle Prisma errors and return user-friendly error messages
 */
export function handlePrismaError(error: unknown): string {
  // Check if it's a Prisma error
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        // Unique constraint violation
        return ERROR_MESSAGES.UNIQUE_CONSTRAINT;
      
      case 'P2003':
        // Foreign key constraint violation
        return ERROR_MESSAGES.FOREIGN_KEY_CONSTRAINT;
      
      case 'P2025':
        // Record not found
        return ERROR_MESSAGES.NOT_FOUND;
      
      case 'P2014':
        // Invalid ID
        return ERROR_MESSAGES.INVALID_FORMAT;
      
      case 'P2021':
        // Table does not exist
        return ERROR_MESSAGES.DATABASE_ERROR;
      
      case 'P2022':
        // Column does not exist
        return ERROR_MESSAGES.DATABASE_ERROR;
      
      default:
        return ERROR_MESSAGES.DATABASE_ERROR;
    }
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return ERROR_MESSAGES.VALIDATION_FAILED;
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return ERROR_MESSAGES.DATABASE_ERROR;
  }

  if (error instanceof Prisma.PrismaClientRustPanicError) {
    return ERROR_MESSAGES.DATABASE_ERROR;
  }

  // Not a Prisma error
  return ERROR_MESSAGES.SERVER_ERROR;
}

/**
 * Extract field name from Prisma unique constraint error
 */
export function extractUniqueConstraintField(error: unknown): string | null {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    const meta = error.meta as { target?: string[] };
    if (meta?.target && Array.isArray(meta.target)) {
      return meta.target[0] || null;
    }
  }
  return null;
}

/**
 * Check if error is a Prisma not found error
 */
export function isPrismaNotFoundError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2025'
  );
}

/**
 * Check if error is a Prisma unique constraint error
 */
export function isPrismaUniqueConstraintError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  );
}

/**
 * Check if error is a Prisma foreign key constraint error
 */
export function isPrismaForeignKeyError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2003'
  );
}

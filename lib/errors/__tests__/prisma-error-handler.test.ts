import { describe, it, expect } from 'vitest';
import { Prisma } from '@prisma/client';
import {
  handlePrismaError,
  extractUniqueConstraintField,
  isPrismaNotFoundError,
  isPrismaUniqueConstraintError,
  isPrismaForeignKeyError,
} from '../prisma-error-handler';
import { ERROR_MESSAGES } from '../error-messages';

describe('Prisma Error Handler Utilities', () => {
  describe('handlePrismaError', () => {
    it('should handle P2002 unique constraint error', () => {
      const error = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        {
          code: 'P2002',
          clientVersion: '5.0.0',
          meta: { target: ['email'] },
        }
      );

      const message = handlePrismaError(error);
      expect(message).toBe(ERROR_MESSAGES.UNIQUE_CONSTRAINT);
    });

    it('should handle P2003 foreign key constraint error', () => {
      const error = new Prisma.PrismaClientKnownRequestError(
        'Foreign key constraint failed',
        {
          code: 'P2003',
          clientVersion: '5.0.0',
        }
      );

      const message = handlePrismaError(error);
      expect(message).toBe(ERROR_MESSAGES.FOREIGN_KEY_CONSTRAINT);
    });

    it('should handle P2025 record not found error', () => {
      const error = new Prisma.PrismaClientKnownRequestError(
        'Record not found',
        {
          code: 'P2025',
          clientVersion: '5.0.0',
        }
      );

      const message = handlePrismaError(error);
      expect(message).toBe(ERROR_MESSAGES.NOT_FOUND);
    });

    it('should handle P2014 invalid ID error', () => {
      const error = new Prisma.PrismaClientKnownRequestError(
        'Invalid ID',
        {
          code: 'P2014',
          clientVersion: '5.0.0',
        }
      );

      const message = handlePrismaError(error);
      expect(message).toBe(ERROR_MESSAGES.INVALID_FORMAT);
    });

    it('should handle P2021 table does not exist error', () => {
      const error = new Prisma.PrismaClientKnownRequestError(
        'Table does not exist',
        {
          code: 'P2021',
          clientVersion: '5.0.0',
        }
      );

      const message = handlePrismaError(error);
      expect(message).toBe(ERROR_MESSAGES.DATABASE_ERROR);
    });

    it('should handle P2022 column does not exist error', () => {
      const error = new Prisma.PrismaClientKnownRequestError(
        'Column does not exist',
        {
          code: 'P2022',
          clientVersion: '5.0.0',
        }
      );

      const message = handlePrismaError(error);
      expect(message).toBe(ERROR_MESSAGES.DATABASE_ERROR);
    });

    it('should handle unknown Prisma error codes', () => {
      const error = new Prisma.PrismaClientKnownRequestError(
        'Unknown error',
        {
          code: 'P9999',
          clientVersion: '5.0.0',
        }
      );

      const message = handlePrismaError(error);
      expect(message).toBe(ERROR_MESSAGES.DATABASE_ERROR);
    });

    it('should handle PrismaClientValidationError', () => {
      const error = new Prisma.PrismaClientValidationError(
        'Validation error',
        { clientVersion: '5.0.0' }
      );

      const message = handlePrismaError(error);
      expect(message).toBe(ERROR_MESSAGES.VALIDATION_FAILED);
    });

    it('should handle PrismaClientInitializationError', () => {
      const error = new Prisma.PrismaClientInitializationError(
        'Initialization error',
        '5.0.0'
      );

      const message = handlePrismaError(error);
      expect(message).toBe(ERROR_MESSAGES.DATABASE_ERROR);
    });

    it('should handle PrismaClientRustPanicError', () => {
      const error = new Prisma.PrismaClientRustPanicError(
        'Rust panic',
        '5.0.0'
      );

      const message = handlePrismaError(error);
      expect(message).toBe(ERROR_MESSAGES.DATABASE_ERROR);
    });

    it('should return SERVER_ERROR for non-Prisma errors', () => {
      const error = new Error('Regular error');
      const message = handlePrismaError(error);
      expect(message).toBe(ERROR_MESSAGES.SERVER_ERROR);
    });
  });

  describe('extractUniqueConstraintField', () => {
    it('should extract field name from unique constraint error', () => {
      const error = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        {
          code: 'P2002',
          clientVersion: '5.0.0',
          meta: { target: ['email'] },
        }
      );

      const field = extractUniqueConstraintField(error);
      expect(field).toBe('email');
    });

    it('should extract first field from multi-field constraint', () => {
      const error = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        {
          code: 'P2002',
          clientVersion: '5.0.0',
          meta: { target: ['email', 'username'] },
        }
      );

      const field = extractUniqueConstraintField(error);
      expect(field).toBe('email');
    });

    it('should return null for non-unique constraint errors', () => {
      const error = new Prisma.PrismaClientKnownRequestError(
        'Other error',
        {
          code: 'P2003',
          clientVersion: '5.0.0',
        }
      );

      const field = extractUniqueConstraintField(error);
      expect(field).toBeNull();
    });

    it('should return null when meta.target is missing', () => {
      const error = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        {
          code: 'P2002',
          clientVersion: '5.0.0',
          meta: {},
        }
      );

      const field = extractUniqueConstraintField(error);
      expect(field).toBeNull();
    });

    it('should return null for non-Prisma errors', () => {
      const error = new Error('Regular error');
      const field = extractUniqueConstraintField(error);
      expect(field).toBeNull();
    });
  });

  describe('isPrismaNotFoundError', () => {
    it('should return true for P2025 error', () => {
      const error = new Prisma.PrismaClientKnownRequestError(
        'Record not found',
        {
          code: 'P2025',
          clientVersion: '5.0.0',
        }
      );

      expect(isPrismaNotFoundError(error)).toBe(true);
    });

    it('should return false for other Prisma errors', () => {
      const error = new Prisma.PrismaClientKnownRequestError(
        'Other error',
        {
          code: 'P2002',
          clientVersion: '5.0.0',
        }
      );

      expect(isPrismaNotFoundError(error)).toBe(false);
    });

    it('should return false for non-Prisma errors', () => {
      const error = new Error('Regular error');
      expect(isPrismaNotFoundError(error)).toBe(false);
    });
  });

  describe('isPrismaUniqueConstraintError', () => {
    it('should return true for P2002 error', () => {
      const error = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        {
          code: 'P2002',
          clientVersion: '5.0.0',
        }
      );

      expect(isPrismaUniqueConstraintError(error)).toBe(true);
    });

    it('should return false for other Prisma errors', () => {
      const error = new Prisma.PrismaClientKnownRequestError(
        'Other error',
        {
          code: 'P2025',
          clientVersion: '5.0.0',
        }
      );

      expect(isPrismaUniqueConstraintError(error)).toBe(false);
    });

    it('should return false for non-Prisma errors', () => {
      const error = new Error('Regular error');
      expect(isPrismaUniqueConstraintError(error)).toBe(false);
    });
  });

  describe('isPrismaForeignKeyError', () => {
    it('should return true for P2003 error', () => {
      const error = new Prisma.PrismaClientKnownRequestError(
        'Foreign key constraint failed',
        {
          code: 'P2003',
          clientVersion: '5.0.0',
        }
      );

      expect(isPrismaForeignKeyError(error)).toBe(true);
    });

    it('should return false for other Prisma errors', () => {
      const error = new Prisma.PrismaClientKnownRequestError(
        'Other error',
        {
          code: 'P2002',
          clientVersion: '5.0.0',
        }
      );

      expect(isPrismaForeignKeyError(error)).toBe(false);
    });

    it('should return false for non-Prisma errors', () => {
      const error = new Error('Regular error');
      expect(isPrismaForeignKeyError(error)).toBe(false);
    });
  });
});

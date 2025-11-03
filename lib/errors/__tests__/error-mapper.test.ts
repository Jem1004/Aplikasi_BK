import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ZodError, z } from 'zod';
import { Prisma } from '@prisma/client';
import { mapErrorToMessage, mapZodErrorsToFields, sanitizeErrorMessage } from '../error-mapper';
import { ERROR_MESSAGES } from '../error-messages';

describe('Error Mapper Utilities', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  describe('mapErrorToMessage', () => {
    it('should map Zod validation error to first error message', () => {
      const schema = z.object({
        email: z.string().email('Email tidak valid'),
      });

      try {
        schema.parse({ email: 'invalid' });
      } catch (error) {
        const message = mapErrorToMessage(error);
        expect(message).toBe('Email tidak valid');
      }
    });

    it('should map Prisma unique constraint error', () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        {
          code: 'P2002',
          clientVersion: '5.0.0',
        }
      );

      const message = mapErrorToMessage(prismaError);
      expect(message).toBe(ERROR_MESSAGES.UNIQUE_CONSTRAINT);
    });

    it('should map Prisma not found error', () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Record not found',
        {
          code: 'P2025',
          clientVersion: '5.0.0',
        }
      );

      const message = mapErrorToMessage(prismaError);
      expect(message).toBe(ERROR_MESSAGES.NOT_FOUND);
    });

    it('should return predefined error message for known errors', () => {
      const error = new Error(ERROR_MESSAGES.UNAUTHORIZED);
      const message = mapErrorToMessage(error);
      expect(message).toBe(ERROR_MESSAGES.UNAUTHORIZED);
    });

    it('should return actual error message in development', () => {
      process.env.NODE_ENV = 'development';
      const error = new Error('Custom development error');
      const message = mapErrorToMessage(error);
      expect(message).toBe('Custom development error');
    });

    it('should return generic error in production for unknown errors', () => {
      process.env.NODE_ENV = 'production';
      const error = new Error('Internal server details');
      const message = mapErrorToMessage(error);
      expect(message).toBe(ERROR_MESSAGES.SERVER_ERROR);
    });

    it('should handle string errors', () => {
      const message = mapErrorToMessage('String error message');
      expect(message).toBe('String error message');
    });

    it('should handle unknown error types', () => {
      const message = mapErrorToMessage({ unknown: 'object' });
      expect(message).toBe(ERROR_MESSAGES.UNKNOWN_ERROR);
    });

    it('should handle null error', () => {
      const message = mapErrorToMessage(null);
      expect(message).toBe(ERROR_MESSAGES.UNKNOWN_ERROR);
    });

    it('should handle undefined error', () => {
      const message = mapErrorToMessage(undefined);
      expect(message).toBe(ERROR_MESSAGES.UNKNOWN_ERROR);
    });
  });

  describe('mapZodErrorsToFields', () => {
    it('should map Zod errors to field-level errors', () => {
      const schema = z.object({
        email: z.string().email('Email tidak valid'),
        password: z.string().min(8, 'Password minimal 8 karakter'),
      });

      try {
        schema.parse({ email: 'invalid', password: 'short' });
      } catch (error) {
        if (error instanceof ZodError) {
          const fieldErrors = mapZodErrorsToFields(error);
          expect(fieldErrors).toHaveProperty('email');
          expect(fieldErrors).toHaveProperty('password');
          expect(fieldErrors.email).toContain('Email tidak valid');
          expect(fieldErrors.password).toContain('Password minimal 8 karakter');
        }
      }
    });

    it('should handle nested field errors', () => {
      const schema = z.object({
        user: z.object({
          name: z.string().min(1, 'Name is required'),
        }),
      });

      try {
        schema.parse({ user: { name: '' } });
      } catch (error) {
        if (error instanceof ZodError) {
          const fieldErrors = mapZodErrorsToFields(error);
          expect(fieldErrors).toHaveProperty('user.name');
          expect(fieldErrors['user.name']).toContain('Name is required');
        }
      }
    });

    it('should handle multiple errors for same field', () => {
      const schema = z.object({
        password: z
          .string()
          .min(8, 'Too short')
          .regex(/[A-Z]/, 'Need uppercase'),
      });

      try {
        schema.parse({ password: 'short' });
      } catch (error) {
        if (error instanceof ZodError) {
          const fieldErrors = mapZodErrorsToFields(error);
          expect(fieldErrors.password.length).toBeGreaterThan(0);
        }
      }
    });

    it('should handle array field errors', () => {
      const schema = z.object({
        items: z.array(z.string().min(1, 'Item required')),
      });

      try {
        schema.parse({ items: ['valid', ''] });
      } catch (error) {
        if (error instanceof ZodError) {
          const fieldErrors = mapZodErrorsToFields(error);
          expect(fieldErrors).toHaveProperty('items.1');
        }
      }
    });
  });

  describe('sanitizeErrorMessage', () => {
    it('should remove email addresses from error messages in development', () => {
      process.env.NODE_ENV = 'development';
      const error = new Error('User user@example.com not found');
      const sanitized = sanitizeErrorMessage(error);
      expect(sanitized).toBe('User [email] not found');
      expect(sanitized).not.toContain('user@example.com');
    });

    it('should remove long numbers from error messages in development', () => {
      process.env.NODE_ENV = 'development';
      const error = new Error('ID 1234567890123 not found');
      const sanitized = sanitizeErrorMessage(error);
      expect(sanitized).toBe('ID [number] not found');
      expect(sanitized).not.toContain('1234567890123');
    });

    it('should remove password mentions from error messages in development', () => {
      process.env.NODE_ENV = 'development';
      const error = new Error('Password validation failed');
      const sanitized = sanitizeErrorMessage(error);
      expect(sanitized).toBe('[credential] validation failed');
      expect(sanitized).not.toContain('password');
    });

    it('should handle multiple sensitive data in one message in development', () => {
      process.env.NODE_ENV = 'development';
      const error = new Error('User admin@test.com with password failed at 1234567890');
      const sanitized = sanitizeErrorMessage(error);
      expect(sanitized).not.toContain('admin@test.com');
      expect(sanitized).not.toContain('password');
      expect(sanitized).not.toContain('1234567890');
    });

    it('should return generic error in production for unknown errors', () => {
      process.env.NODE_ENV = 'production';
      const error = new Error('Invalid input data');
      const sanitized = sanitizeErrorMessage(error);
      expect(sanitized).toBe(ERROR_MESSAGES.SERVER_ERROR);
    });

    it('should handle case-insensitive password removal in development', () => {
      process.env.NODE_ENV = 'development';
      const error = new Error('PASSWORD and Password failed');
      const sanitized = sanitizeErrorMessage(error);
      expect(sanitized).not.toContain('PASSWORD');
      expect(sanitized).not.toContain('Password');
    });

    it('should preserve predefined error messages', () => {
      const error = new Error(ERROR_MESSAGES.UNAUTHORIZED);
      const sanitized = sanitizeErrorMessage(error);
      expect(sanitized).toBe(ERROR_MESSAGES.UNAUTHORIZED);
    });
  });
});

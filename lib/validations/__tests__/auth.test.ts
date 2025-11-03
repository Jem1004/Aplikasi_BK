import { describe, it, expect } from 'vitest';
import { loginSchema, changePasswordSchema } from '../auth';

describe('Auth Validation Schemas', () => {
  describe('loginSchema', () => {
    it('should validate correct login data', () => {
      const validData = {
        identifier: 'user@example.com',
        password: 'password123',
      };

      const result = loginSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept username as identifier', () => {
      const validData = {
        identifier: 'username123',
        password: 'password123',
      };

      const result = loginSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject empty identifier', () => {
      const invalidData = {
        identifier: '',
        password: 'password123',
      };

      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Email atau username harus diisi');
      }
    });

    it('should reject empty password', () => {
      const invalidData = {
        identifier: 'user@example.com',
        password: '',
      };

      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Password harus diisi');
      }
    });

    it('should reject missing fields', () => {
      const invalidData = {};

      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('changePasswordSchema', () => {
    it('should validate correct password change data', () => {
      const validData = {
        currentPassword: 'oldPassword123',
        newPassword: 'newPassword456',
        confirmPassword: 'newPassword456',
      };

      const result = changePasswordSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject password shorter than 8 characters', () => {
      const invalidData = {
        currentPassword: 'oldPassword123',
        newPassword: 'short1',
        confirmPassword: 'short1',
      };

      const result = changePasswordSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Password minimal 8 karakter');
      }
    });

    it('should reject password without letters', () => {
      const invalidData = {
        currentPassword: 'oldPassword123',
        newPassword: '12345678',
        confirmPassword: '12345678',
      };

      const result = changePasswordSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors.some(e => e.message === 'Password harus mengandung huruf')).toBe(true);
      }
    });

    it('should reject password without numbers', () => {
      const invalidData = {
        currentPassword: 'oldPassword123',
        newPassword: 'abcdefgh',
        confirmPassword: 'abcdefgh',
      };

      const result = changePasswordSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors.some(e => e.message === 'Password harus mengandung angka')).toBe(true);
      }
    });

    it('should reject mismatched passwords', () => {
      const invalidData = {
        currentPassword: 'oldPassword123',
        newPassword: 'newPassword456',
        confirmPassword: 'differentPassword789',
      };

      const result = changePasswordSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors.some(e => e.message === 'Konfirmasi password tidak cocok')).toBe(true);
      }
    });

    it('should reject empty current password', () => {
      const invalidData = {
        currentPassword: '',
        newPassword: 'newPassword456',
        confirmPassword: 'newPassword456',
      };

      const result = changePasswordSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Password saat ini harus diisi');
      }
    });

    it('should accept password with special characters', () => {
      const validData = {
        currentPassword: 'oldPassword123',
        newPassword: 'newPass123!@#',
        confirmPassword: 'newPass123!@#',
      };

      const result = changePasswordSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });
});

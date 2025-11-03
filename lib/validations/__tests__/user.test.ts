import { describe, it, expect } from 'vitest';
import { createUserSchema, updateUserSchema } from '../user';

describe('User Validation Schemas', () => {
  describe('createUserSchema', () => {
    it('should validate correct ADMIN user data', () => {
      const validData = {
        email: 'admin@example.com',
        username: 'admin123',
        password: 'password123',
        fullName: 'Admin User',
        role: 'ADMIN',
        isActive: true,
      };

      const result = createUserSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate correct GURU_BK user data with NIP', () => {
      const validData = {
        email: 'gurubk@example.com',
        username: 'gurubk123',
        password: 'password123',
        fullName: 'Guru BK',
        role: 'GURU_BK',
        nip: '1234567890',
        specialization: 'Bimbingan Konseling',
        isActive: true,
      };

      const result = createUserSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate correct SISWA user data with NIS', () => {
      const validData = {
        email: 'siswa@example.com',
        username: 'siswa123',
        password: 'password123',
        fullName: 'Siswa Test',
        role: 'SISWA',
        nis: '2024001',
        nisn: '1234567890',
        classId: '123e4567-e89b-12d3-a456-426614174000',
        dateOfBirth: '2008-01-01',
        address: 'Jl. Test No. 123',
        parentName: 'Parent Name',
        parentPhone: '081234567890',
        isActive: true,
      };

      const result = createUserSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email format', () => {
      const invalidData = {
        email: 'invalid-email',
        username: 'user123',
        password: 'password123',
        fullName: 'Test User',
        role: 'ADMIN',
      };

      const result = createUserSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Email tidak valid');
      }
    });

    it('should reject username shorter than 3 characters', () => {
      const invalidData = {
        email: 'user@example.com',
        username: 'ab',
        password: 'password123',
        fullName: 'Test User',
        role: 'ADMIN',
      };

      const result = createUserSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Username minimal 3 karakter');
      }
    });

    it('should reject username with special characters', () => {
      const invalidData = {
        email: 'user@example.com',
        username: 'user@123',
        password: 'password123',
        fullName: 'Test User',
        role: 'ADMIN',
      };

      const result = createUserSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Username hanya boleh mengandung huruf, angka, dan underscore');
      }
    });

    it('should accept username with underscore', () => {
      const validData = {
        email: 'user@example.com',
        username: 'user_123',
        password: 'password123',
        fullName: 'Test User',
        role: 'ADMIN',
      };

      const result = createUserSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject password shorter than 8 characters', () => {
      const invalidData = {
        email: 'user@example.com',
        username: 'user123',
        password: 'pass1',
        fullName: 'Test User',
        role: 'ADMIN',
      };

      const result = createUserSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Password minimal 8 karakter');
      }
    });

    it('should reject password without letters', () => {
      const invalidData = {
        email: 'user@example.com',
        username: 'user123',
        password: '12345678',
        fullName: 'Test User',
        role: 'ADMIN',
      };

      const result = createUserSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors.some(e => e.message === 'Password harus mengandung huruf')).toBe(true);
      }
    });

    it('should reject password without numbers', () => {
      const invalidData = {
        email: 'user@example.com',
        username: 'user123',
        password: 'abcdefgh',
        fullName: 'Test User',
        role: 'ADMIN',
      };

      const result = createUserSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors.some(e => e.message === 'Password harus mengandung angka')).toBe(true);
      }
    });

    it('should reject GURU_BK without NIP', () => {
      const invalidData = {
        email: 'gurubk@example.com',
        username: 'gurubk123',
        password: 'password123',
        fullName: 'Guru BK',
        role: 'GURU_BK',
      };

      const result = createUserSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors.some(e => e.message === 'NIP harus diisi untuk Guru BK dan Wali Kelas')).toBe(true);
      }
    });

    it('should reject WALI_KELAS without NIP', () => {
      const invalidData = {
        email: 'walikelas@example.com',
        username: 'walikelas123',
        password: 'password123',
        fullName: 'Wali Kelas',
        role: 'WALI_KELAS',
      };

      const result = createUserSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors.some(e => e.message === 'NIP harus diisi untuk Guru BK dan Wali Kelas')).toBe(true);
      }
    });

    it('should reject SISWA without NIS', () => {
      const invalidData = {
        email: 'siswa@example.com',
        username: 'siswa123',
        password: 'password123',
        fullName: 'Siswa Test',
        role: 'SISWA',
      };

      const result = createUserSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors.some(e => e.message === 'NIS harus diisi untuk Siswa')).toBe(true);
      }
    });

    it('should reject invalid role', () => {
      const invalidData = {
        email: 'user@example.com',
        username: 'user123',
        password: 'password123',
        fullName: 'Test User',
        role: 'INVALID_ROLE',
      };

      const result = createUserSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Role tidak valid');
      }
    });

    it('should reject invalid UUID for classId', () => {
      const invalidData = {
        email: 'siswa@example.com',
        username: 'siswa123',
        password: 'password123',
        fullName: 'Siswa Test',
        role: 'SISWA',
        nis: '2024001',
        classId: 'invalid-uuid',
      };

      const result = createUserSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Class ID tidak valid');
      }
    });

    it('should default isActive to true', () => {
      const validData = {
        email: 'user@example.com',
        username: 'user123',
        password: 'password123',
        fullName: 'Test User',
        role: 'ADMIN',
      };

      const result = createUserSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isActive).toBe(true);
      }
    });
  });

  describe('updateUserSchema', () => {
    it('should validate partial user update', () => {
      const validData = {
        fullName: 'Updated Name',
      };

      const result = updateUserSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate email update', () => {
      const validData = {
        email: 'newemail@example.com',
      };

      const result = updateUserSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate password update with requirements', () => {
      const validData = {
        password: 'newPassword123',
      };

      const result = updateUserSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email in update', () => {
      const invalidData = {
        email: 'invalid-email',
      };

      const result = updateUserSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Email tidak valid');
      }
    });

    it('should reject weak password in update', () => {
      const invalidData = {
        password: 'weak',
      };

      const result = updateUserSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should allow empty update object', () => {
      const validData = {};

      const result = updateUserSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate multiple field updates', () => {
      const validData = {
        email: 'updated@example.com',
        fullName: 'Updated Name',
        phone: '081234567890',
        isActive: false,
      };

      const result = updateUserSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });
});

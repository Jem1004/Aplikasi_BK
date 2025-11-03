import { describe, it, expect } from 'vitest';
import { createViolationSchema, updateViolationSchema } from '../violation';

describe('Violation Validation Schemas', () => {
  describe('createViolationSchema', () => {
    it('should validate correct violation data', () => {
      const validData = {
        studentId: '123e4567-e89b-12d3-a456-426614174000',
        violationTypeId: '123e4567-e89b-12d3-a456-426614174001',
        incidentDate: '2024-01-15',
        description: 'Test violation description',
      };

      const result = createViolationSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate violation without description', () => {
      const validData = {
        studentId: '123e4567-e89b-12d3-a456-426614174000',
        violationTypeId: '123e4567-e89b-12d3-a456-426614174001',
        incidentDate: '2024-01-15',
      };

      const result = createViolationSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid studentId UUID', () => {
      const invalidData = {
        studentId: 'invalid-uuid',
        violationTypeId: '123e4567-e89b-12d3-a456-426614174001',
        incidentDate: '2024-01-15',
      };

      const result = createViolationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Student ID tidak valid');
      }
    });

    it('should reject invalid violationTypeId UUID', () => {
      const invalidData = {
        studentId: '123e4567-e89b-12d3-a456-426614174000',
        violationTypeId: 'invalid-uuid',
        incidentDate: '2024-01-15',
      };

      const result = createViolationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Violation Type ID tidak valid');
      }
    });

    it('should reject empty incidentDate', () => {
      const invalidData = {
        studentId: '123e4567-e89b-12d3-a456-426614174000',
        violationTypeId: '123e4567-e89b-12d3-a456-426614174001',
        incidentDate: '',
      };

      const result = createViolationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Tanggal kejadian harus diisi');
      }
    });

    it('should reject future incidentDate', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      const futureDateString = futureDate.toISOString().split('T')[0];

      const invalidData = {
        studentId: '123e4567-e89b-12d3-a456-426614174000',
        violationTypeId: '123e4567-e89b-12d3-a456-426614174001',
        incidentDate: futureDateString,
      };

      const result = createViolationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors.some(e => e.message === 'Tanggal kejadian tidak boleh di masa depan')).toBe(true);
      }
    });

    it('should accept today as incidentDate', () => {
      const today = new Date().toISOString().split('T')[0];

      const validData = {
        studentId: '123e4567-e89b-12d3-a456-426614174000',
        violationTypeId: '123e4567-e89b-12d3-a456-426614174001',
        incidentDate: today,
      };

      const result = createViolationSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept past incidentDate', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 7);
      const pastDateString = pastDate.toISOString().split('T')[0];

      const validData = {
        studentId: '123e4567-e89b-12d3-a456-426614174000',
        violationTypeId: '123e4567-e89b-12d3-a456-426614174001',
        incidentDate: pastDateString,
      };

      const result = createViolationSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('updateViolationSchema', () => {
    it('should validate partial violation update', () => {
      const validData = {
        description: 'Updated description',
      };

      const result = updateViolationSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate violationTypeId update', () => {
      const validData = {
        violationTypeId: '123e4567-e89b-12d3-a456-426614174002',
      };

      const result = updateViolationSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate incidentDate update', () => {
      const validData = {
        incidentDate: '2024-01-20',
      };

      const result = updateViolationSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid violationTypeId UUID in update', () => {
      const invalidData = {
        violationTypeId: 'invalid-uuid',
      };

      const result = updateViolationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Violation Type ID tidak valid');
      }
    });

    it('should reject future incidentDate in update', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      const futureDateString = futureDate.toISOString().split('T')[0];

      const invalidData = {
        incidentDate: futureDateString,
      };

      const result = updateViolationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors.some(e => e.message === 'Tanggal kejadian tidak boleh di masa depan')).toBe(true);
      }
    });

    it('should allow empty update object', () => {
      const validData = {};

      const result = updateViolationSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate multiple field updates', () => {
      const validData = {
        violationTypeId: '123e4567-e89b-12d3-a456-426614174002',
        incidentDate: '2024-01-20',
        description: 'Updated description',
      };

      const result = updateViolationSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });
});

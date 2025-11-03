import { describe, it, expect } from 'vitest';
import {
  AUDIT_ACTIONS,
  ENTITY_TYPES,
  sanitizeForAudit,
} from '../audit-logger';

describe('Audit Logger Utilities', () => {
  describe('AUDIT_ACTIONS constants', () => {
    it('should have user action constants', () => {
      expect(AUDIT_ACTIONS.USER_CREATED).toBe('USER_CREATED');
      expect(AUDIT_ACTIONS.USER_UPDATED).toBe('USER_UPDATED');
      expect(AUDIT_ACTIONS.USER_DELETED).toBe('USER_DELETED');
      expect(AUDIT_ACTIONS.USER_LOGIN).toBe('USER_LOGIN');
      expect(AUDIT_ACTIONS.USER_LOGOUT).toBe('USER_LOGOUT');
      expect(AUDIT_ACTIONS.USER_PASSWORD_CHANGED).toBe('USER_PASSWORD_CHANGED');
    });

    it('should have violation action constants', () => {
      expect(AUDIT_ACTIONS.VIOLATION_CREATED).toBe('VIOLATION_CREATED');
      expect(AUDIT_ACTIONS.VIOLATION_UPDATED).toBe('VIOLATION_UPDATED');
      expect(AUDIT_ACTIONS.VIOLATION_DELETED).toBe('VIOLATION_DELETED');
    });

    it('should have journal action constants', () => {
      expect(AUDIT_ACTIONS.JOURNAL_CREATED).toBe('JOURNAL_CREATED');
      expect(AUDIT_ACTIONS.JOURNAL_READ).toBe('JOURNAL_READ');
      expect(AUDIT_ACTIONS.JOURNAL_UPDATED).toBe('JOURNAL_UPDATED');
      expect(AUDIT_ACTIONS.JOURNAL_DELETED).toBe('JOURNAL_DELETED');
    });

    it('should have permission action constants', () => {
      expect(AUDIT_ACTIONS.PERMISSION_CREATED).toBe('PERMISSION_CREATED');
    });

    it('should have appointment action constants', () => {
      expect(AUDIT_ACTIONS.APPOINTMENT_CREATED).toBe('APPOINTMENT_CREATED');
      expect(AUDIT_ACTIONS.APPOINTMENT_APPROVED).toBe('APPOINTMENT_APPROVED');
      expect(AUDIT_ACTIONS.APPOINTMENT_REJECTED).toBe('APPOINTMENT_REJECTED');
      expect(AUDIT_ACTIONS.APPOINTMENT_RESCHEDULED).toBe('APPOINTMENT_RESCHEDULED');
      expect(AUDIT_ACTIONS.APPOINTMENT_COMPLETED).toBe('APPOINTMENT_COMPLETED');
      expect(AUDIT_ACTIONS.APPOINTMENT_CANCELLED).toBe('APPOINTMENT_CANCELLED');
    });

    it('should have mapping action constants', () => {
      expect(AUDIT_ACTIONS.STUDENT_COUNSELOR_ASSIGNED).toBe('STUDENT_COUNSELOR_ASSIGNED');
      expect(AUDIT_ACTIONS.STUDENT_COUNSELOR_REMOVED).toBe('STUDENT_COUNSELOR_REMOVED');
      expect(AUDIT_ACTIONS.HOMEROOM_TEACHER_ASSIGNED).toBe('HOMEROOM_TEACHER_ASSIGNED');
      expect(AUDIT_ACTIONS.HOMEROOM_TEACHER_REMOVED).toBe('HOMEROOM_TEACHER_REMOVED');
    });

    it('should have master data action constants', () => {
      expect(AUDIT_ACTIONS.ACADEMIC_YEAR_CREATED).toBe('ACADEMIC_YEAR_CREATED');
      expect(AUDIT_ACTIONS.ACADEMIC_YEAR_UPDATED).toBe('ACADEMIC_YEAR_UPDATED');
      expect(AUDIT_ACTIONS.ACADEMIC_YEAR_DELETED).toBe('ACADEMIC_YEAR_DELETED');
      expect(AUDIT_ACTIONS.CLASS_CREATED).toBe('CLASS_CREATED');
      expect(AUDIT_ACTIONS.CLASS_UPDATED).toBe('CLASS_UPDATED');
      expect(AUDIT_ACTIONS.CLASS_DELETED).toBe('CLASS_DELETED');
      expect(AUDIT_ACTIONS.VIOLATION_TYPE_CREATED).toBe('VIOLATION_TYPE_CREATED');
      expect(AUDIT_ACTIONS.VIOLATION_TYPE_UPDATED).toBe('VIOLATION_TYPE_UPDATED');
      expect(AUDIT_ACTIONS.VIOLATION_TYPE_DELETED).toBe('VIOLATION_TYPE_DELETED');
    });
  });

  describe('ENTITY_TYPES constants', () => {
    it('should have all entity type constants', () => {
      expect(ENTITY_TYPES.USER).toBe('USER');
      expect(ENTITY_TYPES.TEACHER).toBe('TEACHER');
      expect(ENTITY_TYPES.STUDENT).toBe('STUDENT');
      expect(ENTITY_TYPES.VIOLATION).toBe('VIOLATION');
      expect(ENTITY_TYPES.COUNSELING_JOURNAL).toBe('COUNSELING_JOURNAL');
      expect(ENTITY_TYPES.PERMISSION).toBe('PERMISSION');
      expect(ENTITY_TYPES.APPOINTMENT).toBe('APPOINTMENT');
      expect(ENTITY_TYPES.STUDENT_COUNSELOR_ASSIGNMENT).toBe('STUDENT_COUNSELOR_ASSIGNMENT');
      expect(ENTITY_TYPES.CLASS_HOMEROOM_TEACHER).toBe('CLASS_HOMEROOM_TEACHER');
      expect(ENTITY_TYPES.ACADEMIC_YEAR).toBe('ACADEMIC_YEAR');
      expect(ENTITY_TYPES.CLASS).toBe('CLASS');
      expect(ENTITY_TYPES.VIOLATION_TYPE).toBe('VIOLATION_TYPE');
    });
  });

  describe('sanitizeForAudit', () => {
    it('should redact passwordHash field', () => {
      const data = {
        id: '123',
        email: 'user@example.com',
        passwordHash: 'hashed_password_value',
        fullName: 'Test User',
      };

      const sanitized = sanitizeForAudit(data);
      expect(sanitized.passwordHash).toBe('[REDACTED]');
      expect(sanitized.email).toBe('user@example.com');
      expect(sanitized.fullName).toBe('Test User');
    });

    it('should redact password field', () => {
      const data = {
        username: 'testuser',
        password: 'plain_password',
      };

      const sanitized = sanitizeForAudit(data);
      expect(sanitized.password).toBe('[REDACTED]');
      expect(sanitized.username).toBe('testuser');
    });

    it('should redact encryptedContent field', () => {
      const data = {
        id: '123',
        studentId: '456',
        encryptedContent: 'encrypted_data_here',
        sessionDate: '2024-01-01',
      };

      const sanitized = sanitizeForAudit(data);
      expect(sanitized.encryptedContent).toBe('[REDACTED]');
      expect(sanitized.studentId).toBe('456');
      expect(sanitized.sessionDate).toBe('2024-01-01');
    });

    it('should redact encryptionIv field', () => {
      const data = {
        id: '123',
        encryptionIv: 'iv_value',
        encryptionTag: 'tag_value',
      };

      const sanitized = sanitizeForAudit(data);
      expect(sanitized.encryptionIv).toBe('[REDACTED]');
      expect(sanitized.encryptionTag).toBe('[REDACTED]');
    });

    it('should redact multiple sensitive fields', () => {
      const data = {
        id: '123',
        email: 'user@example.com',
        passwordHash: 'hashed_password',
        encryptedContent: 'encrypted_data',
        encryptionIv: 'iv_value',
        encryptionTag: 'tag_value',
        fullName: 'Test User',
      };

      const sanitized = sanitizeForAudit(data);
      expect(sanitized.passwordHash).toBe('[REDACTED]');
      expect(sanitized.encryptedContent).toBe('[REDACTED]');
      expect(sanitized.encryptionIv).toBe('[REDACTED]');
      expect(sanitized.encryptionTag).toBe('[REDACTED]');
      expect(sanitized.email).toBe('user@example.com');
      expect(sanitized.fullName).toBe('Test User');
    });

    it('should not modify data without sensitive fields', () => {
      const data = {
        id: '123',
        name: 'Test',
        description: 'Description',
        points: 10,
      };

      const sanitized = sanitizeForAudit(data);
      expect(sanitized).toEqual(data);
    });

    it('should handle empty object', () => {
      const data = {};
      const sanitized = sanitizeForAudit(data);
      expect(sanitized).toEqual({});
    });

    it('should not mutate original object', () => {
      const data = {
        id: '123',
        passwordHash: 'hashed_password',
        email: 'user@example.com',
      };

      const sanitized = sanitizeForAudit(data);
      expect(data.passwordHash).toBe('hashed_password'); // Original unchanged
      expect(sanitized.passwordHash).toBe('[REDACTED]'); // Sanitized version
    });

    it('should handle nested objects (shallow sanitization)', () => {
      const data = {
        user: {
          passwordHash: 'hashed_password',
        },
        email: 'user@example.com',
      };

      const sanitized = sanitizeForAudit(data);
      // Note: Current implementation only sanitizes top-level fields
      expect(sanitized.email).toBe('user@example.com');
      expect(sanitized.user).toEqual({ passwordHash: 'hashed_password' });
    });
  });
});

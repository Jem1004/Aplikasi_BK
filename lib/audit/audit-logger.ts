import { prisma } from '@/lib/db/prisma';
import { headers } from 'next/headers';

/**
 * Audit action types
 */
export const AUDIT_ACTIONS = {
  // User actions
  USER_CREATED: 'USER_CREATED',
  USER_UPDATED: 'USER_UPDATED',
  USER_DELETED: 'USER_DELETED',
  USER_REACTIVATED: 'USER_REACTIVATED',
  USER_PERMANENTLY_DELETED: 'USER_PERMANENTLY_DELETED',
  USER_LOGIN: 'USER_LOGIN',
  USER_LOGOUT: 'USER_LOGOUT',
  USER_PASSWORD_CHANGED: 'USER_PASSWORD_CHANGED',
  USER_PASSWORD_RESET: 'USER_PASSWORD_RESET',

  // Violation actions
  VIOLATION_CREATED: 'VIOLATION_CREATED',
  VIOLATION_UPDATED: 'VIOLATION_UPDATED',
  VIOLATION_DELETED: 'VIOLATION_DELETED',

  // Counseling journal actions (CRITICAL - track all access)
  JOURNAL_CREATED: 'JOURNAL_CREATED',
  JOURNAL_READ: 'JOURNAL_READ',
  JOURNAL_UPDATED: 'JOURNAL_UPDATED',
  JOURNAL_DELETED: 'JOURNAL_DELETED',

  // Permission actions
  PERMISSION_CREATED: 'PERMISSION_CREATED',
  PERMISSION_DELETED: 'PERMISSION_DELETED',

  // Appointment actions
  APPOINTMENT_CREATED: 'APPOINTMENT_CREATED',
  APPOINTMENT_APPROVED: 'APPOINTMENT_APPROVED',
  APPOINTMENT_REJECTED: 'APPOINTMENT_REJECTED',
  APPOINTMENT_RESCHEDULED: 'APPOINTMENT_RESCHEDULED',
  APPOINTMENT_COMPLETED: 'APPOINTMENT_COMPLETED',
  APPOINTMENT_CANCELLED: 'APPOINTMENT_CANCELLED',

  // Mapping actions
  STUDENT_COUNSELOR_ASSIGNED: 'STUDENT_COUNSELOR_ASSIGNED',
  STUDENT_COUNSELOR_REMOVED: 'STUDENT_COUNSELOR_REMOVED',
  HOMEROOM_TEACHER_ASSIGNED: 'HOMEROOM_TEACHER_ASSIGNED',
  HOMEROOM_TEACHER_REMOVED: 'HOMEROOM_TEACHER_REMOVED',

  // Master data actions
  ACADEMIC_YEAR_CREATED: 'ACADEMIC_YEAR_CREATED',
  ACADEMIC_YEAR_UPDATED: 'ACADEMIC_YEAR_UPDATED',
  ACADEMIC_YEAR_DELETED: 'ACADEMIC_YEAR_DELETED',
  CLASS_CREATED: 'CLASS_CREATED',
  CLASS_UPDATED: 'CLASS_UPDATED',
  CLASS_DELETED: 'CLASS_DELETED',
  VIOLATION_TYPE_CREATED: 'VIOLATION_TYPE_CREATED',
  VIOLATION_TYPE_UPDATED: 'VIOLATION_TYPE_UPDATED',
  VIOLATION_TYPE_DELETED: 'VIOLATION_TYPE_DELETED',
  
  // School info actions
  SCHOOL_INFO_CREATED: 'SCHOOL_INFO_CREATED',
  SCHOOL_INFO_UPDATED: 'SCHOOL_INFO_UPDATED',
  SCHOOL_LOGO_UPLOADED: 'SCHOOL_LOGO_UPLOADED',
  SCHOOL_LOGO_DELETED: 'SCHOOL_LOGO_DELETED',
} as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];

/**
 * Entity types for audit logging
 */
export const ENTITY_TYPES = {
  USER: 'USER',
  TEACHER: 'TEACHER',
  STUDENT: 'STUDENT',
  VIOLATION: 'VIOLATION',
  COUNSELING_JOURNAL: 'COUNSELING_JOURNAL',
  PERMISSION: 'PERMISSION',
  APPOINTMENT: 'APPOINTMENT',
  STUDENT_COUNSELOR_ASSIGNMENT: 'STUDENT_COUNSELOR_ASSIGNMENT',
  CLASS_HOMEROOM_TEACHER: 'CLASS_HOMEROOM_TEACHER',
  ACADEMIC_YEAR: 'ACADEMIC_YEAR',
  CLASS: 'CLASS',
  VIOLATION_TYPE: 'VIOLATION_TYPE',
  SCHOOL_INFO: 'SCHOOL_INFO',
} as const;

export type EntityType = (typeof ENTITY_TYPES)[keyof typeof ENTITY_TYPES];

/**
 * Audit log entry interface
 */
export interface AuditLogEntry {
  userId?: string;
  action: AuditAction;
  entityType: EntityType;
  entityId?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Get client IP address from request headers
 */
async function getClientIp(): Promise<string | undefined> {
  const headersList = await headers();
  
  // Try various headers that might contain the client IP
  const forwardedFor = headersList.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = headersList.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  return undefined;
}

/**
 * Get user agent from request headers
 */
async function getUserAgent(): Promise<string | undefined> {
  const headersList = await headers();
  return headersList.get('user-agent') || undefined;
}

/**
 * Main audit logging function
 * Logs an audit event to the database
 */
export async function logAuditEvent(entry: AuditLogEntry): Promise<void> {
  try {
    // Get IP address and user agent if not provided
    const ipAddress = entry.ipAddress || await getClientIp();
    const userAgent = entry.userAgent || await getUserAgent();

    await prisma.auditLog.create({
      data: {
        userId: entry.userId,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        oldValues: entry.oldValues || undefined,
        newValues: entry.newValues || undefined,
        ipAddress,
        userAgent,
      },
    });
  } catch (error) {
    // Log error but don't throw - audit logging should not break the main flow
    console.error('Failed to log audit event:', error);
  }
}

/**
 * Helper function to log create operations
 */
export async function logCreate(
  userId: string | undefined,
  entityType: EntityType,
  entityId: string,
  newValues: Record<string, any>
): Promise<void> {
  const action = `${entityType}_CREATED` as AuditAction;
  
  await logAuditEvent({
    userId,
    action,
    entityType,
    entityId,
    newValues,
  });
}

/**
 * Helper function to log update operations
 */
export async function logUpdate(
  userId: string | undefined,
  entityType: EntityType,
  entityId: string,
  oldValues: Record<string, any>,
  newValues: Record<string, any>
): Promise<void> {
  const action = `${entityType}_UPDATED` as AuditAction;
  
  await logAuditEvent({
    userId,
    action,
    entityType,
    entityId,
    oldValues,
    newValues,
  });
}

/**
 * Helper function to log delete operations
 */
export async function logDelete(
  userId: string | undefined,
  entityType: EntityType,
  entityId: string,
  oldValues: Record<string, any>
): Promise<void> {
  const action = `${entityType}_DELETED` as AuditAction;
  
  await logAuditEvent({
    userId,
    action,
    entityType,
    entityId,
    oldValues,
  });
}

/**
 * Helper function to log read operations (primarily for sensitive data like counseling journals)
 */
export async function logRead(
  userId: string | undefined,
  entityType: EntityType,
  entityId: string
): Promise<void> {
  const action = `${entityType}_READ` as AuditAction;
  
  await logAuditEvent({
    userId,
    action,
    entityType,
    entityId,
  });
}

/**
 * Sanitize sensitive data before logging
 * Removes password hashes and other sensitive fields
 */
export function sanitizeForAudit(data: Record<string, any>): Record<string, any> {
  const sanitized = { ...data };
  
  // Remove sensitive fields
  const sensitiveFields = [
    'passwordHash',
    'password',
    'encryptedContent',
    'encryptionIv',
    'encryptionTag',
  ];
  
  sensitiveFields.forEach(field => {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  });
  
  return sanitized;
}

/**
 * Simplified helper to create audit log
 */
export async function createAuditLog(entry: AuditLogEntry): Promise<void> {
  return logAuditEvent(entry);
}

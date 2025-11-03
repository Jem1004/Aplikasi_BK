'use server';

import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';
import type { ActionResponse } from '@/types';
import { Prisma } from '@prisma/client';

// Type for audit log with user data
type AuditLogWithUser = Prisma.AuditLogGetPayload<{
  include: {
    user: {
      select: {
        fullName: true;
        email: true;
        role: true;
      };
    };
  };
}>;

/**
 * Check if user is admin
 */
async function checkAdminAuth() {
  const session = await auth();

  if (!session || !session.user) {
    return {
      success: false as const,
      error: 'Anda harus login terlebih dahulu',
    };
  }

  if (session.user.role !== 'ADMIN') {
    return {
      success: false as const,
      error: 'Anda tidak memiliki akses ke halaman ini',
    };
  }

  return { success: true as const };
}

/**
 * Get audit logs with filters
 * Admin only
 */
export async function getAuditLogs(filters?: {
  entityType?: string;
  entityId?: string;
  action?: string;
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}): Promise<
  ActionResponse<{
    logs: AuditLogWithUser[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }>
> {
  try {
    // Check authorization
    const authCheck = await checkAdminAuth();
    if (!authCheck.success) {
      return authCheck;
    }

    // Build where clause
    const where: Prisma.AuditLogWhereInput = {};

    if (filters?.entityType) {
      where.entityType = filters.entityType;
    }

    if (filters?.entityId) {
      where.entityId = filters.entityId;
    }

    if (filters?.action) {
      where.action = filters.action;
    }

    if (filters?.userId) {
      where.userId = filters.userId;
    }

    if (filters?.dateFrom || filters?.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) {
        where.createdAt.gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        where.createdAt.lte = new Date(filters.dateTo);
      }
    }

    // Pagination
    const page = filters?.page || 1;
    const pageSize = filters?.pageSize || 50;
    const skip = (page - 1) * pageSize;

    // Fetch logs with count
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              fullName: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: pageSize,
      }),
      prisma.auditLog.count({ where }),
    ]);

    const totalPages = Math.ceil(total / pageSize);

    return {
      success: true,
      data: {
        logs,
        total,
        page,
        pageSize,
        totalPages,
      },
    };
  } catch (error) {
    console.error('Get audit logs error:', error);
    return {
      success: false,
      error: 'Terjadi kesalahan. Silakan coba lagi',
    };
  }
}

/**
 * Get a single audit log by ID
 * Admin only
 */
export async function getAuditLogById(
  id: string
): Promise<ActionResponse<AuditLogWithUser>> {
  try {
    // Check authorization
    const authCheck = await checkAdminAuth();
    if (!authCheck.success) {
      return authCheck;
    }

    // Fetch log
    const log = await prisma.auditLog.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            fullName: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!log) {
      return {
        success: false,
        error: 'Log tidak ditemukan',
      };
    }

    return {
      success: true,
      data: log,
    };
  } catch (error) {
    console.error('Get audit log by ID error:', error);
    return {
      success: false,
      error: 'Terjadi kesalahan. Silakan coba lagi',
    };
  }
}

/**
 * Get unique entity types from audit logs
 * Admin only
 */
export async function getAuditLogEntityTypes(): Promise<
  ActionResponse<string[]>
> {
  try {
    // Check authorization
    const authCheck = await checkAdminAuth();
    if (!authCheck.success) {
      return authCheck;
    }

    // Get distinct entity types
    const entityTypes = await prisma.auditLog.findMany({
      select: {
        entityType: true,
      },
      distinct: ['entityType'],
      orderBy: {
        entityType: 'asc',
      },
    });

    return {
      success: true,
      data: entityTypes.map((et) => et.entityType),
    };
  } catch (error) {
    console.error('Get audit log entity types error:', error);
    return {
      success: false,
      error: 'Terjadi kesalahan. Silakan coba lagi',
    };
  }
}

/**
 * Get unique actions from audit logs
 * Admin only
 */
export async function getAuditLogActions(): Promise<ActionResponse<string[]>> {
  try {
    // Check authorization
    const authCheck = await checkAdminAuth();
    if (!authCheck.success) {
      return authCheck;
    }

    // Get distinct actions
    const actions = await prisma.auditLog.findMany({
      select: {
        action: true,
      },
      distinct: ['action'],
      orderBy: {
        action: 'asc',
      },
    });

    return {
      success: true,
      data: actions.map((a) => a.action),
    };
  } catch (error) {
    console.error('Get audit log actions error:', error);
    return {
      success: false,
      error: 'Terjadi kesalahan. Silakan coba lagi',
    };
  }
}

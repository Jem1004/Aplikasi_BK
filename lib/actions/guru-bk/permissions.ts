'use server';

import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';
import type { ActionResponse } from '@/types';
import { Prisma, PermissionType } from '@prisma/client';

// Validation schemas
const createPermissionSchema = z.object({
  studentId: z.string().min(1, 'Siswa harus dipilih'),
  permissionType: z.enum(['MASUK', 'KELUAR'], {
    errorMap: () => ({ message: 'Jenis izin harus dipilih' }),
  }),
  reason: z.string().min(1, 'Alasan harus diisi'),
  permissionDate: z.string().min(1, 'Tanggal izin harus diisi'),
  startTime: z.string().min(1, 'Waktu mulai harus diisi'),
  endTime: z.string().optional(),
  destination: z.string().optional(),
  notes: z.string().optional(),
});

// Type for permission with related data
type PermissionWithDetails = Prisma.PermissionGetPayload<{
  include: {
    student: {
      include: {
        user: true;
        class: true;
      };
    };
    issuer: {
      include: {
        user: true;
      };
    };
  };
}>;

// Type for permission print data
export type PermissionPrintData = {
  id: string;
  permissionNumber: string;
  studentName: string;
  nis: string;
  className: string;
  permissionType: string;
  reason: string;
  date: string;
  startTime: string;
  endTime: string | null;
  destination: string | null;
  issuedBy: string;
  issuedAt: string;
};

/**
 * Check if user is Guru BK
 */
async function checkGuruBKAuth() {
  const session = await auth();

  if (!session || !session.user) {
    return {
      success: false as const,
      error: 'Anda harus login terlebih dahulu',
    };
  }

  if (session.user.role !== 'GURU_BK') {
    return {
      success: false as const,
      error: 'Anda tidak memiliki akses ke fitur ini',
    };
  }

  if (!session.user.teacherId) {
    return {
      success: false as const,
      error: 'Data guru tidak ditemukan',
    };
  }

  return {
    success: true as const,
    teacherId: session.user.teacherId,
    userName: session.user.name || 'Guru BK',
  };
}

/**
 * Generate permission number
 * Format: PRM/YYYY/MM/XXXX
 */
async function generatePermissionNumber(date: Date): Promise<string> {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');

  // Count permissions in the same month
  const startOfMonth = new Date(year, date.getMonth(), 1);
  const endOfMonth = new Date(year, date.getMonth() + 1, 0, 23, 59, 59);

  const count = await prisma.permission.count({
    where: {
      createdAt: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    },
  });

  const sequence = String(count + 1).padStart(4, '0');

  return `PRM/${year}/${month}/${sequence}`;
}

/**
 * Format time for display
 */
function formatTime(timeString: string): string {
  const date = new Date(`1970-01-01T${timeString}`);
  return date.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format date for display
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Create a new permission record
 * Guru BK only
 * Returns permission data with print information
 */
export async function createPermission(
  formData: FormData
): Promise<ActionResponse<{ id: string; printData: PermissionPrintData }>> {
  try {
    // Check authorization
    const authCheck = await checkGuruBKAuth();
    if (!authCheck.success) {
      return authCheck;
    }

    const teacherId = authCheck.teacherId;
    const teacherName = authCheck.userName;

    // Parse and validate input
    const rawData = {
      studentId: formData.get('studentId'),
      permissionType: formData.get('permissionType'),
      reason: formData.get('reason'),
      permissionDate: formData.get('permissionDate'),
      startTime: formData.get('startTime'),
      endTime: formData.get('endTime') || undefined,
      destination: formData.get('destination') || undefined,
      notes: formData.get('notes') || undefined,
    };

    const validatedFields = createPermissionSchema.safeParse(rawData);

    if (!validatedFields.success) {
      return {
        success: false,
        errors: validatedFields.error.flatten().fieldErrors,
      };
    }

    const data = validatedFields.data;

    // Verify student exists
    const student = await prisma.student.findUnique({
      where: { id: data.studentId },
      include: {
        user: true,
        class: true,
      },
    });

    if (!student || student.deletedAt) {
      return {
        success: false,
        error: 'Data siswa tidak ditemukan',
      };
    }

    // Generate permission number
    const permissionDate = new Date(data.permissionDate);
    const permissionNumber = await generatePermissionNumber(new Date());

    // Create permission record
    const permission = await prisma.permission.create({
      data: {
        studentId: data.studentId,
        issuedBy: teacherId,
        permissionType: data.permissionType as PermissionType,
        reason: data.reason,
        permissionDate: permissionDate,
        startTime: new Date(`1970-01-01T${data.startTime}`),
        endTime: data.endTime
          ? new Date(`1970-01-01T${data.endTime}`)
          : null,
        destination: data.destination,
        notes: data.notes,
      },
    });

    // Prepare print data
    const printData: PermissionPrintData = {
      id: permission.id,
      permissionNumber,
      studentName: student.user.fullName,
      nis: student.nis,
      className: student.class?.name || '-',
      permissionType:
        data.permissionType === 'MASUK' ? 'Izin Masuk' : 'Izin Keluar',
      reason: data.reason,
      date: formatDate(data.permissionDate),
      startTime: formatTime(data.startTime),
      endTime: data.endTime ? formatTime(data.endTime) : null,
      destination: data.destination || null,
      issuedBy: teacherName,
      issuedAt: new Date().toLocaleString('id-ID', {
        dateStyle: 'long',
        timeStyle: 'short',
      }),
    };

    return {
      success: true,
      data: {
        id: permission.id,
        printData,
      },
    };
  } catch (error) {
    console.error('Create permission error:', error);
    return {
      success: false,
      error: 'Terjadi kesalahan. Silakan coba lagi',
    };
  }
}

/**
 * Get permissions with optional filters
 * Guru BK only
 */
export async function getPermissions(filters?: {
  studentId?: string;
  dateFrom?: string;
  dateTo?: string;
  permissionType?: PermissionType;
}): Promise<ActionResponse<PermissionWithDetails[]>> {
  try {
    // Check authorization
    const authCheck = await checkGuruBKAuth();
    if (!authCheck.success) {
      return authCheck;
    }

    // Build where clause
    const where: Prisma.PermissionWhereInput = {};

    if (filters?.studentId) {
      where.studentId = filters.studentId;
    }

    if (filters?.dateFrom || filters?.dateTo) {
      where.permissionDate = {};
      if (filters.dateFrom) {
        where.permissionDate.gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        where.permissionDate.lte = new Date(filters.dateTo);
      }
    }

    if (filters?.permissionType) {
      where.permissionType = filters.permissionType;
    }

    // Fetch permissions
    const permissions = await prisma.permission.findMany({
      where,
      include: {
        student: {
          include: {
            user: true,
            class: true,
          },
        },
        issuer: {
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      success: true,
      data: permissions,
    };
  } catch (error) {
    console.error('Get permissions error:', error);
    return {
      success: false,
      error: 'Terjadi kesalahan. Silakan coba lagi',
    };
  }
}

/**
 * Get a specific permission by ID
 * Guru BK only
 */
export async function getPermissionById(
  id: string
): Promise<ActionResponse<PermissionWithDetails>> {
  try {
    // Check authorization
    const authCheck = await checkGuruBKAuth();
    if (!authCheck.success) {
      return authCheck;
    }

    // Fetch permission
    const permission = await prisma.permission.findUnique({
      where: { id },
      include: {
        student: {
          include: {
            user: true,
            class: true,
          },
        },
        issuer: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!permission) {
      return {
        success: false,
        error: 'Data izin tidak ditemukan',
      };
    }

    return {
      success: true,
      data: permission,
    };
  } catch (error) {
    console.error('Get permission by ID error:', error);
    return {
      success: false,
      error: 'Terjadi kesalahan. Silakan coba lagi',
    };
  }
}

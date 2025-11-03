'use server';

import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';
import { hash } from 'bcryptjs';
import type { ActionResponse } from '@/types';
import { Prisma, Role } from '@prisma/client';
import {
  logAuditEvent,
  AUDIT_ACTIONS,
  ENTITY_TYPES,
  sanitizeForAudit,
} from '@/lib/audit/audit-logger';
import { 
  createUserSchema, 
  updateUserSchema,
  type CreateUserInput,
  type UpdateUserInput 
} from '@/lib/validations';
import {
  createSuccessResponse,
  createErrorResponse,
  createValidationErrorResponse,
  ERROR_MESSAGES,
  logError,
  mapZodErrorsToFields,
  mapErrorToMessage,
  handlePrismaError,
  isPrismaUniqueConstraintError,
} from '@/lib/errors';
import { userCreationRateLimiter, getClientIp, checkRateLimit } from '@/lib/rate-limit';
import { headers } from 'next/headers';

// Type for user with related data
type UserWithRelations = Prisma.UserGetPayload<{
  include: {
    teacher: true;
    student: {
      include: {
        class: true;
      };
    };
  };
}>;

/**
 * Check if user is admin
 */
async function checkAdminAuth<T = void>() {
  const session = await auth();

  if (!session || !session.user) {
    return { success: false as const, error: createErrorResponse<T>(ERROR_MESSAGES.UNAUTHORIZED) };
  }

  if (session.user.role !== 'ADMIN') {
    return { success: false as const, error: createErrorResponse<T>(ERROR_MESSAGES.PERMISSION_DENIED) };
  }

  return { success: true as const, session };
}

/**
 * Create a new user
 * Admin only
 */
export async function createUser(
  formData: FormData
): Promise<ActionResponse<{ userId: string }>> {
  try {
    // Check authorization
    const authCheck = await checkAdminAuth<{ userId: string }>();
    if (!authCheck.success) {
      return authCheck.error;
    }

    const { session } = authCheck;

    // Rate limiting check
    const headersList = await headers();
    const clientIp = getClientIp(headersList);
    const rateLimitResult = await checkRateLimit(userCreationRateLimiter, clientIp);
    
    if (!rateLimitResult.success) {
      return createErrorResponse(rateLimitResult.error!);
    }

    // Parse and validate input
    const rawData = {
      email: formData.get('email'),
      username: formData.get('username'),
      password: formData.get('password'),
      fullName: formData.get('fullName'),
      phone: formData.get('phone') || undefined,
      role: formData.get('role'),
      nip: formData.get('nip') || undefined,
      specialization: formData.get('specialization') || undefined,
      nis: formData.get('nis') || undefined,
      nisn: formData.get('nisn') || undefined,
      classId: formData.get('classId') || undefined,
      dateOfBirth: formData.get('dateOfBirth') || undefined,
      address: formData.get('address') || undefined,
      parentName: formData.get('parentName') || undefined,
      parentPhone: formData.get('parentPhone') || undefined,
    };

    const validatedFields = createUserSchema.safeParse(rawData);

    if (!validatedFields.success) {
      return createValidationErrorResponse(mapZodErrorsToFields(validatedFields.error));
    }

    const data = validatedFields.data;

    // Check for duplicate email or username
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: data.email },
          { username: data.username },
        ],
      },
    });

    if (existingUser) {
      return createErrorResponse(ERROR_MESSAGES.USER_ALREADY_EXISTS);
    }

    // Hash password
    const passwordHash = await hash(data.password, 12);

    // Create user with related data in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email: data.email,
          username: data.username,
          passwordHash,
          fullName: data.fullName,
          phone: data.phone || null,
          role: data.role,
          isActive: data.isActive ?? true,
        },
      });

      // Create teacher record if role is GURU_BK or WALI_KELAS
      if (data.role === 'GURU_BK' || data.role === 'WALI_KELAS') {
        await tx.teacher.create({
          data: {
            userId: user.id,
            nip: data.nip || null,
            specialization: data.specialization || null,
          },
        });
      }

      // Create student record if role is SISWA
      if (data.role === 'SISWA') {
        if (!data.nis) {
          throw new Error('NIS harus diisi untuk siswa');
        }

        await tx.student.create({
          data: {
            userId: user.id,
            nis: data.nis,
            nisn: data.nisn || null,
            classId: data.classId || null,
            dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
            address: data.address || null,
            parentName: data.parentName || null,
            parentPhone: data.parentPhone || null,
          },
        });
      }

      return user;
    });

    // Log audit event
    await logAuditEvent({
      userId: session.user.id,
      action: AUDIT_ACTIONS.USER_CREATED,
      entityType: ENTITY_TYPES.USER,
      entityId: result.id,
      newValues: sanitizeForAudit({
        email: result.email,
        username: result.username,
        fullName: result.fullName,
        role: result.role,
        phone: result.phone,
      }),
    });

    return createSuccessResponse({ userId: result.id });
  } catch (error) {
    logError(error, { action: 'createUser', resource: 'user' });
    
    if (isPrismaUniqueConstraintError(error)) {
      return createErrorResponse(ERROR_MESSAGES.USER_ALREADY_EXISTS);
    }
    
    if (error instanceof Error && error.message.includes('NIS')) {
      return createErrorResponse(error.message);
    }

    return createErrorResponse(mapErrorToMessage(error));
  }
}

/**
 * Update an existing user
 * Admin only
 */
export async function updateUser(
  userId: string,
  formData: FormData
): Promise<ActionResponse> {
  try {
    // Check authorization
    const authCheck = await checkAdminAuth();
    if (!authCheck.success) {
      return authCheck.error;
    }

    // Parse and validate input
    const rawData = {
      email: formData.get('email') || undefined,
      username: formData.get('username') || undefined,
      fullName: formData.get('fullName') || undefined,
      phone: formData.get('phone') || undefined,
      isActive: formData.get('isActive') === 'true',
      nip: formData.get('nip') || undefined,
      specialization: formData.get('specialization') || undefined,
      nis: formData.get('nis') || undefined,
      nisn: formData.get('nisn') || undefined,
      classId: formData.get('classId') || undefined,
      dateOfBirth: formData.get('dateOfBirth') || undefined,
      address: formData.get('address') || undefined,
      parentName: formData.get('parentName') || undefined,
      parentPhone: formData.get('parentPhone') || undefined,
    };

    const validatedFields = updateUserSchema.safeParse(rawData);

    if (!validatedFields.success) {
      return {
        success: false,
        errors: validatedFields.error.flatten().fieldErrors,
      };
    }

    const data = validatedFields.data;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        teacher: true,
        student: true,
      },
    });

    if (!existingUser) {
      return {
        success: false,
        error: 'User tidak ditemukan',
      };
    }

    // Check for duplicate email or username (excluding current user)
    if (data.email || data.username) {
      const duplicate = await prisma.user.findFirst({
        where: {
          AND: [
            { id: { not: userId } },
            {
              OR: [
                data.email ? { email: data.email } : {},
                data.username ? { username: data.username } : {},
              ].filter(obj => Object.keys(obj).length > 0),
            },
          ],
        },
      });

      if (duplicate) {
        return {
          success: false,
          error: 'Email atau username sudah digunakan',
        };
      }
    }

    // Get current user for audit log
    const session = await auth();

    // Update user with related data in a transaction
    await prisma.$transaction(async (tx) => {
      // Update user
      await tx.user.update({
        where: { id: userId },
        data: {
          email: data.email,
          username: data.username,
          fullName: data.fullName,
          phone: data.phone,
          isActive: data.isActive,
        },
      });

      // Update teacher record if exists
      if (existingUser.teacher) {
        await tx.teacher.update({
          where: { userId: userId },
          data: {
            nip: data.nip,
            specialization: data.specialization,
          },
        });
      }

      // Update student record if exists
      if (existingUser.student) {
        const studentData: any = {};
        if (data.nis !== undefined) studentData.nis = data.nis;
        if (data.nisn !== undefined) studentData.nisn = data.nisn;
        if (data.classId !== undefined) studentData.classId = data.classId;
        if (data.dateOfBirth !== undefined) studentData.dateOfBirth = data.dateOfBirth ? new Date(data.dateOfBirth) : null;
        if (data.address !== undefined) studentData.address = data.address;
        if (data.parentName !== undefined) studentData.parentName = data.parentName;
        if (data.parentPhone !== undefined) studentData.parentPhone = data.parentPhone;
        
        if (Object.keys(studentData).length > 0) {
          await tx.student.update({
            where: { userId: userId },
            data: studentData,
          });
        }
      }
    });

    // Log audit event
    await logAuditEvent({
      userId: session?.user?.id,
      action: AUDIT_ACTIONS.USER_UPDATED,
      entityType: ENTITY_TYPES.USER,
      entityId: userId,
      oldValues: sanitizeForAudit({
        email: existingUser.email,
        username: existingUser.username,
        fullName: existingUser.fullName,
        phone: existingUser.phone,
        isActive: existingUser.isActive,
      }),
      newValues: sanitizeForAudit({
        email: data.email || existingUser.email,
        username: data.username || existingUser.username,
        fullName: data.fullName || existingUser.fullName,
        phone: data.phone || existingUser.phone,
        isActive: data.isActive !== undefined ? data.isActive : existingUser.isActive,
      }),
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error('Update user error:', error);
    return {
      success: false,
      error: 'Terjadi kesalahan. Silakan coba lagi',
    };
  }
}

/**
 * Delete a user (soft delete)
 * Admin only
 */
export async function deleteUser(userId: string): Promise<ActionResponse> {
  try {
    // Check authorization
    const authCheck = await checkAdminAuth();
    if (!authCheck.success) {
      return authCheck.error;
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return {
        success: false,
        error: 'User tidak ditemukan',
      };
    }

    // Prevent deleting own account
    const session = await auth();
    if (session?.user?.id === userId) {
      return {
        success: false,
        error: 'Anda tidak dapat menghapus akun sendiri',
      };
    }

    // Soft delete user and related records
    await prisma.$transaction(async (tx) => {
      // Soft delete user
      await tx.user.update({
        where: { id: userId },
        data: {
          deletedAt: new Date(),
          isActive: false,
        },
      });

      // Soft delete teacher if exists
      const teacher = await tx.teacher.findUnique({
        where: { userId: userId },
      });

      if (teacher) {
        await tx.teacher.update({
          where: { userId: userId },
          data: { deletedAt: new Date() },
        });
      }

      // Soft delete student if exists
      const student = await tx.student.findUnique({
        where: { userId: userId },
      });

      if (student) {
        await tx.student.update({
          where: { userId: userId },
          data: { deletedAt: new Date() },
        });
      }
    });

    // Log audit event
    await logAuditEvent({
      userId: session?.user?.id,
      action: AUDIT_ACTIONS.USER_DELETED,
      entityType: ENTITY_TYPES.USER,
      entityId: userId,
      oldValues: sanitizeForAudit({
        email: user.email,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
      }),
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error('Delete user error:', error);
    return {
      success: false,
      error: 'Terjadi kesalahan. Silakan coba lagi',
    };
  }
}

/**
 * Get all users with optional filters
 * Admin only
 */
export async function getUsers(filters?: {
  role?: Role;
  search?: string;
}): Promise<ActionResponse<UserWithRelations[]>> {
  try {
    // Check authorization
    const authCheck = await checkAdminAuth<UserWithRelations[]>();
    if (!authCheck.success) {
      return authCheck.error;
    }

    // Build where clause
    const where: Prisma.UserWhereInput = {
      deletedAt: null,
    };

    if (filters?.role) {
      where.role = filters.role;
    }

    if (filters?.search) {
      where.OR = [
        { fullName: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { username: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    // Fetch users
    const users = await prisma.user.findMany({
      where,
      include: {
        teacher: true,
        student: {
          include: {
            class: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      success: true,
      data: users,
    };
  } catch (error) {
    console.error('Get users error:', error);
    return {
      success: false,
      error: 'Terjadi kesalahan. Silakan coba lagi',
    };
  }
}

/**
 * Get a single user by ID
 * Admin only
 */
export async function getUserById(
  userId: string
): Promise<ActionResponse<UserWithRelations>> {
  try {
    // Check authorization
    const authCheck = await checkAdminAuth<UserWithRelations>();
    if (!authCheck.success) {
      return authCheck.error;
    }

    // Fetch user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        teacher: true,
        student: {
          include: {
            class: true,
          },
        },
      },
    });

    if (!user || user.deletedAt) {
      return {
        success: false,
        error: 'User tidak ditemukan',
      };
    }

    return {
      success: true,
      data: user,
    };
  } catch (error) {
    console.error('Get user by ID error:', error);
    return {
      success: false,
      error: 'Terjadi kesalahan. Silakan coba lagi',
    };
  }
}

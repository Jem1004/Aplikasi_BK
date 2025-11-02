'use server';

import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';
import { hash } from 'bcryptjs';
import { z } from 'zod';
import type { ActionResponse } from '@/types';
import { Role } from '@prisma/client';
import { Prisma } from '@prisma/client';

// Validation schemas
const createUserSchema = z.object({
  email: z.string().email('Email tidak valid'),
  username: z.string().min(3, 'Username minimal 3 karakter'),
  password: z
    .string()
    .min(8, 'Password minimal 8 karakter')
    .regex(/[a-zA-Z]/, 'Password harus mengandung huruf')
    .regex(/[0-9]/, 'Password harus mengandung angka'),
  fullName: z.string().min(1, 'Nama lengkap harus diisi'),
  phone: z.string().optional(),
  role: z.nativeEnum(Role, { errorMap: () => ({ message: 'Role tidak valid' }) }),
  // Teacher-specific fields
  nip: z.string().optional(),
  specialization: z.string().optional(),
  // Student-specific fields
  nis: z.string().optional(),
  nisn: z.string().optional(),
  classId: z.string().optional(),
  dateOfBirth: z.string().optional(),
  address: z.string().optional(),
  parentName: z.string().optional(),
  parentPhone: z.string().optional(),
});

const updateUserSchema = z.object({
  email: z.string().email('Email tidak valid').optional(),
  username: z.string().min(3, 'Username minimal 3 karakter').optional(),
  fullName: z.string().min(1, 'Nama lengkap harus diisi').optional(),
  phone: z.string().optional(),
  isActive: z.boolean().optional(),
  // Teacher-specific fields
  nip: z.string().optional(),
  specialization: z.string().optional(),
  // Student-specific fields
  nis: z.string().optional(),
  nisn: z.string().optional(),
  classId: z.string().optional(),
  dateOfBirth: z.string().optional(),
  address: z.string().optional(),
  parentName: z.string().optional(),
  parentPhone: z.string().optional(),
});

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
 * Create a new user
 * Admin only
 */
export async function createUser(
  formData: FormData
): Promise<ActionResponse<{ userId: string }>> {
  try {
    // Check authorization
    const authCheck = await checkAdminAuth();
    if (!authCheck.success) {
      return authCheck;
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
      return {
        success: false,
        errors: validatedFields.error.flatten().fieldErrors,
      };
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
      return {
        success: false,
        error: 'Email atau username sudah digunakan',
      };
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
          phone: data.phone,
          role: data.role,
          isActive: true,
        },
      });

      // Create teacher record if role is GURU_BK or WALI_KELAS
      if (data.role === 'GURU_BK' || data.role === 'WALI_KELAS') {
        await tx.teacher.create({
          data: {
            userId: user.id,
            nip: data.nip,
            specialization: data.specialization,
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
            nisn: data.nisn,
            classId: data.classId,
            dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
            address: data.address,
            parentName: data.parentName,
            parentPhone: data.parentPhone,
          },
        });
      }

      return user;
    });

    return {
      success: true,
      data: { userId: result.id },
    };
  } catch (error) {
    console.error('Create user error:', error);
    
    if (error instanceof Error && error.message.includes('NIS')) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error: 'Terjadi kesalahan. Silakan coba lagi',
    };
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
      return authCheck;
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
        await tx.student.update({
          where: { userId: userId },
          data: {
            nis: data.nis,
            nisn: data.nisn,
            classId: data.classId,
            dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
            address: data.address,
            parentName: data.parentName,
            parentPhone: data.parentPhone,
          },
        });
      }
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
      return authCheck;
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
    const authCheck = await checkAdminAuth();
    if (!authCheck.success) {
      return authCheck;
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
    const authCheck = await checkAdminAuth();
    if (!authCheck.success) {
      return authCheck;
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

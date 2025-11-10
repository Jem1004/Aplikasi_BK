'use server';

import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';
import type { ActionResponse } from '@/types';
import { Prisma } from '@prisma/client';
import { z } from 'zod';

// Type for student profile with all related data
type StudentProfile = Prisma.StudentGetPayload<{
  include: {
    user: true;
    class: {
      include: {
        academicYear: true;
      };
    };
    counselorAssignments: {
      include: {
        counselor: {
          include: {
            user: true;
          };
        };
      };
    };
  };
}>;

// Type for violation with details (read-only)
type ViolationWithDetails = Prisma.ViolationGetPayload<{
  include: {
    violationType: true;
    recorder: {
      include: {
        user: true;
      };
    };
  };
}>;

// Type for permission with details (read-only)
type PermissionWithDetails = Prisma.PermissionGetPayload<{
  include: {
    issuer: {
      include: {
        user: true;
      };
    };
  };
}>;

// Validation schema for profile update (limited fields only)
const updateProfileSchema = z.object({
  phone: z.string().optional(),
  address: z.string().optional(),
  parentPhone: z.string().optional(),
});

/**
 * Check if user is Siswa and get their student ID
 */
async function checkSiswaAuth() {
  const session = await auth();

  if (!session || !session.user) {
    return {
      success: false as const,
      error: 'Anda harus login terlebih dahulu',
    };
  }

  if (session.user.role !== 'SISWA') {
    return {
      success: false as const,
      error: 'Anda tidak memiliki akses ke fitur ini',
    };
  }

  if (!session.user.studentId) {
    return {
      success: false as const,
      error: 'Data siswa tidak ditemukan',
    };
  }

  return {
    success: true as const,
    studentId: session.user.studentId,
    userId: session.user.id,
  };
}

/**
 * Get student's own profile
 * Siswa only, own data only
 */
export async function getMyProfile(): Promise<ActionResponse<StudentProfile>> {
  try {
    // Check authorization
    const authCheck = await checkSiswaAuth();
    if (!authCheck.success) {
      return authCheck;
    }

    const studentId = authCheck.studentId;

    // Fetch student profile with related data
    const student = await prisma.student.findUnique({
      where: {
        id: studentId
      },
      include: {
        user: true,
        class: {
          include: {
            academicYear: true,
          },
        },
        counselorAssignments: {
          include: {
            counselor: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    if (!student) {
      return {
        success: false,
        error: 'Data siswa tidak ditemukan',
      };
    }

    return {
      success: true,
      data: student,
    };
  } catch (error) {
    console.error('Get my profile error:', error);
    return {
      success: false,
      error: 'Terjadi kesalahan. Silakan coba lagi',
    };
  }
}

/**
 * Update student's own profile (limited fields only)
 * Siswa only, can only update phone, address, and parent phone
 */
export async function updateMyProfile(
  formData: FormData
): Promise<ActionResponse> {
  try {
    // Check authorization
    const authCheck = await checkSiswaAuth();
    if (!authCheck.success) {
      return authCheck;
    }

    const studentId = authCheck.studentId;
    const userId = authCheck.userId;

    // Parse and validate form data
    const data = {
      phone: formData.get('phone') as string | null,
      address: formData.get('address') as string | null,
      parentPhone: formData.get('parentPhone') as string | null,
    };

    const validation = updateProfileSchema.safeParse(data);

    if (!validation.success) {
      return {
        success: false,
        error: 'Data tidak valid',
        errors: validation.error.flatten().fieldErrors,
      };
    }

    // Update user phone if provided
    if (data.phone !== null) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          phone: data.phone || null,
        },
      });
    }

    // Update student data
    await prisma.student.update({
      where: { id: studentId },
      data: {
        address: data.address || null,
        parentPhone: data.parentPhone || null,
      },
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error('Update my profile error:', error);
    return {
      success: false,
      error: 'Terjadi kesalahan. Silakan coba lagi',
    };
  }
}

/**
 * Get student's own violations (read-only)
 * Siswa only, own data only
 */
export async function getMyViolations(): Promise<
  ActionResponse<ViolationWithDetails[]>
> {
  try {
    // Check authorization
    const authCheck = await checkSiswaAuth();
    if (!authCheck.success) {
      return authCheck;
    }

    const studentId = authCheck.studentId;

    // Fetch violations (read-only)
    const violations = await prisma.violation.findMany({
      where: {
        studentId
      },
      include: {
        violationType: true,
        recorder: {
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        incidentDate: 'desc',
      },
    });

    return {
      success: true,
      data: violations,
    };
  } catch (error) {
    console.error('Get my violations error:', error);
    return {
      success: false,
      error: 'Terjadi kesalahan. Silakan coba lagi',
    };
  }
}

/**
 * Get student's violation summary
 * Siswa only, own data only
 */
export async function getMyViolationSummary(): Promise<
  ActionResponse<{
    totalPoints: number;
    violationCount: number;
    prestationCount: number;
  }>
> {
  try {
    // Check authorization
    const authCheck = await checkSiswaAuth();
    if (!authCheck.success) {
      return authCheck;
    }

    const studentId = authCheck.studentId;

    // Fetch all violations
    const violations = await prisma.violation.findMany({
      where: {
        studentId
      },
      include: {
        violationType: true,
      },
    });

    // Calculate summary
    let totalPoints = 0;
    let violationCount = 0;
    let prestationCount = 0;

    violations.forEach((violation) => {
      totalPoints += violation.points;
      if (violation.violationType.type === 'PELANGGARAN') {
        violationCount++;
      } else if (violation.violationType.type === 'PRESTASI') {
        prestationCount++;
      }
    });

    return {
      success: true,
      data: {
        totalPoints,
        violationCount,
        prestationCount,
      },
    };
  } catch (error) {
    console.error('Get my violation summary error:', error);
    return {
      success: false,
      error: 'Terjadi kesalahan. Silakan coba lagi',
    };
  }
}

/**
 * Get student's own permissions (read-only)
 * Siswa only, own data only
 */
export async function getMyPermissions(): Promise<
  ActionResponse<PermissionWithDetails[]>
> {
  try {
    // Check authorization
    const authCheck = await checkSiswaAuth();
    if (!authCheck.success) {
      return authCheck;
    }

    const studentId = authCheck.studentId;

    // Fetch permissions (read-only)
    const permissions = await prisma.permission.findMany({
      where: {
        studentId,
      },
      include: {
        issuer: {
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        permissionDate: 'desc',
      },
    });

    return {
      success: true,
      data: permissions,
    };
  } catch (error) {
    console.error('Get my permissions error:', error);
    return {
      success: false,
      error: 'Terjadi kesalahan. Silakan coba lagi',
    };
  }
}

'use server';

import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';
import type { ActionResponse } from '@/types';
import { Prisma } from '@prisma/client';

// Type for student with violation summary
type StudentWithSummary = Prisma.StudentGetPayload<{
  include: {
    user: true;
    class: true;
    violations: {
      include: {
        violationType: true;
      };
    };
  };
}>;

// Type for violation with related data (read-only)
type ViolationWithDetails = Prisma.ViolationGetPayload<{
  include: {
    student: {
      include: {
        user: true;
        class: true;
      };
    };
    violationType: true;
    recorder: {
      include: {
        user: true;
      };
    };
  };
}>;

// Type for permission with related data (read-only)
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

/**
 * Check if user is Wali Kelas and get their class
 */
async function checkWaliKelasAuth() {
  const session = await auth();

  if (!session || !session.user) {
    return {
      success: false as const,
      error: 'Anda harus login terlebih dahulu',
    };
  }

  if (session.user.role !== 'WALI_KELAS') {
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

  // Get the class assigned to this homeroom teacher for active academic year
  const homeroomAssignment = await prisma.classHomeroomTeacher.findFirst({
    where: {
      teacherId: session.user.teacherId,
      academicYear: {
        isActive: true,
      },
    },
    include: {
      class: true,
    },
  });

  if (!homeroomAssignment) {
    return {
      success: false as const,
      error: 'Anda belum ditugaskan sebagai wali kelas untuk tahun ajaran aktif',
    };
  }

  return {
    success: true as const,
    teacherId: session.user.teacherId,
    classId: homeroomAssignment.classId,
  };
}

/**
 * Check if student belongs to wali kelas's class
 */
async function checkStudentInClass(
  studentId: string,
  classId: string
): Promise<boolean> {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
  });

  return student?.classId === classId;
}

/**
 * Get all students in the homeroom class
 * Wali Kelas only, for their assigned class
 */
export async function getMyClassStudents(): Promise<
  ActionResponse<StudentWithSummary[]>
> {
  try {
    // Check authorization
    const authCheck = await checkWaliKelasAuth();
    if (!authCheck.success) {
      return authCheck;
    }

    const classId = authCheck.classId;

    // Get students in the class
    const students = await prisma.student.findMany({
      where: {
        classId,
      },
      include: {
        user: true,
        class: true,
        violations: {
          include: {
            violationType: true,
          },
        },
      },
      orderBy: {
        user: {
          fullName: 'asc',
        },
      },
    });

    return {
      success: true,
      data: students,
    };
  } catch (error) {
    console.error('Get my class students error:', error);
    return {
      success: false,
      error: 'Terjadi kesalahan. Silakan coba lagi',
    };
  }
}

/**
 * Get violation history for a specific student (read-only)
 * Wali Kelas only, for students in their class
 */
export async function getStudentViolationHistory(
  studentId: string
): Promise<ActionResponse<ViolationWithDetails[]>> {
  try {
    // Check authorization
    const authCheck = await checkWaliKelasAuth();
    if (!authCheck.success) {
      return authCheck;
    }

    const classId = authCheck.classId;

    // Check if student is in this class
    const isInClass = await checkStudentInClass(studentId, classId);

    if (!isInClass) {
      return {
        success: false,
        error: 'Anda tidak memiliki akses ke siswa ini',
      };
    }

    // Fetch violations (read-only, no counseling journals)
    const violations = await prisma.violation.findMany({
      where: {
        studentId,
              },
      include: {
        student: {
          include: {
            user: true,
            class: true,
          },
        },
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
    console.error('Get student violation history error:', error);
    return {
      success: false,
      error: 'Terjadi kesalahan. Silakan coba lagi',
    };
  }
}

/**
 * Get permission history for a specific student (read-only)
 * Wali Kelas only, for students in their class
 */
export async function getStudentPermissionHistory(
  studentId: string
): Promise<ActionResponse<PermissionWithDetails[]>> {
  try {
    // Check authorization
    const authCheck = await checkWaliKelasAuth();
    if (!authCheck.success) {
      return authCheck;
    }

    const classId = authCheck.classId;

    // Check if student is in this class
    const isInClass = await checkStudentInClass(studentId, classId);

    if (!isInClass) {
      return {
        success: false,
        error: 'Anda tidak memiliki akses ke siswa ini',
      };
    }

    // Fetch permissions (read-only)
    const permissions = await prisma.permission.findMany({
      where: {
        studentId,
      },
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
        permissionDate: 'desc',
      },
    });

    return {
      success: true,
      data: permissions,
    };
  } catch (error) {
    console.error('Get student permission history error:', error);
    return {
      success: false,
      error: 'Terjadi kesalahan. Silakan coba lagi',
    };
  }
}

/**
 * Get class statistics
 * Wali Kelas only, for their assigned class
 */
export async function getClassStatistics(): Promise<
  ActionResponse<{
    totalStudents: number;
    totalViolations: number;
    totalPrestations: number;
    averagePoints: number;
  }>
> {
  try {
    // Check authorization
    const authCheck = await checkWaliKelasAuth();
    if (!authCheck.success) {
      return authCheck;
    }

    const classId = authCheck.classId;

    // Get students count
    const totalStudents = await prisma.student.count({
      where: {
        classId,
      },
    });

    // Get all violations for students in this class
    const students = await prisma.student.findMany({
      where: {
        classId,
      },
      include: {
        violations: {
          include: {
            violationType: true,
          },
        },
      },
    });

    // Calculate statistics
    let totalViolations = 0;
    let totalPrestations = 0;
    let totalPoints = 0;

    students.forEach((student) => {
      student.violations.forEach((violation) => {
        if (violation.violationType.type === 'PELANGGARAN') {
          totalViolations++;
        } else if (violation.violationType.type === 'PRESTASI') {
          totalPrestations++;
        }
        totalPoints += violation.points;
      });
    });

    const averagePoints =
      totalStudents > 0 ? Math.round(totalPoints / totalStudents) : 0;

    return {
      success: true,
      data: {
        totalStudents,
        totalViolations,
        totalPrestations,
        averagePoints,
      },
    };
  } catch (error) {
    console.error('Get class statistics error:', error);
    return {
      success: false,
      error: 'Terjadi kesalahan. Silakan coba lagi',
    };
  }
}

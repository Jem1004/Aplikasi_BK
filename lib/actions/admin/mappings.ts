'use server';

import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';
import type { ActionResponse } from '@/types';
import { Prisma } from '@prisma/client';

// Validation schemas
const assignStudentToCounselorSchema = z.object({
  studentIds: z.array(z.string()).min(1, 'Pilih minimal satu siswa'),
  counselorId: z.string().min(1, 'Guru BK harus dipilih'),
  academicYearId: z.string().min(1, 'Tahun ajaran harus dipilih'),
});

const assignHomeroomTeacherSchema = z.object({
  classId: z.string().min(1, 'Kelas harus dipilih'),
  teacherId: z.string().min(1, 'Wali kelas harus dipilih'),
  academicYearId: z.string().min(1, 'Tahun ajaran harus dipilih'),
});

// Type for assignment with related data
type StudentCounselorAssignmentWithRelations = Prisma.StudentCounselorAssignmentGetPayload<{
  include: {
    student: {
      include: {
        user: true;
        class: true;
      };
    };
    counselor: {
      include: {
        user: true;
      };
    };
    academicYear: true;
  };
}>;

type ClassHomeroomTeacherWithRelations = Prisma.ClassHomeroomTeacherGetPayload<{
  include: {
    class: true;
    teacher: {
      include: {
        user: true;
      };
    };
    academicYear: true;
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
 * Assign students to a counselor
 * Admin only
 */
export async function assignStudentToCounselor(
  formData: FormData
): Promise<ActionResponse> {
  try {
    // Check authorization
    const authCheck = await checkAdminAuth();
    if (!authCheck.success) {
      return authCheck;
    }

    // Parse and validate input
    const studentIdsRaw = formData.get('studentIds');
    const studentIds = studentIdsRaw ? JSON.parse(studentIdsRaw as string) : [];

    const rawData = {
      studentIds,
      counselorId: formData.get('counselorId'),
      academicYearId: formData.get('academicYearId'),
    };

    const validatedFields = assignStudentToCounselorSchema.safeParse(rawData);

    if (!validatedFields.success) {
      return {
        success: false,
        errors: validatedFields.error.flatten().fieldErrors,
      };
    }

    const data = validatedFields.data;

    // Verify counselor exists and has GURU_BK role
    const counselor = await prisma.teacher.findUnique({
      where: { id: data.counselorId },
      include: { user: true },
    });

    if (!counselor || counselor.user.role !== 'GURU_BK') {
      return {
        success: false,
        error: 'Guru BK tidak ditemukan',
      };
    }

    // Verify academic year exists
    const academicYear = await prisma.academicYear.findUnique({
      where: { id: data.academicYearId },
    });

    if (!academicYear) {
      return {
        success: false,
        error: 'Tahun ajaran tidak ditemukan',
      };
    }

    // Verify all students exist
    const students = await prisma.student.findMany({
      where: {
        id: { in: data.studentIds },
        deletedAt: null,
      },
    });

    if (students.length !== data.studentIds.length) {
      return {
        success: false,
        error: 'Beberapa siswa tidak ditemukan',
      };
    }

    // Create assignments in a transaction
    await prisma.$transaction(async (tx) => {
      // Remove existing assignments for these students in this academic year
      await tx.studentCounselorAssignment.deleteMany({
        where: {
          studentId: { in: data.studentIds },
          academicYearId: data.academicYearId,
        },
      });

      // Create new assignments
      await tx.studentCounselorAssignment.createMany({
        data: data.studentIds.map((studentId) => ({
          studentId,
          counselorId: data.counselorId,
          academicYearId: data.academicYearId,
        })),
      });
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error('Assign student to counselor error:', error);
    return {
      success: false,
      error: 'Terjadi kesalahan. Silakan coba lagi',
    };
  }
}

/**
 * Remove student from counselor assignment
 * Admin only
 */
export async function removeStudentFromCounselor(
  assignmentId: string
): Promise<ActionResponse> {
  try {
    // Check authorization
    const authCheck = await checkAdminAuth();
    if (!authCheck.success) {
      return authCheck;
    }

    // Check if assignment exists
    const assignment = await prisma.studentCounselorAssignment.findUnique({
      where: { id: assignmentId },
    });

    if (!assignment) {
      return {
        success: false,
        error: 'Assignment tidak ditemukan',
      };
    }

    // Delete assignment
    await prisma.studentCounselorAssignment.delete({
      where: { id: assignmentId },
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error('Remove student from counselor error:', error);
    return {
      success: false,
      error: 'Terjadi kesalahan. Silakan coba lagi',
    };
  }
}

/**
 * Assign homeroom teacher to a class
 * Admin only
 */
export async function assignHomeroomTeacher(
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
      classId: formData.get('classId'),
      teacherId: formData.get('teacherId'),
      academicYearId: formData.get('academicYearId'),
    };

    const validatedFields = assignHomeroomTeacherSchema.safeParse(rawData);

    if (!validatedFields.success) {
      return {
        success: false,
        errors: validatedFields.error.flatten().fieldErrors,
      };
    }

    const data = validatedFields.data;

    // Verify teacher exists and has WALI_KELAS role
    const teacher = await prisma.teacher.findUnique({
      where: { id: data.teacherId },
      include: { user: true },
    });

    if (!teacher || teacher.user.role !== 'WALI_KELAS') {
      return {
        success: false,
        error: 'Wali kelas tidak ditemukan',
      };
    }

    // Verify class exists
    const classData = await prisma.class.findUnique({
      where: { id: data.classId },
    });

    if (!classData) {
      return {
        success: false,
        error: 'Kelas tidak ditemukan',
      };
    }

    // Verify academic year exists
    const academicYear = await prisma.academicYear.findUnique({
      where: { id: data.academicYearId },
    });

    if (!academicYear) {
      return {
        success: false,
        error: 'Tahun ajaran tidak ditemukan',
      };
    }

    // Check if this class already has a homeroom teacher for this academic year
    const existingAssignment = await prisma.classHomeroomTeacher.findFirst({
      where: {
        classId: data.classId,
        academicYearId: data.academicYearId,
      },
    });

    if (existingAssignment) {
      return {
        success: false,
        error: 'Kelas ini sudah memiliki wali kelas untuk tahun ajaran ini',
      };
    }

    // Create assignment
    await prisma.classHomeroomTeacher.create({
      data: {
        classId: data.classId,
        teacherId: data.teacherId,
        academicYearId: data.academicYearId,
      },
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error('Assign homeroom teacher error:', error);
    return {
      success: false,
      error: 'Terjadi kesalahan. Silakan coba lagi',
    };
  }
}

/**
 * Remove homeroom teacher assignment
 * Admin only
 */
export async function removeHomeroomTeacher(
  assignmentId: string
): Promise<ActionResponse> {
  try {
    // Check authorization
    const authCheck = await checkAdminAuth();
    if (!authCheck.success) {
      return authCheck;
    }

    // Check if assignment exists
    const assignment = await prisma.classHomeroomTeacher.findUnique({
      where: { id: assignmentId },
    });

    if (!assignment) {
      return {
        success: false,
        error: 'Assignment tidak ditemukan',
      };
    }

    // Delete assignment
    await prisma.classHomeroomTeacher.delete({
      where: { id: assignmentId },
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error('Remove homeroom teacher error:', error);
    return {
      success: false,
      error: 'Terjadi kesalahan. Silakan coba lagi',
    };
  }
}

/**
 * Get student-counselor assignments with optional filters
 * Admin only
 */
export async function getStudentCounselorAssignments(filters?: {
  counselorId?: string;
  studentId?: string;
  academicYearId?: string;
}): Promise<ActionResponse<StudentCounselorAssignmentWithRelations[]>> {
  try {
    // Check authorization
    const authCheck = await checkAdminAuth();
    if (!authCheck.success) {
      return authCheck;
    }

    // Build where clause
    const where: Prisma.StudentCounselorAssignmentWhereInput = {};

    if (filters?.counselorId) {
      where.counselorId = filters.counselorId;
    }

    if (filters?.studentId) {
      where.studentId = filters.studentId;
    }

    if (filters?.academicYearId) {
      where.academicYearId = filters.academicYearId;
    }

    // Fetch assignments
    const assignments = await prisma.studentCounselorAssignment.findMany({
      where,
      include: {
        student: {
          include: {
            user: true,
            class: true,
          },
        },
        counselor: {
          include: {
            user: true,
          },
        },
        academicYear: true,
      },
      orderBy: {
        assignedAt: 'desc',
      },
    });

    return {
      success: true,
      data: assignments,
    };
  } catch (error) {
    console.error('Get student counselor assignments error:', error);
    return {
      success: false,
      error: 'Terjadi kesalahan. Silakan coba lagi',
    };
  }
}

/**
 * Get homeroom teacher assignments with optional filters
 * Admin only
 */
export async function getHomeroomTeacherAssignments(filters?: {
  teacherId?: string;
  classId?: string;
  academicYearId?: string;
}): Promise<ActionResponse<ClassHomeroomTeacherWithRelations[]>> {
  try {
    // Check authorization
    const authCheck = await checkAdminAuth();
    if (!authCheck.success) {
      return authCheck;
    }

    // Build where clause
    const where: Prisma.ClassHomeroomTeacherWhereInput = {};

    if (filters?.teacherId) {
      where.teacherId = filters.teacherId;
    }

    if (filters?.classId) {
      where.classId = filters.classId;
    }

    if (filters?.academicYearId) {
      where.academicYearId = filters.academicYearId;
    }

    // Fetch assignments
    const assignments = await prisma.classHomeroomTeacher.findMany({
      where,
      include: {
        class: true,
        teacher: {
          include: {
            user: true,
          },
        },
        academicYear: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      success: true,
      data: assignments,
    };
  } catch (error) {
    console.error('Get homeroom teacher assignments error:', error);
    return {
      success: false,
      error: 'Terjadi kesalahan. Silakan coba lagi',
    };
  }
}

/**
 * Get all counselors (teachers with GURU_BK role)
 * Admin only
 */
export async function getCounselors(): Promise<
  ActionResponse<
    Prisma.TeacherGetPayload<{
      include: { user: true };
    }>[]
  >
> {
  try {
    // Check authorization
    const authCheck = await checkAdminAuth();
    if (!authCheck.success) {
      return authCheck;
    }

    const counselors = await prisma.teacher.findMany({
      where: {
        user: {
          role: 'GURU_BK',
          deletedAt: null,
          isActive: true,
        },
        deletedAt: null,
      },
      include: {
        user: true,
      },
      orderBy: {
        user: {
          fullName: 'asc',
        },
      },
    });

    return {
      success: true,
      data: counselors,
    };
  } catch (error) {
    console.error('Get counselors error:', error);
    return {
      success: false,
      error: 'Terjadi kesalahan. Silakan coba lagi',
    };
  }
}

/**
 * Get all homeroom teachers (teachers with WALI_KELAS role)
 * Admin only
 */
export async function getHomeroomTeachers(): Promise<
  ActionResponse<
    Prisma.TeacherGetPayload<{
      include: { user: true };
    }>[]
  >
> {
  try {
    // Check authorization
    const authCheck = await checkAdminAuth();
    if (!authCheck.success) {
      return authCheck;
    }

    const teachers = await prisma.teacher.findMany({
      where: {
        user: {
          role: 'WALI_KELAS',
          deletedAt: null,
          isActive: true,
        },
        deletedAt: null,
      },
      include: {
        user: true,
      },
      orderBy: {
        user: {
          fullName: 'asc',
        },
      },
    });

    return {
      success: true,
      data: teachers,
    };
  } catch (error) {
    console.error('Get homeroom teachers error:', error);
    return {
      success: false,
      error: 'Terjadi kesalahan. Silakan coba lagi',
    };
  }
}

/**
 * Get all students without counselor assignment for a specific academic year
 * Admin only
 */
export async function getUnassignedStudents(
  academicYearId: string
): Promise<
  ActionResponse<
    Prisma.StudentGetPayload<{
      include: {
        user: true;
        class: true;
      };
    }>[]
  >
> {
  try {
    // Check authorization
    const authCheck = await checkAdminAuth();
    if (!authCheck.success) {
      return authCheck;
    }

    // Get all students who don't have an assignment for this academic year
    const students = await prisma.student.findMany({
      where: {
        deletedAt: null,
        user: {
          isActive: true,
          deletedAt: null,
        },
        counselorAssignments: {
          none: {
            academicYearId: academicYearId,
          },
        },
      },
      include: {
        user: true,
        class: true,
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
    console.error('Get unassigned students error:', error);
    return {
      success: false,
      error: 'Terjadi kesalahan. Silakan coba lagi',
    };
  }
}

'use server';

import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';
import type { ActionResponse } from '@/types';
import { Prisma } from '@prisma/client';
import {
  logAuditEvent,
  AUDIT_ACTIONS,
  ENTITY_TYPES,
} from '@/lib/audit/audit-logger';

// Validation schemas
const createViolationSchema = z.object({
  studentId: z.string().min(1, 'Siswa harus dipilih'),
  violationTypeId: z.string().min(1, 'Jenis pelanggaran harus dipilih'),
  incidentDate: z.string().min(1, 'Tanggal kejadian harus diisi'),
  description: z.string().optional(),
});

const updateViolationSchema = z.object({
  violationTypeId: z.string().min(1, 'Jenis pelanggaran harus dipilih').optional(),
  incidentDate: z.string().min(1, 'Tanggal kejadian harus diisi').optional(),
  description: z.string().optional(),
});

// Type for violation with related data
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
  };
}

/**
 * Check if student is assigned to counselor
 */
async function checkStudentAssignment(
  studentId: string,
  teacherId: string
): Promise<boolean> {
  const assignment = await prisma.studentCounselorAssignment.findFirst({
    where: {
      studentId,
      counselorId: teacherId,
    },
  });

  return !!assignment;
}

/**
 * Create a new violation record
 * Guru BK only, for assigned students
 */
export async function createViolation(
  formData: FormData
): Promise<ActionResponse<{ id: string }>> {
  try {
    // Check authorization
    const authCheck = await checkGuruBKAuth();
    if (!authCheck.success) {
      return authCheck;
    }

    const teacherId = authCheck.teacherId;

    // Parse and validate input
    const rawData = {
      studentId: formData.get('studentId'),
      violationTypeId: formData.get('violationTypeId'),
      incidentDate: formData.get('incidentDate'),
      description: formData.get('description') || undefined,
    };

    const validatedFields = createViolationSchema.safeParse(rawData);

    if (!validatedFields.success) {
      return {
        success: false,
        errors: validatedFields.error.flatten().fieldErrors,
      };
    }

    const data = validatedFields.data;

    // Check if student is assigned to this counselor
    const isAssigned = await checkStudentAssignment(data.studentId, teacherId);

    if (!isAssigned) {
      return {
        success: false,
        error: 'Anda tidak memiliki akses ke siswa ini',
      };
    }

    // Get violation type to get points
    const violationType = await prisma.violationType.findUnique({
      where: { id: data.violationTypeId },
    });

    if (!violationType || !violationType.isActive) {
      return {
        success: false,
        error: 'Jenis pelanggaran tidak valid',
      };
    }

    // Get session for audit log
    const session = await auth();

    // Create violation record
    const violation = await prisma.violation.create({
      data: {
        studentId: data.studentId,
        violationTypeId: data.violationTypeId,
        recordedBy: teacherId,
        incidentDate: new Date(data.incidentDate),
        description: data.description,
        points: violationType.points,
      },
    });

    // Log audit event
    await logAuditEvent({
      userId: session?.user?.id,
      action: AUDIT_ACTIONS.VIOLATION_CREATED,
      entityType: ENTITY_TYPES.VIOLATION,
      entityId: violation.id,
      newValues: {
        studentId: violation.studentId,
        violationTypeId: violation.violationTypeId,
        violationTypeName: violationType.name,
        incidentDate: violation.incidentDate.toISOString(),
        points: violation.points,
        description: violation.description,
      },
    });

    return {
      success: true,
      data: { id: violation.id },
    };
  } catch (error) {
    console.error('Create violation error:', error);
    return {
      success: false,
      error: 'Terjadi kesalahan. Silakan coba lagi',
    };
  }
}

/**
 * Update an existing violation record
 * Guru BK only, for violations they created
 */
export async function updateViolation(
  id: string,
  formData: FormData
): Promise<ActionResponse> {
  try {
    // Check authorization
    const authCheck = await checkGuruBKAuth();
    if (!authCheck.success) {
      return authCheck;
    }

    const teacherId = authCheck.teacherId;

    // Parse and validate input
    const rawData = {
      violationTypeId: formData.get('violationTypeId') || undefined,
      incidentDate: formData.get('incidentDate') || undefined,
      description: formData.get('description') || undefined,
    };

    const validatedFields = updateViolationSchema.safeParse(rawData);

    if (!validatedFields.success) {
      return {
        success: false,
        errors: validatedFields.error.flatten().fieldErrors,
      };
    }

    const data = validatedFields.data;

    // Check if violation exists and was created by this teacher
    const existingViolation = await prisma.violation.findUnique({
      where: { id },
    });

    if (!existingViolation) {
      return {
        success: false,
        error: 'Data pelanggaran tidak ditemukan',
      };
    }

    if (existingViolation.recordedBy !== teacherId) {
      return {
        success: false,
        error: 'Anda tidak memiliki akses untuk mengubah data ini',
      };
    }

    // Prepare update data
    const updateData: Prisma.ViolationUpdateInput = {};

    if (data.violationTypeId) {
      // Get new violation type to update points
      const violationType = await prisma.violationType.findUnique({
        where: { id: data.violationTypeId },
      });

      if (!violationType || !violationType.isActive) {
        return {
          success: false,
          error: 'Jenis pelanggaran tidak valid',
        };
      }

      updateData.violationType = { connect: { id: data.violationTypeId } };
      updateData.points = violationType.points;
    }

    if (data.incidentDate) {
      updateData.incidentDate = new Date(data.incidentDate);
    }

    if (data.description !== undefined) {
      updateData.description = data.description;
    }

    // Get session for audit log
    const session = await auth();

    // Update violation record
    const updatedViolation = await prisma.violation.update({
      where: { id },
      data: updateData,
      include: {
        violationType: true,
      },
    });

    // Log audit event
    await logAuditEvent({
      userId: session?.user?.id,
      action: AUDIT_ACTIONS.VIOLATION_UPDATED,
      entityType: ENTITY_TYPES.VIOLATION,
      entityId: id,
      oldValues: {
        violationTypeId: existingViolation.violationTypeId,
        incidentDate: existingViolation.incidentDate.toISOString(),
        points: existingViolation.points,
        description: existingViolation.description,
      },
      newValues: {
        violationTypeId: updatedViolation.violationTypeId,
        violationTypeName: updatedViolation.violationType.name,
        incidentDate: updatedViolation.incidentDate.toISOString(),
        points: updatedViolation.points,
        description: updatedViolation.description,
      },
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error('Update violation error:', error);
    return {
      success: false,
      error: 'Terjadi kesalahan. Silakan coba lagi',
    };
  }
}

/**
 * Delete a violation record (soft delete)
 * Guru BK only, for violations they created
 */
export async function deleteViolation(id: string): Promise<ActionResponse> {
  try {
    // Check authorization
    const authCheck = await checkGuruBKAuth();
    if (!authCheck.success) {
      return authCheck;
    }

    const teacherId = authCheck.teacherId;

    // Check if violation exists and was created by this teacher
    const violation = await prisma.violation.findUnique({
      where: { id },
    });

    if (!violation) {
      return {
        success: false,
        error: 'Data pelanggaran tidak ditemukan',
      };
    }

    if (violation.recordedBy !== teacherId) {
      return {
        success: false,
        error: 'Anda tidak memiliki akses untuk menghapus data ini',
      };
    }

    // Get session for audit log
    const session = await auth();

    // Permanently delete violation
    await prisma.violation.delete({
      where: { id },
    });

    // Log audit event
    await logAuditEvent({
      userId: session?.user?.id,
      action: AUDIT_ACTIONS.VIOLATION_DELETED,
      entityType: ENTITY_TYPES.VIOLATION,
      entityId: id,
      oldValues: {
        studentId: violation.studentId,
        violationTypeId: violation.violationTypeId,
        incidentDate: violation.incidentDate.toISOString(),
        points: violation.points,
        description: violation.description,
      },
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error('Delete violation error:', error);
    return {
      success: false,
      error: 'Terjadi kesalahan. Silakan coba lagi',
    };
  }
}

/**
 * Get violation details by ID
 * Guru BK only, for violations they created
 */
export async function getViolationById(
  id: string
): Promise<ActionResponse<ViolationWithDetails>> {
  try {
    // Check authorization
    const authCheck = await checkGuruBKAuth();
    if (!authCheck.success) {
      return authCheck;
    }

    const teacherId = authCheck.teacherId;

    // Get violation with related data
    const violation = await prisma.violation.findUnique({
      where: {
        id,
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
    });

    if (!violation) {
      return {
        success: false,
        error: 'Data pelanggaran tidak ditemukan',
      };
    }

    // Check if the violation was created by this teacher
    if (violation.recordedBy !== teacherId) {
      return {
        success: false,
        error: 'Anda tidak memiliki akses untuk melihat data ini',
      };
    }

    return {
      success: true,
      data: violation,
    };
  } catch (error) {
    console.error('Get violation by ID error:', error);
    return {
      success: false,
      error: 'Terjadi kesalahan. Silakan coba lagi',
    };
  }
}

/**
 * Get violations for a specific student
 * Guru BK only, for assigned students
 */
export async function getStudentViolations(
  studentId: string
): Promise<ActionResponse<ViolationWithDetails[]>> {
  try {
    // Check authorization
    const authCheck = await checkGuruBKAuth();
    if (!authCheck.success) {
      return authCheck;
    }

    const teacherId = authCheck.teacherId;

    // Check if student is assigned to this counselor
    const isAssigned = await checkStudentAssignment(studentId, teacherId);

    if (!isAssigned) {
      return {
        success: false,
        error: 'Anda tidak memiliki akses ke siswa ini',
      };
    }

    // Fetch violations
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
    console.error('Get student violations error:', error);
    return {
      success: false,
      error: 'Terjadi kesalahan. Silakan coba lagi',
    };
  }
}

/**
 * Get all students assigned to the current counselor
 * Guru BK only
 */
export async function getMyStudents(): Promise<
  ActionResponse<StudentWithSummary[]>
> {
  try {
    // Check authorization
    const authCheck = await checkGuruBKAuth();
    if (!authCheck.success) {
      return authCheck;
    }

    const teacherId = authCheck.teacherId;

    // Get assigned students
    const assignments = await prisma.studentCounselorAssignment.findMany({
      where: {
        counselorId: teacherId,
      },
      include: {
        student: {
          include: {
            user: true,
            class: true,
            violations: {
              include: {
                violationType: true,
              },
            },
          },
        },
      },
    });

    const students = assignments.map((assignment) => assignment.student);

    return {
      success: true,
      data: students,
    };
  } catch (error) {
    console.error('Get my students error:', error);
    return {
      success: false,
      error: 'Terjadi kesalahan. Silakan coba lagi',
    };
  }
}

/**
 * Get violation summary for a specific student
 * Guru BK only, for assigned students
 */
export async function getStudentViolationSummary(
  studentId: string
): Promise<
  ActionResponse<{
    totalPoints: number;
    violationCount: number;
    prestationCount: number;
  }>
> {
  try {
    // Check authorization
    const authCheck = await checkGuruBKAuth();
    if (!authCheck.success) {
      return authCheck;
    }

    const teacherId = authCheck.teacherId;

    // Check if student is assigned to this counselor
    const isAssigned = await checkStudentAssignment(studentId, teacherId);

    if (!isAssigned) {
      return {
        success: false,
        error: 'Anda tidak memiliki akses ke siswa ini',
      };
    }

    // Get all violations for the student
    const violations = await prisma.violation.findMany({
      where: {
        studentId,
              },
      include: {
        violationType: true,
      },
    });

    // Calculate summary
    const totalPoints = violations.reduce(
      (sum, violation) => sum + violation.points,
      0
    );

    const violationCount = violations.filter(
      (v) => v.violationType.type === 'PELANGGARAN'
    ).length;

    const prestationCount = violations.filter(
      (v) => v.violationType.type === 'PRESTASI'
    ).length;

    return {
      success: true,
      data: {
        totalPoints,
        violationCount,
        prestationCount,
      },
    };
  } catch (error) {
    console.error('Get student violation summary error:', error);
    return {
      success: false,
      error: 'Terjadi kesalahan. Silakan coba lagi',
    };
  }
}

'use server';

import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

type ActionResponse<T = void> = {
  success: boolean;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
};

// ============================================================================
// ACADEMIC YEAR ACTIONS
// ============================================================================

const academicYearSchema = z.object({
  name: z.string().min(1, 'Nama tahun ajaran wajib diisi'),
  startDate: z.string().min(1, 'Tanggal mulai wajib diisi'),
  endDate: z.string().min(1, 'Tanggal selesai wajib diisi'),
  isActive: z.boolean().optional(),
});

export async function createAcademicYear(
  formData: FormData
): Promise<ActionResponse<{ id: string }>> {
  try {
    const session = await auth();
    
    if (!session || session.user.role !== 'ADMIN') {
      return { success: false, error: 'Unauthorized' };
    }

    const data = {
      name: formData.get('name') as string,
      startDate: formData.get('startDate') as string,
      endDate: formData.get('endDate') as string,
      isActive: formData.get('isActive') === 'true',
    };

    const validated = academicYearSchema.safeParse(data);
    
    if (!validated.success) {
      return {
        success: false,
        errors: validated.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const startDate = new Date(validated.data.startDate);
    const endDate = new Date(validated.data.endDate);

    if (endDate <= startDate) {
      return {
        success: false,
        error: 'Tanggal selesai harus setelah tanggal mulai',
      };
    }

    // If setting as active, deactivate all other academic years
    if (validated.data.isActive) {
      await prisma.academicYear.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      });
    }

    const academicYear = await prisma.academicYear.create({
      data: {
        name: validated.data.name,
        startDate,
        endDate,
        isActive: validated.data.isActive || false,
      },
    });

    revalidatePath('/admin/master-data');
    
    return { success: true, data: { id: academicYear.id } };
  } catch (error) {
    console.error('Error creating academic year:', error);
    return { success: false, error: 'Terjadi kesalahan saat membuat tahun ajaran' };
  }
}

export async function updateAcademicYear(
  id: string,
  formData: FormData
): Promise<ActionResponse> {
  try {
    const session = await auth();
    
    if (!session || session.user.role !== 'ADMIN') {
      return { success: false, error: 'Unauthorized' };
    }

    const data = {
      name: formData.get('name') as string,
      startDate: formData.get('startDate') as string,
      endDate: formData.get('endDate') as string,
      isActive: formData.get('isActive') === 'true',
    };

    const validated = academicYearSchema.safeParse(data);
    
    if (!validated.success) {
      return {
        success: false,
        errors: validated.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const startDate = new Date(validated.data.startDate);
    const endDate = new Date(validated.data.endDate);

    if (endDate <= startDate) {
      return {
        success: false,
        error: 'Tanggal selesai harus setelah tanggal mulai',
      };
    }

    // If setting as active, deactivate all other academic years
    if (validated.data.isActive) {
      await prisma.academicYear.updateMany({
        where: { 
          isActive: true,
          id: { not: id }
        },
        data: { isActive: false },
      });
    }

    await prisma.academicYear.update({
      where: { id },
      data: {
        name: validated.data.name,
        startDate,
        endDate,
        isActive: validated.data.isActive || false,
      },
    });

    revalidatePath('/admin/master-data');
    
    return { success: true };
  } catch (error) {
    console.error('Error updating academic year:', error);
    return { success: false, error: 'Terjadi kesalahan saat mengupdate tahun ajaran' };
  }
}

export async function deleteAcademicYear(id: string): Promise<ActionResponse> {
  try {
    const session = await auth();

    if (!session || session.user.role !== 'ADMIN') {
      return { success: false, error: 'Unauthorized' };
    }

    // Check if academic year has associated classes
    const classCount = await prisma.class.count({
      where: { academicYearId: id },
    });

    if (classCount > 0) {
      return {
        success: false,
        error: 'Tidak dapat menghapus tahun ajaran yang memiliki kelas terkait',
      };
    }

    // Check if academic year has homeroom teachers
    const homeroomTeacherCount = await prisma.classHomeroomTeacher.count({
      where: { academicYearId: id },
    });

    if (homeroomTeacherCount > 0) {
      return {
        success: false,
        error: 'Tidak dapat menghapus tahun ajaran yang memiliki wali kelas terkait',
      };
    }

    // Check if academic year has student counselor assignments
    const counselorAssignmentCount = await prisma.studentCounselorAssignment.count({
      where: { academicYearId: id },
    });

    if (counselorAssignmentCount > 0) {
      return {
        success: false,
        error: 'Tidak dapat menghapus tahun ajaran yang memiliki penugasan konselor siswa terkait',
      };
    }

    // Delete the academic year (hard delete since no soft delete is implemented)
    await prisma.academicYear.delete({
      where: { id },
    });

    revalidatePath('/admin/master-data');

    return { success: true };
  } catch (error) {
    console.error('Error deleting academic year:', error);
    return { success: false, error: 'Terjadi kesalahan saat menghapus tahun ajaran' };
  }
}

export async function setActiveAcademicYear(id: string): Promise<ActionResponse> {
  try {
    const session = await auth();
    
    if (!session || session.user.role !== 'ADMIN') {
      return { success: false, error: 'Unauthorized' };
    }

    // Deactivate all academic years
    await prisma.academicYear.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });

    // Activate the selected academic year
    await prisma.academicYear.update({
      where: { id },
      data: { isActive: true },
    });

    revalidatePath('/admin/master-data');
    
    return { success: true };
  } catch (error) {
    console.error('Error setting active academic year:', error);
    return { success: false, error: 'Terjadi kesalahan saat mengatur tahun ajaran aktif' };
  }
}

export async function getAcademicYears(): Promise<ActionResponse<any[]>> {
  try {
    const session = await auth();
    
    if (!session) {
      return { success: false, error: 'Unauthorized' };
    }

    const academicYears = await prisma.academicYear.findMany({
      orderBy: { startDate: 'desc' },
    });

    return { success: true, data: academicYears };
  } catch (error) {
    console.error('Error fetching academic years:', error);
    return { success: false, error: 'Terjadi kesalahan saat mengambil data tahun ajaran' };
  }
}

// ============================================================================
// CLASS ACTIONS
// ============================================================================

const classSchema = z.object({
  name: z.string().min(1, 'Nama kelas wajib diisi'),
  gradeLevel: z.number().min(1).max(12, 'Tingkat kelas harus antara 1-12'),
  academicYearId: z.string().min(1, 'Tahun ajaran wajib dipilih'),
});

export async function createClass(
  formData: FormData
): Promise<ActionResponse<{ id: string }>> {
  try {
    const session = await auth();
    
    if (!session || session.user.role !== 'ADMIN') {
      return { success: false, error: 'Unauthorized' };
    }

    const data = {
      name: formData.get('name') as string,
      gradeLevel: parseInt(formData.get('gradeLevel') as string),
      academicYearId: formData.get('academicYearId') as string,
    };

    const validated = classSchema.safeParse(data);
    
    if (!validated.success) {
      return {
        success: false,
        errors: validated.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    // Check for duplicate class name in the same academic year
    const existing = await prisma.class.findFirst({
      where: {
        name: validated.data.name,
        academicYearId: validated.data.academicYearId
      },
    });

    if (existing) {
      return {
        success: false,
        error: 'Kelas dengan nama yang sama sudah ada di tahun ajaran ini',
      };
    }

    const classData = await prisma.class.create({
      data: {
        name: validated.data.name,
        gradeLevel: validated.data.gradeLevel,
        academicYearId: validated.data.academicYearId,
      },
    });

    revalidatePath('/admin/master-data');
    
    return { success: true, data: { id: classData.id } };
  } catch (error) {
    console.error('Error creating class:', error);
    return { success: false, error: 'Terjadi kesalahan saat membuat kelas' };
  }
}

export async function updateClass(
  id: string,
  formData: FormData
): Promise<ActionResponse> {
  try {
    const session = await auth();
    
    if (!session || session.user.role !== 'ADMIN') {
      return { success: false, error: 'Unauthorized' };
    }

    const data = {
      name: formData.get('name') as string,
      gradeLevel: parseInt(formData.get('gradeLevel') as string),
      academicYearId: formData.get('academicYearId') as string,
    };

    const validated = classSchema.safeParse(data);
    
    if (!validated.success) {
      return {
        success: false,
        errors: validated.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    // Check for duplicate class name in the same academic year (excluding current)
    const existing = await prisma.class.findFirst({
      where: {
        name: validated.data.name,
        academicYearId: validated.data.academicYearId,
        id: { not: id },
      },
    });

    if (existing) {
      return {
        success: false,
        error: 'Kelas dengan nama yang sama sudah ada di tahun ajaran ini',
      };
    }

    await prisma.class.update({
      where: { id },
      data: {
        name: validated.data.name,
        gradeLevel: validated.data.gradeLevel,
        academicYearId: validated.data.academicYearId,
      },
    });

    revalidatePath('/admin/master-data');
    
    return { success: true };
  } catch (error) {
    console.error('Error updating class:', error);
    return { success: false, error: 'Terjadi kesalahan saat mengupdate kelas' };
  }
}

export async function deleteClass(id: string): Promise<ActionResponse> {
  try {
    const session = await auth();

    if (!session || session.user.role !== 'ADMIN') {
      return { success: false, error: 'Unauthorized' };
    }

    // Check if class has associated students
    const studentCount = await prisma.student.count({
      where: { classId: id },
    });

    if (studentCount > 0) {
      return {
        success: false,
        error: 'Tidak dapat menghapus kelas yang memiliki siswa terkait',
      };
    }

    // Check if class has homeroom teachers
    const homeroomTeacherCount = await prisma.classHomeroomTeacher.count({
      where: { classId: id },
    });

    if (homeroomTeacherCount > 0) {
      return {
        success: false,
        error: 'Tidak dapat menghapus kelas yang memiliki wali kelas terkait',
      };
    }

    // Delete the class (hard delete since no soft delete is implemented)
    await prisma.class.delete({
      where: { id },
    });

    revalidatePath('/admin/master-data');

    return { success: true };
  } catch (error) {
    console.error('Error deleting class:', error);
    return { success: false, error: 'Terjadi kesalahan saat menghapus kelas' };
  }
}

export async function getClasses(academicYearId?: string): Promise<ActionResponse<any[]>> {
  try {
    const session = await auth();
    
    if (!session) {
      return { success: false, error: 'Unauthorized' };
    }

    const classes = await prisma.class.findMany({
      where: {
        ...(academicYearId && { academicYearId }),
      },
      include: {
        academicYear: {
          select: {
            name: true,
          },
        },
        _count: {
          select: {
            students: true,
          },
        },
      },
      orderBy: [
        { gradeLevel: 'asc' },
        { name: 'asc' },
      ],
    });

    return { success: true, data: classes };
  } catch (error) {
    console.error('Error fetching classes:', error);
    return { success: false, error: 'Terjadi kesalahan saat mengambil data kelas' };
  }
}

// ============================================================================
// VIOLATION TYPE ACTIONS
// ============================================================================

const violationTypeSchema = z.object({
  code: z.string().min(1, 'Kode wajib diisi'),
  name: z.string().min(1, 'Nama wajib diisi'),
  description: z.string().optional(),
  points: z.number().int('Poin harus berupa bilangan bulat'),
  type: z.enum(['PELANGGARAN', 'PRESTASI'], {
    errorMap: () => ({ message: 'Tipe harus PELANGGARAN atau PRESTASI' }),
  }),
  category: z.string().optional(),
  isActive: z.boolean().optional(),
});

export async function createViolationType(
  formData: FormData
): Promise<ActionResponse<{ id: string }>> {
  try {
    const session = await auth();
    
    if (!session || session.user.role !== 'ADMIN') {
      return { success: false, error: 'Unauthorized' };
    }

    const data = {
      code: formData.get('code') as string,
      name: formData.get('name') as string,
      description: formData.get('description') as string || undefined,
      points: parseInt(formData.get('points') as string),
      type: formData.get('type') as 'PELANGGARAN' | 'PRESTASI',
      category: formData.get('category') as string || undefined,
      isActive: formData.get('isActive') === 'true',
    };

    const validated = violationTypeSchema.safeParse(data);
    
    if (!validated.success) {
      return {
        success: false,
        errors: validated.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    // Check for duplicate code
    const existing = await prisma.violationType.findFirst({
      where: {
        code: validated.data.code
      },
    });

    if (existing) {
      return {
        success: false,
        error: 'Kode pelanggaran/prestasi sudah ada',
      };
    }

    const violationType = await prisma.violationType.create({
      data: {
        code: validated.data.code,
        name: validated.data.name,
        description: validated.data.description,
        points: validated.data.points,
        type: validated.data.type,
        category: validated.data.category,
        isActive: validated.data.isActive ?? true,
      },
    });

    revalidatePath('/admin/master-data');
    
    return { success: true, data: { id: violationType.id } };
  } catch (error) {
    console.error('Error creating violation type:', error);
    return { success: false, error: 'Terjadi kesalahan saat membuat jenis pelanggaran/prestasi' };
  }
}

export async function updateViolationType(
  id: string,
  formData: FormData
): Promise<ActionResponse> {
  try {
    const session = await auth();
    
    if (!session || session.user.role !== 'ADMIN') {
      return { success: false, error: 'Unauthorized' };
    }

    const data = {
      code: formData.get('code') as string,
      name: formData.get('name') as string,
      description: formData.get('description') as string || undefined,
      points: parseInt(formData.get('points') as string),
      type: formData.get('type') as 'PELANGGARAN' | 'PRESTASI',
      category: formData.get('category') as string || undefined,
      isActive: formData.get('isActive') === 'true',
    };

    const validated = violationTypeSchema.safeParse(data);
    
    if (!validated.success) {
      return {
        success: false,
        errors: validated.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    // Check for duplicate code (excluding current)
    const existing = await prisma.violationType.findFirst({
      where: {
        code: validated.data.code,
        id: { not: id },
      },
    });

    if (existing) {
      return {
        success: false,
        error: 'Kode pelanggaran/prestasi sudah ada',
      };
    }

    await prisma.violationType.update({
      where: { id },
      data: {
        code: validated.data.code,
        name: validated.data.name,
        description: validated.data.description,
        points: validated.data.points,
        type: validated.data.type,
        category: validated.data.category,
        isActive: validated.data.isActive ?? true,
      },
    });

    revalidatePath('/admin/master-data');
    
    return { success: true };
  } catch (error) {
    console.error('Error updating violation type:', error);
    return { success: false, error: 'Terjadi kesalahan saat mengupdate jenis pelanggaran/prestasi' };
  }
}

export async function deleteViolationType(id: string): Promise<ActionResponse> {
  try {
    const session = await auth();

    if (!session || session.user.role !== 'ADMIN') {
      return { success: false, error: 'Unauthorized' };
    }

    // Check if violation type is used in any violations
    const violationCount = await prisma.violation.count({
      where: { violationTypeId: id },
    });

    if (violationCount > 0) {
      return {
        success: false,
        error: 'Tidak dapat menghapus jenis pelanggaran/prestasi yang sudah digunakan',
      };
    }

    // Delete the violation type (hard delete since no soft delete is implemented)
    await prisma.violationType.delete({
      where: { id },
    });

    revalidatePath('/admin/master-data');

    return { success: true };
  } catch (error) {
    console.error('Error deleting violation type:', error);
    return { success: false, error: 'Terjadi kesalahan saat menghapus jenis pelanggaran/prestasi' };
  }
}

export async function getViolationTypes(filters?: {
  type?: 'PELANGGARAN' | 'PRESTASI';
  isActive?: boolean;
}): Promise<ActionResponse<any[]>> {
  try {
    const session = await auth();
    
    if (!session) {
      return { success: false, error: 'Unauthorized' };
    }

    const violationTypes = await prisma.violationType.findMany({
      where: {
        ...(filters?.type && { type: filters.type }),
        ...(filters?.isActive !== undefined && { isActive: filters.isActive }),
      },
      orderBy: [
        { type: 'asc' },
        { category: 'asc' },
        { code: 'asc' },
      ],
    });

    return { success: true, data: violationTypes };
  } catch (error) {
    console.error('Error fetching violation types:', error);
    return { success: false, error: 'Terjadi kesalahan saat mengambil data jenis pelanggaran/prestasi' };
  }
}

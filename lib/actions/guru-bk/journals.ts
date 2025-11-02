'use server';

import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';
import { encrypt, decrypt } from '@/lib/encryption/crypto';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

// Response type
type ActionResponse<T = void> = {
  success: boolean;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
};

// Validation schemas
const counselingJournalSchema = z.object({
  studentId: z.string().uuid('Student ID tidak valid'),
  sessionDate: z.string().min(1, 'Tanggal sesi harus diisi'),
  content: z.string().min(10, 'Konten jurnal minimal 10 karakter'),
});

// Error messages
const ERROR_MESSAGES = {
  UNAUTHORIZED: 'Anda tidak memiliki akses ke halaman ini',
  PERMISSION_DENIED: 'Anda tidak memiliki izin untuk melakukan aksi ini',
  NOT_FOUND: 'Data tidak ditemukan',
  VALIDATION_FAILED: 'Data yang Anda masukkan tidak valid',
  SERVER_ERROR: 'Terjadi kesalahan server. Silakan coba lagi',
  ENCRYPTION_ERROR: 'Terjadi kesalahan keamanan. Hubungi administrator',
  STUDENT_NOT_ASSIGNED: 'Siswa tidak di-assign ke Anda',
};

/**
 * Create a new counseling journal entry with encryption
 * Only GURU_BK can create journals for their assigned students
 */
export async function createCounselingJournal(
  formData: FormData
): Promise<ActionResponse<{ id: string }>> {
  try {
    // Check authentication and authorization
    const session = await auth();
    
    if (!session || session.user.role !== 'GURU_BK') {
      return { success: false, error: ERROR_MESSAGES.UNAUTHORIZED };
    }

    if (!session.user.teacherId) {
      return { success: false, error: ERROR_MESSAGES.UNAUTHORIZED };
    }

    // Extract and validate data
    const rawData = {
      studentId: formData.get('studentId') as string,
      sessionDate: formData.get('sessionDate') as string,
      content: formData.get('content') as string,
    };

    const validation = counselingJournalSchema.safeParse(rawData);

    if (!validation.success) {
      return {
        success: false,
        error: ERROR_MESSAGES.VALIDATION_FAILED,
        errors: validation.error.flatten().fieldErrors,
      };
    }

    const { studentId, sessionDate, content } = validation.data;

    // Verify student is assigned to this counselor
    const assignment = await prisma.studentCounselorAssignment.findFirst({
      where: {
        studentId,
        counselorId: session.user.teacherId,
      },
    });

    if (!assignment) {
      return { success: false, error: ERROR_MESSAGES.STUDENT_NOT_ASSIGNED };
    }

    // Encrypt the content
    let encryptedData;
    try {
      encryptedData = encrypt(content);
    } catch (error) {
      console.error('Encryption error:', error);
      return { success: false, error: ERROR_MESSAGES.ENCRYPTION_ERROR };
    }

    // Create journal entry
    const journal = await prisma.counselingJournal.create({
      data: {
        studentId,
        counselorId: session.user.teacherId,
        sessionDate: new Date(sessionDate),
        encryptedContent: encryptedData.encrypted,
        encryptionIv: encryptedData.iv,
        encryptionTag: encryptedData.tag,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'CREATE',
        entityType: 'CounselingJournal',
        entityId: journal.id,
        newValues: {
          studentId,
          sessionDate,
          counselorId: session.user.teacherId,
        },
      },
    });

    revalidatePath('/guru-bk/journals');

    return {
      success: true,
      data: { id: journal.id },
    };
  } catch (error) {
    console.error('Create counseling journal error:', error);
    return { success: false, error: ERROR_MESSAGES.SERVER_ERROR };
  }
}

/**
 * Update an existing counseling journal with re-encryption
 * Only the creator can update their own journals
 */
export async function updateCounselingJournal(
  id: string,
  formData: FormData
): Promise<ActionResponse> {
  try {
    // Check authentication and authorization
    const session = await auth();
    
    if (!session || session.user.role !== 'GURU_BK') {
      return { success: false, error: ERROR_MESSAGES.UNAUTHORIZED };
    }

    if (!session.user.teacherId) {
      return { success: false, error: ERROR_MESSAGES.UNAUTHORIZED };
    }

    // Find existing journal
    const existingJournal = await prisma.counselingJournal.findUnique({
      where: { id },
    });

    if (!existingJournal) {
      return { success: false, error: ERROR_MESSAGES.NOT_FOUND };
    }

    // Verify ownership - only creator can update
    if (existingJournal.counselorId !== session.user.teacherId) {
      return { success: false, error: ERROR_MESSAGES.PERMISSION_DENIED };
    }

    // Extract and validate data
    const rawData = {
      studentId: formData.get('studentId') as string,
      sessionDate: formData.get('sessionDate') as string,
      content: formData.get('content') as string,
    };

    const validation = counselingJournalSchema.safeParse(rawData);

    if (!validation.success) {
      return {
        success: false,
        error: ERROR_MESSAGES.VALIDATION_FAILED,
        errors: validation.error.flatten().fieldErrors,
      };
    }

    const { studentId, sessionDate, content } = validation.data;

    // Verify student is assigned to this counselor
    const assignment = await prisma.studentCounselorAssignment.findFirst({
      where: {
        studentId,
        counselorId: session.user.teacherId,
      },
    });

    if (!assignment) {
      return { success: false, error: ERROR_MESSAGES.STUDENT_NOT_ASSIGNED };
    }

    // Re-encrypt the content with new IV
    let encryptedData;
    try {
      encryptedData = encrypt(content);
    } catch (error) {
      console.error('Encryption error:', error);
      return { success: false, error: ERROR_MESSAGES.ENCRYPTION_ERROR };
    }

    // Decrypt old content for audit log
    let oldContent = '';
    try {
      oldContent = decrypt(
        existingJournal.encryptedContent,
        existingJournal.encryptionIv,
        existingJournal.encryptionTag
      );
    } catch (error) {
      console.error('Decryption error for audit:', error);
      // Continue even if decryption fails for audit
    }

    // Update journal entry
    await prisma.counselingJournal.update({
      where: { id },
      data: {
        studentId,
        sessionDate: new Date(sessionDate),
        encryptedContent: encryptedData.encrypted,
        encryptionIv: encryptedData.iv,
        encryptionTag: encryptedData.tag,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'UPDATE',
        entityType: 'CounselingJournal',
        entityId: id,
        oldValues: {
          studentId: existingJournal.studentId,
          sessionDate: existingJournal.sessionDate,
          contentLength: oldContent.length,
        },
        newValues: {
          studentId,
          sessionDate,
          contentLength: content.length,
        },
      },
    });

    revalidatePath('/guru-bk/journals');
    revalidatePath(`/guru-bk/journals/${id}`);

    return { success: true };
  } catch (error) {
    console.error('Update counseling journal error:', error);
    return { success: false, error: ERROR_MESSAGES.SERVER_ERROR };
  }
}

/**
 * Delete a counseling journal (soft delete)
 * Only the creator can delete their own journals
 */
export async function deleteCounselingJournal(
  id: string
): Promise<ActionResponse> {
  try {
    // Check authentication and authorization
    const session = await auth();
    
    if (!session || session.user.role !== 'GURU_BK') {
      return { success: false, error: ERROR_MESSAGES.UNAUTHORIZED };
    }

    if (!session.user.teacherId) {
      return { success: false, error: ERROR_MESSAGES.UNAUTHORIZED };
    }

    // Find existing journal
    const existingJournal = await prisma.counselingJournal.findUnique({
      where: { id },
    });

    if (!existingJournal) {
      return { success: false, error: ERROR_MESSAGES.NOT_FOUND };
    }

    // Verify ownership - only creator can delete
    if (existingJournal.counselorId !== session.user.teacherId) {
      return { success: false, error: ERROR_MESSAGES.PERMISSION_DENIED };
    }

    // Soft delete
    await prisma.counselingJournal.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'DELETE',
        entityType: 'CounselingJournal',
        entityId: id,
        oldValues: {
          studentId: existingJournal.studentId,
          sessionDate: existingJournal.sessionDate,
        },
      },
    });

    revalidatePath('/guru-bk/journals');

    return { success: true };
  } catch (error) {
    console.error('Delete counseling journal error:', error);
    return { success: false, error: ERROR_MESSAGES.SERVER_ERROR };
  }
}

/**
 * Get all counseling journals for the logged-in counselor with decryption
 * Supports filtering by student and date range
 */
export async function getMyCounselingJournals(
  filters?: {
    studentId?: string;
    dateFrom?: string;
    dateTo?: string;
  }
): Promise<ActionResponse<Array<{
  id: string;
  studentId: string;
  studentName: string;
  sessionDate: Date;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}>>> {
  try {
    // Check authentication and authorization
    const session = await auth();
    
    if (!session || session.user.role !== 'GURU_BK') {
      return { success: false, error: ERROR_MESSAGES.UNAUTHORIZED };
    }

    if (!session.user.teacherId) {
      return { success: false, error: ERROR_MESSAGES.UNAUTHORIZED };
    }

    // Build where clause
    const where: any = {
      counselorId: session.user.teacherId,
      deletedAt: null,
    };

    if (filters?.studentId) {
      where.studentId = filters.studentId;
    }

    if (filters?.dateFrom || filters?.dateTo) {
      where.sessionDate = {};
      if (filters.dateFrom) {
        where.sessionDate.gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        where.sessionDate.lte = new Date(filters.dateTo);
      }
    }

    // Fetch journals
    const journals = await prisma.counselingJournal.findMany({
      where,
      include: {
        student: {
          include: {
            user: {
              select: {
                fullName: true,
              },
            },
          },
        },
      },
      orderBy: {
        sessionDate: 'desc',
      },
    });

    // Decrypt content for each journal
    const decryptedJournals = journals.map((journal) => {
      let content = '';
      try {
        content = decrypt(
          journal.encryptedContent,
          journal.encryptionIv,
          journal.encryptionTag
        );
      } catch (error) {
        console.error(`Decryption error for journal ${journal.id}:`, error);
        content = '[Error: Tidak dapat mendekripsi konten]';
      }

      return {
        id: journal.id,
        studentId: journal.studentId,
        studentName: journal.student.user.fullName,
        sessionDate: journal.sessionDate,
        content,
        createdAt: journal.createdAt,
        updatedAt: journal.updatedAt,
      };
    });

    return {
      success: true,
      data: decryptedJournals,
    };
  } catch (error) {
    console.error('Get counseling journals error:', error);
    return { success: false, error: ERROR_MESSAGES.SERVER_ERROR };
  }
}

/**
 * Get a single counseling journal by ID with ownership verification
 * Only the creator can access their own journals
 */
export async function getCounselingJournalById(
  id: string
): Promise<ActionResponse<{
  id: string;
  studentId: string;
  studentName: string;
  studentNis: string;
  sessionDate: Date;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}>> {
  try {
    // Check authentication and authorization
    const session = await auth();
    
    if (!session || session.user.role !== 'GURU_BK') {
      return { success: false, error: ERROR_MESSAGES.UNAUTHORIZED };
    }

    if (!session.user.teacherId) {
      return { success: false, error: ERROR_MESSAGES.UNAUTHORIZED };
    }

    // Find journal
    const journal = await prisma.counselingJournal.findUnique({
      where: { id },
      include: {
        student: {
          include: {
            user: {
              select: {
                fullName: true,
              },
            },
          },
        },
      },
    });

    if (!journal || journal.deletedAt) {
      return { success: false, error: ERROR_MESSAGES.NOT_FOUND };
    }

    // Verify ownership - CRITICAL SECURITY CHECK
    if (journal.counselorId !== session.user.teacherId) {
      // Log unauthorized access attempt
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
          entityType: 'CounselingJournal',
          entityId: id,
          newValues: {
            attemptedBy: session.user.id,
            ownedBy: journal.counselorId,
          },
        },
      });

      return { success: false, error: ERROR_MESSAGES.PERMISSION_DENIED };
    }

    // Decrypt content
    let content = '';
    try {
      content = decrypt(
        journal.encryptedContent,
        journal.encryptionIv,
        journal.encryptionTag
      );
    } catch (error) {
      console.error(`Decryption error for journal ${id}:`, error);
      return { success: false, error: ERROR_MESSAGES.ENCRYPTION_ERROR };
    }

    // Create audit log for access
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'READ',
        entityType: 'CounselingJournal',
        entityId: id,
      },
    });

    return {
      success: true,
      data: {
        id: journal.id,
        studentId: journal.studentId,
        studentName: journal.student.user.fullName,
        studentNis: journal.student.nis,
        sessionDate: journal.sessionDate,
        content,
        createdAt: journal.createdAt,
        updatedAt: journal.updatedAt,
      },
    };
  } catch (error) {
    console.error('Get counseling journal by ID error:', error);
    return { success: false, error: ERROR_MESSAGES.SERVER_ERROR };
  }
}

'use server';

import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';
import { hash } from 'bcryptjs';
import { z } from 'zod';
import type { ActionResponse } from '@/types';
import * as XLSX from 'xlsx';

// Validation schema for student data
const studentSchema = z.object({
  email: z.string().email('Email tidak valid'),
  username: z.string().min(3, 'Username minimal 3 karakter'),
  fullName: z.string().min(1, 'Nama lengkap harus diisi'),
  nis: z.string().min(1, 'NIS harus diisi'),
  nisn: z.string().optional(),
  className: z.string().optional(),
  dateOfBirth: z.string().optional(),
  address: z.string().optional(),
  parentName: z.string().optional(),
  parentPhone: z.string().optional(),
});

type StudentData = z.infer<typeof studentSchema>;

interface ImportResult {
  success: number;
  failed: number;
  errors: Array<{ row: number; error: string }>;
}

/**
 * Import students from Excel/CSV file
 * Admin only
 */
export async function importStudents(
  formData: FormData
): Promise<ActionResponse<ImportResult>> {
  try {
    // Check authorization
    const session = await auth();

    if (!session?.user) {
      return {
        success: false,
        error: 'Unauthorized',
      };
    }

    if (session.user.role !== 'ADMIN') {
      return {
        success: false,
        error: 'Only admin can import students',
      };
    }

    // Get file from form data
    const file = formData.get('file') as File;

    if (!file) {
      return {
        success: false,
        error: 'File tidak ditemukan',
      };
    }

    // Read file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Parse Excel/CSV
    let workbook: XLSX.WorkBook;
    try {
      workbook = XLSX.read(buffer, { type: 'buffer' });
    } catch (error) {
      return {
        success: false,
        error: 'File tidak valid atau corrupt',
      };
    }

    // Get first sheet
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Convert to JSON
    const data = XLSX.utils.sheet_to_json<Record<string, any>>(sheet);

    if (data.length === 0) {
      return {
        success: false,
        error: 'File kosong atau tidak ada data',
      };
    }

    // Process each row
    const result: ImportResult = {
      success: 0,
      failed: 0,
      errors: [],
    };

    const defaultPassword = await hash('siswa123', 12);

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNumber = i + 2; // +2 because Excel starts at 1 and has header

      try {
        // Validate data
        const validatedData = studentSchema.parse({
          email: row.email?.toString().trim(),
          username: row.username?.toString().trim(),
          fullName: row.fullName?.toString().trim(),
          nis: row.nis?.toString().trim(),
          nisn: row.nisn?.toString().trim() || undefined,
          className: row.className?.toString().trim() || undefined,
          dateOfBirth: row.dateOfBirth?.toString().trim() || undefined,
          address: row.address?.toString().trim() || undefined,
          parentName: row.parentName?.toString().trim() || undefined,
          parentPhone: row.parentPhone?.toString().trim() || undefined,
        });

        // Check if email already exists
        const existingEmail = await prisma.user.findUnique({
          where: { email: validatedData.email },
        });

        if (existingEmail) {
          result.failed++;
          result.errors.push({
            row: rowNumber,
            error: `Email ${validatedData.email} sudah terdaftar`,
          });
          continue;
        }

        // Check if username already exists
        const existingUsername = await prisma.user.findUnique({
          where: { username: validatedData.username },
        });

        if (existingUsername) {
          result.failed++;
          result.errors.push({
            row: rowNumber,
            error: `Username ${validatedData.username} sudah terdaftar`,
          });
          continue;
        }

        // Check if NIS already exists
        const existingNIS = await prisma.student.findUnique({
          where: { nis: validatedData.nis },
        });

        if (existingNIS) {
          result.failed++;
          result.errors.push({
            row: rowNumber,
            error: `NIS ${validatedData.nis} sudah terdaftar`,
          });
          continue;
        }

        // Find class if className provided
        let classId: string | null = null;
        if (validatedData.className) {
          const classData = await prisma.class.findFirst({
            where: {
              name: validatedData.className,
              deletedAt: null,
            },
          });

          if (!classData) {
            result.failed++;
            result.errors.push({
              row: rowNumber,
              error: `Kelas ${validatedData.className} tidak ditemukan`,
            });
            continue;
          }

          classId = classData.id;
        }

        // Parse date of birth
        let dateOfBirth: Date | null = null;
        if (validatedData.dateOfBirth) {
          try {
            dateOfBirth = new Date(validatedData.dateOfBirth);
            if (isNaN(dateOfBirth.getTime())) {
              throw new Error('Invalid date');
            }
          } catch (error) {
            result.failed++;
            result.errors.push({
              row: rowNumber,
              error: 'Format tanggal lahir tidak valid (gunakan YYYY-MM-DD)',
            });
            continue;
          }
        }

        // Create user and student in transaction
        await prisma.$transaction(async (tx) => {
          // Create user
          const user = await tx.user.create({
            data: {
              email: validatedData.email,
              username: validatedData.username,
              passwordHash: defaultPassword,
              role: 'SISWA',
              fullName: validatedData.fullName,
              isActive: true,
              mustChangePassword: true, // Force password change on first login
            },
          });

          // Create student
          await tx.student.create({
            data: {
              userId: user.id,
              nis: validatedData.nis,
              nisn: validatedData.nisn || null,
              classId: classId,
              dateOfBirth: dateOfBirth,
              address: validatedData.address || null,
              parentName: validatedData.parentName || null,
              parentPhone: validatedData.parentPhone || null,
            },
          });
        });

        result.success++;
      } catch (error) {
        result.failed++;
        
        if (error instanceof z.ZodError) {
          const firstError = error.errors[0];
          result.errors.push({
            row: rowNumber,
            error: firstError.message,
          });
        } else if (error instanceof Error) {
          result.errors.push({
            row: rowNumber,
            error: error.message,
          });
        } else {
          result.errors.push({
            row: rowNumber,
            error: 'Terjadi kesalahan tidak diketahui',
          });
        }
      }
    }

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error('Import students error:', error);
    return {
      success: false,
      error: 'Terjadi kesalahan saat import. Silakan coba lagi',
    };
  }
}

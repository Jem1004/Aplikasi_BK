import { z } from 'zod';
import { ViolationCategory } from '@prisma/client';

// Academic Year validation schema
export const academicYearSchema = z.object({
  name: z.string().min(1, 'Nama tahun ajaran harus diisi').max(50, 'Nama tahun ajaran maksimal 50 karakter'),
  startDate: z.string().min(1, 'Tanggal mulai harus diisi'),
  endDate: z.string().min(1, 'Tanggal selesai harus diisi'),
  isActive: z.boolean().default(false),
}).refine(
  (data) => {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    return end > start;
  },
  {
    message: 'Tanggal selesai harus lebih besar dari tanggal mulai',
    path: ['endDate'],
  }
);

export type AcademicYearInput = z.infer<typeof academicYearSchema>;

// Class validation schema
export const classSchema = z.object({
  name: z.string().min(1, 'Nama kelas harus diisi').max(50, 'Nama kelas maksimal 50 karakter'),
  gradeLevel: z.number().int('Tingkat kelas harus berupa angka').min(1, 'Tingkat kelas minimal 1').max(12, 'Tingkat kelas maksimal 12'),
  academicYearId: z.string().uuid('Academic Year ID tidak valid'),
});

export type ClassInput = z.infer<typeof classSchema>;

// Violation Type validation schema
export const violationTypeSchema = z.object({
  code: z.string().min(1, 'Kode harus diisi').max(20, 'Kode maksimal 20 karakter'),
  name: z.string().min(1, 'Nama harus diisi').max(255, 'Nama maksimal 255 karakter'),
  description: z.string().optional().nullable(),
  points: z.number().int('Poin harus berupa angka'),
  type: z.nativeEnum(ViolationCategory, { errorMap: () => ({ message: 'Tipe tidak valid' }) }),
  category: z.string().max(100, 'Kategori maksimal 100 karakter').optional().nullable(),
  isActive: z.boolean().default(true),
}).refine(
  (data) => {
    // For PELANGGARAN, points should be positive
    // For PRESTASI, points should be negative
    if (data.type === 'PELANGGARAN' && data.points < 0) {
      return false;
    }
    if (data.type === 'PRESTASI' && data.points > 0) {
      return false;
    }
    return true;
  },
  {
    message: 'Poin untuk pelanggaran harus positif, poin untuk prestasi harus negatif',
    path: ['points'],
  }
);

export type ViolationTypeInput = z.infer<typeof violationTypeSchema>;

import { z } from 'zod';

// Student Counselor Assignment validation schema
export const studentCounselorAssignmentSchema = z.object({
  studentId: z.string().uuid('Student ID tidak valid'),
  counselorId: z.string().uuid('Counselor ID tidak valid'),
  academicYearId: z.string().uuid('Academic Year ID tidak valid'),
});

export type StudentCounselorAssignmentInput = z.infer<typeof studentCounselorAssignmentSchema>;

// Bulk Student Counselor Assignment validation schema
export const bulkStudentCounselorAssignmentSchema = z.object({
  studentIds: z.array(z.string().uuid('Student ID tidak valid')).min(1, 'Minimal satu siswa harus dipilih'),
  counselorId: z.string().uuid('Counselor ID tidak valid'),
  academicYearId: z.string().uuid('Academic Year ID tidak valid'),
});

export type BulkStudentCounselorAssignmentInput = z.infer<typeof bulkStudentCounselorAssignmentSchema>;

// Homeroom Teacher Assignment validation schema
export const homeroomTeacherAssignmentSchema = z.object({
  classId: z.string().uuid('Class ID tidak valid'),
  teacherId: z.string().uuid('Teacher ID tidak valid'),
  academicYearId: z.string().uuid('Academic Year ID tidak valid'),
});

export type HomeroomTeacherAssignmentInput = z.infer<typeof homeroomTeacherAssignmentSchema>;

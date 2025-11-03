import { z } from 'zod';
import { Role } from '@prisma/client';

// User creation validation schema
export const createUserSchema = z.object({
  email: z.string().email('Email tidak valid'),
  username: z
    .string()
    .min(3, 'Username minimal 3 karakter')
    .max(100, 'Username maksimal 100 karakter')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username hanya boleh mengandung huruf, angka, dan underscore'),
  password: z
    .string()
    .min(8, 'Password minimal 8 karakter')
    .regex(/[a-zA-Z]/, 'Password harus mengandung huruf')
    .regex(/[0-9]/, 'Password harus mengandung angka'),
  fullName: z.string().min(1, 'Nama lengkap harus diisi').max(255, 'Nama lengkap maksimal 255 karakter'),
  phone: z.string().optional().nullable(),
  role: z.nativeEnum(Role, { errorMap: () => ({ message: 'Role tidak valid' }) }),
  isActive: z.boolean().default(true),
  
  // Teacher-specific fields
  nip: z.string().optional().nullable(),
  specialization: z.string().optional().nullable(),
  
  // Student-specific fields
  nis: z.string().optional().nullable(),
  nisn: z.string().optional().nullable(),
  classId: z.string().uuid('Class ID tidak valid').optional().nullable(),
  dateOfBirth: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  parentName: z.string().optional().nullable(),
  parentPhone: z.string().optional().nullable(),
}).refine(
  (data) => {
    // If role is GURU_BK or WALI_KELAS, NIP should be provided
    if ((data.role === 'GURU_BK' || data.role === 'WALI_KELAS') && !data.nip) {
      return false;
    }
    return true;
  },
  {
    message: 'NIP harus diisi untuk Guru BK dan Wali Kelas',
    path: ['nip'],
  }
).refine(
  (data) => {
    // If role is SISWA, NIS should be provided
    if (data.role === 'SISWA' && !data.nis) {
      return false;
    }
    return true;
  },
  {
    message: 'NIS harus diisi untuk Siswa',
    path: ['nis'],
  }
);

export type CreateUserInput = z.infer<typeof createUserSchema>;

// User update validation schema (password is optional)
export const updateUserSchema = z.object({
  email: z.string().email('Email tidak valid').optional(),
  username: z
    .string()
    .min(3, 'Username minimal 3 karakter')
    .max(100, 'Username maksimal 100 karakter')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username hanya boleh mengandung huruf, angka, dan underscore')
    .optional(),
  password: z
    .string()
    .min(8, 'Password minimal 8 karakter')
    .regex(/[a-zA-Z]/, 'Password harus mengandung huruf')
    .regex(/[0-9]/, 'Password harus mengandung angka')
    .optional(),
  fullName: z.string().min(1, 'Nama lengkap harus diisi').max(255, 'Nama lengkap maksimal 255 karakter').optional(),
  phone: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  
  // Teacher-specific fields
  nip: z.string().optional().nullable(),
  specialization: z.string().optional().nullable(),
  
  // Student-specific fields
  nis: z.string().optional().nullable(),
  nisn: z.string().optional().nullable(),
  classId: z.string().uuid('Class ID tidak valid').optional().nullable(),
  dateOfBirth: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  parentName: z.string().optional().nullable(),
  parentPhone: z.string().optional().nullable(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;

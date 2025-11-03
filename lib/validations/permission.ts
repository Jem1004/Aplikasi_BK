import { z } from 'zod';
import { PermissionType } from '@prisma/client';

// Permission creation validation schema
export const createPermissionSchema = z.object({
  studentId: z.string().uuid('Student ID tidak valid'),
  permissionType: z.nativeEnum(PermissionType, { errorMap: () => ({ message: 'Tipe izin tidak valid' }) }),
  reason: z.string().min(1, 'Alasan harus diisi').max(500, 'Alasan maksimal 500 karakter'),
  permissionDate: z.string().min(1, 'Tanggal izin harus diisi'),
  startTime: z.string().min(1, 'Waktu mulai harus diisi'),
  endTime: z.string().optional().nullable(),
  destination: z.string().max(255, 'Tujuan maksimal 255 karakter').optional().nullable(),
  notes: z.string().optional().nullable(),
}).refine(
  (data) => {
    // If endTime is provided, it should be after startTime
    if (data.endTime) {
      const start = new Date(`2000-01-01T${data.startTime}`);
      const end = new Date(`2000-01-01T${data.endTime}`);
      return end > start;
    }
    return true;
  },
  {
    message: 'Waktu selesai harus lebih besar dari waktu mulai',
    path: ['endTime'],
  }
);

export type CreatePermissionInput = z.infer<typeof createPermissionSchema>;

import { z } from 'zod';

// Student profile update validation schema (limited fields)
export const updateStudentProfileSchema = z.object({
  phone: z.string().optional().nullable(),
  address: z.string().max(500, 'Alamat maksimal 500 karakter').optional().nullable(),
  parentPhone: z.string().optional().nullable(),
});

export type UpdateStudentProfileInput = z.infer<typeof updateStudentProfileSchema>;

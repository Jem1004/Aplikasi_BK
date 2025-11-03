import { z } from 'zod';

// Violation creation validation schema
export const createViolationSchema = z.object({
  studentId: z.string().uuid('Student ID tidak valid'),
  violationTypeId: z.string().uuid('Violation Type ID tidak valid'),
  incidentDate: z.string().min(1, 'Tanggal kejadian harus diisi'),
  description: z.string().optional().nullable(),
}).refine(
  (data) => {
    // Incident date should not be in the future
    const incidentDate = new Date(data.incidentDate);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today
    return incidentDate <= today;
  },
  {
    message: 'Tanggal kejadian tidak boleh di masa depan',
    path: ['incidentDate'],
  }
);

export type CreateViolationInput = z.infer<typeof createViolationSchema>;

// Violation update validation schema
export const updateViolationSchema = z.object({
  violationTypeId: z.string().uuid('Violation Type ID tidak valid').optional(),
  incidentDate: z.string().optional(),
  description: z.string().optional().nullable(),
}).refine(
  (data) => {
    // If incidentDate is provided, it should not be in the future
    if (data.incidentDate) {
      const incidentDate = new Date(data.incidentDate);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      return incidentDate <= today;
    }
    return true;
  },
  {
    message: 'Tanggal kejadian tidak boleh di masa depan',
    path: ['incidentDate'],
  }
);

export type UpdateViolationInput = z.infer<typeof updateViolationSchema>;

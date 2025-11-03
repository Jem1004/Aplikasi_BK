import { z } from 'zod';

// Counseling Journal creation validation schema
export const createCounselingJournalSchema = z.object({
  studentId: z.string().uuid('Student ID tidak valid'),
  sessionDate: z.string().min(1, 'Tanggal sesi harus diisi'),
  content: z.string().min(10, 'Konten jurnal minimal 10 karakter').max(10000, 'Konten jurnal maksimal 10000 karakter'),
}).refine(
  (data) => {
    // Session date should not be in the future
    const sessionDate = new Date(data.sessionDate);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return sessionDate <= today;
  },
  {
    message: 'Tanggal sesi tidak boleh di masa depan',
    path: ['sessionDate'],
  }
);

export type CreateCounselingJournalInput = z.infer<typeof createCounselingJournalSchema>;

// Counseling Journal update validation schema
export const updateCounselingJournalSchema = z.object({
  sessionDate: z.string().optional(),
  content: z.string().min(10, 'Konten jurnal minimal 10 karakter').max(10000, 'Konten jurnal maksimal 10000 karakter').optional(),
}).refine(
  (data) => {
    // If sessionDate is provided, it should not be in the future
    if (data.sessionDate) {
      const sessionDate = new Date(data.sessionDate);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      return sessionDate <= today;
    }
    return true;
  },
  {
    message: 'Tanggal sesi tidak boleh di masa depan',
    path: ['sessionDate'],
  }
);

export type UpdateCounselingJournalInput = z.infer<typeof updateCounselingJournalSchema>;

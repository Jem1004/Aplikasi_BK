import { z } from 'zod';
import { AppointmentStatus } from '@prisma/client';

// Appointment creation validation schema
export const createAppointmentSchema = z.object({
  counselorId: z.string().uuid('Counselor ID tidak valid'),
  appointmentDate: z.string().min(1, 'Tanggal janji temu harus diisi'),
  startTime: z.string().min(1, 'Waktu mulai harus diisi'),
  endTime: z.string().min(1, 'Waktu selesai harus diisi'),
  reason: z.string().min(10, 'Alasan minimal 10 karakter').max(500, 'Alasan maksimal 500 karakter'),
}).refine(
  (data) => {
    // Appointment date should not be in the past
    const appointmentDate = new Date(data.appointmentDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today
    return appointmentDate >= today;
  },
  {
    message: 'Tanggal janji temu tidak boleh di masa lalu',
    path: ['appointmentDate'],
  }
).refine(
  (data) => {
    // End time should be after start time
    const start = new Date(`2000-01-01T${data.startTime}`);
    const end = new Date(`2000-01-01T${data.endTime}`);
    return end > start;
  },
  {
    message: 'Waktu selesai harus lebih besar dari waktu mulai',
    path: ['endTime'],
  }
);

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;

// Appointment update validation schema (for rescheduling)
export const updateAppointmentSchema = z.object({
  appointmentDate: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  status: z.nativeEnum(AppointmentStatus, { errorMap: () => ({ message: 'Status tidak valid' }) }).optional(),
  rejectionReason: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
}).refine(
  (data) => {
    // If appointmentDate is provided, it should not be in the past
    if (data.appointmentDate) {
      const appointmentDate = new Date(data.appointmentDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return appointmentDate >= today;
    }
    return true;
  },
  {
    message: 'Tanggal janji temu tidak boleh di masa lalu',
    path: ['appointmentDate'],
  }
).refine(
  (data) => {
    // If both startTime and endTime are provided, endTime should be after startTime
    if (data.startTime && data.endTime) {
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
).refine(
  (data) => {
    // If status is REJECTED, rejectionReason should be provided
    if (data.status === 'REJECTED' && !data.rejectionReason) {
      return false;
    }
    return true;
  },
  {
    message: 'Alasan penolakan harus diisi',
    path: ['rejectionReason'],
  }
);

export type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>;

// Appointment rejection validation schema
export const rejectAppointmentSchema = z.object({
  rejectionReason: z.string().min(10, 'Alasan penolakan minimal 10 karakter').max(500, 'Alasan penolakan maksimal 500 karakter'),
});

export type RejectAppointmentInput = z.infer<typeof rejectAppointmentSchema>;

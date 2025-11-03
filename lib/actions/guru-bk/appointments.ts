'use server';

import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';
import type { ActionResponse } from '@/types';
import { Prisma, AppointmentStatus } from '@prisma/client';
import {
  logAuditEvent,
  AUDIT_ACTIONS,
  ENTITY_TYPES,
} from '@/lib/audit/audit-logger';

// Validation schemas
const rescheduleAppointmentSchema = z.object({
  appointmentDate: z.string().min(1, 'Tanggal harus diisi'),
  startTime: z.string().min(1, 'Waktu mulai harus diisi'),
  endTime: z.string().min(1, 'Waktu selesai harus diisi'),
});

const rejectAppointmentSchema = z.object({
  rejectionReason: z.string().min(1, 'Alasan penolakan harus diisi'),
});

// Type for appointment with related data
type AppointmentWithStudent = Prisma.AppointmentGetPayload<{
  include: {
    student: {
      include: {
        user: true;
        class: true;
      };
    };
    counselor: {
      include: {
        user: true;
      };
    };
  };
}>;

// Type for time slot
export type TimeSlot = {
  startTime: string;
  endTime: string;
  isAvailable: boolean;
};

/**
 * Check if user is Guru BK
 */
async function checkGuruBKAuth() {
  const session = await auth();

  if (!session || !session.user) {
    return {
      success: false as const,
      error: 'Anda harus login terlebih dahulu',
    };
  }

  if (session.user.role !== 'GURU_BK') {
    return {
      success: false as const,
      error: 'Anda tidak memiliki akses ke fitur ini',
    };
  }

  if (!session.user.teacherId) {
    return {
      success: false as const,
      error: 'Data guru tidak ditemukan',
    };
  }

  return {
    success: true as const,
    teacherId: session.user.teacherId,
  };
}

/**
 * Get all appointments for the current counselor
 * Guru BK only
 */
export async function getMyAppointments(
  filters?: {
    status?: AppointmentStatus;
    dateFrom?: string;
    dateTo?: string;
  }
): Promise<ActionResponse<AppointmentWithStudent[]>> {
  try {
    // Check authorization
    const authCheck = await checkGuruBKAuth();
    if (!authCheck.success) {
      return authCheck;
    }

    const teacherId = authCheck.teacherId;

    // Build where clause
    const where: Prisma.AppointmentWhereInput = {
      counselorId: teacherId,
      deletedAt: null,
    };

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.dateFrom || filters?.dateTo) {
      where.appointmentDate = {};
      if (filters.dateFrom) {
        where.appointmentDate.gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        where.appointmentDate.lte = new Date(filters.dateTo);
      }
    }

    // Fetch appointments
    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        student: {
          include: {
            user: true,
            class: true,
          },
        },
        counselor: {
          include: {
            user: true,
          },
        },
      },
      orderBy: [
        { appointmentDate: 'asc' },
        { startTime: 'asc' },
      ],
    });

    return {
      success: true,
      data: appointments,
    };
  } catch (error) {
    console.error('Get my appointments error:', error);
    return {
      success: false,
      error: 'Terjadi kesalahan. Silakan coba lagi',
    };
  }
}

/**
 * Approve an appointment
 * Guru BK only, for their own appointments
 */
export async function approveAppointment(
  id: string
): Promise<ActionResponse> {
  try {
    // Check authorization
    const authCheck = await checkGuruBKAuth();
    if (!authCheck.success) {
      return authCheck;
    }

    const teacherId = authCheck.teacherId;

    // Check if appointment exists and belongs to this counselor
    const appointment = await prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment || appointment.deletedAt) {
      return {
        success: false,
        error: 'Janji temu tidak ditemukan',
      };
    }

    if (appointment.counselorId !== teacherId) {
      return {
        success: false,
        error: 'Anda tidak memiliki akses ke janji temu ini',
      };
    }

    if (appointment.status !== 'PENDING') {
      return {
        success: false,
        error: 'Janji temu ini sudah diproses',
      };
    }

    // Get session for audit log
    const session = await auth();

    // Update appointment status to APPROVED
    await prisma.appointment.update({
      where: { id },
      data: {
        status: 'APPROVED',
      },
    });

    // Log audit event
    await logAuditEvent({
      userId: session?.user?.id,
      action: AUDIT_ACTIONS.APPOINTMENT_APPROVED,
      entityType: ENTITY_TYPES.APPOINTMENT,
      entityId: id,
      oldValues: { status: appointment.status },
      newValues: { status: 'APPROVED' },
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error('Approve appointment error:', error);
    return {
      success: false,
      error: 'Terjadi kesalahan. Silakan coba lagi',
    };
  }
}

/**
 * Reject an appointment with reason
 * Guru BK only, for their own appointments
 */
export async function rejectAppointment(
  id: string,
  formData: FormData
): Promise<ActionResponse> {
  try {
    // Check authorization
    const authCheck = await checkGuruBKAuth();
    if (!authCheck.success) {
      return authCheck;
    }

    const teacherId = authCheck.teacherId;

    // Parse and validate input
    const rawData = {
      rejectionReason: formData.get('rejectionReason'),
    };

    const validatedFields = rejectAppointmentSchema.safeParse(rawData);

    if (!validatedFields.success) {
      return {
        success: false,
        errors: validatedFields.error.flatten().fieldErrors,
      };
    }

    const data = validatedFields.data;

    // Check if appointment exists and belongs to this counselor
    const appointment = await prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment || appointment.deletedAt) {
      return {
        success: false,
        error: 'Janji temu tidak ditemukan',
      };
    }

    if (appointment.counselorId !== teacherId) {
      return {
        success: false,
        error: 'Anda tidak memiliki akses ke janji temu ini',
      };
    }

    if (appointment.status !== 'PENDING') {
      return {
        success: false,
        error: 'Janji temu ini sudah diproses',
      };
    }

    // Update appointment status to REJECTED with reason
    await prisma.appointment.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectionReason: data.rejectionReason,
      },
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error('Reject appointment error:', error);
    return {
      success: false,
      error: 'Terjadi kesalahan. Silakan coba lagi',
    };
  }
}

/**
 * Reschedule an appointment to a different time
 * Guru BK only, for their own appointments
 */
export async function rescheduleAppointment(
  id: string,
  formData: FormData
): Promise<ActionResponse> {
  try {
    // Check authorization
    const authCheck = await checkGuruBKAuth();
    if (!authCheck.success) {
      return authCheck;
    }

    const teacherId = authCheck.teacherId;

    // Parse and validate input
    const rawData = {
      appointmentDate: formData.get('appointmentDate'),
      startTime: formData.get('startTime'),
      endTime: formData.get('endTime'),
    };

    const validatedFields = rescheduleAppointmentSchema.safeParse(rawData);

    if (!validatedFields.success) {
      return {
        success: false,
        errors: validatedFields.error.flatten().fieldErrors,
      };
    }

    const data = validatedFields.data;

    // Check if appointment exists and belongs to this counselor
    const appointment = await prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment || appointment.deletedAt) {
      return {
        success: false,
        error: 'Janji temu tidak ditemukan',
      };
    }

    if (appointment.counselorId !== teacherId) {
      return {
        success: false,
        error: 'Anda tidak memiliki akses ke janji temu ini',
      };
    }

    if (appointment.status === 'COMPLETED' || appointment.status === 'CANCELLED') {
      return {
        success: false,
        error: 'Janji temu ini tidak dapat dijadwalkan ulang',
      };
    }

    // Check if the new time slot is available
    const conflictingAppointment = await prisma.appointment.findFirst({
      where: {
        counselorId: teacherId,
        appointmentDate: new Date(data.appointmentDate),
        deletedAt: null,
        status: {
          in: ['PENDING', 'APPROVED', 'RESCHEDULED'],
        },
        id: {
          not: id, // Exclude current appointment
        },
        OR: [
          {
            AND: [
              { startTime: { lte: data.startTime } },
              { endTime: { gt: data.startTime } },
            ],
          },
          {
            AND: [
              { startTime: { lt: data.endTime } },
              { endTime: { gte: data.endTime } },
            ],
          },
          {
            AND: [
              { startTime: { gte: data.startTime } },
              { endTime: { lte: data.endTime } },
            ],
          },
        ],
      },
    });

    if (conflictingAppointment) {
      return {
        success: false,
        error: 'Waktu yang dipilih sudah ada janji temu lain',
      };
    }

    // Update appointment with new schedule
    await prisma.appointment.update({
      where: { id },
      data: {
        appointmentDate: new Date(data.appointmentDate),
        startTime: data.startTime,
        endTime: data.endTime,
        status: 'RESCHEDULED',
      },
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error('Reschedule appointment error:', error);
    return {
      success: false,
      error: 'Terjadi kesalahan. Silakan coba lagi',
    };
  }
}

/**
 * Mark an appointment as completed
 * Guru BK only, for their own appointments
 */
export async function completeAppointment(
  id: string
): Promise<ActionResponse> {
  try {
    // Check authorization
    const authCheck = await checkGuruBKAuth();
    if (!authCheck.success) {
      return authCheck;
    }

    const teacherId = authCheck.teacherId;

    // Check if appointment exists and belongs to this counselor
    const appointment = await prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment || appointment.deletedAt) {
      return {
        success: false,
        error: 'Janji temu tidak ditemukan',
      };
    }

    if (appointment.counselorId !== teacherId) {
      return {
        success: false,
        error: 'Anda tidak memiliki akses ke janji temu ini',
      };
    }

    if (appointment.status !== 'APPROVED' && appointment.status !== 'RESCHEDULED') {
      return {
        success: false,
        error: 'Hanya janji temu yang disetujui yang dapat diselesaikan',
      };
    }

    // Update appointment status to COMPLETED
    await prisma.appointment.update({
      where: { id },
      data: {
        status: 'COMPLETED',
      },
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error('Complete appointment error:', error);
    return {
      success: false,
      error: 'Terjadi kesalahan. Silakan coba lagi',
    };
  }
}

/**
 * Get available time slots for a specific date
 * Guru BK only, for their own schedule
 */
export async function getAvailableSlots(
  date: string
): Promise<ActionResponse<TimeSlot[]>> {
  try {
    // Check authorization
    const authCheck = await checkGuruBKAuth();
    if (!authCheck.success) {
      return authCheck;
    }

    const teacherId = authCheck.teacherId;

    // Define working hours (8:00 AM to 4:00 PM)
    const workingHours = [
      { startTime: '08:00', endTime: '09:00' },
      { startTime: '09:00', endTime: '10:00' },
      { startTime: '10:00', endTime: '11:00' },
      { startTime: '11:00', endTime: '12:00' },
      { startTime: '13:00', endTime: '14:00' },
      { startTime: '14:00', endTime: '15:00' },
      { startTime: '15:00', endTime: '16:00' },
    ];

    // Get existing appointments for the date
    const existingAppointments = await prisma.appointment.findMany({
      where: {
        counselorId: teacherId,
        appointmentDate: new Date(date),
        deletedAt: null,
        status: {
          in: ['PENDING', 'APPROVED', 'RESCHEDULED'],
        },
      },
      select: {
        startTime: true,
        endTime: true,
      },
    });

    // Check availability for each time slot
    const availableSlots: TimeSlot[] = workingHours.map((slot) => {
      const isBooked = existingAppointments.some((appointment) => {
        // Convert Date objects to time strings (HH:MM format)
        const appointmentStart = appointment.startTime.toISOString().substring(11, 16);
        const appointmentEnd = appointment.endTime.toISOString().substring(11, 16);
        const slotStart = slot.startTime;
        const slotEnd = slot.endTime;

        // Check if there's any overlap
        return (
          (appointmentStart <= slotStart && appointmentEnd > slotStart) ||
          (appointmentStart < slotEnd && appointmentEnd >= slotEnd) ||
          (appointmentStart >= slotStart && appointmentEnd <= slotEnd)
        );
      });

      return {
        startTime: slot.startTime,
        endTime: slot.endTime,
        isAvailable: !isBooked,
      };
    });

    return {
      success: true,
      data: availableSlots,
    };
  } catch (error) {
    console.error('Get available slots error:', error);
    return {
      success: false,
      error: 'Terjadi kesalahan. Silakan coba lagi',
    };
  }
}

'use server';

import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';
import type { ActionResponse } from '@/types';
import { Prisma, AppointmentStatus } from '@prisma/client';
import { revalidatePath } from 'next/cache';

// Validation schemas
const createAppointmentSchema = z.object({
  appointmentDate: z.string().min(1, 'Tanggal harus diisi'),
  startTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Format waktu mulai tidak valid (HH:MM)'),
  endTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Format waktu selesai tidak valid (HH:MM)'),
  reason: z.string().min(10, 'Alasan harus diisi minimal 10 karakter'),
}).refine((data) => {
  // Check if date is not in the past
  const appointmentDate = new Date(data.appointmentDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return appointmentDate >= today;
}, {
  message: 'Tanggal janji temu tidak boleh di masa lalu',
}).refine((data) => {
  const start = new Date(`1970-01-01T${data.startTime}:00`);
  const end = new Date(`1970-01-01T${data.endTime}:00`);
  return end > start;
}, {
  message: 'Waktu selesai harus setelah waktu mulai',
});

// Type for appointment with counselor data
type AppointmentWithCounselor = Prisma.AppointmentGetPayload<{
  include: {
    counselor: {
      include: {
        user: true;
      };
    };
    student: {
      include: {
        user: true;
        class: true;
      };
    };
  };
}>;

// Type for teacher with user data
type TeacherWithUser = Prisma.TeacherGetPayload<{
  include: {
    user: true;
  };
}>;

// Type for time slot
export type TimeSlot = {
  startTime: string;
  endTime: string;
  isAvailable: boolean;
};

/**
 * Check if user is Siswa and get student ID
 */
async function checkSiswaAuth() {
  const session = await auth();

  if (!session || !session.user) {
    return {
      success: false as const,
      error: 'Anda harus login terlebih dahulu',
    };
  }

  if (session.user.role !== 'SISWA') {
    return {
      success: false as const,
      error: 'Anda tidak memiliki akses ke fitur ini',
    };
  }

  if (!session.user.studentId) {
    return {
      success: false as const,
      error: 'Data siswa tidak ditemukan',
    };
  }

  return {
    success: true as const,
    studentId: session.user.studentId,
  };
}

/**
 * Create a new appointment request
 * Siswa only
 */
export async function createAppointment(
  formData: FormData
): Promise<ActionResponse<{ id: string }>> {
  try {
    // Check authorization
    const authCheck = await checkSiswaAuth();
    if (!authCheck.success) {
      return authCheck;
    }

    const studentId = authCheck.studentId;

    // Parse and validate input
    const rawData = {
      appointmentDate: formData.get('appointmentDate'),
      startTime: formData.get('startTime'),
      endTime: formData.get('endTime'),
      reason: formData.get('reason'),
    };

    const validatedFields = createAppointmentSchema.safeParse(rawData);

    if (!validatedFields.success) {
      return {
        success: false,
        errors: validatedFields.error.flatten().fieldErrors,
      };
    }

    const data = validatedFields.data;

    // Get student's assigned counselor
    const assignment = await prisma.studentCounselorAssignment.findFirst({
      where: {
        studentId: studentId,
      },
      orderBy: {
        assignedAt: 'desc',
      },
      select: {
        counselorId: true,
      },
    });

    if (!assignment) {
      return {
        success: false,
        error: 'Anda belum memiliki guru BK yang ditugaskan',
      };
    }

    const counselorId = assignment.counselorId;

    // Check if the time slot is still available
    const newStartTime = new Date(`1970-01-01T${data.startTime}:00`);
    const newEndTime = new Date(`1970-01-01T${data.endTime}:00`);

    const conflictingAppointment = await prisma.appointment.findFirst({
      where: {
        counselorId: counselorId,
        appointmentDate: new Date(data.appointmentDate),
        status: {
          in: ['PENDING', 'APPROVED', 'RESCHEDULED'],
        },
        OR: [
          {
            AND: [
              { startTime: { lte: newStartTime } },
              { endTime: { gt: newStartTime } },
            ],
          },
          {
            AND: [
              { startTime: { lt: newEndTime } },
              { endTime: { gte: newEndTime } },
            ],
          },
          {
            AND: [
              { startTime: { gte: newStartTime } },
              { endTime: { lte: newEndTime } },
            ],
          },
        ],
      },
    });

    if (conflictingAppointment) {
      return {
        success: false,
        error: 'Waktu yang dipilih sudah tidak tersedia. Silakan pilih waktu lain',
      };
    }

    // Create appointment with PENDING status
    const appointment = await prisma.appointment.create({
      data: {
        studentId: studentId,
        counselorId: counselorId,
        appointmentDate: new Date(data.appointmentDate),
        startTime: new Date(`1970-01-01T${data.startTime}:00`),
        endTime: new Date(`1970-01-01T${data.endTime}:00`),
        reason: data.reason,
        status: 'PENDING',
      },
    });

    // Invalidate cache for appointments page
    revalidatePath('/siswa/appointments');

    return {
      success: true,
      data: { id: appointment.id },
    };
  } catch (error) {
    console.error('Create appointment error:', error);

    // Handle specific errors
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }

    // Check for Prisma errors
    if (typeof error === 'object' && error !== null) {
      console.error('Prisma error details:', JSON.stringify(error, null, 2));
    }

    return {
      success: false,
      error: 'Terjadi kesalahan. Silakan coba lagi',
    };
  }
}

/**
 * Cancel a pending appointment
 * Siswa only, for their own appointments
 */
export async function cancelAppointment(
  id: string
): Promise<ActionResponse> {
  try {
    // Check authorization
    const authCheck = await checkSiswaAuth();
    if (!authCheck.success) {
      return authCheck;
    }

    const studentId = authCheck.studentId;

    // Check if appointment exists and belongs to this student
    const appointment = await prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment ) {
      return {
        success: false,
        error: 'Janji temu tidak ditemukan',
      };
    }

    if (appointment.studentId !== studentId) {
      return {
        success: false,
        error: 'Anda tidak memiliki akses ke janji temu ini',
      };
    }

    if (appointment.status !== 'PENDING') {
      return {
        success: false,
        error: 'Hanya janji temu yang masih pending yang dapat dibatalkan',
      };
    }

    // Update appointment status to CANCELLED
    await prisma.appointment.update({
      where: { id },
      data: {
        status: 'CANCELLED',
      },
    });

    // Invalidate cache for appointments page
    revalidatePath('/siswa/appointments');

    return {
      success: true,
    };
  } catch (error) {
    console.error('Cancel appointment error:', error);
    return {
      success: false,
      error: 'Terjadi kesalahan. Silakan coba lagi',
    };
  }
}

/**
 * Get all appointments for the current student
 * Siswa only
 */
export async function getMyAppointments(
  filters?: {
    status?: AppointmentStatus;
  }
): Promise<ActionResponse<AppointmentWithCounselor[]>> {
  try {
    // Check authorization
    const authCheck = await checkSiswaAuth();
    if (!authCheck.success) {
      return authCheck;
    }

    const studentId = authCheck.studentId;

    // Build where clause
    const where: Prisma.AppointmentWhereInput = {
      studentId: studentId
    };

    if (filters?.status) {
      where.status = filters.status;
    }

    // Fetch appointments
    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        counselor: {
          include: {
            user: true,
          },
        },
        student: {
          include: {
            user: true,
            class: true,
          },
        },
      },
      orderBy: [
        { appointmentDate: 'desc' },
        { startTime: 'desc' },
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
 * Get the assigned counselor for the current student
 * Siswa only
 */
export async function getMyCounselor(): Promise<ActionResponse<TeacherWithUser>> {
  try {
    // Check authorization
    const authCheck = await checkSiswaAuth();
    if (!authCheck.success) {
      return authCheck;
    }

    const studentId = authCheck.studentId;

    // Get student's assigned counselor
    const assignment = await prisma.studentCounselorAssignment.findFirst({
      where: {
        studentId: studentId,
      },
      orderBy: {
        assignedAt: 'desc',
      },
      include: {
        counselor: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!assignment) {
      return {
        success: false,
        error: 'Anda belum memiliki guru BK yang ditugaskan',
      };
    }

    return {
      success: true,
      data: assignment.counselor,
    };
  } catch (error) {
    console.error('Get my counselor error:', error);
    return {
      success: false,
      error: 'Terjadi kesalahan. Silakan coba lagi',
    };
  }
}

/**
 * Get available time slots for counselor on a specific date
 * Siswa only
 */
export async function getCounselorAvailableSlots(
  date: string
): Promise<ActionResponse<TimeSlot[]>> {
  try {
    // Check authorization
    const authCheck = await checkSiswaAuth();
    if (!authCheck.success) {
      return authCheck;
    }

    const studentId = authCheck.studentId;

    // Get student's assigned counselor
    const assignment = await prisma.studentCounselorAssignment.findFirst({
      where: {
        studentId: studentId,
      },
      orderBy: {
        assignedAt: 'desc',
      },
      select: {
        counselorId: true,
      },
    });

    if (!assignment) {
      return {
        success: false,
        error: 'Anda belum memiliki guru BK yang ditugaskan',
      };
    }

    const counselorId = assignment.counselorId;

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
        counselorId: counselorId,
        appointmentDate: new Date(date),
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
    console.error('Get counselor available slots error:', error);
    return {
      success: false,
      error: 'Terjadi kesalahan. Silakan coba lagi',
    };
  }
}

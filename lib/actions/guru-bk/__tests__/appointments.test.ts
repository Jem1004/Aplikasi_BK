import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import {
  getMyAppointments,
  approveAppointment,
  rejectAppointment,
  rescheduleAppointment,
  completeAppointment,
  getAvailableSlots,
} from '../appointments';

const prisma = new PrismaClient();

// Mock auth module
const mockAuth = {
  currentUser: null as any,
};

vi.mock('@/lib/auth/auth', () => ({
  auth: vi.fn(() => Promise.resolve(mockAuth.currentUser)),
}));

describe('Appointment Management Actions', () => {
  let academicYear: any;
  let guruBkUser: any;
  let guruBkTeacher: any;
  let studentUser: any;
  let student: any;
  let classEntity: any;

  beforeAll(async () => {
    // Create academic year
    academicYear = await prisma.academicYear.create({
      data: {
        name: '2024/2025 Appointment Test',
        startDate: new Date('2024-07-01'),
        endDate: new Date('2025-06-30'),
        isActive: true,
      },
    });

    // Create class
    classEntity = await prisma.class.create({
      data: {
        name: '10 IPA 1 Appointment Test',
        gradeLevel: 10,
        academicYearId: academicYear.id,
      },
    });

    // Create Guru BK
    guruBkUser = await prisma.user.create({
      data: {
        email: 'gurubkappointment@test.com',
        username: 'gurubkappointment',
        passwordHash: await bcrypt.hash('password123', 12),
        role: 'GURU_BK',
        fullName: 'Guru BK Appointment Test',
        isActive: true,
      },
    });

    guruBkTeacher = await prisma.teacher.create({
      data: {
        userId: guruBkUser.id,
        nip: '1111111111',
      },
    });

    // Create student
    studentUser = await prisma.user.create({
      data: {
        email: 'studentappointment@test.com',
        username: 'studentappointment',
        passwordHash: await bcrypt.hash('password123', 12),
        role: 'SISWA',
        fullName: 'Student Appointment Test',
        isActive: true,
      },
    });

    student = await prisma.student.create({
      data: {
        userId: studentUser.id,
        nis: `NISAPPT${Date.now()}`,
        nisn: `NISNAPPT${Date.now()}`,
        classId: classEntity.id,
      },
    });

    // Assign student to Guru BK
    await prisma.studentCounselorAssignment.create({
      data: {
        studentId: student.id,
        counselorId: guruBkTeacher.id,
        academicYearId: academicYear.id,
      },
    });
  });

  afterAll(async () => {
    // Clean up
    await prisma.auditLog.deleteMany({
      where: {
        userId: guruBkUser.id,
      },
    });

    await prisma.appointment.deleteMany({
      where: {
        counselorId: guruBkTeacher.id,
      },
    });

    await prisma.studentCounselorAssignment.deleteMany({
      where: {
        studentId: student.id,
      },
    });

    await prisma.student.delete({ where: { id: student.id } });
    await prisma.user.delete({ where: { id: studentUser.id } });
    await prisma.teacher.delete({ where: { id: guruBkTeacher.id } });
    await prisma.user.delete({ where: { id: guruBkUser.id } });
    await prisma.class.delete({ where: { id: classEntity.id } });
    await prisma.academicYear.delete({ where: { id: academicYear.id } });

    await prisma.$disconnect();
  });

  beforeEach(() => {
    mockAuth.currentUser = null;
    vi.clearAllMocks();
  });

  describe('Authorization', () => {
    it('should require GURU_BK role', async () => {
      mockAuth.currentUser = {
        user: {
          id: studentUser.id,
          role: 'SISWA',
        },
      };

      const result = await getMyAppointments();

      expect(result.success).toBe(false);
      expect(result.error).toContain('akses');
    });
  });

  describe('getMyAppointments', () => {
    it('should return counselor appointments', async () => {
      mockAuth.currentUser = {
        user: {
          id: guruBkUser.id,
          role: 'GURU_BK',
          teacherId: guruBkTeacher.id,
        },
      };

      const result = await getMyAppointments();

      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should filter by status', async () => {
      mockAuth.currentUser = {
        user: {
          id: guruBkUser.id,
          role: 'GURU_BK',
          teacherId: guruBkTeacher.id,
        },
      };

      const result = await getMyAppointments({ status: 'PENDING' });

      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
    });
  });

  describe('approveAppointment', () => {
    let testAppointment: any;

    beforeEach(async () => {
      testAppointment = await prisma.appointment.create({
        data: {
          studentId: student.id,
          counselorId: guruBkTeacher.id,
          appointmentDate: new Date('2024-12-01'),
          startTime: new Date('1970-01-01T09:00:00'),
          endTime: new Date('1970-01-01T10:00:00'),
          status: 'PENDING',
          reason: 'Test appointment',
        },
      });
    });

    afterEach(async () => {
      await prisma.appointment.delete({ where: { id: testAppointment.id } }).catch(() => {});
    });

    it('should approve pending appointment', async () => {
      mockAuth.currentUser = {
        user: {
          id: guruBkUser.id,
          role: 'GURU_BK',
          teacherId: guruBkTeacher.id,
        },
      };

      const result = await approveAppointment(testAppointment.id);

      expect(result.success).toBe(true);

      // Verify status changed
      const updated = await prisma.appointment.findUnique({
        where: { id: testAppointment.id },
      });

      expect(updated!.status).toBe('APPROVED');
    });

    it('should reject already processed appointment', async () => {
      mockAuth.currentUser = {
        user: {
          id: guruBkUser.id,
          role: 'GURU_BK',
          teacherId: guruBkTeacher.id,
        },
      };

      // Approve first
      await approveAppointment(testAppointment.id);

      // Try to approve again
      const result = await approveAppointment(testAppointment.id);

      expect(result.success).toBe(false);
      expect(result.error).toContain('diproses');
    });
  });

  describe('rejectAppointment', () => {
    let testAppointment: any;

    beforeEach(async () => {
      testAppointment = await prisma.appointment.create({
        data: {
          studentId: student.id,
          counselorId: guruBkTeacher.id,
          appointmentDate: new Date('2024-12-01'),
          startTime: new Date('1970-01-01T09:00:00'),
          endTime: new Date('1970-01-01T10:00:00'),
          status: 'PENDING',
          reason: 'Test appointment',
        },
      });
    });

    afterEach(async () => {
      await prisma.appointment.delete({ where: { id: testAppointment.id } }).catch(() => {});
    });

    it('should reject appointment with reason', async () => {
      mockAuth.currentUser = {
        user: {
          id: guruBkUser.id,
          role: 'GURU_BK',
          teacherId: guruBkTeacher.id,
        },
      };

      const formData = new FormData();
      formData.append('rejectionReason', 'Schedule conflict');

      const result = await rejectAppointment(testAppointment.id, formData);

      expect(result.success).toBe(true);

      // Verify status and reason
      const updated = await prisma.appointment.findUnique({
        where: { id: testAppointment.id },
      });

      expect(updated!.status).toBe('REJECTED');
      expect(updated!.rejectionReason).toBe('Schedule conflict');
    });

    it('should require rejection reason', async () => {
      mockAuth.currentUser = {
        user: {
          id: guruBkUser.id,
          role: 'GURU_BK',
          teacherId: guruBkTeacher.id,
        },
      };

      const formData = new FormData();
      formData.append('rejectionReason', '');

      const result = await rejectAppointment(testAppointment.id, formData);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });
  });

  describe('rescheduleAppointment', () => {
    let testAppointment: any;

    beforeEach(async () => {
      testAppointment = await prisma.appointment.create({
        data: {
          studentId: student.id,
          counselorId: guruBkTeacher.id,
          appointmentDate: new Date('2024-12-01'),
          startTime: new Date('1970-01-01T09:00:00'),
          endTime: new Date('1970-01-01T10:00:00'),
          status: 'PENDING',
          reason: 'Test appointment',
        },
      });
    });

    afterEach(async () => {
      await prisma.appointment.delete({ where: { id: testAppointment.id } }).catch(() => {});
    });

    it('should reschedule appointment', async () => {
      mockAuth.currentUser = {
        user: {
          id: guruBkUser.id,
          role: 'GURU_BK',
          teacherId: guruBkTeacher.id,
        },
      };

      const formData = new FormData();
      formData.append('appointmentDate', '2024-12-02');
      formData.append('startTime', '10:00');
      formData.append('endTime', '11:00');

      const result = await rescheduleAppointment(testAppointment.id, formData);

      expect(result.success).toBe(true);

      // Verify reschedule
      const updated = await prisma.appointment.findUnique({
        where: { id: testAppointment.id },
      });

      expect(updated!.status).toBe('RESCHEDULED');
      expect(updated!.appointmentDate.toISOString().split('T')[0]).toBe('2024-12-02');
    });

    it('should detect time conflicts', async () => {
      mockAuth.currentUser = {
        user: {
          id: guruBkUser.id,
          role: 'GURU_BK',
          teacherId: guruBkTeacher.id,
        },
      };

      // Create conflicting appointment
      const conflicting = await prisma.appointment.create({
        data: {
          studentId: student.id,
          counselorId: guruBkTeacher.id,
          appointmentDate: new Date('2024-12-02'),
          startTime: new Date('1970-01-01T10:00:00'),
          endTime: new Date('1970-01-01T11:00:00'),
          status: 'APPROVED',
          reason: 'Conflicting appointment',
        },
      });

      const formData = new FormData();
      formData.append('appointmentDate', '2024-12-02');
      formData.append('startTime', '10:00');
      formData.append('endTime', '11:00');

      const result = await rescheduleAppointment(testAppointment.id, formData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('sudah ada');

      // Clean up
      await prisma.appointment.delete({ where: { id: conflicting.id } });
    });
  });

  describe('completeAppointment', () => {
    let testAppointment: any;

    beforeEach(async () => {
      testAppointment = await prisma.appointment.create({
        data: {
          studentId: student.id,
          counselorId: guruBkTeacher.id,
          appointmentDate: new Date('2024-12-01'),
          startTime: new Date('1970-01-01T09:00:00'),
          endTime: new Date('1970-01-01T10:00:00'),
          status: 'APPROVED',
          reason: 'Test appointment',
        },
      });
    });

    afterEach(async () => {
      await prisma.appointment.delete({ where: { id: testAppointment.id } }).catch(() => {});
    });

    it('should complete approved appointment', async () => {
      mockAuth.currentUser = {
        user: {
          id: guruBkUser.id,
          role: 'GURU_BK',
          teacherId: guruBkTeacher.id,
        },
      };

      const result = await completeAppointment(testAppointment.id);

      expect(result.success).toBe(true);

      // Verify status
      const updated = await prisma.appointment.findUnique({
        where: { id: testAppointment.id },
      });

      expect(updated!.status).toBe('COMPLETED');
    });

    it('should reject completing pending appointment', async () => {
      mockAuth.currentUser = {
        user: {
          id: guruBkUser.id,
          role: 'GURU_BK',
          teacherId: guruBkTeacher.id,
        },
      };

      // Update to pending
      await prisma.appointment.update({
        where: { id: testAppointment.id },
        data: { status: 'PENDING' },
      });

      const result = await completeAppointment(testAppointment.id);

      expect(result.success).toBe(false);
      expect(result.error).toContain('disetujui');
    });
  });

  describe('getAvailableSlots', () => {
    it('should return available time slots', async () => {
      mockAuth.currentUser = {
        user: {
          id: guruBkUser.id,
          role: 'GURU_BK',
          teacherId: guruBkTeacher.id,
        },
      };

      const result = await getAvailableSlots('2024-12-10');

      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data!.length).toBeGreaterThan(0);
      expect(result.data![0]).toHaveProperty('startTime');
      expect(result.data![0]).toHaveProperty('endTime');
      expect(result.data![0]).toHaveProperty('isAvailable');
    });

    it('should mark booked slots as unavailable', async () => {
      mockAuth.currentUser = {
        user: {
          id: guruBkUser.id,
          role: 'GURU_BK',
          teacherId: guruBkTeacher.id,
        },
      };

      // Create appointment
      const appointment = await prisma.appointment.create({
        data: {
          studentId: student.id,
          counselorId: guruBkTeacher.id,
          appointmentDate: new Date('2024-12-10'),
          startTime: new Date('1970-01-01T09:00:00'),
          endTime: new Date('1970-01-01T10:00:00'),
          status: 'APPROVED',
          reason: 'Test',
        },
      });

      const result = await getAvailableSlots('2024-12-10');

      expect(result.success).toBe(true);
      const slot9to10 = result.data!.find((s) => s.startTime === '09:00');
      expect(slot9to10?.isAvailable).toBe(false);

      // Clean up
      await prisma.appointment.delete({ where: { id: appointment.id } });
    });
  });
});

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import {
  createViolation,
  updateViolation,
  deleteViolation,
  getStudentViolations,
  getMyStudents,
  getStudentViolationSummary,
} from '../violations';

const prisma = new PrismaClient();

// Mock auth module
const mockAuth = {
  currentUser: null as any,
};

vi.mock('@/lib/auth/auth', () => ({
  auth: vi.fn(() => Promise.resolve(mockAuth.currentUser)),
}));

describe('Violation Management Actions', () => {
  let academicYear: any;
  let guruBk1User: any;
  let guruBk1Teacher: any;
  let guruBk2User: any;
  let guruBk2Teacher: any;
  let studentUser: any;
  let student: any;
  let classEntity: any;
  let violationType: any;
  let prestationType: any;

  beforeAll(async () => {
    // Create academic year
    academicYear = await prisma.academicYear.create({
      data: {
        name: '2024/2025 Violation Test',
        startDate: new Date('2024-07-01'),
        endDate: new Date('2025-06-30'),
        isActive: true,
      },
    });

    // Create class
    classEntity = await prisma.class.create({
      data: {
        name: '10 IPA 1 Violation Test',
        gradeLevel: 10,
        academicYearId: academicYear.id,
      },
    });

    // Create Guru BK 1
    guruBk1User = await prisma.user.create({
      data: {
        email: 'gurubkviolation1@test.com',
        username: 'gurubkviolation1',
        passwordHash: await bcrypt.hash('password123', 12),
        role: 'GURU_BK',
        fullName: 'Guru BK Violation 1',
        isActive: true,
      },
    });

    guruBk1Teacher = await prisma.teacher.create({
      data: {
        userId: guruBk1User.id,
        nip: '1111111111',
      },
    });

    // Create Guru BK 2
    guruBk2User = await prisma.user.create({
      data: {
        email: 'gurubkviolation2@test.com',
        username: 'gurubkviolation2',
        passwordHash: await bcrypt.hash('password123', 12),
        role: 'GURU_BK',
        fullName: 'Guru BK Violation 2',
        isActive: true,
      },
    });

    guruBk2Teacher = await prisma.teacher.create({
      data: {
        userId: guruBk2User.id,
        nip: '2222222222',
      },
    });

    // Create student
    studentUser = await prisma.user.create({
      data: {
        email: 'studentviolation@test.com',
        username: 'studentviolation',
        passwordHash: await bcrypt.hash('password123', 12),
        role: 'SISWA',
        fullName: 'Student Violation Test',
        isActive: true,
      },
    });

    student = await prisma.student.create({
      data: {
        userId: studentUser.id,
        nis: `NISVIOLATION${Date.now()}`,
        nisn: `NISNVIOLATION${Date.now()}`,
        classId: classEntity.id,
      },
    });

    // Assign student to Guru BK 1
    await prisma.studentCounselorAssignment.create({
      data: {
        studentId: student.id,
        counselorId: guruBk1Teacher.id,
        academicYearId: academicYear.id,
      },
    });

    // Create violation types
    violationType = await prisma.violationType.create({
      data: {
        code: 'V001',
        name: 'Terlambat',
        description: 'Datang terlambat ke sekolah',
        points: -10,
        type: 'PELANGGARAN',
        category: 'Kedisiplinan',
        isActive: true,
      },
    });

    prestationType = await prisma.violationType.create({
      data: {
        code: 'P001',
        name: 'Juara Lomba',
        description: 'Menjuarai lomba',
        points: 20,
        type: 'PRESTASI',
        category: 'Prestasi',
        isActive: true,
      },
    });
  });

  afterAll(async () => {
    // Clean up
    await prisma.auditLog.deleteMany({
      where: {
        userId: {
          in: [guruBk1User.id, guruBk2User.id],
        },
      },
    });

    await prisma.violation.deleteMany({
      where: {
        studentId: student.id,
      },
    });

    await prisma.studentCounselorAssignment.deleteMany({
      where: {
        studentId: student.id,
      },
    });

    await prisma.student.delete({ where: { id: student.id } });
    await prisma.user.delete({ where: { id: studentUser.id } });
    await prisma.teacher.delete({ where: { id: guruBk1Teacher.id } });
    await prisma.teacher.delete({ where: { id: guruBk2Teacher.id } });
    await prisma.user.delete({ where: { id: guruBk1User.id } });
    await prisma.user.delete({ where: { id: guruBk2User.id } });
    await prisma.violationType.delete({ where: { id: violationType.id } });
    await prisma.violationType.delete({ where: { id: prestationType.id } });
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

      const formData = new FormData();
      formData.append('studentId', student.id);
      formData.append('violationTypeId', violationType.id);
      formData.append('incidentDate', '2024-11-01');

      const result = await createViolation(formData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('akses');
    });

    it('should only allow access to assigned students', async () => {
      mockAuth.currentUser = {
        user: {
          id: guruBk2User.id,
          role: 'GURU_BK',
          teacherId: guruBk2Teacher.id,
        },
      };

      const formData = new FormData();
      formData.append('studentId', student.id);
      formData.append('violationTypeId', violationType.id);
      formData.append('incidentDate', '2024-11-01');

      const result = await createViolation(formData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('akses');
    });
  });

  describe('createViolation', () => {
    it('should validate required fields', async () => {
      mockAuth.currentUser = {
        user: {
          id: guruBk1User.id,
          role: 'GURU_BK',
          teacherId: guruBk1Teacher.id,
        },
      };

      const formData = new FormData();
      formData.append('studentId', '');
      formData.append('violationTypeId', '');
      formData.append('incidentDate', '');

      const result = await createViolation(formData);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('should create violation with correct points', async () => {
      mockAuth.currentUser = {
        user: {
          id: guruBk1User.id,
          role: 'GURU_BK',
          teacherId: guruBk1Teacher.id,
        },
      };

      const formData = new FormData();
      formData.append('studentId', student.id);
      formData.append('violationTypeId', violationType.id);
      formData.append('incidentDate', '2024-11-01');
      formData.append('description', 'Test violation');

      const result = await createViolation(formData);

      expect(result.success).toBe(true);
      expect(result.data?.id).toBeDefined();

      // Verify violation was created with correct points
      const violation = await prisma.violation.findUnique({
        where: { id: result.data!.id },
      });

      expect(violation).toBeDefined();
      expect(violation!.points).toBe(-10);
      expect(violation!.recordedBy).toBe(guruBk1Teacher.id);

      // Clean up
      await prisma.violation.delete({ where: { id: result.data!.id } });
    });

    it('should create prestasi with positive points', async () => {
      mockAuth.currentUser = {
        user: {
          id: guruBk1User.id,
          role: 'GURU_BK',
          teacherId: guruBk1Teacher.id,
        },
      };

      const formData = new FormData();
      formData.append('studentId', student.id);
      formData.append('violationTypeId', prestationType.id);
      formData.append('incidentDate', '2024-11-01');

      const result = await createViolation(formData);

      expect(result.success).toBe(true);

      // Verify prestasi was created with positive points
      const violation = await prisma.violation.findUnique({
        where: { id: result.data!.id },
      });

      expect(violation!.points).toBe(20);

      // Clean up
      await prisma.violation.delete({ where: { id: result.data!.id } });
    });
  });

  describe('updateViolation', () => {
    let testViolation: any;

    beforeEach(async () => {
      mockAuth.currentUser = {
        user: {
          id: guruBk1User.id,
          role: 'GURU_BK',
          teacherId: guruBk1Teacher.id,
        },
      };

      testViolation = await prisma.violation.create({
        data: {
          studentId: student.id,
          violationTypeId: violationType.id,
          recordedBy: guruBk1Teacher.id,
          incidentDate: new Date('2024-11-01'),
          points: -10,
        },
      });
    });

    afterEach(async () => {
      await prisma.violation.delete({ where: { id: testViolation.id } }).catch(() => {});
    });

    it('should update violation', async () => {
      const formData = new FormData();
      formData.append('incidentDate', '2024-11-02');
      formData.append('description', 'Updated description');

      const result = await updateViolation(testViolation.id, formData);

      expect(result.success).toBe(true);

      // Verify update
      const updated = await prisma.violation.findUnique({
        where: { id: testViolation.id },
      });

      expect(updated!.incidentDate.toISOString().split('T')[0]).toBe('2024-11-02');
      expect(updated!.description).toBe('Updated description');
    });

    it('should prevent other counselors from updating', async () => {
      mockAuth.currentUser = {
        user: {
          id: guruBk2User.id,
          role: 'GURU_BK',
          teacherId: guruBk2Teacher.id,
        },
      };

      const formData = new FormData();
      formData.append('description', 'Hacked');

      const result = await updateViolation(testViolation.id, formData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('akses');
    });
  });

  describe('deleteViolation', () => {
    let testViolation: any;

    beforeEach(async () => {
      testViolation = await prisma.violation.create({
        data: {
          studentId: student.id,
          violationTypeId: violationType.id,
          recordedBy: guruBk1Teacher.id,
          incidentDate: new Date('2024-11-01'),
          points: -10,
        },
      });
    });

    afterEach(async () => {
      await prisma.violation.delete({ where: { id: testViolation.id } }).catch(() => {});
    });

    it('should soft delete violation', async () => {
      mockAuth.currentUser = {
        user: {
          id: guruBk1User.id,
          role: 'GURU_BK',
          teacherId: guruBk1Teacher.id,
        },
      };

      const result = await deleteViolation(testViolation.id);

      expect(result.success).toBe(true);

      // Verify soft delete
      const deleted = await prisma.violation.findUnique({
        where: { id: testViolation.id },
      });

      expect(deleted!.deletedAt).not.toBeNull();
    });

    it('should prevent other counselors from deleting', async () => {
      mockAuth.currentUser = {
        user: {
          id: guruBk2User.id,
          role: 'GURU_BK',
          teacherId: guruBk2Teacher.id,
        },
      };

      const result = await deleteViolation(testViolation.id);

      expect(result.success).toBe(false);
      expect(result.error).toContain('akses');
    });
  });

  describe('getStudentViolations', () => {
    it('should return violations for assigned student', async () => {
      mockAuth.currentUser = {
        user: {
          id: guruBk1User.id,
          role: 'GURU_BK',
          teacherId: guruBk1Teacher.id,
        },
      };

      const result = await getStudentViolations(student.id);

      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should reject access to unassigned student', async () => {
      mockAuth.currentUser = {
        user: {
          id: guruBk2User.id,
          role: 'GURU_BK',
          teacherId: guruBk2Teacher.id,
        },
      };

      const result = await getStudentViolations(student.id);

      expect(result.success).toBe(false);
      expect(result.error).toContain('akses');
    });
  });

  describe('getMyStudents', () => {
    it('should return only assigned students', async () => {
      mockAuth.currentUser = {
        user: {
          id: guruBk1User.id,
          role: 'GURU_BK',
          teacherId: guruBk1Teacher.id,
        },
      };

      const result = await getMyStudents();

      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data!.some((s) => s.id === student.id)).toBe(true);
    });
  });

  describe('getStudentViolationSummary', () => {
    beforeAll(async () => {
      // Create test violations
      await prisma.violation.create({
        data: {
          studentId: student.id,
          violationTypeId: violationType.id,
          recordedBy: guruBk1Teacher.id,
          incidentDate: new Date('2024-11-01'),
          points: -10,
        },
      });

      await prisma.violation.create({
        data: {
          studentId: student.id,
          violationTypeId: prestationType.id,
          recordedBy: guruBk1Teacher.id,
          incidentDate: new Date('2024-11-02'),
          points: 20,
        },
      });
    });

    it('should calculate correct summary', async () => {
      mockAuth.currentUser = {
        user: {
          id: guruBk1User.id,
          role: 'GURU_BK',
          teacherId: guruBk1Teacher.id,
        },
      };

      const result = await getStudentViolationSummary(student.id);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.totalPoints).toBe(10); // -10 + 20
      expect(result.data!.violationCount).toBeGreaterThanOrEqual(1);
      expect(result.data!.prestationCount).toBeGreaterThanOrEqual(1);
    });
  });
});

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import {
  createPermission,
  getPermissions,
  getPermissionById,
} from '../permissions';

const prisma = new PrismaClient();

// Mock auth module
const mockAuth = {
  currentUser: null as any,
};

vi.mock('@/lib/auth/auth', () => ({
  auth: vi.fn(() => Promise.resolve(mockAuth.currentUser)),
}));

describe('Permission Management Actions', () => {
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
        name: '2024/2025 Permission Test',
        startDate: new Date('2024-07-01'),
        endDate: new Date('2025-06-30'),
        isActive: true,
      },
    });

    // Create class
    classEntity = await prisma.class.create({
      data: {
        name: '10 IPA 1 Permission Test',
        gradeLevel: 10,
        academicYearId: academicYear.id,
      },
    });

    // Create Guru BK
    guruBkUser = await prisma.user.create({
      data: {
        email: 'gurubkpermission@test.com',
        username: 'gurubkpermission',
        passwordHash: await bcrypt.hash('password123', 12),
        role: 'GURU_BK',
        fullName: 'Guru BK Permission Test',
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
        email: 'studentpermission@test.com',
        username: 'studentpermission',
        passwordHash: await bcrypt.hash('password123', 12),
        role: 'SISWA',
        fullName: 'Student Permission Test',
        isActive: true,
      },
    });

    student = await prisma.student.create({
      data: {
        userId: studentUser.id,
        nis: `NISPERM${Date.now()}`,
        nisn: `NISNPERM${Date.now()}`,
        classId: classEntity.id,
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

    await prisma.permission.deleteMany({
      where: {
        issuedBy: guruBkTeacher.id,
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

      const formData = new FormData();
      formData.append('studentId', student.id);
      formData.append('permissionType', 'KELUAR');
      formData.append('reason', 'Test');
      formData.append('permissionDate', '2024-11-01');
      formData.append('startTime', '10:00');

      const result = await createPermission(formData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('akses');
    });
  });

  describe('createPermission', () => {
    it('should validate required fields', async () => {
      mockAuth.currentUser = {
        user: {
          id: guruBkUser.id,
          role: 'GURU_BK',
          teacherId: guruBkTeacher.id,
          name: 'Guru BK Permission Test',
        },
      };

      const formData = new FormData();
      formData.append('studentId', '');
      formData.append('permissionType', '');
      formData.append('reason', '');
      formData.append('permissionDate', '');
      formData.append('startTime', '');

      const result = await createPermission(formData);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('should create KELUAR permission with print data', async () => {
      mockAuth.currentUser = {
        user: {
          id: guruBkUser.id,
          role: 'GURU_BK',
          teacherId: guruBkTeacher.id,
          name: 'Guru BK Permission Test',
        },
      };

      const formData = new FormData();
      formData.append('studentId', student.id);
      formData.append('permissionType', 'KELUAR');
      formData.append('reason', 'Keperluan keluarga');
      formData.append('permissionDate', '2024-11-01');
      formData.append('startTime', '10:00');
      formData.append('endTime', '12:00');
      formData.append('destination', 'Rumah');

      const result = await createPermission(formData);

      expect(result.success).toBe(true);
      expect(result.data?.id).toBeDefined();
      expect(result.data?.printData).toBeDefined();
      expect(result.data?.printData.permissionNumber).toMatch(/^PRM\/\d{4}\/\d{2}\/\d{4}$/);
      expect(result.data?.printData.studentName).toBe('Student Permission Test');
      expect(result.data?.printData.permissionType).toBe('Izin Keluar');

      // Clean up
      await prisma.permission.delete({ where: { id: result.data!.id } });
    });

    it('should create MASUK permission', async () => {
      mockAuth.currentUser = {
        user: {
          id: guruBkUser.id,
          role: 'GURU_BK',
          teacherId: guruBkTeacher.id,
          name: 'Guru BK Permission Test',
        },
      };

      const formData = new FormData();
      formData.append('studentId', student.id);
      formData.append('permissionType', 'MASUK');
      formData.append('reason', 'Terlambat karena macet');
      formData.append('permissionDate', '2024-11-01');
      formData.append('startTime', '08:30');

      const result = await createPermission(formData);

      expect(result.success).toBe(true);
      expect(result.data?.printData.permissionType).toBe('Izin Masuk');

      // Clean up
      await prisma.permission.delete({ where: { id: result.data!.id } });
    });

    it('should reject invalid permission type', async () => {
      mockAuth.currentUser = {
        user: {
          id: guruBkUser.id,
          role: 'GURU_BK',
          teacherId: guruBkTeacher.id,
          name: 'Guru BK Permission Test',
        },
      };

      const formData = new FormData();
      formData.append('studentId', student.id);
      formData.append('permissionType', 'INVALID');
      formData.append('reason', 'Test');
      formData.append('permissionDate', '2024-11-01');
      formData.append('startTime', '10:00');

      const result = await createPermission(formData);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('should reject non-existent student', async () => {
      mockAuth.currentUser = {
        user: {
          id: guruBkUser.id,
          role: 'GURU_BK',
          teacherId: guruBkTeacher.id,
          name: 'Guru BK Permission Test',
        },
      };

      const formData = new FormData();
      formData.append('studentId', 'non-existent-id');
      formData.append('permissionType', 'KELUAR');
      formData.append('reason', 'Test');
      formData.append('permissionDate', '2024-11-01');
      formData.append('startTime', '10:00');

      const result = await createPermission(formData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('tidak ditemukan');
    });
  });

  describe('getPermissions', () => {
    let testPermission: any;

    beforeAll(async () => {
      testPermission = await prisma.permission.create({
        data: {
          studentId: student.id,
          issuedBy: guruBkTeacher.id,
          permissionType: 'KELUAR',
          reason: 'Test permission',
          permissionDate: new Date('2024-11-01'),
          startTime: new Date('1970-01-01T10:00:00'),
          endTime: new Date('1970-01-01T12:00:00'),
        },
      });
    });

    afterAll(async () => {
      await prisma.permission.delete({ where: { id: testPermission.id } }).catch(() => {});
    });

    it('should return all permissions', async () => {
      mockAuth.currentUser = {
        user: {
          id: guruBkUser.id,
          role: 'GURU_BK',
          teacherId: guruBkTeacher.id,
          name: 'Guru BK Permission Test',
        },
      };

      const result = await getPermissions();

      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data!.length).toBeGreaterThan(0);
    });

    it('should filter by student', async () => {
      mockAuth.currentUser = {
        user: {
          id: guruBkUser.id,
          role: 'GURU_BK',
          teacherId: guruBkTeacher.id,
          name: 'Guru BK Permission Test',
        },
      };

      const result = await getPermissions({ studentId: student.id });

      expect(result.success).toBe(true);
      expect(result.data!.every((p) => p.studentId === student.id)).toBe(true);
    });

    it('should filter by permission type', async () => {
      mockAuth.currentUser = {
        user: {
          id: guruBkUser.id,
          role: 'GURU_BK',
          teacherId: guruBkTeacher.id,
          name: 'Guru BK Permission Test',
        },
      };

      const result = await getPermissions({ permissionType: 'KELUAR' });

      expect(result.success).toBe(true);
      expect(result.data!.every((p) => p.permissionType === 'KELUAR')).toBe(true);
    });
  });

  describe('getPermissionById', () => {
    let testPermission: any;

    beforeAll(async () => {
      testPermission = await prisma.permission.create({
        data: {
          studentId: student.id,
          issuedBy: guruBkTeacher.id,
          permissionType: 'MASUK',
          reason: 'Test permission by ID',
          permissionDate: new Date('2024-11-01'),
          startTime: new Date('1970-01-01T08:30:00'),
        },
      });
    });

    afterAll(async () => {
      await prisma.permission.delete({ where: { id: testPermission.id } }).catch(() => {});
    });

    it('should return permission with relations', async () => {
      mockAuth.currentUser = {
        user: {
          id: guruBkUser.id,
          role: 'GURU_BK',
          teacherId: guruBkTeacher.id,
          name: 'Guru BK Permission Test',
        },
      };

      const result = await getPermissionById(testPermission.id);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.id).toBe(testPermission.id);
      expect(result.data!.student).toBeDefined();
      expect(result.data!.issuer).toBeDefined();
    });

    it('should return error for non-existent permission', async () => {
      mockAuth.currentUser = {
        user: {
          id: guruBkUser.id,
          role: 'GURU_BK',
          teacherId: guruBkTeacher.id,
          name: 'Guru BK Permission Test',
        },
      };

      const result = await getPermissionById('non-existent-id');

      expect(result.success).toBe(false);
      expect(result.error).toContain('tidak ditemukan');
    });
  });
});

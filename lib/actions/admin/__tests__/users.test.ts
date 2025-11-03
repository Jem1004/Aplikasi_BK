import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import {
  createUser,
  updateUser,
  deleteUser,
  getUsers,
  getUserById,
} from '../users';

const prisma = new PrismaClient();

// Mock auth module
const mockAuth = {
  currentUser: null as any,
};

vi.mock('@/lib/auth/auth', () => ({
  auth: vi.fn(() => Promise.resolve(mockAuth.currentUser)),
}));

// Mock rate limiting
vi.mock('@/lib/rate-limit', () => ({
  loginRateLimiter: {},
  userCreationRateLimiter: {},
  getClientIp: vi.fn(() => '127.0.0.1'),
  checkRateLimit: vi.fn(() => Promise.resolve({ success: true })),
}));

// Mock headers
vi.mock('next/headers', () => ({
  headers: vi.fn(() => Promise.resolve(new Map())),
}));

describe('User Management Actions', () => {
  let adminUser: any;
  let guruBkUser: any;
  let testClass: any;
  let academicYear: any;

  beforeAll(async () => {
    // Create academic year
    academicYear = await prisma.academicYear.create({
      data: {
        name: '2024/2025 User Test',
        startDate: new Date('2024-07-01'),
        endDate: new Date('2025-06-30'),
        isActive: true,
      },
    });

    // Create test class
    testClass = await prisma.class.create({
      data: {
        name: '10 IPA 1 User Test',
        gradeLevel: 10,
        academicYearId: academicYear.id,
      },
    });

    // Create admin user
    adminUser = await prisma.user.create({
      data: {
        email: 'adminuser@test.com',
        username: 'adminusertest',
        passwordHash: await bcrypt.hash('password123', 12),
        role: 'ADMIN',
        fullName: 'Admin User Test',
        isActive: true,
      },
    });

    // Create Guru BK user
    guruBkUser = await prisma.user.create({
      data: {
        email: 'gurubkuser@test.com',
        username: 'gurubkusertest',
        passwordHash: await bcrypt.hash('password123', 12),
        role: 'GURU_BK',
        fullName: 'Guru BK User Test',
        isActive: true,
      },
    });

    await prisma.teacher.create({
      data: {
        userId: guruBkUser.id,
        nip: '1234567890',
      },
    });
  });

  afterAll(async () => {
    // Clean up
    await prisma.auditLog.deleteMany({
      where: {
        userId: {
          in: [adminUser.id, guruBkUser.id],
        },
      },
    });

    await prisma.teacher.deleteMany({
      where: {
        userId: {
          in: [guruBkUser.id],
        },
      },
    });

    await prisma.user.deleteMany({
      where: {
        id: {
          in: [adminUser.id, guruBkUser.id],
        },
      },
    });

    await prisma.class.delete({ where: { id: testClass.id } });
    await prisma.academicYear.delete({ where: { id: academicYear.id } });

    await prisma.$disconnect();
  });

  beforeEach(() => {
    mockAuth.currentUser = null;
    vi.clearAllMocks();
  });

  describe('Authorization', () => {
    it('should require authentication', async () => {
      const formData = new FormData();
      formData.append('email', 'test@test.com');
      formData.append('username', 'testuser');
      formData.append('password', 'password123');
      formData.append('fullName', 'Test User');
      formData.append('role', 'SISWA');

      const result = await createUser(formData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('login');
    });

    it('should require ADMIN role', async () => {
      mockAuth.currentUser = {
        user: {
          id: guruBkUser.id,
          role: 'GURU_BK',
        },
      };

      const formData = new FormData();
      formData.append('email', 'test@test.com');
      formData.append('username', 'testuser');
      formData.append('password', 'password123');
      formData.append('fullName', 'Test User');
      formData.append('role', 'SISWA');

      const result = await createUser(formData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('akses');
    });
  });

  describe('createUser', () => {
    it('should validate required fields', async () => {
      mockAuth.currentUser = {
        user: {
          id: adminUser.id,
          role: 'ADMIN',
        },
      };

      const formData = new FormData();
      formData.append('email', '');
      formData.append('username', '');
      formData.append('password', '');
      formData.append('fullName', '');
      formData.append('role', '');

      const result = await createUser(formData);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('should create a SISWA user with student record', async () => {
      mockAuth.currentUser = {
        user: {
          id: adminUser.id,
          role: 'ADMIN',
        },
      };

      const formData = new FormData();
      formData.append('email', `siswatest${Date.now()}@test.com`);
      formData.append('username', `siswatest${Date.now()}`);
      formData.append('password', 'password123');
      formData.append('fullName', 'Siswa Test');
      formData.append('role', 'SISWA');
      formData.append('nis', `NIS${Date.now()}`);
      formData.append('classId', testClass.id);

      const result = await createUser(formData);

      expect(result.success).toBe(true);
      expect(result.data?.userId).toBeDefined();

      // Verify student record was created
      const student = await prisma.student.findUnique({
        where: { userId: result.data!.userId },
      });

      expect(student).toBeDefined();
      expect(student!.classId).toBe(testClass.id);

      // Clean up
      await prisma.student.delete({ where: { id: student!.id } });
      await prisma.user.delete({ where: { id: result.data!.userId } });
    });

    it('should create a GURU_BK user with teacher record', async () => {
      mockAuth.currentUser = {
        user: {
          id: adminUser.id,
          role: 'ADMIN',
        },
      };

      const formData = new FormData();
      formData.append('email', `gurubktest${Date.now()}@test.com`);
      formData.append('username', `gurubktest${Date.now()}`);
      formData.append('password', 'password123');
      formData.append('fullName', 'Guru BK Test');
      formData.append('role', 'GURU_BK');
      formData.append('nip', `NIP${Date.now()}`);

      const result = await createUser(formData);

      expect(result.success).toBe(true);
      expect(result.data?.userId).toBeDefined();

      // Verify teacher record was created
      const teacher = await prisma.teacher.findUnique({
        where: { userId: result.data!.userId },
      });

      expect(teacher).toBeDefined();

      // Clean up
      await prisma.teacher.delete({ where: { id: teacher!.id } });
      await prisma.user.delete({ where: { id: result.data!.userId } });
    });

    it('should reject duplicate email', async () => {
      mockAuth.currentUser = {
        user: {
          id: adminUser.id,
          role: 'ADMIN',
        },
      };

      const formData = new FormData();
      formData.append('email', adminUser.email);
      formData.append('username', 'uniqueusername');
      formData.append('password', 'password123');
      formData.append('fullName', 'Test User');
      formData.append('role', 'ADMIN');

      const result = await createUser(formData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('sudah');
    });
  });

  describe('updateUser', () => {
    let testUser: any;

    beforeEach(async () => {
      testUser = await prisma.user.create({
        data: {
          email: `updatetest${Date.now()}@test.com`,
          username: `updatetest${Date.now()}`,
          passwordHash: await bcrypt.hash('password123', 12),
          role: 'ADMIN',
          fullName: 'Update Test User',
          isActive: true,
        },
      });
    });

    afterEach(async () => {
      await prisma.user.delete({ where: { id: testUser.id } }).catch(() => {});
    });

    it('should update user information', async () => {
      mockAuth.currentUser = {
        user: {
          id: adminUser.id,
          role: 'ADMIN',
        },
      };

      const formData = new FormData();
      formData.append('fullName', 'Updated Name');
      formData.append('email', testUser.email);
      formData.append('username', testUser.username);
      formData.append('isActive', 'false');

      const result = await updateUser(testUser.id, formData);

      expect(result.success).toBe(true);

      // Verify update
      const updatedUser = await prisma.user.findUnique({
        where: { id: testUser.id },
      });

      expect(updatedUser!.fullName).toBe('Updated Name');
      expect(updatedUser!.isActive).toBe(false);
    });

    it('should reject update for non-existent user', async () => {
      mockAuth.currentUser = {
        user: {
          id: adminUser.id,
          role: 'ADMIN',
        },
      };

      const formData = new FormData();
      formData.append('fullName', 'Updated Name');

      const result = await updateUser('non-existent-id', formData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('tidak ditemukan');
    });
  });

  describe('deleteUser', () => {
    let testUser: any;

    beforeEach(async () => {
      testUser = await prisma.user.create({
        data: {
          email: `deletetest${Date.now()}@test.com`,
          username: `deletetest${Date.now()}`,
          passwordHash: await bcrypt.hash('password123', 12),
          role: 'ADMIN',
          fullName: 'Delete Test User',
          isActive: true,
        },
      });
    });

    afterEach(async () => {
      await prisma.user.delete({ where: { id: testUser.id } }).catch(() => {});
    });

    it('should soft delete user', async () => {
      mockAuth.currentUser = {
        user: {
          id: adminUser.id,
          role: 'ADMIN',
        },
      };

      const result = await deleteUser(testUser.id);

      expect(result.success).toBe(true);

      // Verify soft delete
      const deletedUser = await prisma.user.findUnique({
        where: { id: testUser.id },
      });

      expect(deletedUser!.deletedAt).not.toBeNull();
      expect(deletedUser!.isActive).toBe(false);
    });

    it('should prevent deleting own account', async () => {
      mockAuth.currentUser = {
        user: {
          id: adminUser.id,
          role: 'ADMIN',
        },
      };

      const result = await deleteUser(adminUser.id);

      expect(result.success).toBe(false);
      expect(result.error).toContain('sendiri');
    });
  });

  describe('getUsers', () => {
    it('should return all active users', async () => {
      mockAuth.currentUser = {
        user: {
          id: adminUser.id,
          role: 'ADMIN',
        },
      };

      const result = await getUsers();

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should filter users by role', async () => {
      mockAuth.currentUser = {
        user: {
          id: adminUser.id,
          role: 'ADMIN',
        },
      };

      const result = await getUsers({ role: 'GURU_BK' });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.every((user) => user.role === 'GURU_BK')).toBe(true);
    });
  });

  describe('getUserById', () => {
    it('should return user with relations', async () => {
      mockAuth.currentUser = {
        user: {
          id: adminUser.id,
          role: 'ADMIN',
        },
      };

      const result = await getUserById(guruBkUser.id);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.id).toBe(guruBkUser.id);
      expect(result.data!.teacher).toBeDefined();
    });

    it('should return error for non-existent user', async () => {
      mockAuth.currentUser = {
        user: {
          id: adminUser.id,
          role: 'ADMIN',
        },
      };

      const result = await getUserById('non-existent-id');

      expect(result.success).toBe(false);
      expect(result.error).toContain('tidak ditemukan');
    });
  });
});

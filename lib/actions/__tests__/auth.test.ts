import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { signIn, changePassword } from '../auth';

const prisma = new PrismaClient();

// Mock auth module
const mockAuth = {
  currentUser: null as any,
};

// Mock the auth function
vi.mock('@/lib/auth/auth', () => ({
  auth: vi.fn(() => Promise.resolve(mockAuth.currentUser)),
  signIn: vi.fn(),
  signOut: vi.fn(),
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

describe('Authentication Actions', () => {
  let testUser: any;

  beforeAll(async () => {
    // Create test user
    testUser = await prisma.user.create({
      data: {
        email: 'authtest@test.com',
        username: 'authtest',
        passwordHash: await bcrypt.hash('password123', 12),
        role: 'ADMIN',
        fullName: 'Auth Test User',
        isActive: true,
      },
    });
  });

  afterAll(async () => {
    // Clean up
    await prisma.user.delete({ where: { id: testUser.id } }).catch(() => {});
    await prisma.$disconnect();
  });

  beforeEach(() => {
    mockAuth.currentUser = null;
    vi.clearAllMocks();
  });

  describe('signIn', () => {
    it('should validate required fields', async () => {
      const formData = new FormData();
      formData.append('identifier', '');
      formData.append('password', '');

      const result = await signIn(formData);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('should reject invalid credentials', async () => {
      const formData = new FormData();
      formData.append('identifier', 'nonexistent@test.com');
      formData.append('password', 'wrongpassword');

      const result = await signIn(formData);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('changePassword', () => {
    it('should require authentication', async () => {
      const formData = new FormData();
      formData.append('currentPassword', 'password123');
      formData.append('newPassword', 'newpassword123');
      formData.append('confirmPassword', 'newpassword123');

      const result = await changePassword(formData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('login');
    });

    it('should validate password fields', async () => {
      mockAuth.currentUser = {
        user: {
          id: testUser.id,
          role: 'ADMIN',
        },
      };

      const formData = new FormData();
      formData.append('currentPassword', '');
      formData.append('newPassword', 'short');
      formData.append('confirmPassword', 'different');

      const result = await changePassword(formData);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('should reject incorrect current password', async () => {
      mockAuth.currentUser = {
        user: {
          id: testUser.id,
          role: 'ADMIN',
        },
      };

      const formData = new FormData();
      formData.append('currentPassword', 'wrongpassword');
      formData.append('newPassword', 'newpassword123');
      formData.append('confirmPassword', 'newpassword123');

      const result = await changePassword(formData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('salah');
    });

    it('should successfully change password with correct credentials', async () => {
      mockAuth.currentUser = {
        user: {
          id: testUser.id,
          role: 'ADMIN',
        },
      };

      const formData = new FormData();
      formData.append('currentPassword', 'password123');
      formData.append('newPassword', 'newpassword123');
      formData.append('confirmPassword', 'newpassword123');

      const result = await changePassword(formData);

      expect(result.success).toBe(true);

      // Verify password was changed
      const updatedUser = await prisma.user.findUnique({
        where: { id: testUser.id },
      });

      const isNewPasswordValid = await bcrypt.compare(
        'newpassword123',
        updatedUser!.passwordHash
      );
      expect(isNewPasswordValid).toBe(true);

      // Reset password for other tests
      await prisma.user.update({
        where: { id: testUser.id },
        data: { passwordHash: await bcrypt.hash('password123', 12) },
      });
    });
  });
});

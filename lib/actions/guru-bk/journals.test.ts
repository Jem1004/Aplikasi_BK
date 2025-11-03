import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import {
  createCounselingJournal,
  updateCounselingJournal,
  deleteCounselingJournal,
  getMyCounselingJournals,
  getCounselingJournalById,
} from './journals';
import { decrypt } from '@/lib/encryption/crypto';

const prisma = new PrismaClient();

// Mock auth module
const mockAuth = {
  currentUser: null as any,
};

// Mock the auth function
vi.mock('@/lib/auth/auth', () => ({
  auth: vi.fn(() => Promise.resolve(mockAuth.currentUser)),
}));

describe('Counseling Journal Security Tests', () => {
  let academicYear: any;
  let guruBk1User: any;
  let guruBk1Teacher: any;
  let guruBk2User: any;
  let guruBk2Teacher: any;
  let adminUser: any;
  let studentUser: any;
  let student: any;
  let classEntity: any;

  beforeAll(async () => {
    // Create test data
    academicYear = await prisma.academicYear.create({
      data: {
        name: '2024/2025 Test',
        startDate: new Date('2024-07-01'),
        endDate: new Date('2025-06-30'),
        isActive: true,
      },
    });

    // Create Guru BK 1
    guruBk1User = await prisma.user.create({
      data: {
        email: 'gurubk1@test.com',
        username: 'gurubk1test',
        passwordHash: await bcrypt.hash('password123', 12),
        role: 'GURU_BK',
        fullName: 'Guru BK 1 Test',
        isActive: true,
      },
    });

    guruBk1Teacher = await prisma.teacher.create({
      data: {
        userId: guruBk1User.id,
        nip: '1111111111',
        specialization: 'Bimbingan Konseling',
      },
    });

    // Create Guru BK 2
    guruBk2User = await prisma.user.create({
      data: {
        email: 'gurubk2@test.com',
        username: 'gurubk2test',
        passwordHash: await bcrypt.hash('password123', 12),
        role: 'GURU_BK',
        fullName: 'Guru BK 2 Test',
        isActive: true,
      },
    });

    guruBk2Teacher = await prisma.teacher.create({
      data: {
        userId: guruBk2User.id,
        nip: '2222222222',
        specialization: 'Bimbingan Konseling',
      },
    });

    // Create Admin
    adminUser = await prisma.user.create({
      data: {
        email: 'admin@test.com',
        username: 'admintest',
        passwordHash: await bcrypt.hash('password123', 12),
        role: 'ADMIN',
        fullName: 'Admin Test',
        isActive: true,
      },
    });

    // Create Class
    classEntity = await prisma.class.create({
      data: {
        name: '10 IPA 1 Test',
        gradeLevel: 10,
        academicYearId: academicYear.id,
      },
    });

    // Create Student
    studentUser = await prisma.user.create({
      data: {
        email: 'student@test.com',
        username: 'studenttest',
        passwordHash: await bcrypt.hash('password123', 12),
        role: 'SISWA',
        fullName: 'Student Test',
        isActive: true,
      },
    });

    student = await prisma.student.create({
      data: {
        userId: studentUser.id,
        nis: '2024TEST001',
        nisn: `TEST${Date.now()}`,
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
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.auditLog.deleteMany({
      where: {
        userId: {
          in: [guruBk1User.id, guruBk2User.id, adminUser.id],
        },
      },
    });

    await prisma.counselingJournal.deleteMany({
      where: {
        counselorId: {
          in: [guruBk1Teacher.id, guruBk2Teacher.id],
        },
      },
    });

    await prisma.studentCounselorAssignment.deleteMany({
      where: {
        studentId: student.id,
      },
    });

    await prisma.student.delete({ where: { id: student.id } });
    await prisma.user.delete({ where: { id: studentUser.id } });
    await prisma.class.delete({ where: { id: classEntity.id } });
    await prisma.teacher.delete({ where: { id: guruBk1Teacher.id } });
    await prisma.teacher.delete({ where: { id: guruBk2Teacher.id } });
    await prisma.user.delete({ where: { id: guruBk1User.id } });
    await prisma.user.delete({ where: { id: guruBk2User.id } });
    await prisma.user.delete({ where: { id: adminUser.id } });
    await prisma.academicYear.delete({ where: { id: academicYear.id } });

    await prisma.$disconnect();
  });

  beforeEach(() => {
    // Reset mock auth before each test
    mockAuth.currentUser = null;
  });

  describe('Encryption/Decryption Flow', () => {
    it('should encrypt journal content when creating', async () => {
      // Set auth as Guru BK 1
      mockAuth.currentUser = {
        user: {
          id: guruBk1User.id,
          role: 'GURU_BK',
          teacherId: guruBk1Teacher.id,
        },
      };

      const formData = new FormData();
      formData.append('studentId', student.id);
      formData.append('sessionDate', '2024-11-01');
      formData.append('content', 'This is a sensitive counseling note that should be encrypted');

      const result = await createCounselingJournal(formData);

      expect(result.success).toBe(true);
      expect(result.data?.id).toBeDefined();

      // Verify data is encrypted in database
      const journal = await prisma.counselingJournal.findUnique({
        where: { id: result.data!.id },
      });

      expect(journal).toBeDefined();
      expect(journal!.encryptedContent).toBeDefined();
      expect(journal!.encryptionIv).toBeDefined();
      expect(journal!.encryptionTag).toBeDefined();
      expect(journal!.encryptedContent).not.toBe('This is a sensitive counseling note that should be encrypted');

      // Verify we can decrypt it
      const decrypted = decrypt(
        journal!.encryptedContent,
        journal!.encryptionIv,
        journal!.encryptionTag
      );
      expect(decrypted).toBe('This is a sensitive counseling note that should be encrypted');

      // Clean up
      await prisma.counselingJournal.delete({ where: { id: result.data!.id } });
    });

    it('should re-encrypt journal content when updating', async () => {
      // Set auth as Guru BK 1
      mockAuth.currentUser = {
        user: {
          id: guruBk1User.id,
          role: 'GURU_BK',
          teacherId: guruBk1Teacher.id,
        },
      };

      // Create journal
      const createFormData = new FormData();
      createFormData.append('studentId', student.id);
      createFormData.append('sessionDate', '2024-11-01');
      createFormData.append('content', 'Original content');

      const createResult = await createCounselingJournal(createFormData);
      expect(createResult.success).toBe(true);

      const journalId = createResult.data!.id;
      const originalJournal = await prisma.counselingJournal.findUnique({
        where: { id: journalId },
      });

      // Update journal
      const updateFormData = new FormData();
      updateFormData.append('studentId', student.id);
      updateFormData.append('sessionDate', '2024-11-02');
      updateFormData.append('content', 'Updated content');

      const updateResult = await updateCounselingJournal(journalId, updateFormData);
      expect(updateResult.success).toBe(true);

      // Verify new encryption
      const updatedJournal = await prisma.counselingJournal.findUnique({
        where: { id: journalId },
      });

      expect(updatedJournal!.encryptedContent).not.toBe(originalJournal!.encryptedContent);
      expect(updatedJournal!.encryptionIv).not.toBe(originalJournal!.encryptionIv);

      // Verify decryption works
      const decrypted = decrypt(
        updatedJournal!.encryptedContent,
        updatedJournal!.encryptionIv,
        updatedJournal!.encryptionTag
      );
      expect(decrypted).toBe('Updated content');

      // Clean up
      await prisma.counselingJournal.delete({ where: { id: journalId } });
    });
  });

  describe('Ownership Verification', () => {
    it('should allow creator to access their own journal', async () => {
      // Set auth as Guru BK 1
      mockAuth.currentUser = {
        user: {
          id: guruBk1User.id,
          role: 'GURU_BK',
          teacherId: guruBk1Teacher.id,
        },
      };

      // Create journal
      const formData = new FormData();
      formData.append('studentId', student.id);
      formData.append('sessionDate', '2024-11-01');
      formData.append('content', 'Test content');

      const createResult = await createCounselingJournal(formData);
      expect(createResult.success).toBe(true);

      const journalId = createResult.data!.id;

      // Try to access as creator
      const getResult = await getCounselingJournalById(journalId);
      expect(getResult.success).toBe(true);
      expect(getResult.data?.content).toBe('Test content');

      // Clean up
      await prisma.counselingJournal.delete({ where: { id: journalId } });
    });

    it('should prevent other Guru BK from accessing journal', async () => {
      // Create journal as Guru BK 1
      mockAuth.currentUser = {
        user: {
          id: guruBk1User.id,
          role: 'GURU_BK',
          teacherId: guruBk1Teacher.id,
        },
      };

      const formData = new FormData();
      formData.append('studentId', student.id);
      formData.append('sessionDate', '2024-11-01');
      formData.append('content', 'Private content');

      const createResult = await createCounselingJournal(formData);
      expect(createResult.success).toBe(true);

      const journalId = createResult.data!.id;

      // Try to access as Guru BK 2
      mockAuth.currentUser = {
        user: {
          id: guruBk2User.id,
          role: 'GURU_BK',
          teacherId: guruBk2Teacher.id,
        },
      };

      const getResult = await getCounselingJournalById(journalId);
      expect(getResult.success).toBe(false);
      expect(getResult.error).toBe('Anda tidak memiliki izin untuk melakukan aksi ini');

      // Verify audit log was created for unauthorized access attempt
      const auditLog = await prisma.auditLog.findFirst({
        where: {
          userId: guruBk2User.id,
          action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
          entityType: 'CounselingJournal',
          entityId: journalId,
        },
      });
      expect(auditLog).toBeDefined();

      // Clean up
      mockAuth.currentUser = {
        user: {
          id: guruBk1User.id,
          role: 'GURU_BK',
          teacherId: guruBk1Teacher.id,
        },
      };
      await prisma.counselingJournal.delete({ where: { id: journalId } });
    });

    it('should prevent other Guru BK from updating journal', async () => {
      // Create journal as Guru BK 1
      mockAuth.currentUser = {
        user: {
          id: guruBk1User.id,
          role: 'GURU_BK',
          teacherId: guruBk1Teacher.id,
        },
      };

      const formData = new FormData();
      formData.append('studentId', student.id);
      formData.append('sessionDate', '2024-11-01');
      formData.append('content', 'Original content');

      const createResult = await createCounselingJournal(formData);
      expect(createResult.success).toBe(true);

      const journalId = createResult.data!.id;

      // Try to update as Guru BK 2
      mockAuth.currentUser = {
        user: {
          id: guruBk2User.id,
          role: 'GURU_BK',
          teacherId: guruBk2Teacher.id,
        },
      };

      const updateFormData = new FormData();
      updateFormData.append('studentId', student.id);
      updateFormData.append('sessionDate', '2024-11-02');
      updateFormData.append('content', 'Hacked content');

      const updateResult = await updateCounselingJournal(journalId, updateFormData);
      expect(updateResult.success).toBe(false);
      expect(updateResult.error).toBe('Anda tidak memiliki izin untuk melakukan aksi ini');

      // Verify content was not changed
      const journal = await prisma.counselingJournal.findUnique({
        where: { id: journalId },
      });
      const decrypted = decrypt(
        journal!.encryptedContent,
        journal!.encryptionIv,
        journal!.encryptionTag
      );
      expect(decrypted).toBe('Original content');

      // Clean up
      mockAuth.currentUser = {
        user: {
          id: guruBk1User.id,
          role: 'GURU_BK',
          teacherId: guruBk1Teacher.id,
        },
      };
      await prisma.counselingJournal.delete({ where: { id: journalId } });
    });

    it('should prevent other Guru BK from deleting journal', async () => {
      // Create journal as Guru BK 1
      mockAuth.currentUser = {
        user: {
          id: guruBk1User.id,
          role: 'GURU_BK',
          teacherId: guruBk1Teacher.id,
        },
      };

      const formData = new FormData();
      formData.append('studentId', student.id);
      formData.append('sessionDate', '2024-11-01');
      formData.append('content', 'Content to protect');

      const createResult = await createCounselingJournal(formData);
      expect(createResult.success).toBe(true);

      const journalId = createResult.data!.id;

      // Try to delete as Guru BK 2
      mockAuth.currentUser = {
        user: {
          id: guruBk2User.id,
          role: 'GURU_BK',
          teacherId: guruBk2Teacher.id,
        },
      };

      const deleteResult = await deleteCounselingJournal(journalId);
      expect(deleteResult.success).toBe(false);
      expect(deleteResult.error).toBe('Anda tidak memiliki izin untuk melakukan aksi ini');

      // Verify journal still exists
      const journal = await prisma.counselingJournal.findUnique({
        where: { id: journalId },
      });
      expect(journal).toBeDefined();
      expect(journal!.deletedAt).toBeNull();

      // Clean up
      mockAuth.currentUser = {
        user: {
          id: guruBk1User.id,
          role: 'GURU_BK',
          teacherId: guruBk1Teacher.id,
        },
      };
      await prisma.counselingJournal.delete({ where: { id: journalId } });
    });
  });

  describe('Unauthorized Access Prevention (Including ADMIN)', () => {
    it('should prevent ADMIN from accessing journals', async () => {
      // Create journal as Guru BK 1
      mockAuth.currentUser = {
        user: {
          id: guruBk1User.id,
          role: 'GURU_BK',
          teacherId: guruBk1Teacher.id,
        },
      };

      const formData = new FormData();
      formData.append('studentId', student.id);
      formData.append('sessionDate', '2024-11-01');
      formData.append('content', 'Confidential counseling notes');

      const createResult = await createCounselingJournal(formData);
      expect(createResult.success).toBe(true);

      const journalId = createResult.data!.id;

      // Try to access as ADMIN
      mockAuth.currentUser = {
        user: {
          id: adminUser.id,
          role: 'ADMIN',
          teacherId: null,
        },
      };

      const getResult = await getCounselingJournalById(journalId);
      expect(getResult.success).toBe(false);
      expect(getResult.error).toBe('Anda tidak memiliki akses ke halaman ini');

      // Clean up
      mockAuth.currentUser = {
        user: {
          id: guruBk1User.id,
          role: 'GURU_BK',
          teacherId: guruBk1Teacher.id,
        },
      };
      await prisma.counselingJournal.delete({ where: { id: journalId } });
    });

    it('should prevent ADMIN from listing journals', async () => {
      // Try to list journals as ADMIN
      mockAuth.currentUser = {
        user: {
          id: adminUser.id,
          role: 'ADMIN',
          teacherId: null,
        },
      };

      const result = await getMyCounselingJournals();
      expect(result.success).toBe(false);
      expect(result.error).toBe('Anda tidak memiliki akses ke halaman ini');
    });

    it('should prevent non-GURU_BK roles from creating journals', async () => {
      // Try to create as ADMIN
      mockAuth.currentUser = {
        user: {
          id: adminUser.id,
          role: 'ADMIN',
          teacherId: null,
        },
      };

      const formData = new FormData();
      formData.append('studentId', student.id);
      formData.append('sessionDate', '2024-11-01');
      formData.append('content', 'Unauthorized content');

      const result = await createCounselingJournal(formData);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Anda tidak memiliki akses ke halaman ini');
    });
  });

  describe('Audit Logging', () => {
    it('should log journal creation', async () => {
      mockAuth.currentUser = {
        user: {
          id: guruBk1User.id,
          role: 'GURU_BK',
          teacherId: guruBk1Teacher.id,
        },
      };

      const formData = new FormData();
      formData.append('studentId', student.id);
      formData.append('sessionDate', '2024-11-01');
      formData.append('content', 'Test content for audit');

      const result = await createCounselingJournal(formData);
      expect(result.success).toBe(true);

      const journalId = result.data!.id;

      // Check audit log
      const auditLog = await prisma.auditLog.findFirst({
        where: {
          userId: guruBk1User.id,
          action: 'CREATE',
          entityType: 'CounselingJournal',
          entityId: journalId,
        },
      });

      expect(auditLog).toBeDefined();
      expect(auditLog!.newValues).toBeDefined();

      // Clean up
      await prisma.counselingJournal.delete({ where: { id: journalId } });
    });

    it('should log journal access', async () => {
      mockAuth.currentUser = {
        user: {
          id: guruBk1User.id,
          role: 'GURU_BK',
          teacherId: guruBk1Teacher.id,
        },
      };

      // Create journal
      const formData = new FormData();
      formData.append('studentId', student.id);
      formData.append('sessionDate', '2024-11-01');
      formData.append('content', 'Test content');

      const createResult = await createCounselingJournal(formData);
      const journalId = createResult.data!.id;

      // Access journal
      await getCounselingJournalById(journalId);

      // Check audit log
      const auditLog = await prisma.auditLog.findFirst({
        where: {
          userId: guruBk1User.id,
          action: 'READ',
          entityType: 'CounselingJournal',
          entityId: journalId,
        },
      });

      expect(auditLog).toBeDefined();

      // Clean up
      await prisma.counselingJournal.delete({ where: { id: journalId } });
    });

    it('should log journal updates', async () => {
      mockAuth.currentUser = {
        user: {
          id: guruBk1User.id,
          role: 'GURU_BK',
          teacherId: guruBk1Teacher.id,
        },
      };

      // Create journal
      const createFormData = new FormData();
      createFormData.append('studentId', student.id);
      createFormData.append('sessionDate', '2024-11-01');
      createFormData.append('content', 'Original');

      const createResult = await createCounselingJournal(createFormData);
      const journalId = createResult.data!.id;

      // Update journal
      const updateFormData = new FormData();
      updateFormData.append('studentId', student.id);
      updateFormData.append('sessionDate', '2024-11-02');
      updateFormData.append('content', 'Updated');

      await updateCounselingJournal(journalId, updateFormData);

      // Check audit log
      const auditLog = await prisma.auditLog.findFirst({
        where: {
          userId: guruBk1User.id,
          action: 'UPDATE',
          entityType: 'CounselingJournal',
          entityId: journalId,
        },
      });

      expect(auditLog).toBeDefined();
      expect(auditLog!.oldValues).toBeDefined();
      expect(auditLog!.newValues).toBeDefined();

      // Clean up
      await prisma.counselingJournal.delete({ where: { id: journalId } });
    });

    it('should log journal deletion', async () => {
      mockAuth.currentUser = {
        user: {
          id: guruBk1User.id,
          role: 'GURU_BK',
          teacherId: guruBk1Teacher.id,
        },
      };

      // Create journal
      const formData = new FormData();
      formData.append('studentId', student.id);
      formData.append('sessionDate', '2024-11-01');
      formData.append('content', 'To be deleted');

      const createResult = await createCounselingJournal(formData);
      const journalId = createResult.data!.id;

      // Delete journal
      await deleteCounselingJournal(journalId);

      // Check audit log
      const auditLog = await prisma.auditLog.findFirst({
        where: {
          userId: guruBk1User.id,
          action: 'DELETE',
          entityType: 'CounselingJournal',
          entityId: journalId,
        },
      });

      expect(auditLog).toBeDefined();
      expect(auditLog!.oldValues).toBeDefined();

      // Clean up
      await prisma.counselingJournal.delete({ where: { id: journalId } });
    });
  });
});

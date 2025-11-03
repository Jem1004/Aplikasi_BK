'use server';

import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';
import { hash } from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { logError } from '@/lib/errors/error-logger';
import { createAuditLog, AUDIT_ACTIONS, ENTITY_TYPES } from '@/lib/audit/audit-logger';
import type { ActionResponse } from '@/types';

/**
 * Get default password based on user role
 */
function getDefaultPassword(role: string): string {
  const defaultPasswords: Record<string, string> = {
    ADMIN: 'admin123',
    GURU_BK: 'gurubk123',
    WALI_KELAS: 'walikelas123',
    SISWA: 'siswa123',
  };
  
  return defaultPasswords[role] || 'default123';
}

/**
 * Admin action to reset user password to default
 * Sets mustChangePassword flag to true
 */
export async function resetUserPassword(
  userId: string
): Promise<ActionResponse<{ newPassword: string }>> {
  try {
    const session = await auth();

    // Check authentication and authorization
    if (!session?.user?.id) {
      return {
        success: false,
        error: 'Unauthorized',
      };
    }

    if (session.user.role !== 'ADMIN') {
      return {
        success: false,
        error: 'Only admin can reset passwords',
      };
    }

    // Get target user
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        fullName: true,
      },
    });

    if (!targetUser) {
      return {
        success: false,
        error: 'User not found',
      };
    }

    // Prevent admin from resetting their own password this way
    if (targetUser.id === session.user.id) {
      return {
        success: false,
        error: 'Cannot reset your own password. Use change password instead.',
      };
    }

    // Get default password for role
    const defaultPassword = getDefaultPassword(targetUser.role);
    const hashedPassword = await hash(defaultPassword, 12);

    // Update user password and set mustChangePassword flag
    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: hashedPassword,
        mustChangePassword: true,
      },
    });

    // Create audit log
    await createAuditLog({
      userId: session.user.id,
      action: AUDIT_ACTIONS.USER_PASSWORD_RESET,
      entityType: ENTITY_TYPES.USER,
      entityId: userId,
      newValues: {
        targetUserId: userId,
        targetUserEmail: targetUser.email,
        resetBy: session.user.email,
      },
    });

    revalidatePath('/admin/users');

    return {
      success: true,
      data: { newPassword: defaultPassword },
    };
  } catch (error) {
    logError(error, { action: 'resetUserPassword', userId });
    return {
      success: false,
      error: 'Failed to reset password',
    };
  }
}

/**
 * Admin action to set custom password for user
 * Sets mustChangePassword flag to false (admin set intentional password)
 */
export async function setUserPassword(
  userId: string,
  newPassword: string
): Promise<ActionResponse> {
  try {
    const session = await auth();

    // Check authentication and authorization
    if (!session?.user?.id) {
      return {
        success: false,
        error: 'Unauthorized',
      };
    }

    if (session.user.role !== 'ADMIN') {
      return {
        success: false,
        error: 'Only admin can set passwords',
      };
    }

    // Validate password
    if (!newPassword || newPassword.length < 8) {
      return {
        success: false,
        error: 'Password must be at least 8 characters',
      };
    }

    // Get target user
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
      },
    });

    if (!targetUser) {
      return {
        success: false,
        error: 'User not found',
      };
    }

    // Hash new password
    const hashedPassword = await hash(newPassword, 12);

    // Update user password (don't force change for custom password)
    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: hashedPassword,
        mustChangePassword: false,
      },
    });

    // Create audit log
    await createAuditLog({
      userId: session.user.id,
      action: AUDIT_ACTIONS.USER_PASSWORD_CHANGED,
      entityType: ENTITY_TYPES.USER,
      entityId: userId,
      newValues: {
        targetUserId: userId,
        targetUserEmail: targetUser.email,
        changedBy: session.user.email,
        customPassword: true,
      },
    });

    revalidatePath('/admin/users');

    return {
      success: true,
    };
  } catch (error) {
    logError(error, { action: 'setUserPassword', userId });
    return {
      success: false,
      error: 'Failed to set password',
    };
  }
}

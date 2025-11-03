'use server';

import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';
import type { ActionResponse } from '@/types';
import type { SchoolInfo } from '@prisma/client';
import {
  logAuditEvent,
  AUDIT_ACTIONS,
  ENTITY_TYPES,
  sanitizeForAudit,
} from '@/lib/audit/audit-logger';
import {
  schoolInfoSchema,
  type SchoolInfoFormData,
} from '@/lib/validations/school-info';
import {
  createSuccessResponse,
  createErrorResponse,
  createValidationErrorResponse,
  ERROR_MESSAGES,
  logError,
  mapZodErrorsToFields,
  mapErrorToMessage,
} from '@/lib/errors';
import {
  validateFile,
  deleteFile,
  replaceFile,
} from '@/lib/utils/file-upload';

/**
 * Check if user is admin
 */
async function checkAdminAuth<T = void>() {
  const session = await auth();

  if (!session || !session.user) {
    return {
      success: false as const,
      error: createErrorResponse<T>(ERROR_MESSAGES.UNAUTHORIZED),
    };
  }

  if (session.user.role !== 'ADMIN') {
    return {
      success: false as const,
      error: createErrorResponse<T>(ERROR_MESSAGES.PERMISSION_DENIED),
    };
  }

  return { success: true as const, session };
}

/**
 * Get school info (single record)
 * Requirements: 1.1, 1.2, 1.5
 */
export async function getSchoolInfo(): Promise<ActionResponse<SchoolInfo | null>> {
  try {
    // Check authorization
    const authCheck = await checkAdminAuth<SchoolInfo | null>();
    if (!authCheck.success) {
      return authCheck.error;
    }

    // Fetch school info (should only be one record)
    const schoolInfo = await prisma.schoolInfo.findFirst();

    return createSuccessResponse(schoolInfo);
  } catch (error) {
    logError(error, { action: 'getSchoolInfo', resource: 'school_info' });
    return createErrorResponse(mapErrorToMessage(error));
  }
}

/**
 * Create or update school info
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 7.1, 7.2, 7.4, 7.5
 */
export async function upsertSchoolInfo(
  data: SchoolInfoFormData
): Promise<ActionResponse<SchoolInfo>> {
  try {
    // Check authorization
    const authCheck = await checkAdminAuth<SchoolInfo>();
    if (!authCheck.success) {
      return authCheck.error;
    }

    const { session } = authCheck;

    // Validate input
    const validatedFields = schoolInfoSchema.safeParse(data);

    if (!validatedFields.success) {
      return createValidationErrorResponse(
        mapZodErrorsToFields(validatedFields.error)
      );
    }

    const validatedData = validatedFields.data;

    // Check if school info already exists
    const existingSchoolInfo = await prisma.schoolInfo.findFirst();

    let result: SchoolInfo;
    let isUpdate = false;

    if (existingSchoolInfo) {
      // Update existing school info
      isUpdate = true;
      result = await prisma.schoolInfo.update({
        where: { id: existingSchoolInfo.id },
        data: {
          name: validatedData.name,
          address: validatedData.address,
          phone: validatedData.phone,
          email: validatedData.email,
          website: validatedData.website || null,
          principalName: validatedData.principalName,
          principalNip: validatedData.principalNip,
        },
      });

      // Log audit event for update
      await logAuditEvent({
        userId: session.user.id,
        action: AUDIT_ACTIONS.SCHOOL_INFO_UPDATED,
        entityType: ENTITY_TYPES.SCHOOL_INFO,
        entityId: result.id,
        oldValues: sanitizeForAudit({
          name: existingSchoolInfo.name,
          address: existingSchoolInfo.address,
          phone: existingSchoolInfo.phone,
          email: existingSchoolInfo.email,
          website: existingSchoolInfo.website,
          principalName: existingSchoolInfo.principalName,
          principalNip: existingSchoolInfo.principalNip,
        }),
        newValues: sanitizeForAudit({
          name: result.name,
          address: result.address,
          phone: result.phone,
          email: result.email,
          website: result.website,
          principalName: result.principalName,
          principalNip: result.principalNip,
        }),
      });
    } else {
      // Create new school info
      result = await prisma.schoolInfo.create({
        data: {
          name: validatedData.name,
          address: validatedData.address,
          phone: validatedData.phone,
          email: validatedData.email,
          website: validatedData.website || null,
          principalName: validatedData.principalName,
          principalNip: validatedData.principalNip,
        },
      });

      // Log audit event for create
      await logAuditEvent({
        userId: session.user.id,
        action: AUDIT_ACTIONS.SCHOOL_INFO_CREATED,
        entityType: ENTITY_TYPES.SCHOOL_INFO,
        entityId: result.id,
        newValues: sanitizeForAudit({
          name: result.name,
          address: result.address,
          phone: result.phone,
          email: result.email,
          website: result.website,
          principalName: result.principalName,
          principalNip: result.principalNip,
        }),
      });
    }

    return createSuccessResponse(result);
  } catch (error) {
    logError(error, { action: 'upsertSchoolInfo', resource: 'school_info' });
    return createErrorResponse(mapErrorToMessage(error));
  }
}

/**
 * Upload school logo
 * Requirements: 3.3, 3.4, 3.5, 7.3, 7.4, 7.5
 */
export async function uploadSchoolLogo(
  formData: FormData
): Promise<ActionResponse<{ logoPath: string }>> {
  try {
    // Check authorization
    const authCheck = await checkAdminAuth<{ logoPath: string }>();
    if (!authCheck.success) {
      return authCheck.error;
    }

    const { session } = authCheck;

    // Get file from form data
    const file = formData.get('logo') as File;

    if (!file) {
      return createErrorResponse('File logo tidak ditemukan');
    }

    // Validate file using utility function
    const validation = validateFile(file);
    if (!validation.valid) {
      return createErrorResponse(validation.error!);
    }

    // Get school info
    const schoolInfo = await prisma.schoolInfo.findFirst();

    if (!schoolInfo) {
      return createErrorResponse(
        'Informasi sekolah belum dibuat. Silakan buat terlebih dahulu.'
      );
    }

    // Save file and replace old logo if exists
    const { publicPath: logoPath } = await replaceFile(
      file,
      schoolInfo.logoPath,
      'uploads/school',
      'school-logo'
    );

    // Update school info with new logo path
    await prisma.schoolInfo.update({
      where: { id: schoolInfo.id },
      data: { logoPath },
    });

    // Log audit event
    await logAuditEvent({
      userId: session.user.id,
      action: AUDIT_ACTIONS.SCHOOL_LOGO_UPLOADED,
      entityType: ENTITY_TYPES.SCHOOL_INFO,
      entityId: schoolInfo.id,
      oldValues: { logoPath: schoolInfo.logoPath },
      newValues: { logoPath },
    });

    return createSuccessResponse({ logoPath });
  } catch (error) {
    logError(error, { action: 'uploadSchoolLogo', resource: 'school_info' });
    return createErrorResponse(mapErrorToMessage(error));
  }
}

/**
 * Delete school logo
 * Requirements: 3.4, 7.3, 7.4, 7.5
 */
export async function deleteSchoolLogo(): Promise<ActionResponse<void>> {
  try {
    // Check authorization
    const authCheck = await checkAdminAuth<void>();
    if (!authCheck.success) {
      return authCheck.error;
    }

    const { session } = authCheck;

    // Get school info
    const schoolInfo = await prisma.schoolInfo.findFirst();

    if (!schoolInfo) {
      return createErrorResponse('Informasi sekolah tidak ditemukan');
    }

    if (!schoolInfo.logoPath) {
      return createErrorResponse('Logo sekolah tidak ada');
    }

    // Delete logo file using utility function
    const deleted = await deleteFile(schoolInfo.logoPath);
    if (!deleted) {
      return createErrorResponse('Gagal menghapus file logo');
    }

    // Update school info to remove logo path
    await prisma.schoolInfo.update({
      where: { id: schoolInfo.id },
      data: { logoPath: null },
    });

    // Log audit event
    await logAuditEvent({
      userId: session.user.id,
      action: AUDIT_ACTIONS.SCHOOL_LOGO_DELETED,
      entityType: ENTITY_TYPES.SCHOOL_INFO,
      entityId: schoolInfo.id,
      oldValues: { logoPath: schoolInfo.logoPath },
      newValues: { logoPath: null },
    });

    return createSuccessResponse(undefined);
  } catch (error) {
    logError(error, { action: 'deleteSchoolLogo', resource: 'school_info' });
    return createErrorResponse(mapErrorToMessage(error));
  }
}

# Error Handling Migration Guide

This guide explains how to update existing server actions to use the new error handling utilities.

## Overview

The new error handling system provides:
- Centralized error messages
- Consistent error logging
- Type-safe error responses
- Prisma error handling
- Zod validation error mapping

## Key Utilities

### 1. Error Response Creators

```typescript
import {
  createSuccessResponse,
  createErrorResponse,
  createValidationErrorResponse,
} from '@/lib/errors';

// Success response
return createSuccessResponse({ userId: '123' });

// Error response
return createErrorResponse<{ userId: string }>(ERROR_MESSAGES.NOT_FOUND);

// Validation error response
return createValidationErrorResponse<{ userId: string }>(fieldErrors);
```

### 2. Error Messages

```typescript
import { ERROR_MESSAGES } from '@/lib/errors';

// Use predefined messages
return createErrorResponse(ERROR_MESSAGES.UNAUTHORIZED);
return createErrorResponse(ERROR_MESSAGES.NOT_FOUND);
return createErrorResponse(ERROR_MESSAGES.PERMISSION_DENIED);
```

### 3. Error Logging

```typescript
import { logError } from '@/lib/errors';

try {
  // ... action logic
} catch (error) {
  logError(error, {
    action: 'createUser',
    userId: session.user.id,
    resource: 'user',
  });
  return createErrorResponse(mapErrorToMessage(error));
}
```

### 4. Validation Error Mapping

```typescript
import { mapZodErrorsToFields } from '@/lib/errors';

const validatedFields = schema.safeParse(data);

if (!validatedFields.success) {
  return createValidationErrorResponse(
    mapZodErrorsToFields(validatedFields.error)
  );
}
```

### 5. Prisma Error Handling

```typescript
import {
  handlePrismaError,
  isPrismaUniqueConstraintError,
  isPrismaNotFoundError,
} from '@/lib/errors';

try {
  // ... prisma operations
} catch (error) {
  if (isPrismaUniqueConstraintError(error)) {
    return createErrorResponse(ERROR_MESSAGES.DUPLICATE_ENTRY);
  }
  
  if (isPrismaNotFoundError(error)) {
    return createErrorResponse(ERROR_MESSAGES.NOT_FOUND);
  }
  
  return createErrorResponse(handlePrismaError(error));
}
```

## Migration Pattern

### Before:

```typescript
export async function createUser(formData: FormData): Promise<ActionResponse<{ userId: string }>> {
  try {
    const session = await auth();
    
    if (!session || !session.user) {
      return {
        success: false,
        error: 'Anda harus login terlebih dahulu',
      };
    }

    if (session.user.role !== 'ADMIN') {
      return {
        success: false,
        error: 'Anda tidak memiliki akses',
      };
    }

    const validatedFields = schema.safeParse(data);

    if (!validatedFields.success) {
      return {
        success: false,
        errors: validatedFields.error.flatten().fieldErrors,
      };
    }

    // ... business logic

    return {
      success: true,
      data: { userId: result.id },
    };
  } catch (error) {
    console.error('Create user error:', error);
    return {
      success: false,
      error: 'Terjadi kesalahan. Silakan coba lagi',
    };
  }
}
```

### After:

```typescript
import {
  createSuccessResponse,
  createErrorResponse,
  createValidationErrorResponse,
  ERROR_MESSAGES,
  logError,
  mapZodErrorsToFields,
  mapErrorToMessage,
  isPrismaUniqueConstraintError,
} from '@/lib/errors';
import { createUserSchema } from '@/lib/validations';

export async function createUser(formData: FormData): Promise<ActionResponse<{ userId: string }>> {
  try {
    const session = await auth();
    
    if (!session || !session.user) {
      return createErrorResponse<{ userId: string }>(ERROR_MESSAGES.UNAUTHORIZED);
    }

    if (session.user.role !== 'ADMIN') {
      return createErrorResponse<{ userId: string }>(ERROR_MESSAGES.PERMISSION_DENIED);
    }

    const validatedFields = createUserSchema.safeParse(data);

    if (!validatedFields.success) {
      return createValidationErrorResponse<{ userId: string }>(
        mapZodErrorsToFields(validatedFields.error)
      );
    }

    // ... business logic

    return createSuccessResponse({ userId: result.id });
  } catch (error) {
    logError(error, {
      action: 'createUser',
      userId: session?.user?.id,
      resource: 'user',
    });
    
    if (isPrismaUniqueConstraintError(error)) {
      return createErrorResponse<{ userId: string }>(ERROR_MESSAGES.DUPLICATE_ENTRY);
    }
    
    return createErrorResponse<{ userId: string }>(mapErrorToMessage(error));
  }
}
```

## Using Action Wrappers (Optional)

For simpler code, you can use the action wrappers:

```typescript
import { withAuth } from '@/lib/errors/action-wrapper';

export async function createUser(formData: FormData): Promise<ActionResponse<{ userId: string }>> {
  return withAuth(
    async (session) => {
      // Validation
      const validatedFields = createUserSchema.safeParse(data);
      if (!validatedFields.success) {
        return createValidationErrorResponse(
          mapZodErrorsToFields(validatedFields.error)
        );
      }

      // Business logic
      const result = await prisma.user.create({ ... });

      return createSuccessResponse({ userId: result.id });
    },
    {
      requiredRole: 'ADMIN',
      actionName: 'createUser',
    }
  );
}
```

## Checklist for Migration

For each server action file:

- [ ] Import error handling utilities
- [ ] Import validation schemas from `@/lib/validations`
- [ ] Replace inline validation schemas with imported ones
- [ ] Replace manual error responses with `createErrorResponse`
- [ ] Replace success responses with `createSuccessResponse`
- [ ] Replace validation error responses with `createValidationErrorResponse`
- [ ] Use `ERROR_MESSAGES` constants instead of hardcoded strings
- [ ] Add `logError` calls in catch blocks
- [ ] Use Prisma error helpers for database errors
- [ ] Use `mapZodErrorsToFields` for validation errors
- [ ] Use `mapErrorToMessage` for generic error mapping

## Files to Update

### Priority 1 (Critical):
- [x] `lib/actions/auth.ts` - Authentication actions
- [ ] `lib/actions/admin/users.ts` - User management (partially done)
- [ ] `lib/actions/guru-bk/journals.ts` - Counseling journals (security critical)

### Priority 2 (High):
- [ ] `lib/actions/admin/master-data.ts` - Master data management
- [ ] `lib/actions/admin/mappings.ts` - Relationship mappings
- [ ] `lib/actions/guru-bk/violations.ts` - Violation management
- [ ] `lib/actions/guru-bk/permissions.ts` - Permission management
- [ ] `lib/actions/guru-bk/appointments.ts` - Appointment management

### Priority 3 (Medium):
- [ ] `lib/actions/wali-kelas/students.ts` - Wali Kelas actions
- [ ] `lib/actions/siswa/profile.ts` - Student profile actions
- [ ] `lib/actions/siswa/appointments.ts` - Student appointment actions

## Testing After Migration

After updating each file:

1. Check for TypeScript errors: `npm run build`
2. Run tests: `npm test`
3. Test the functionality manually in the UI
4. Verify error messages are user-friendly
5. Check that errors are logged properly

## Notes

- Always use the generic type parameter for error responses: `createErrorResponse<T>`
- Log errors with context for better debugging
- Use predefined ERROR_MESSAGES when possible
- Sanitize error messages before showing to users
- Never expose sensitive information in error messages

# Client-Side Error Handling Guide

This guide explains how to handle errors and display feedback in client components.

## Available Components and Utilities

### 1. Toast Notifications

Use toast notifications for success/error feedback after actions.

```typescript
import { showSuccessToast, showErrorToast, handleActionResponse } from '@/lib/client/error-display';

// Show success toast
showSuccessToast('Data berhasil disimpan');

// Show error toast
showErrorToast('Gagal menyimpan data', 'Silakan coba lagi');

// Handle action response automatically
const response = await createUser(formData);
handleActionResponse(response, {
  successMessage: 'User berhasil dibuat',
  errorMessage: 'Gagal membuat user',
  onSuccess: (data) => {
    router.push(`/admin/users/${data.userId}`);
  },
});
```

### 2. Form Error Display

Display validation errors in forms.

```typescript
import { FormError } from '@/components/shared/FormError';
import { getFieldErrors, hasFieldErrors } from '@/lib/client/error-display';

function MyForm() {
  const [response, setResponse] = useState<ActionResponse<any>>();

  const handleSubmit = async (formData: FormData) => {
    const result = await myAction(formData);
    setResponse(result);
    
    if (result.success) {
      // Handle success
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Display general error or field errors */}
      <FormError error={response?.error} errors={response?.errors} />
      
      {/* Form fields */}
      <input name="email" />
      
      {/* Display field-specific error */}
      {response?.errors?.email && (
        <p className="text-sm text-destructive">{response.errors.email[0]}</p>
      )}
      
      <button type="submit">Submit</button>
    </form>
  );
}
```

### 3. Loading States

Show loading indicators during async operations.

```typescript
import { LoadingButton } from '@/components/shared/LoadingButton';
import { LoadingSpinner, LoadingPage } from '@/components/shared/LoadingSpinner';

function MyForm() {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true);
    try {
      const result = await myAction(formData);
      // Handle result
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      
      {/* Loading button */}
      <LoadingButton loading={isLoading} loadingText="Menyimpan...">
        Simpan
      </LoadingButton>
    </form>
  );
}

// Loading spinner in content
function MyComponent() {
  const [isLoading, setIsLoading] = useState(true);

  if (isLoading) {
    return <LoadingSpinner text="Memuat data..." />;
  }

  return <div>Content</div>;
}

// Full page loading
function MyPage() {
  const [isLoading, setIsLoading] = useState(true);

  if (isLoading) {
    return <LoadingPage text="Memuat halaman..." />;
  }

  return <div>Page content</div>;
}
```

### 4. Error Boundary

Wrap components with ErrorBoundary to catch runtime errors.

```typescript
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';

// In layout or page
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      {children}
    </ErrorBoundary>
  );
}

// With custom fallback
<ErrorBoundary fallback={<div>Custom error message</div>}>
  <MyComponent />
</ErrorBoundary>
```

## Complete Form Example

Here's a complete example of a form with proper error handling:

```typescript
'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { createUserSchema, type CreateUserInput } from '@/lib/validations';
import { createUser } from '@/lib/actions/admin/users';
import { handleActionResponse } from '@/lib/client/error-display';
import { LoadingButton } from '@/components/shared/LoadingButton';
import { FormError } from '@/components/shared/FormError';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import type { ActionResponse } from '@/types';

export function UserForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [response, setResponse] = useState<ActionResponse<{ userId: string }>>();

  const form = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      email: '',
      username: '',
      password: '',
      fullName: '',
      role: 'SISWA',
    },
  });

  const onSubmit = (data: CreateUserInput) => {
    startTransition(async () => {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value.toString());
        }
      });

      const result = await createUser(formData);
      setResponse(result);

      handleActionResponse(result, {
        successMessage: 'User berhasil dibuat',
        onSuccess: (data) => {
          router.push(`/admin/users/${data?.userId}`);
        },
      });
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Display server errors */}
        <FormError error={response?.error} errors={response?.errors} />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="user@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="username" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nama Lengkap</FormLabel>
              <FormControl>
                <Input placeholder="Nama Lengkap" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <LoadingButton
          type="submit"
          loading={isPending}
          loadingText="Menyimpan..."
          className="w-full"
        >
          Simpan
        </LoadingButton>
      </form>
    </Form>
  );
}
```

## Best Practices

### 1. Always Show Loading States

```typescript
// ✅ Good
const [isLoading, setIsLoading] = useState(false);

const handleAction = async () => {
  setIsLoading(true);
  try {
    await myAction();
  } finally {
    setIsLoading(false);
  }
};

// ❌ Bad - No loading state
const handleAction = async () => {
  await myAction();
};
```

### 2. Use useTransition for Server Actions

```typescript
// ✅ Good - Using useTransition
const [isPending, startTransition] = useTransition();

const handleSubmit = (data: FormData) => {
  startTransition(async () => {
    const result = await myAction(data);
    // Handle result
  });
};

// ❌ Bad - Not using useTransition
const handleSubmit = async (data: FormData) => {
  const result = await myAction(data);
};
```

### 3. Display Field-Level Errors

```typescript
// ✅ Good - Show field-specific errors
<FormField
  control={form.control}
  name="email"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Email</FormLabel>
      <FormControl>
        <Input {...field} />
      </FormControl>
      <FormMessage /> {/* Shows field error */}
    </FormItem>
  )}
/>

// ❌ Bad - Only showing general error
<Input name="email" />
{error && <p>{error}</p>}
```

### 4. Provide User Feedback

```typescript
// ✅ Good - Clear feedback
handleActionResponse(result, {
  successMessage: 'Data berhasil disimpan',
  errorMessage: 'Gagal menyimpan data',
  onSuccess: () => router.push('/success'),
});

// ❌ Bad - No feedback
await myAction(data);
router.push('/success');
```

### 5. Handle Errors Gracefully

```typescript
// ✅ Good - Proper error handling
try {
  const result = await myAction(data);
  if (result.success) {
    showSuccessToast('Berhasil');
  } else {
    showErrorToast(result.error || 'Terjadi kesalahan');
  }
} catch (error) {
  showErrorToast('Terjadi kesalahan yang tidak terduga');
  console.error(error);
}

// ❌ Bad - No error handling
const result = await myAction(data);
showSuccessToast('Berhasil');
```

## Common Patterns

### Pattern 1: Form with Server Action

```typescript
function MyForm() {
  const [isPending, startTransition] = useTransition();
  const [response, setResponse] = useState<ActionResponse<any>>();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    startTransition(async () => {
      const result = await myAction(formData);
      setResponse(result);
      
      if (result.success) {
        showSuccessToast('Berhasil');
        e.currentTarget.reset();
      }
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <FormError error={response?.error} errors={response?.errors} />
      {/* Form fields */}
      <LoadingButton loading={isPending}>Submit</LoadingButton>
    </form>
  );
}
```

### Pattern 2: Data Fetching with Loading

```typescript
function MyComponent() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>();

  useEffect(() => {
    async function fetchData() {
      try {
        const result = await getData();
        if (result.success) {
          setData(result.data);
        } else {
          setError(result.error);
        }
      } catch (err) {
        setError('Gagal memuat data');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchData();
  }, []);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <FormError error={error} />;
  if (!data) return <div>Tidak ada data</div>;

  return <div>{/* Render data */}</div>;
}
```

### Pattern 3: Delete Confirmation

```typescript
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

function DeleteButton({ id }: { id: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteItem(id);
      
      handleActionResponse(result, {
        successMessage: 'Data berhasil dihapus',
        onSuccess: () => {
          setIsOpen(false);
          router.refresh();
        },
      });
    });
  };

  return (
    <>
      <Button variant="destructive" onClick={() => setIsOpen(true)}>
        Hapus
      </Button>
      
      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus data ini? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isPending}>
              {isPending ? 'Menghapus...' : 'Hapus'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
```

## Testing Error Handling

When testing components with error handling:

1. Test loading states are shown
2. Test success messages are displayed
3. Test error messages are displayed
4. Test field-level validation errors
5. Test error boundary catches errors
6. Test form resets after success
7. Test disabled states during loading

## Checklist

- [ ] All forms show loading states
- [ ] All forms display validation errors
- [ ] All forms show success/error toasts
- [ ] All async operations have error handling
- [ ] Error boundaries wrap critical components
- [ ] Loading spinners shown during data fetching
- [ ] Buttons disabled during pending operations
- [ ] User feedback provided for all actions

import dynamicImport from 'next/dynamic';
import { getDeletedUsers } from '@/lib/actions/admin/users';
import { redirect } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Trash2, Users } from 'lucide-react';

export const dynamic = 'force-dynamic';

const DeletedUsersTable = dynamicImport(
  () => import('@/components/admin/DeletedUsersTable').then(mod => ({ default: mod.DeletedUsersTable })),
  {
    loading: () => (
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Skeleton className="h-6 w-6" />
            <Skeleton className="h-8 w-48" />
          </div>
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    )
  }
);

// Cache deleted users for 30 seconds
export const revalidate = 30;

export default async function DeletedUsersPage() {
  const result = await getDeletedUsers();

  if (!result.success) {
    redirect('/unauthorized');
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Trash2 className="h-8 w-8 text-red-600" />
            Sampah Pengguna
          </h1>
          <p className="text-muted-foreground mt-2">
            Kelola pengguna yang telah dinonaktifkan
          </p>
        </div>
      </div>

      <DeletedUsersTable users={result.data || []} />
    </div>
  );
}
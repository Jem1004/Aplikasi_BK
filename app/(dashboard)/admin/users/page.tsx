import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { getUsers } from '@/lib/actions/admin/users';
import Link from 'next/link';
import { UserPlus, Upload } from 'lucide-react';
import { redirect } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

const UserManagementTable = dynamic(
  () => import('@/components/admin/UserManagementTable').then(mod => ({ default: mod.UserManagementTable })),
  {
    loading: () => (
      <Card>
        <CardContent className="p-6 space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    )
  }
);

// Cache user list for 30 seconds
// Users change more frequently than master data, so shorter cache
export const revalidate = 30;

export default async function UsersPage() {
  const result = await getUsers();

  if (!result.success) {
    redirect('/unauthorized');
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Manajemen Pengguna</h1>
          <p className="text-muted-foreground mt-2">
            Kelola akun pengguna sistem
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Link href="/admin/users/import" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full sm:w-auto min-h-[44px]">
              <Upload className="mr-2 h-4 w-4" />
              Import Siswa
            </Button>
          </Link>
          <Link href="/admin/users/new" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto min-h-[44px]">
              <UserPlus className="mr-2 h-4 w-4" />
              Tambah Pengguna
            </Button>
          </Link>
        </div>
      </div>

      <UserManagementTable users={result.data || []} />
    </div>
  );
}

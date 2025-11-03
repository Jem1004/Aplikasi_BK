import { Button } from '@/components/ui/button';
import { UserManagementTable } from '@/components/admin/UserManagementTable';
import { getUsers } from '@/lib/actions/admin/users';
import Link from 'next/link';
import { UserPlus } from 'lucide-react';
import { redirect } from 'next/navigation';

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
        <Link href="/admin/users/new" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto min-h-[44px]">
            <UserPlus className="mr-2 h-4 w-4" />
            Tambah Pengguna
          </Button>
        </Link>
      </div>

      <UserManagementTable users={result.data || []} />
    </div>
  );
}

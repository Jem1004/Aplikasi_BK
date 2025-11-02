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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manajemen Pengguna</h1>
          <p className="text-muted-foreground mt-2">
            Kelola akun pengguna sistem
          </p>
        </div>
        <Link href="/admin/users/new">
          <Button>
            <UserPlus className="mr-2 h-4 w-4" />
            Tambah Pengguna
          </Button>
        </Link>
      </div>

      <UserManagementTable users={result.data || []} />
    </div>
  );
}

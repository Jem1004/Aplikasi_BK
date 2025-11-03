import { Suspense } from 'react';
import { getSchoolInfo } from '@/lib/actions/admin/school-info';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { PermissionList } from '@/components/guru-bk/PermissionList';

// Force dynamic rendering because we use auth headers
export const dynamic = 'force-dynamic';

// Cache permissions list for 1 minute (60 seconds)
// Permissions are created frequently, shorter cache
export const revalidate = 60;

export default async function PermissionsPage() {
  // Check if school info exists
  const schoolInfoResult = await getSchoolInfo();
  const schoolInfoMissing = !schoolInfoResult.success || !schoolInfoResult.data;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manajemen Izin</h1>
          <p className="text-muted-foreground mt-2">
            Kelola izin masuk dan keluar siswa
          </p>
        </div>
        <Link href="/guru-bk/permissions/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Buat Izin Baru
          </Button>
        </Link>
      </div>

      <Suspense fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }>
        <PermissionList schoolInfoMissing={schoolInfoMissing} />
      </Suspense>
    </div>
  );
}

import { getMyPermissions } from '@/lib/actions/siswa/profile';
import { MyPermissionList } from '@/components/siswa/MyPermissionList';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

// Cache permissions for 1 minute (60 seconds)
// Permissions are created frequently
export const revalidate = 60;

export default async function MyPermissionsPage() {
  const result = await getMyPermissions();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Riwayat Izin</h1>
        <p className="text-muted-foreground mt-2">
          Lihat riwayat izin masuk dan keluar Anda
        </p>
      </div>

      {!result.success ? (
        <Card>
          <CardContent className="py-8">
            <div className="flex flex-col items-center justify-center text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {result.error || 'Terjadi kesalahan saat memuat data'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <MyPermissionList permissions={result.data || []} />
      )}
    </div>
  );
}

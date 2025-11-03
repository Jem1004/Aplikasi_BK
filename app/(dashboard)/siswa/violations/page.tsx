import { getMyViolations } from '@/lib/actions/siswa/profile';
import { MyViolationList } from '@/components/siswa/MyViolationList';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

// Cache violations for 1 minute (60 seconds)
// Violations are updated frequently
export const revalidate = 60;

export default async function MyViolationsPage() {
  const result = await getMyViolations();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Riwayat Pelanggaran & Prestasi</h1>
        <p className="text-muted-foreground mt-2">
          Lihat riwayat pelanggaran dan prestasi Anda
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
        <MyViolationList violations={result.data || []} />
      )}
    </div>
  );
}

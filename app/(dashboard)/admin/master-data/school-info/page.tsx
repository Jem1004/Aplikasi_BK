import { Suspense } from 'react';
import Link from 'next/link';
import { ChevronRight, Building2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { SchoolInfoForm } from '@/components/admin/SchoolInfoForm';
import { getSchoolInfo } from '@/lib/actions/admin/school-info';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

export const dynamic = 'force-dynamic';

// Cache school info data for 5 minutes (300 seconds)
// School info changes infrequently, so longer cache is appropriate
export const revalidate = 300;

export default async function SchoolInfoPage() {
  const result = await getSchoolInfo();
  const schoolInfo = result.success ? result.data : null;

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
        <Link href="/admin" className="hover:text-foreground transition-colors">
          Admin
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link href="/admin/master-data" className="hover:text-foreground transition-colors">
          Data Master
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground font-medium">Informasi Sekolah</span>
      </nav>

      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
          <Building2 className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Informasi Sekolah</h1>
          <p className="text-muted-foreground">
            Kelola informasi sekolah yang akan ditampilkan di dokumen sistem
          </p>
        </div>
      </div>

      {/* School Info Form */}
      <Suspense
        fallback={
          <Card>
            <CardContent className="py-10">
              <LoadingSpinner />
            </CardContent>
          </Card>
        }
      >
        <SchoolInfoForm initialData={schoolInfo} />
      </Suspense>
    </div>
  );
}

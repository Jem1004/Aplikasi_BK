import dynamic from 'next/dynamic';
import { getAcademicYears } from '@/lib/actions/admin/master-data';
import { Skeleton } from '@/components/ui/skeleton';

const ClassForm = dynamic(
  () => import('@/components/admin/ClassForm').then(mod => ({ default: mod.ClassForm })),
  {
    loading: () => (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-32" />
      </div>
    )
  }
);

export default async function NewClassPage() {
  const result = await getAcademicYears();
  const academicYears = result.success && result.data ? result.data : [];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tambah Kelas</h1>
        <p className="text-muted-foreground">Buat kelas baru</p>
      </div>

      <ClassForm academicYears={academicYears} />
    </div>
  );
}

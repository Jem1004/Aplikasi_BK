import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const AcademicYearForm = dynamic(
  () => import('@/components/admin/AcademicYearForm').then(mod => ({ default: mod.AcademicYearForm })),
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

export default function NewAcademicYearPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tambah Tahun Ajaran</h1>
        <p className="text-muted-foreground">Buat tahun ajaran baru</p>
      </div>

      <AcademicYearForm />
    </div>
  );
}

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const ViolationTypeForm = dynamic(
  () => import('@/components/admin/ViolationTypeForm').then(mod => ({ default: mod.ViolationTypeForm })),
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

export default function NewViolationTypePage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tambah Jenis Pelanggaran/Prestasi</h1>
        <p className="text-muted-foreground">Buat jenis pelanggaran atau prestasi baru</p>
      </div>

      <ViolationTypeForm />
    </div>
  );
}

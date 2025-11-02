import { ClassForm } from '@/components/admin/ClassForm';
import { getAcademicYears } from '@/lib/actions/admin/master-data';

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

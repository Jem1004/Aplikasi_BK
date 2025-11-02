import { AcademicYearForm } from '@/components/admin/AcademicYearForm';

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

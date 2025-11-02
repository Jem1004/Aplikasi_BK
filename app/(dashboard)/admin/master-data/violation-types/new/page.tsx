import { ViolationTypeForm } from '@/components/admin/ViolationTypeForm';

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

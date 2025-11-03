import dynamic from 'next/dynamic';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/auth';
import { getMyStudents } from '@/lib/actions/guru-bk/violations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const CounselingJournalForm = dynamic(() => import('@/components/guru-bk/CounselingJournalForm').then(mod => ({ default: mod.CounselingJournalForm })), {
  loading: () => (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-10 w-32" />
    </div>
  )
});

export default async function NewJournalPage() {
  const session = await auth();

  if (!session || session.user.role !== 'GURU_BK') {
    redirect('/unauthorized');
  }

  // Fetch assigned students
  const studentsResult = await getMyStudents();

  if (!studentsResult.success) {
    return (
      <div className="p-6">
        <div className="text-center text-destructive">
          {studentsResult.error || 'Gagal memuat data siswa'}
        </div>
      </div>
    );
  }

  const students = studentsResult.data || [];

  if (students.length === 0) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Tidak Ada Siswa</CardTitle>
            <CardDescription>
              Anda belum memiliki siswa yang di-assign. Hubungi admin untuk menambahkan siswa.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Buat Jurnal Konseling Baru</h1>
        <p className="text-muted-foreground mt-1">
          Catat sesi konseling privat dengan siswa
        </p>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Informasi Jurnal</CardTitle>
          <CardDescription>
            Isi detail sesi konseling. Semua data akan dienkripsi secara otomatis.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CounselingJournalForm students={students} mode="create" />
        </CardContent>
      </Card>
    </div>
  );
}

import dynamic from 'next/dynamic';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/auth';
import { getCounselingJournalById } from '@/lib/actions/guru-bk/journals';
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

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditJournalPage({ params }: PageProps) {
  const { id } = await params;
  const session = await auth();

  if (!session || session.user.role !== 'GURU_BK') {
    redirect('/unauthorized');
  }

  // Fetch journal and students
  const [journalResult, studentsResult] = await Promise.all([
    getCounselingJournalById(id),
    getMyStudents(),
  ]);

  if (!journalResult.success) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive mb-2">
            {journalResult.error === 'Anda tidak memiliki izin untuk melakukan aksi ini'
              ? 'Akses Ditolak'
              : 'Jurnal Tidak Ditemukan'}
          </h2>
          <p className="text-muted-foreground">
            {journalResult.error || 'Jurnal yang Anda cari tidak ditemukan'}
          </p>
        </div>
      </div>
    );
  }

  if (!studentsResult.success) {
    return (
      <div className="p-6">
        <div className="text-center text-destructive">
          {studentsResult.error || 'Gagal memuat data siswa'}
        </div>
      </div>
    );
  }

  const journal = journalResult.data!;
  const students = studentsResult.data || [];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Edit Jurnal Konseling</h1>
        <p className="text-muted-foreground mt-1">
          Perbarui catatan sesi konseling
        </p>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Informasi Jurnal</CardTitle>
          <CardDescription>
            Edit detail sesi konseling. Data akan dienkripsi ulang secara otomatis.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CounselingJournalForm
            students={students}
            defaultValues={{
              id: journal.id,
              studentId: journal.studentId,
              sessionDate: new Date(journal.sessionDate),
              content: journal.content,
            }}
            mode="edit"
          />
        </CardContent>
      </Card>
    </div>
  );
}

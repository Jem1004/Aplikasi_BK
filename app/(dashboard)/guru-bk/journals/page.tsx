import dynamic from 'next/dynamic';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth/auth';
import { getMyCounselingJournals } from '@/lib/actions/guru-bk/journals';
import { getMyStudents } from '@/lib/actions/guru-bk/violations';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

const CounselingJournalList = dynamic(
  () => import('@/components/guru-bk/CounselingJournalList').then(mod => ({ default: mod.CounselingJournalList })),
  {
    loading: () => (
      <Card>
        <CardContent className="p-6 space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    )
  }
);

// Cache journals list for 30 seconds
// Journals are frequently updated, shorter cache
export const revalidate = 30;

export default async function JournalsPage() {
  const session = await auth();

  if (!session || session.user.role !== 'GURU_BK') {
    redirect('/unauthorized');
  }

  // Fetch journals and students
  const [journalsResult, studentsResult] = await Promise.all([
    getMyCounselingJournals(),
    getMyStudents(),
  ]);

  if (!journalsResult.success) {
    return (
      <div className="p-6">
        <div className="text-center text-destructive">
          {journalsResult.error || 'Gagal memuat data jurnal'}
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

  const journals = journalsResult.data || [];
  const students = studentsResult.data || [];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Jurnal Konseling</h1>
          <p className="text-muted-foreground mt-1">
            Kelola catatan sesi konseling privat Anda
          </p>
        </div>
        <Link href="/guru-bk/journals/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Buat Jurnal Baru
          </Button>
        </Link>
      </div>

      {/* Journal List */}
      <CounselingJournalList journals={journals} students={students} />
    </div>
  );
}

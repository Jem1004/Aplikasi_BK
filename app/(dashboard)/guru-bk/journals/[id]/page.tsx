import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/auth';
import { getCounselingJournalById } from '@/lib/actions/guru-bk/journals';
import { CounselingJournalViewer } from '@/components/guru-bk/CounselingJournalViewer';

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function JournalDetailPage({ params }: PageProps) {
  const { id } = await params;
  const session = await auth();

  if (!session || session.user.role !== 'GURU_BK') {
    redirect('/unauthorized');
  }

  // Fetch journal
  const journalResult = await getCounselingJournalById(id);

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

  const journal = journalResult.data!;

  return (
    <div className="p-6">
      <CounselingJournalViewer journal={journal} />
    </div>
  );
}

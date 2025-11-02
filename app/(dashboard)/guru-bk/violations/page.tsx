import { getMyStudents } from '@/lib/actions/guru-bk/violations';
import { StudentList } from '@/components/guru-bk/StudentList';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function ViolationsPage() {
  const result = await getMyStudents();

  if (!result.success) {
    redirect('/unauthorized');
  }

  const students = result.data || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manajemen Pelanggaran</h1>
          <p className="text-muted-foreground mt-2">
            Kelola pelanggaran dan prestasi siswa binaan
          </p>
        </div>
        <Link href="/guru-bk/violations/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Catat Pelanggaran
          </Button>
        </Link>
      </div>

      <StudentList students={students} />
    </div>
  );
}

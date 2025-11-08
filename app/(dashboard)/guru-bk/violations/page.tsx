import { getMyStudents } from '@/lib/actions/guru-bk/violations';
import { StudentList } from '@/components/guru-bk/StudentList';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

// Cache student list for 2 minutes (120 seconds)
// Student assignments change occasionally
export const revalidate = 120;

export default async function ViolationsPage() {
  const result = await getMyStudents();

  if (!result.success) {
    redirect('/unauthorized');
  }

  const students = result.data || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-start">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Manajemen Pelanggaran</h1>
          <p className="text-muted-foreground mt-2">
            Kelola pelanggaran dan prestasi siswa binaan
          </p>
        </div>
        <Link href="/guru-bk/violations/new" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto min-h-[44px]">
            <Plus className="h-4 w-4 mr-2" />
            Catat Pelanggaran
          </Button>
        </Link>
      </div>

      <StudentList students={students} />
    </div>
  );
}
